// Modulate Fingerprint — conversation generator and renderers.
//
// The generator produces a plausible dialogue (turn-taking, emotional arcs,
// behaviours, detection layers) as plain data; the renderers turn that data
// into DOM using the same visual model as the playground player dataviz
// (`.pg-player-dataviz` / `.transcript-clip`, styles already in the bundle).

export const DATA_FORMAT = "modulate-fingerprint";
export const DATA_VERSION = 2;

// Emotion vocabulary grouped as in tokens/colors.css. Weights steer the
// generator: neutral firmly dominates (as it does in real detector output),
// hostile emotions are rare until a conflict arc kicks in.
const EMOTION_GROUPS = [
  { name: "neutral", weight: 20, emotions: ["neutral"] },
  {
    name: "calm-grounded",
    weight: 5,
    emotions: ["calm", "confident", "interested"],
  },
  {
    name: "excited-engaged",
    weight: 3,
    emotions: ["amused", "happy", "excited", "hopeful", "relieved", "curious"],
  },
  {
    name: "low-energy-negative",
    weight: 2.5,
    emotions: ["disappointed", "bored", "tired", "concerned", "confused", "sad"],
  },
  {
    name: "threat-uncertainty",
    weight: 1.5,
    emotions: ["anxious", "stressed", "surprised", "frustrated", "afraid"],
  },
  { name: "attack-rejection", weight: 1, emotions: ["angry", "contemptuous", "disgusted"] },
];

const BEHAVIOURS = [
  "Harassment",
  "Bargaining manipulation",
  "Coercion manipulation",
  "Social boundary setting",
];

// Fragments the fake transcript is stitched from — support-call and voice-chat
// small talk; only the first line ever shows in the player caption.
const TRANSCRIPT_CHUNKS = [
  "yeah I hear you",
  "let me pull that up",
  "so what happened next",
  "that's not what I said",
  "can you walk me through it one more time",
  "one second",
  "I'm looking at the account right now",
  "it should be back by tonight",
  "honestly I'm not sure",
  "we shipped that fix last week",
  "the match was already over by then",
  "he kept pushing after I asked him to stop",
  "that's fair",
  "give me a moment",
  "I'll flag it for the team",
  "did you try restarting the client",
  "the report went through on our side",
  "it still says pending on my end",
  "we can escalate this if you want",
  "no worries at all",
  "I appreciate your patience",
  "the logs don't show anything unusual",
  "that was a completely different lobby",
  "okay let's take it from the top",
];

// Kiki glyph (outline + shape) from assets/service/behaviour-icon-kiki.svg;
// inlined so the outline path can carry the emotion color via CSS.
const KIKI_SVG =
  '<svg viewBox="0 0 241.8 241.8" aria-hidden="true">' +
  '<path class="behaviour-icon__outline" d="M159,239.9c-6.3,0-12.3-3.3-15.6-9l-29.3-50.7-87.2,44.2c-2.6,1.3-5.4,1.9-8.1,1.9-4.9,0-9.8-2-13.3-5.8-5.5-5.9-6.3-14.8-2.1-21.6l43.4-70.3-36.4-19.3c-6.9-3.7-10.7-11.4-9.3-19.2,1.4-7.7,7.7-13.6,15.5-14.6l40.5-5-19.8-41.1c-3.5-7.3-1.7-16,4.3-21.3,3.4-3,7.6-4.5,11.9-4.5s6.9,1,9.9,2.9l70.9,46.5L196.6,5.7c3.2-2.4,7.1-3.7,10.9-3.7s7.3,1.1,10.5,3.4c6.4,4.6,9.1,12.9,6.6,20.4l-29,86.5,35.2,16.4c6.8,3.2,10.9,10.2,10.3,17.7s-5.7,13.8-12.9,15.9l-47.9,14.1-3.3,46.9c-.6,7.9-6.2,14.5-13.9,16.3-1.3.3-2.7.5-4,.5Z"/>' +
  '<polygon points="18.9 93.5 84.3 85.5 53.6 21.7 135.1 75.2 207.5 20 173.4 121.7 223.1 144.9 163.3 162.5 159 221.9 121.2 156.4 18.8 208.4 72.3 121.7 18.9 93.5"/>' +
  "</svg>";

/* Random ─────────────────────────────────────────────────────────────── */

