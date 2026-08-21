// Modulate Fingerprint studio (`/tools/modulate-fingerprint/`): controls on
// top, the fingerprint below on the page background. The conversation is
// generated data; display options are applied on render. Scale examples at
// the bottom reuse the same renderers with fixed seeds.

import {
  DATA_FORMAT,
  DATA_VERSION,
  formatTime,
  generateConversation,
  parseConversation,
  renderFingerprint,
  renderFingerprintMini,
  renderSpeakTimeBar,
} from "./fingerprint.js";

// Default speaker names, one per possible lane.
const DEFAULT_NAMES = ["John", "Mary", "Priya", "Diego", "Yuki", "Amara", "Viktor"];

const STATE = {
  speakers: 2,
  minutes: 8,
  mode: "transcript",
  emotions: true,
  behaviours: false,
  amplitude: false,
  player: true,
  labels: true,
  // Percent of the container width the fingerprint occupies.
  width: 100,
  // The player theme is independent from the page theme; dark by default.
  theme: "dark",
  names: [...DEFAULT_NAMES],
};

// The seed only changes on Regenerate: dragging the length or switching the
// speaker count re-runs the generator deterministically, so the conversation
// keeps its shape instead of reshuffling on every tick.
let seed = Math.floor(Math.random() * 2 ** 31);
let data = null;
let imported = null;
// Update slider positions/outputs without regenerating; assigned in
// bindConversationControls / bindFormatControls, used by import.
let syncLengthUI = () => {};
let syncWidthUI = () => {};

const frame = document.querySelector("[data-fp-frame]");

function init() {
  regenerate();
  bindConversationControls();
  bindFormatControls();
  bindThemeControls();
  renderExamples();
}

function regenerate() {
  imported = null;
  data = generateConversation({
    speakers: STATE.speakers,
    durationSec: STATE.minutes * 60,
    seed,
  });
  render();
}

function render() {
  renderFingerprint(frame, imported || data, {
    mode: STATE.mode,
    emotions: STATE.emotions,
    behaviours: STATE.behaviours,
    amplitude: STATE.amplitude,
    player: STATE.player,
    labels: STATE.labels,
    names: STATE.names,
  });
  applyWidth();
  applyTheme();
  updateConstraints();
}

function applyWidth() {
  frame.style.width = `${STATE.width}%`;
}

// The player theme is local to the frame and independent from the page
// theme: the theme classes flip the `--m__*` tokens for the subtree, and
// `fp-theme-light` restates the playground `--ids__*` light values.
function applyTheme() {
  frame.classList.toggle("dark-mode", STATE.theme === "dark");
  frame.classList.toggle("light-mode", STATE.theme === "light");
  frame.classList.toggle("fp-theme-light", STATE.theme === "light");
}

/* Conversation controls ──────────────────────────────────────────────── */

function bindConversationControls() {
  document.querySelectorAll("[data-fp-speakers]").forEach((radio) => {
    radio.addEventListener("change", () => {
      STATE.speakers = Number(radio.value);
      syncNamesUI();
      regenerate();
    });
  });

  const length = document.querySelector("[data-fp-length]");

  if (length) {
    const output = length.closest("label")?.querySelector("output");
    const sync = () => {
      const min = Number(length.min);
      const max = Number(length.max);

      length.style.setProperty(
        "--icon-studio-range-progress",
        `${((Number(length.value) - min) / (max - min)) * 100}%`
      );
      if (output) output.textContent = formatTime(Number(length.value) * 60);
    };

    length.value = STATE.minutes;
    sync();
    syncLengthUI = () => {
      length.value = STATE.minutes;
      sync();
    };
    length.addEventListener("input", () => {
      STATE.minutes = Number(length.value);
      sync();
      regenerate();
    });
  }

  document
    .querySelector("[data-fp-regenerate]")
    ?.addEventListener("click", () => {
      seed = Math.floor(Math.random() * 2 ** 31);
      regenerate();
    });

  const names = document.querySelector("[data-fp-names]");

  if (names) {
    syncNamesUI();
    // The textarea holds comma-separated names for the current speakers;
    // its content is not rewritten while typing — only labels re-render.
    names.addEventListener("input", () => {
      const parsed = names.value.split(",").map((name) => name.trim());

      for (let i = 0; i < STATE.speakers && i < DEFAULT_NAMES.length; i += 1) {
        STATE.names[i] = parsed[i] || DEFAULT_NAMES[i];
      }
      render();
    });
  }

  document.querySelector("[data-fp-export]")?.addEventListener("click", exportConversation);
  bindImport();
}