// mulberry32: deterministic PRNG so examples render the same on every load.
export function createRng(seed) {
  let state = seed >>> 0;

  return function () {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(rng, list) {
  return list[Math.floor(rng() * list.length)];
}

function range(rng, min, max) {
  return min + rng() * (max - min);
}

/* Generator ──────────────────────────────────────────────────────────── */

// A plausible dialogue: speakers alternate turns of 1–4 utterances. Emotions
// are deliberately noisy — real detector output flickers between groups from
// clip to clip; each speaker only keeps a mild bias, and one conversation in
// three grows a conflict arc near the end. Optional `biases` pins a speaker
// to an emotion group (index into EMOTION_GROUPS) for curated examples.
export function generateConversation({ speakers = 2, durationSec = 480, seed, biases } = {}) {
  const rng = createRng(seed === undefined ? Math.floor(Math.random() * 2 ** 31) : seed);
  const clips = [];

  // Per-speaker emotional bias: index into EMOTION_GROUPS.
  const moods = Array.from({ length: speakers }, (_, i) =>
    biases?.[i] !== undefined ? biases[i] : rng() < 0.7 ? 0 : 1
  );
  // Uneven speak time: two leads carry the conversation, the rest chime in
  // occasionally — the more speakers, the stronger the skew away from an
  // even split.
  const minorShare = speakers > 2 ? 0.3 / Math.max(speakers - 2, 1.5) : 0;
  const leadShare = (1 - minorShare * (speakers - 2)) / 2;
  const shares = Array.from({ length: speakers }, (_, i) =>
    (i < 2 ? leadShare : minorShare) * range(rng, 0.75, 1.25)
  );
  const conflict = rng() < 0.35;
  const conflictStart = conflict ? range(rng, 0.55, 0.8) : 2;
  // 0..1 with the conversation length: long calls drift towards monologues
  // and longer utterances, short calls stay choppy.
  const longFactor = clamp((durationSec - 180) / 1020, 0, 1);

  let cursor = 0;
  let current = Math.floor(rng() * speakers);

  while (cursor < durationSec) {
    // Minor speakers drop short remarks; the two leads hold longer turns,
    // and in long conversations sometimes take the floor for a monologue —
    // one uncut clip instead of a diced-up turn.
    const isLead = current < 2;
    const monologue = isLead && rng() < 0.04 + 0.3 * longFactor;
    const turnClips = monologue ? 1 : 1 + Math.floor(rng() * rng() * (isLead ? 4 : 2));

    for (let index = 0; index < turnClips && cursor < durationSec; index += 1) {
      const inConflict = cursor / durationSec >= conflictStart;
      const maxClip = monologue
        ? 25 + 50 * longFactor
        : isLead
          ? (inConflict ? 8 : 14 + 8 * longFactor)
          : inConflict
            ? 4
            : 7;
      const clipDuration = Math.min(
        range(rng, monologue ? 15 : 1.5, maxClip),
        durationSec - cursor
      );

      const pinned = biases?.[current] !== undefined;

      if (!pinned) moods[current] = driftMood(rng, moods[current], inConflict);

      // The clip's group is the speaker's bias most of the time, but every
      // third clip or so jumps anywhere — that's the real-life flicker.
      // Pinned speakers hold their group more stubbornly.
      const groupIndex = pinned
        ? rng() < 0.65
          ? biases[current]
          : weightedGroup(rng)
        : rng() < 0.35
          ? weightedGroup(rng)
          : moods[current];
      const group = EMOTION_GROUPS[groupIndex];

      clips.push({
        speaker: current + 1,
        startSec: round2(cursor),
        durationSec: round2(clipDuration),
        emotion: pick(rng, group.emotions),
        amplitude: round2(range(rng, 0.6, 1)),
        text: fakeUtterance(rng, clipDuration),
      });
      cursor += clipDuration;
    }

    // Next speaker, weighted by talkativeness.
    if (speakers > 1) {
      let next = current;

      while (next === current) {
        const total = shares.reduce((sum, share, i) => (i === current ? sum : sum + share), 0);
        let roll = rng() * total;

        for (let i = 0; i < speakers; i += 1) {
          if (i === current) continue;
          roll -= shares[i];
          if (roll <= 0) {
            next = i;
            break;
          }
        }
      }
      current = next;
    }
  }

  assignBehaviours(rng, clips);

  return {
    format: DATA_FORMAT,
    version: DATA_VERSION,
    speakers,
    durationSec,
    windowSec: 4,
    clips,
    detection: generateWindows(rng, durationSec, 4, [
      { verdict: "authentic", weight: 3 },
      { verdict: "synthetic", weight: 2 },
    ]),
    music: generateWindows(rng, durationSec, 4, [
      { verdict: "ai", weight: 3 },
      { verdict: "not-ai", weight: 2 },
      { verdict: "silence", weight: 0.3 },
    ]),
  };
}

function driftMood(rng, mood, inConflict) {
  if (inConflict) {
    // Escalate towards threat/attack groups, sometimes hold.
    if (mood < 4 && rng() < 0.55) return Math.min(mood + (rng() < 0.5 ? 1 : 2), 5);
    return mood;
  }
  if (rng() < 0.3) return mood; // mild inertia

  return weightedGroup(rng);
}

function weightedGroup(rng) {
  const total = EMOTION_GROUPS.reduce((sum, group) => sum + group.weight, 0);
  let roll = rng() * total;

  for (let i = 0; i < EMOTION_GROUPS.length; i += 1) {
    roll -= EMOTION_GROUPS[i].weight;
    if (roll <= 0) return i;
  }
  return 0;
}

// Behaviours land roughly on every ~8th clip: hostile clips first, tense
// ones fill in when the conversation stays polite.
function assignBehaviours(rng, clips) {
  const hostile = clips.filter((clip) =>
    ["angry", "contemptuous", "disgusted", "frustrated", "stressed", "anxious"].includes(
      clip.emotion
    )
  );
  const tense = clips.filter((clip) =>
    ["concerned", "disappointed", "sad", "confused", "afraid", "surprised"].includes(
      clip.emotion
    )
  );
  // Hostile clips are consumed first, each group shuffled so behaviours
  // never land on the same clip twice.
  const pool = [...shuffle(rng, hostile), ...shuffle(rng, tense)];

  if (!pool.length) return;

  const target = Math.max(2, Math.round(clips.length / 8));
  const count = Math.min(pool.length, target);

  for (let i = 0; i < count; i += 1) {
    pool[i].behaviour = pick(rng, BEHAVIOURS);
  }
}

// Word count roughly follows the clip duration, capped: the caption is a
// single clipped line, so a monologue doesn't need its full text.
function fakeUtterance(rng, durationSec) {
  const target = Math.min(3 + durationSec * 2.2, 28);
  const words = [];

  while (words.length < target) {
    words.push(...pick(rng, TRANSCRIPT_CHUNKS).split(" "));
  }

  const text = words.join(" ");

  return `${text.charAt(0).toUpperCase()}${text.slice(1)}.`;
}

function shuffle(rng, list) {
  const result = [...list];

  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));

    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Equal windows with runs of the same verdict (as detection models output).
function generateWindows(rng, durationSec, windowSec, states) {
  const total = Math.ceil(durationSec / windowSec);
  const windows = [];
  let verdict = weightedPick(rng, states);
  let run = 0;

  for (let i = 0; i < total; i += 1) {
    if (run <= 0) {
      verdict = weightedPick(rng, states);
      run = 2 + Math.floor(rng() * 7);
    }
    windows.push({ verdict, confidence: round2(range(rng, 0.75, 0.99)) });
    run -= 1;
  }
  return windows;
}

function weightedPick(rng, states) {
  const total = states.reduce((sum, state) => sum + state.weight, 0);
  let roll = rng() * total;

  for (const state of states) {
    roll -= state.weight;
    if (roll <= 0) return state.verdict;
  }
  return states[0].verdict;
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

/* Import validation ──────────────────────────────────────────────────── */

// Accepts both export versions: v2 wraps the conversation together with the
// studio settings, v1 was the bare conversation. Returns
// `{ conversation, settings }` (settings is null for v1 files).
export function parseConversation(json) {
  const data = JSON.parse(json);

  if (data.format !== DATA_FORMAT) {
    throw new Error("Not a Modulate Fingerprint conversation file");
  }

  const conversation = Array.isArray(data.clips) ? data : data.conversation;

  if (!conversation || !Array.isArray(conversation.clips)) {
    throw new Error("Conversation file has no clips");
  }
  if (
    !Number.isFinite(conversation.speakers) ||
    !Number.isFinite(conversation.durationSec)
  ) {
    throw new Error("Conversation file is missing speakers or duration");
  }
  return { conversation, settings: data.settings || null };
}

/* Colors ─────────────────────────────────────────────────────────────── */

function emotionColor(emotion) {
  return `rgba(var(--emotion-${emotion}-RGB), 1)`;
}

const VERDICT_COLORS = {
  authentic: "var(--m__success)",
  synthetic: "var(--m__error)",
  ai: "var(--m__error)",
  "not-ai": "var(--m__success)",
  silence: "var(--m__border)",
};

/* Full-size renderer ─────────────────────────────────────────────────── */

// options:
//   mode       'transcript' | 'detection'
//   emotions   boolean — color clips by detected emotion (transcript only)
//   behaviours boolean — draw behaviour glyphs (transcript only)
//   amplitude  boolean — Y axis doubles as a waveform-like amplitude
//   player     boolean — attach the (non-functional) playground player
//   labels     boolean — show speaker labels on the lanes
//   names      array — custom speaker names for the lane labels
//   className  string — extra classes on the container (e.g. `fp-cmp` for
//              the technology-comparison variant)
//   laneHover  boolean — clip nodes are confined to their own lane, so
//              every lane hovers independently (the comparison variant;
//              the default treats the full column as one hover zone)
//   hoverCaptions  boolean (default true) — hovering a clip shows the
//              transcript line and emotion name (in the player chrome, or
//              in a caption strip below a player-less plate); false drops
//              both, e.g. for the selected-signal comparison players
//
// Per-clip hooks (all optional, used by the comparison variant):
//   clip.classes           extra classes on the clip node (`clip-mute`,
//                          `clip-quiet`, `clip-hit`, …)
//   clip.emotion           may be absent — the clip renders uncolored and
//                          the hover caption skips the emotion name
//   clip.behaviourClasses  extra classes on the behaviour indicator
//                          (`behaviour-indicator--tech/--ghost/--false`)
//   clip.behaviourModal    id of a modal the glyph opens (data-modal-open)
//   clip.behaviourAtSec    glyph position on the timeline (defaults to the
//                          clip start)
export function renderFingerprint(root, data, options = {}) {
  const opts = {
    mode: "transcript",
    emotions: true,
    behaviours: false,
    amplitude: false,
    player: false,
    labels: true,
    names: [],
    className: "",
    laneHover: false,
    hoverCaptions: true,
    ...options,
  };
  const lanes = opts.mode === "transcript" ? data.speakers : 1;

  root.textContent = "";

  const container = el(
    "div",
    `media-container fp-media m__rounded${opts.className ? ` ${opts.className}` : ""}`
  );
  const dataviz = el("div", "pg-player-dataviz");
  const viz = el("div", "player-visualization");

  container.style.setProperty("--speaker-count", lanes);
  dataviz.style.setProperty("--speaker-count", lanes);
  dataviz.appendChild(viz);
  container.appendChild(dataviz);

  if (opts.amplitude) {
    renderAmplitude(viz, buildSpans(data, opts), lanes);
  } else if (opts.mode === "transcript") {
    renderTranscriptClips(viz, data, opts, lanes);
  } else {
    renderHeat(viz, data.detection);
  }

  if (opts.mode === "transcript") {
    if (lanes > 1 && opts.labels) {
      dataviz.appendChild(buildSpeakerLabels(lanes, opts.names));
    }
    if (opts.behaviours && !opts.amplitude) {
      dataviz.appendChild(buildBehaviourIndicators(data, lanes));
    }
  }

  if (opts.player) {
    container.appendChild(buildPlayer(data, lanes));
    container.appendChild(el("div", "pg-media-hover-line"));
    bindHoverLine(container);
  }

  root.appendChild(container);

  if (opts.mode === "transcript" && !opts.amplitude && opts.hoverCaptions) {
    bindClipCaptions(root, container, opts);
  }
}

function renderTranscriptClips(viz, data, opts, lanes) {
  data.clips.forEach((clip) => {
    const emotionClass =
      opts.emotions && clip.emotion ? ` emotion-${clip.emotion}` : "";
    const extraClass = clip.classes ? ` ${clip.classes}` : "";
    const node = el("div", `transcript-clip${emotionClass}${extraClass}`);
    const clipViz = el("div", "clip-visualization");

    node.dataset.speakerIndex = clip.speaker;
    node._fpClip = clip;
    node.style.left = `${pct(clip.startSec, data.durationSec)}%`;
    node.style.width = `${pct(clip.durationSec, data.durationSec)}%`;
    // The stylesheet only enumerates lane offsets for up to 5 speakers;
    // inline top works for any lane count. With laneHover the clip node
    // itself is confined to its lane (each lane hovers on its own).
    if (opts.laneHover) {
      node.style.top = `${((clip.speaker - 1) * 100) / lanes}%`;
      node.style.height = `${100 / lanes}%`;
      clipViz.style.top = "0";
      clipViz.style.height = "100%";
    } else {
      clipViz.style.top = `${((clip.speaker - 1) * 100) / lanes}%`;
    }
    node.appendChild(clipViz);
    viz.appendChild(node);
  });
}

/* Hover captions ─────────────────────────────────────────────────────── */

// Hovering a clip (its whole vertical zone — the clip node is full-height)
// shows the emotion name and a line of the transcript: instantly in, fade
// out on leave (the `.visible` class carries the transition switch).
//
// With the player: the emotion name sits to the left of the total time, the
// transcript line goes into the player's own clip-text caption slot. Without
// the player there is no transcript, and the emotion name moves to a strip
// below the rounded container, left-aligned.
function bindClipCaptions(root, container, opts) {
  const clipNodes = container.querySelectorAll(".transcript-clip");

  if (!clipNodes.length) return;

  const transcript = opts.player ? container.querySelector(".clip-text-caption") : null;
  let transcriptSpan = transcript ? transcript.querySelector("span") : null;
  let emotionSpan = null;

  if (opts.player) {
    if (opts.emotions) emotionSpan = container.querySelector(".fp-emotion-caption");
  } else {
    // Player-less fingerprints get a caption strip below the plate: the
    // start of the transcript line on the left, the emotion name on the
    // right — the same pair the player chrome shows.
    const strip = el("div", "fp-emotion-strip");

    transcriptSpan = el("span", "fp-transcript-caption");
    strip.appendChild(transcriptSpan);
    if (opts.emotions) {
      emotionSpan = el("span", "fp-emotion-caption");
      strip.appendChild(emotionSpan);
    }
    root.appendChild(strip);
  }

  clipNodes.forEach((node) => {
    const clip = node._fpClip;

    if (!clip) return;

    node.addEventListener("mouseenter", () => {
      if (emotionSpan && clip.emotion) {
        emotionSpan.textContent =
          clip.emotion.charAt(0).toUpperCase() + clip.emotion.slice(1);
        emotionSpan.style.color = emotionColor(clip.emotion);
        emotionSpan.classList.add("visible");
      }
      if (transcriptSpan && clip.text) {
        transcriptSpan.textContent = clip.text;
        (transcript || transcriptSpan).classList.add("visible");
      }
    });
    node.addEventListener("mouseleave", () => {
      if (emotionSpan) emotionSpan.classList.remove("visible");
      if (transcriptSpan) (transcript || transcriptSpan).classList.remove("visible");
    });
  });
}

function renderHeat(viz, windows) {
  const heat = el("div", "fp-heat");

  windows.forEach((window) => {
    const cell = el("div", "fp-heat-cell");

    cell.style.backgroundColor = VERDICT_COLORS[window.verdict];
    if (window.verdict !== "silence") cell.style.opacity = window.confidence;
    heat.appendChild(cell);
  });
  viz.appendChild(heat);
}

// A colored span on the timeline: the common currency between transcript
// clips and detection windows, so amplitude mode can slice either.
function buildSpans(data, opts) {
  if (opts.mode === "transcript") {
    return data.clips.map((clip) => ({
      startPct: pct(clip.startSec, data.durationSec),
      widthPct: pct(clip.durationSec, data.durationSec),
      color: opts.emotions ? emotionColor(clip.emotion) : emotionColor("neutral"),
      lane: clip.speaker,
      amplitude: clip.amplitude,
      opacity: 1,
    }));
  }

  const windows = data.detection;
  const widthPct = 100 / windows.length;

  return windows.map((window, index) => ({
    startPct: index * widthPct,
    widthPct,
    color: VERDICT_COLORS[window.verdict],
    lane: 1,
    amplitude: window.verdict === "silence" ? 0.1 : window.confidence,
    opacity: window.verdict === "silence" ? 1 : window.confidence,
  }));
}

// Waveform imitation: each span is sliced into narrow bars whose heights
// walk around the span's amplitude, sitting on the bottom of the lane. The
// slices are normalized so the span's peak reaches the full lane height.
function renderAmplitude(viz, spans, lanes) {
  const laneHeight = 100 / lanes;
  const sliceWidth = 0.45;

  spans.forEach((span) => {
    const slices = Math.max(1, Math.round(span.widthPct / sliceWidth));
    const rng = createRng(Math.floor(span.startPct * 1000) + span.lane);
    const amps = [];
    let amp = span.amplitude;
    let peak = 0;

    for (let i = 0; i < slices; i += 1) {
      amp = clamp(amp + (rng() - 0.5) * 0.35, 0.08, 1);

      // Fade the envelope at span edges so utterances read as waves.
      const edge = Math.min(1, (Math.min(i, slices - 1 - i) + 1) / 3);
      const value = amp * edge;

      amps.push(value);
      peak = Math.max(peak, value);
    }

    amps.forEach((value, i) => {
      const height = laneHeight * (value / peak) * span.amplitude;
      const bar = el("div", "fp-amp-bar");

      bar.style.left = `${span.startPct + (span.widthPct * i) / slices}%`;
      bar.style.width = `${span.widthPct / slices}%`;
      bar.style.top = `${span.lane * laneHeight - height}%`;
      bar.style.height = `${height}%`;
      bar.style.backgroundColor = span.color;
      if (span.opacity !== 1) bar.style.opacity = span.opacity;
      viz.appendChild(bar);
    });
  });
}

function buildSpeakerLabels(lanes, names = []) {
  const labels = el("div", "speaker-labels");

  for (let i = 1; i <= lanes; i += 1) {
    const label = el("div", "speaker-label");
    const name = (names[i - 1] || "").trim() || `Speaker ${i - 1}`;

    label.dataset.speakerIndex = i;
    label.style.bottom = `${((lanes - i) * 100) / lanes}%`;
    label.appendChild(el("span", "", name));
    labels.appendChild(label);
  }
  return labels;
}

function buildBehaviourIndicators(data, lanes) {
  const indicators = el("div", "behaviour-indicators");

  data.clips
    .filter((clip) => clip.behaviour)
    .forEach((clip) => {
      const indicator = el(
        "div",
        `behaviour-indicator${clip.behaviourClasses ? ` ${clip.behaviourClasses}` : ""}`
      );

      indicator.dataset.speakerIndex = clip.speaker;
      indicator.dataset.behaviourIndex = "1";
      if (clip.emotion) indicator.dataset.emotion = clip.emotion;
      if (clip.behaviourModal) indicator.dataset.modalOpen = clip.behaviourModal;
      indicator.style.left = `${pct(
        clip.behaviourAtSec === undefined ? clip.startSec : clip.behaviourAtSec,
        data.durationSec
      )}%`;
      indicator.style.bottom = `${((lanes - clip.speaker) * 100) / lanes}%`;

      const icon = el("span", "behaviour-icon behaviour-icon--kiki");

      icon.title = clip.behaviour;
      icon.innerHTML = KIKI_SVG;
      indicator.appendChild(icon);
      indicators.appendChild(indicator);
    });
  return indicators;
}

// The playground player strip, verbatim from playground-layout.html; it is
// decorative here (nothing plays), like everywhere in the prototypes.
function buildPlayer(data, lanes) {
  const player = el("div", "media-box");

  player.id = "audio-player";
  player.dataset.speakerCount = Math.min(lanes, 5);
  player.style.setProperty("--speaker-count", lanes);
  player.innerHTML = `
    <div class="player-controls">
      <div class="player-control-spacer"></div>
      <div class="player-control player-control-center" data-action="play-pause">
        <a href="#" class="player-icon" data-playing="false">
          <svg viewBox="0 0 220 220" xmlns="http://www.w3.org/2000/svg">
            <polygon fill="currentColor" points="40 30 40 190 190 110 40 30" />
          </svg>
        </a>
      </div>
    </div>
    <div class="clip-text-caption"><span></span></div>
    <div class="player-status-caption"><span class="emotion-caption"></span></div>
    <div class="player-start-time"><span class="start-time">0:00</span></div>
    <div class="player-total-time">
      <span class="fp-emotion-caption"></span>
      <span class="total-time" data-total-time>${formatTime(data.durationSec)}</span>
    </div>
    <div class="player-position-indicator">
      <div class="player-position-line"></div>
      <div class="player-position-caption"><span data-current-time>0:00</span></div>
    </div>
    <div class="player-hover-position-indicator">
      <div class="player-hover-position-line"></div>
      <div class="player-hover-position-caption"><span data-hover-time>0:00</span></div>
    </div>`;
  return player;
}

// Same hover line the playground binds on its media containers.
function bindHoverLine(container) {
  container.addEventListener("mousemove", (event) => {
    const rect = container.getBoundingClientRect();

    container.style.setProperty("--pg-hover-x", `${event.clientX - rect.left}px`);
    container.dataset.hover = "true";
  });
  container.addEventListener("mouseleave", () => {
    container.dataset.hover = "false";
  });
}

/* Small-scale renderer ───────────────────────────────────────────────── */

// Miniature fingerprint (table rows, icons): same data, inline-positioned
// clips inside a single small plate. Lane split follows the speaker count.
export function renderFingerprintMini(root, data, options = {}) {
  const opts = { mode: "transcript", ...options };

  root.textContent = "";

  const lanes = opts.mode === "transcript" ? data.speakers : 1;
  const laneHeight = 100 / lanes;

  if (opts.mode === "transcript") {
    data.clips.forEach((clip) => {
      const node = el("div", "fp-mini-clip");

      node.style.left = `${pct(clip.startSec, data.durationSec)}%`;
      node.style.width = `${pct(clip.durationSec, data.durationSec)}%`;
      node.style.top = `${(clip.speaker - 1) * laneHeight}%`;
      node.style.height = `${laneHeight}%`;
      node.style.backgroundColor = emotionColor(clip.emotion);
      root.appendChild(node);
    });
    return;
  }

  const windows = data[opts.mode === "detection" ? "detection" : "music"];
  const widthPct = 100 / windows.length;

  windows.forEach((window, index) => {
    const node = el("div", "fp-mini-clip");

    node.style.left = `${index * widthPct}%`;
    node.style.width = `${widthPct}%`;
    node.style.top = "0";
    node.style.height = "100%";
    node.style.backgroundColor = VERDICT_COLORS[window.verdict];
    if (window.verdict !== "silence") node.style.opacity = window.confidence;
    root.appendChild(node);
  });
}

// Speak-time bar for one speaker: their clips glued together into a proper
// player-component instance (`.media-container` → `.transcript-clip`), so
// the playground hover styles apply to each segment. The bar's width is the
// speaker's share of the whole conversation.
export function renderSpeakTimeBar(root, data, speaker = 1) {
  const clips = data.clips.filter((clip) => clip.speaker === speaker);
  const speech = clips.reduce((sum, clip) => sum + clip.durationSec, 0);

  root.textContent = "";

  const container = el("div", "media-container fp-media fp-speaktime");
  const dataviz = el("div", "pg-player-dataviz");
  const viz = el("div", "player-visualization");

  container.style.setProperty("--speaker-count", 1);
  dataviz.style.setProperty("--speaker-count", 1);
  container.style.width = `${pct(speech, data.durationSec)}%`;

  let cursor = 0;

  clips.forEach((clip) => {
    const node = el("div", `transcript-clip emotion-${clip.emotion}`);
    const clipViz = el("div", "clip-visualization");

    node.dataset.speakerIndex = 1;
    node.style.left = `${pct(cursor, speech)}%`;
    node.style.width = `${pct(clip.durationSec, speech)}%`;
    node.appendChild(clipViz);
    viz.appendChild(node);
    cursor += clip.durationSec;
  });

  dataviz.appendChild(viz);
  container.appendChild(dataviz);
  root.appendChild(container);

  return speech / data.durationSec;
}

/* Utils ──────────────────────────────────────────────────────────────── */

export function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const rest = Math.round(seconds % 60);

  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

function pct(part, total) {
  return Math.round((part / total) * 10000) / 100;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function el(tag, className, text) {
  const node = document.createElement(tag);

  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