// Rewrites the names textarea from STATE: one name per selected speaker.
function syncNamesUI() {
  const names = document.querySelector("[data-fp-names]");

  if (names) names.value = STATE.names.slice(0, STATE.speakers).join(", ");
}

// The export carries the conversation together with every studio setting
// (current and future ones — the whole STATE goes in), so an imported file
// restores the exact picture.
function exportConversation() {
  const source = imported || data;
  const payload = {
    format: DATA_FORMAT,
    version: DATA_VERSION,
    settings: { ...STATE, names: [...STATE.names] },
    conversation: source,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `fingerprint-conversation-${formatTime(source.durationSec).replace(":", "m")}s.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function bindImport() {
  const button = document.querySelector("[data-fp-import]");
  const input = document.querySelector("[data-fp-import-input]");

  if (!button || !input) return;

  button.addEventListener("click", () => input.click());
  input.addEventListener("change", () => {
    const file = input.files?.[0];

    if (!file) return;
    file.text().then((text) => {
      let parsed;

      try {
        parsed = parseConversation(text);
      } catch (error) {
        window.alert(error.message);
        return;
      } finally {
        input.value = "";
      }

      imported = parsed.conversation;

      // v2 files carry the full studio settings; restore whatever is there.
      if (parsed.settings) {
        Object.keys(STATE).forEach((key) => {
          if (key in parsed.settings) STATE[key] = parsed.settings[key];
        });
        // Older files may carry fewer names; defaults fill the gaps.
        const importedNames = Array.isArray(STATE.names) ? STATE.names : [];

        STATE.names = DEFAULT_NAMES.map((name, i) => importedNames[i] || name);
      }

      // The conversation itself is the source of truth for its shape.
      STATE.speakers = imported.speakers;
      STATE.minutes = Math.max(1, Math.round(imported.durationSec / 60));

      syncControls();
      render();
    });
  });
}

// Reflects the whole STATE in the panel — used after import.
function syncControls() {
  const speakersRadio = document.querySelector(
    `[data-fp-speakers][value="${Math.min(STATE.speakers, 7)}"]`
  );

  if (speakersRadio) speakersRadio.checked = true;
  syncLengthUI();
  syncWidthUI();

  document.querySelectorAll("[data-fp-mode]").forEach((radio) => {
    radio.checked = radio.value === STATE.mode;
  });
  document.querySelectorAll("[data-fp-theme]").forEach((radio) => {
    radio.checked = radio.value === STATE.theme;
  });
  syncNamesUI();
  syncChecks();
}

/* Format controls ────────────────────────────────────────────────────── */

function bindFormatControls() {
  document.querySelectorAll("[data-fp-mode]").forEach((radio) => {
    radio.addEventListener("change", () => {
      STATE.mode = radio.value;
      render();
    });
  });

  const width = document.querySelector("[data-fp-width]");

  if (width) {
    const output = width.closest("label")?.querySelector("output");
    const sync = () => {
      const min = Number(width.min);
      const max = Number(width.max);

      width.style.setProperty(
        "--icon-studio-range-progress",
        `${((Number(width.value) - min) / (max - min)) * 100}%`
      );
      if (output) output.textContent = `${width.value}%`;
    };

    width.value = STATE.width;
    sync();
    syncWidthUI = () => {
      width.value = STATE.width;
      sync();
      applyWidth();
    };
    width.addEventListener("input", () => {
      STATE.width = Number(width.value);
      sync();
      applyWidth();
    });
  }

  bindCheck("[data-fp-emotions]", "emotions");
  bindCheck("[data-fp-behaviours]", "behaviours");
  bindCheck("[data-fp-amplitude]", "amplitude");
  bindCheck("[data-fp-player]", "player");
  bindCheck("[data-fp-labels]", "labels");
}

/* Theme (player only, independent from the page theme) ───────────────── */

function bindThemeControls() {
  document.querySelectorAll("[data-fp-theme]").forEach((radio) => {
    radio.checked = radio.value === STATE.theme;
    radio.addEventListener("change", () => {
      STATE.theme = radio.value;
      applyTheme();
    });
  });
}

function bindCheck(selector, key) {
  const input = document.querySelector(selector);

  if (!input) return;
  input.checked = STATE[key];
  input.addEventListener("change", () => {
    STATE[key] = input.checked;
    render();
  });
}

function syncChecks() {
  ["emotions", "behaviours", "amplitude", "player", "labels"].forEach((key) => {
    const check = document.querySelector(`[data-fp-${key}]`);

    if (check) check.checked = STATE[key];
  });
}

// Transcript-only controls: emotion/behaviour layers color utterance clips,
// speakers and their names split the lanes — none of it applies to equal
// detection windows.
function updateConstraints() {
  const transcript = STATE.mode === "transcript";

  const emotions = document.querySelector("[data-fp-emotions]");
  const behaviours = document.querySelector("[data-fp-behaviours]");
  const labels = document.querySelector("[data-fp-labels]");
  const transcriptOnly = document.querySelector("[data-fp-transcript-only]");

  if (emotions) emotions.disabled = !transcript;
  if (behaviours) behaviours.disabled = !transcript;
  if (labels) labels.disabled = !transcript;
  if (transcriptOnly) transcriptOnly.hidden = !transcript;
}

/* Scale examples (fixed seeds, same renderers) ───────────────────────── */

// Short calls: at miniature scale the fingerprint should read as a coarse
// pattern, not a dense texture. `biases` (EMOTION_GROUPS indices: 0 neutral,
// 1 calm, 2 excited, 3 low-negative, 4 threat, 5 attack) pin each speaker's
// emotional register so the pattern matches the story.
const EXAMPLE_ROWS = [
  {
    title: "Customer weighs renewal after feature gaps",
    speakers: 2,
    durationSec: 296,
    seed: 101,
    biases: [3, 1],
  },
  {
    title: "Health member appeals denied MRI claim",
    speakers: 2,
    durationSec: 178,
    seed: 102,
    biases: [4, 0],
  },
  {
    title: "Moderator hears out two players after a report",
    speakers: 3,
    durationSec: 312,
    seed: 103,
    biases: [5, 4, 1],
  },
  {
    title: "Manager pushes IT for password reset",
    speakers: 2,
    durationSec: 64,
    seed: 104,
    biases: [5, 1],
  },
];

// Inline illustrations for the text part: each is the studio renderer with
// a fixed conversation and the settings the thought talks about.
const DEMOS = {
  player: {
    data: { speakers: 2, durationSec: 300, seed: 41 },
    opts: { player: true },
  },
  standalone: {
    data: { speakers: 2, durationSec: 240, seed: 42 },
    opts: { labels: false },
  },
  single: {
    data: { speakers: 1, durationSec: 180, seed: 43 },
    opts: {},
  },
  many: {
    data: { speakers: 5, durationSec: 360, seed: 44 },
    opts: {},
  },
  bare: {
    data: { speakers: 2, durationSec: 240, seed: 45 },
    opts: { emotions: false },
  },
  behaviours: {
    data: { speakers: 2, durationSec: 300, seed: 46 },
    opts: { behaviours: true },
  },
  detection: {
    data: { speakers: 1, durationSec: 240, seed: 47 },
    opts: { mode: "detection" },
  },
  amplitude: {
    data: { speakers: 2, durationSec: 300, seed: 48 },
    opts: { amplitude: true },
  },
  comparison: {
    raw: () => buildComparisonDemo(false),
    opts: {
      behaviours: true,
      className: "fp-cmp",
      laneHover: true,
      names: ["Velma", "STT+LLM"],
    },
  },
  "comparison-signal": {
    raw: () => buildComparisonDemo(true),
    opts: {
      behaviours: true,
      className: "fp-cmp",
      laneHover: true,
      hoverCaptions: false,
      names: ["Velma", "STT+LLM"],
    },
  },
};

// Technology comparison: lanes are engines, not speakers — the same call
// analyzed twice. Each lane carries its own transcript variant (its own
// segmentation, timings and recognition details: STT slices finer, merges
// across utterance boundaries, sometimes keeps a whole utterance in one
// chunk with shifted bounds), which is why the clip structures never
// match. Both lanes are gapless and span the full duration. The dataset
// feeds both flavors: the full comparison and the selected-signal player
// (`signalOnly`). On the stack lane every glyph-carrying clip gets the
// light-gray highlight; the glyph itself tells the case — a catch, a red
// false positive, a ghost where a reference signal was missed.
function buildComparisonDemo(signalOnly) {
  const durationSec = 47.5;
  const velma = [
    { s: 0, e: 6, emotion: "calm", text: "Thanks for calling — how can I help?" },
    { s: 6, e: 13, emotion: "neutral", text: "I ordered the standing desk two weeks ago and it still shows processing." },
    { s: 13, e: 21, emotion: "frustrated", behaviour: "Urgency pressure", at: 13.4, text: "I need this resolved today, not eventually — today." },
    { s: 21, e: 29, emotion: "neutral", text: "Let me check what the warehouse says about that order." },
    { s: 29, e: 38, emotion: "angry", behaviour: "Coercion manipulation", at: 33.9, text: "If you can't fix it, I'll make sure your manager hears about this call." },
    { s: 38, e: 47.5, emotion: "calm", text: "I understand. I'm escalating it right now." },
  ];
  const stack = [
    { s: 0, e: 3.3, text: "thanks for calling" },
    { s: 3.3, e: 6.4, text: "how can i help i" },
    { s: 6.4, e: 13.2, text: "ordered the standing desk two weeks ago and it still shows processing" },
    { s: 13.2, e: 16.9, text: "i need this resolved today", ghost: 13.4 },
    { s: 16.9, e: 21.3, text: "not eventually today" },
    { s: 21.3, e: 25.1, text: "let me check what the warehouse says" },
    { s: 25.1, e: 29.2, text: "about that order", falsePositive: true },
    { s: 29.2, e: 33.7, text: "if you can't fix it" },
    { s: 33.7, e: 38.2, text: "i'll make sure your manager hears about this call", hit: true },
    { s: 38.2, e: 43.1, text: "i understand i'm escalating" },
    { s: 43.1, e: 47.5, text: "it right now" },
  ];
  const clips = [];

  velma.forEach((c) => {
    const clip = { speaker: 1, startSec: c.s, durationSec: c.e - c.s, text: c.text };

    if (!signalOnly || c.behaviour === "Urgency pressure") {
      clip.emotion = c.emotion;
      clip.behaviour = c.behaviour;
      clip.behaviourAtSec = c.at;
    } else {
      clip.classes = "clip-quiet";
    }
    clips.push(clip);
  });
  stack.forEach((c) => {
    const clip = { speaker: 2, startSec: c.s, durationSec: c.e - c.s, text: c.text };

    clip.classes = "clip-quiet-tech";
    if (signalOnly) {
      if (c.ghost) {
        clip.classes = "clip-hit";
        clip.behaviour = "Urgency pressure";
        clip.behaviourClasses = "behaviour-indicator--ghost";
        clip.behaviourAtSec = c.ghost;
      } else if (c.falsePositive) {
        clip.classes = "clip-hit";
        clip.behaviour = "Urgency pressure";
        clip.behaviourClasses = "behaviour-indicator--tech behaviour-indicator--false";
      }
    } else if (c.hit || c.falsePositive) {
      clip.classes = "clip-hit";
      clip.behaviour = c.hit ? "Coercion manipulation" : "Urgency pressure";
      clip.behaviourClasses = "behaviour-indicator--tech";
    }
    clips.push(clip);
  });
  return { speakers: 2, durationSec, clips };
}

// Brick-wall sample: miniatures at exactly the table scale (same height,
// same seconds-per-rem), without time labels, flowing like inline blocks.
const BRICK_ROWS = [
  { speakers: 2, durationSec: 214, seed: 301 },
  { speakers: 1, durationSec: 88, seed: 302 },
  { speakers: 3, durationSec: 342, seed: 303 },
  { speakers: 2, durationSec: 126, seed: 304 },
  { speakers: 2, durationSec: 415, seed: 305 },
  { speakers: 1, durationSec: 57, seed: 306 },
  { speakers: 2, durationSec: 268, seed: 307 },
  { speakers: 3, durationSec: 174, seed: 308 },
  { speakers: 2, durationSec: 96, seed: 309 },
  { speakers: 2, durationSec: 328, seed: 310 },
  { speakers: 2, durationSec: 152, seed: 311 },
  { speakers: 1, durationSec: 236, seed: 312 },
  { speakers: 3, durationSec: 118, seed: 313 },
  { speakers: 2, durationSec: 384, seed: 314 },
  { speakers: 2, durationSec: 74, seed: 315 },
  { speakers: 4, durationSec: 296, seed: 316 },
  { speakers: 2, durationSec: 189, seed: 317 },
  { speakers: 1, durationSec: 142, seed: 318 },
  { speakers: 2, durationSec: 442, seed: 319 },
  { speakers: 3, durationSec: 226, seed: 320 },
];

function renderExamples() {
  document.querySelectorAll("[data-fp-demo]").forEach((node) => {
    const demo = DEMOS[node.dataset.fpDemo];

    if (!demo) return;
    renderFingerprint(node, demo.raw ? demo.raw() : generateConversation(demo.data), {
      names: DEFAULT_NAMES,
      ...demo.opts,
    });
  });

  const speakBar = document.querySelector("[data-fp-example-speaktime]");

  if (speakBar) {
    const conversation = generateConversation({ speakers: 2, durationSec: 468, seed: 21 });
    const share = renderSpeakTimeBar(speakBar, conversation, 1);
    const caption = document.querySelector("[data-fp-example-speaktime-caption]");

    if (caption) caption.textContent = `${Math.round(share * 100)}%`;
  }

  const tableBody = document.querySelector("[data-fp-example-table]");

  if (tableBody) {
    const longest = Math.max(...EXAMPLE_ROWS.map((row) => row.durationSec));

    EXAMPLE_ROWS.forEach((row) => {
      const tr = document.createElement("tr");
      const titleCell = document.createElement("td");
      const fpCell = document.createElement("td");
      const strong = document.createElement("strong");
      const wrapper = document.createElement("div");
      const mini = document.createElement("div");
      const time = document.createElement("span");

      strong.textContent = row.title;
      titleCell.appendChild(strong);

      wrapper.className = "fp-mini-wrapper";
      mini.className = "fp-mini";
      // Even the longest bar stops short of the cell edge so the duration
      // label always has room.
      mini.style.width = `${Math.max(10, (row.durationSec / longest) * 72)}%`;
      renderFingerprintMini(
        mini,
        generateConversation({
          speakers: row.speakers,
          durationSec: row.durationSec,
          seed: row.seed,
          biases: row.biases,
        })
      );
      time.className = "fp-mini-time";
      time.textContent = formatTime(row.durationSec);
      wrapper.appendChild(mini);
      wrapper.appendChild(time);
      fpCell.appendChild(wrapper);
      fpCell.className = "fp-example-fp-cell";

      tr.appendChild(fpCell);
      tr.appendChild(titleCell);
      tableBody.appendChild(tr);
    });
  }

  const bricks = document.querySelector("[data-fp-example-bricks]");

  if (bricks) {
    BRICK_ROWS.forEach((row) => {
      const mini = document.createElement("div");

      mini.className = "fp-mini";
      // Same seconds-per-rem as the longest table row (312s ≈ 11.5rem).
      mini.style.width = `${(row.durationSec / 27).toFixed(1)}rem`;
      renderFingerprintMini(
        mini,
        generateConversation({
          speakers: row.speakers,
          durationSec: row.durationSec,
          seed: row.seed,
        })
      );
      bricks.appendChild(mini);
    });
  }
}

if (frame) {
  init();
}
