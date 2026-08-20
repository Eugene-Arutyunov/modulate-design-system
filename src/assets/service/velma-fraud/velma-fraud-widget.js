// Velma Fraud Demo widget — the interactive fraud-call demo rebuilt on the
// canonical fingerprint player (`.media-container` → `.pg-player-dataviz` →
// `.transcript-clip emotion-*`, kiki behaviour glyphs, hover captions).
//
// Classic script on purpose (no module imports): the HTML export inlines
// this file verbatim into a self-contained Webflow page. On the tools page
// the studio module mounts it via `window.VelmaFraudWidget.mount()`; in the
// exported file it self-mounts from the inline `#velma-fraud-data` JSON.
//
// Everything on screen is a pure function of the clock (`render(t)`): the
// clock is the mp3 when it loads, a simulated rAF clock otherwise — so
// scrub, pause and replay need no extra state.

(function () {
  "use strict";

  // Kiki glyph (outline + shape), same inline SVG the fingerprint uses.
  const KIKI_SVG =
    '<svg viewBox="0 0 241.8 241.8" aria-hidden="true">' +
    '<path class="behaviour-icon__outline" d="M159,239.9c-6.3,0-12.3-3.3-15.6-9l-29.3-50.7-87.2,44.2c-2.6,1.3-5.4,1.9-8.1,1.9-4.9,0-9.8-2-13.3-5.8-5.5-5.9-6.3-14.8-2.1-21.6l43.4-70.3-36.4-19.3c-6.9-3.7-10.7-11.4-9.3-19.2,1.4-7.7,7.7-13.6,15.5-14.6l40.5-5-19.8-41.1c-3.5-7.3-1.7-16,4.3-21.3,3.4-3,7.6-4.5,11.9-4.5s6.9,1,9.9,2.9l70.9,46.5L196.6,5.7c3.2-2.4,7.1-3.7,10.9-3.7s7.3,1.1,10.5,3.4c6.4,4.6,9.1,12.9,6.6,20.4l-29,86.5,35.2,16.4c6.8,3.2,10.9,10.2,10.3,17.7s-5.7,13.8-12.9,15.9l-47.9,14.1-3.3,46.9c-.6,7.9-6.2,14.5-13.9,16.3-1.3.3-2.7.5-4,.5Z"/>' +
    '<polygon points="18.9 93.5 84.3 85.5 53.6 21.7 135.1 75.2 207.5 20 173.4 121.7 223.1 144.9 163.3 162.5 159 221.9 121.2 156.4 18.8 208.4 72.3 121.7 18.9 93.5"/>' +
    "</svg>";

  const PLAY_ICON = '<polygon fill="currentColor" points="40 30 40 190 190 110 40 30" />';
  const PAUSE_ICON =
    '<rect fill="currentColor" x="50" y="35" width="40" height="150" rx="10" />' +
    '<rect fill="currentColor" x="130" y="35" width="40" height="150" rx="10" />';

  function el(tag, className, text) {
    const node = document.createElement(tag);

    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function fmt(ms) {
    const s = Math.max(0, Math.floor(ms / 1000));

    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  }

  function pct(part, total) {
    return Math.round((part / total) * 10000) / 100;
  }

  function capitalize(text) {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  /* Build ─────────────────────────────────────────────────────────────── */

  function buildTopBar(meta) {
    const top = el("div", "vf-top");
    const title = el("h2", "vf-top__title", meta.title || "Velma Triage");

    if (meta.subtitle) title.appendChild(el("span", "vf-top__subtitle", ` · ${meta.subtitle}`));
    top.appendChild(title);
    return top;
  }

  // The fingerprint player: dataviz with per-speaker clip lanes on top,
  // the (now actually working) player strip below.
  function buildPlayer(data, ui) {
    const duration = data.meta.durationMs;
    const container = el("div", "media-container vf-player");
    const dataviz = el("div", "pg-player-dataviz");
    const viz = el("div", "player-visualization");

    container.style.setProperty("--speaker-count", 2);
    dataviz.style.setProperty("--speaker-count", 2);

    // Clips start emotion-less: at 0:00 nothing is known yet — the resting
    // player is an empty fingerprint, the first clip lands as neutral on
    // play, and each clip takes its emotion color once it resolves.
    data.transcript.forEach((utt) => {
      const clip = el("div", "transcript-clip vf-pending");
      const clipViz = el("div", "clip-visualization");

      clip.dataset.speakerIndex = utt.speaker;
      clip.style.left = `${pct(utt.startMs, duration)}%`;
      clip.style.width = `${pct(utt.endMs - utt.startMs, duration)}%`;
      clip.appendChild(clipViz);
      clip._vfUtt = utt;
      viz.appendChild(clip);
      ui.clips.push({
        el: clip,
        utt,
        emotionClass: utt.emotion && utt.emotion !== "neutral" ? `emotion-${utt.emotion}` : null,
        revealMs: emotionRevealMs(data, utt),
      });
    });
    dataviz.appendChild(viz);

    // Speaker labels appear when the speaker gets identified.
    const labels = el("div", "speaker-labels");

    [1, 2].forEach((index) => {
      const label = el("div", "speaker-label vf-pending");
      const idSignal = data.signals.find(
        (signal) => signal.type === "speaker" && signal.speaker === index
      );

      label.dataset.speakerIndex = index;
      // Top-left of the lane — the bottom-left corner belongs to the
      // behaviour glyphs.
      label.style.top = `${((index - 1) * 100) / 2}%`;
      label.style.bottom = "auto";
      label.appendChild(el("span", "", data.meta.speakers?.[index]?.label || `Speaker ${index}`));
      labels.appendChild(label);
      ui.speakerLabels.push({ el: label, tMs: idSignal ? idSignal.tMs : 0 });
    });
    dataviz.appendChild(labels);

    // Behaviour glyphs sit in the bottom-left corner of their clip — the
    // same clip the transcript pins the behavior to — and appear when the
    // signal fires; the outline takes the clip's emotion.
    const indicators = el("div", "behaviour-indicators");
    const behaviors = behaviorsByUtterance(data);

    data.transcript.forEach((utt) => {
      (behaviors[utt.id] || []).forEach((signal, index) => {
        const indicator = el("div", "behaviour-indicator vf-pending");
        const icon = el("span", "behaviour-icon behaviour-icon--kiki");

        indicator.dataset.speakerIndex = utt.speaker;
        indicator.dataset.behaviourIndex = String(index + 1);
        indicator.dataset.emotion = utt.emotion || "neutral";
        indicator.style.left = `calc(${pct(utt.startMs, duration)}% + 0.3em)`;
        icon.title = signal.label;
        icon.innerHTML = KIKI_SVG;
        indicator.appendChild(icon);
        indicators.appendChild(indicator);
        ui.behaviours.push({ el: indicator, tMs: signal.tMs });
      });
    });
    dataviz.appendChild(indicators);
    container.appendChild(dataviz);

    // No `#audio-player` id: pages like the fingerprint studio already own
    // it for their canonical player; the strip subset the playground keys
    // on that id lives class-scoped in the widget styles instead.
    const strip = el("div", "media-box");

    strip.dataset.speakerCount = "2";
    strip.style.setProperty("--speaker-count", 2);
    strip.innerHTML = `
      <div class="player-controls">
        <div class="player-control-spacer"></div>
        <div class="player-control player-control-center" data-action="play-pause">
          <a href="#" class="player-icon" data-playing="false">
            <svg viewBox="0 0 220 220" xmlns="http://www.w3.org/2000/svg">${PLAY_ICON}</svg>
          </a>
        </div>
      </div>
      <div class="clip-text-caption"><span></span></div>
      <div class="player-start-time"><span class="start-time">0:00</span></div>
      <div class="player-total-time">
        <span class="vf-emotion-caption"></span>
        <span class="total-time">${fmt(duration)}</span>
      </div>`;
    container.appendChild(strip);

    const position = el("div", "player-position-indicator");

    position.appendChild(el("div", "player-position-line"));
    container.appendChild(position);
    container.appendChild(el("div", "pg-media-hover-line"));

    ui.player = container;
    ui.dataviz = dataviz;
    ui.strip = strip;
    ui.playIcon = strip.querySelector(".player-icon");
    ui.currentTime = strip.querySelector(".start-time");
    ui.positionLine = position.querySelector(".player-position-line");
    ui.transcriptCaption = strip.querySelector(".clip-text-caption");
    ui.emotionCaption = strip.querySelector(".vf-emotion-caption");
    return container;
  }

  // Fraud risk — the third feed column: a vertical meter filling bottom-up,
  // the threshold as a translucent dashed line. The head stays on top, the
  // live percent sits mid-column, the verdict line and action tags reveal
  // at the bottom. Past the threshold the whole plate turns red
  // (`vf-critical` on the root).
  function buildRisk(data, ui) {
    const panel = el("div", "vf-risk");
    const fill = el("div", "vf-risk__fill");
    const threshold = el("div", "vf-risk__threshold");
    const head = el("div", "vf-risk__head", "Fraud risk");
    const value = el("output", "vf-risk__value", "0%");
    const tags = el("div", "vf-risk__tags");
    const [, detailText] = splitVerdict(data.verdict.label);

    threshold.style.bottom = `${data.meta.fraudThreshold}%`;

    const verdict = el("div", "vf-risk__verdict", capitalize(detailText || data.verdict.label));

    tags.appendChild(verdict);

    // Action tags inherit the column state color — grades of white by the
    // time they reveal (the plate is red past the threshold).
    data.actions.forEach((action) => {
      const tag = el("span", "m__tag vf-action", action.label);

      tags.appendChild(tag);
      ui.actions.push({ el: tag, tMs: action.tMs });
    });

    panel.appendChild(fill);
    panel.appendChild(threshold);
    panel.appendChild(head);
    panel.appendChild(value);
    panel.appendChild(tags);

    ui.risk = panel;
    ui.riskFill = fill;
    ui.riskValue = value;
    ui.verdict = verdict;
    return panel;
  }

  function splitVerdict(label) {
    const parts = String(label).split(" — ");

    if (parts.length < 2) return [label, ""];
    return [parts[0], parts.slice(1).join(" — ")];
  }

  // Each behavior signal is pinned to the last utterance of its speaker
  // that started before the signal fired (same rule `emotionAt` uses for
  // the glyph outline — the behavior may register during the reply).
  function behaviorsByUtterance(data) {
    const map = {};

    data.signals
      .filter((signal) => signal.type === "behavior")
      .forEach((signal) => {
        let target = null;

        data.transcript.forEach((utt) => {
          if (utt.speaker === (signal.speaker || 1) && utt.startMs <= signal.tMs) target = utt;
        });
        if (!target) return;
        if (!map[target.id]) map[target.id] = [];
        map[target.id].push(signal);
      });
    return map;
  }

  function buildTranscript(data, ui) {
    const panel = el("div", "vf-transcript");
    const head = el("div", "vf-panel-head", "Diarized transcript");
    const list = el("div", "vf-utterances");
    const behaviors = behaviorsByUtterance(data);

    data.transcript.forEach((utt) => {
      // Caller keeps the left shoulder, Agent the right — the playground's
      // alternating-transcript pattern pinned to roles.
      const side = utt.speaker === 2 ? "speaker-right" : "speaker-left";
      const item = el("div", `pg-transcript-utterance vf-utt ${side}`);
      const header = el("div", "pg-transcript-utterance-header");
      const text = el("div", "pg-transcript-text");
      const speaker = data.meta.speakers?.[utt.speaker];
      const emotion = utt.emotion || "neutral";

      item.dataset.speaker = utt.speaker;
      item.style.setProperty("--ec", `rgba(var(--emotion-${emotion}-RGB), 1)`);
      header.appendChild(el("span", "pg-transcript-time", fmt(utt.startMs)));
      header.appendChild(
        el("span", "pg-transcript-speaker", speaker?.label || `Speaker ${utt.speaker}`)
      );

      // Behavior tags appear in the header when their signal fires.
      (behaviors[utt.id] || []).forEach((signal) => {
        const wrap = el("span", "pg-transcript-behavior");
        const link = el("a", "pg-behavior-link");

        link.href = "#";
        link.innerHTML = KIKI_SVG;
        link.appendChild(document.createTextNode(signal.label));
        wrap.appendChild(link);
        wrap.appendChild(
          el("span", "pg-transcript-behavior-confidence", `${signal.confidence}%`)
        );
        header.appendChild(wrap);
        ui.behaviorLinks.push({ el: link, tMs: signal.tMs });
        ui.behaviorTags.push({ el: wrap, tMs: signal.tMs });
      });

      // The emotion name fades in when the emotion resolves.
      const emotionSpan = el("span", "pg-transcript-emotion", capitalize(emotion));

      header.appendChild(emotionSpan);
      ui.emotionSpans.push({ el: emotionSpan, tMs: emotionRevealMs(data, utt) });
      text.appendChild(el("p", "", utt.text));
      item.appendChild(header);
      item.appendChild(text);
      list.appendChild(item);
      ui.utterances.push({ el: item, utt });
    });

    panel.appendChild(head);
    panel.appendChild(list);
    ui.transcriptPanel = panel;
    return panel;
  }

  function buildSignals(data, ui) {
    const panel = el("div", "vf-signals");
    const head = el("div", "vf-panel-head", "Live signal stream");
    const list = el("div", "vf-signal-list");
    const empty = el("div", "vf-signals__empty", "Press play — signals appear as Velma hears them");

    list.appendChild(empty);

    // A table row: time · kind · label · confidence.
    data.signals.forEach((signal) => {
      const item = el("div", "vf-sig");

      item.dataset.kind = signal.type;
      item.appendChild(el("span", "vf-sig__time", fmt(signal.tMs)));
      item.appendChild(el("span", "vf-sig__type", signal.type));
      item.appendChild(el("span", "vf-sig__label", signal.label));
      item.appendChild(el("span", "vf-sig__val", `${signal.confidence}%`));
      list.appendChild(item);
      ui.signals.push({ el: item, tMs: signal.tMs, signal });
    });

    panel.appendChild(head);
    panel.appendChild(list);
    ui.signalsPanel = panel;
    ui.signalsEmpty = empty;
    return panel;
  }

  // The confidence rises only when suspicious signals land — each carries
  // a `weight` in percent points; the sum by time t is the meter value.
  function meterAt(signals, t) {
    let value = 0;

    signals.forEach((signal) => {
      if (signal.weight && signal.tMs <= t) value += signal.weight;
    });
    return Math.min(value, 100);
  }

  // Emotions resolve with a small lag: with an emotion signal inside the
  // utterance the emotion lands at the signal moment, otherwise ~2.5s in.
  // Until then the clip reads neutral.
  function emotionRevealMs(data, utt) {
    const signal = data.signals.find(
      (s) =>
        s.type === "emotion" && s.speaker === utt.speaker && s.tMs >= utt.startMs && s.tMs <= utt.endMs
    );

    return signal ? signal.tMs : Math.min(utt.startMs + 2500, utt.endMs);
  }

  // The feed panels are `overflow: hidden`, so the wheel always stays with
  // the page — the widget drives scrollTop itself, eased towards the
  // target every frame: from the cursor position (Y over a panel, X over
  // the fingerprint) and from the playback autoscroll.
  function createPanelScroller(panel) {
    let target = 0;
    let rafId = null;

    function step() {
      const delta = target - panel.scrollTop;

      if (Math.abs(delta) < 0.5) {
        panel.scrollTop = target;
        rafId = null;
        return;
      }
      panel.scrollTop += delta * 0.16;
      rafId = requestAnimationFrame(step);
    }

    return {
      to(px) {
        target = Math.max(0, Math.min(px, panel.scrollHeight - panel.clientHeight));
        if (rafId === null) rafId = requestAnimationFrame(step);
      },
      toRatio(ratio) {
        this.to(Math.min(1, Math.max(0, ratio)) * (panel.scrollHeight - panel.clientHeight));
      },
      by(delta) {
        this.to(panel.scrollTop + delta);
      },
      stop() {
        cancelAnimationFrame(rafId);
        rafId = null;
      },
    };
  }

  // Keep a feed pinned to its very end — the newest entry sits above the
  // list's bottom padding (the `to` clamp resolves the actual maximum).
  function scrollPanelEnd(scroller, panel) {
    scroller.to(panel.scrollHeight);
  }

  /* Mount ─────────────────────────────────────────────────────────────── */

  function mount(root, data, options) {
    const opts = options || {};
    const duration = data.meta.durationMs;
    const ui = {
      clips: [],
      behaviours: [],
      utterances: [],
      signals: [],
      actions: [],
      behaviorLinks: [],
      behaviorTags: [],
      speakerLabels: [],
      emotionSpans: [],
    };

    root.classList.add("velma-fraud-widget", "dark-mode");
    root.textContent = "";
    root.appendChild(buildTopBar(data.meta));
    root.appendChild(buildPlayer(data, ui));

    const main = el("div", "vf-main");

    main.appendChild(buildTranscript(data, ui));
    main.appendChild(buildSignals(data, ui));
    main.appendChild(buildRisk(data, ui));
    root.appendChild(main);

    const transcriptScroller = createPanelScroller(ui.transcriptPanel);
    const signalsScroller = createPanelScroller(ui.signalsPanel);
    // Panels whose playback autoscroll currently yields to the cursor.
    const scrollHeld = new Set();
    // The utterance whose bubble is hovered — keeps the linked clip lit
    // through the render loop.
    let hoverUtt = null;
    // The cursor's clientX while it hovers the fingerprint — render
    // re-applies the transcript mapping when a new clip reveals.
    let playerHoverX = null;

    function bindHoverScroll(panel, scroller) {
      panel.addEventListener("mouseenter", () => scrollHeld.add(panel));
      panel.addEventListener("mousemove", (event) => {
        const rect = panel.getBoundingClientRect();

        scroller.toRatio((event.clientY - rect.top) / rect.height);
      });
      panel.addEventListener("mouseleave", () => {
        scrollHeld.delete(panel);
        // The resting state shows the end of the feed.
        scrollPanelEnd(scroller, panel);
      });
    }

    bindHoverScroll(ui.transcriptPanel, transcriptScroller);
    bindHoverScroll(ui.signalsPanel, signalsScroller);

    /* Clock — audio-backed when the mp3 loads, simulated otherwise. */
    let audio = null;
    let audioOK = false;
    let simT = 0;
    let playing = false;
    let rafId = null;
    let lastTick = 0;
    let destroyed = false;

    if (data.meta.audioUrl) {
      const candidate = new Audio(data.meta.audioUrl);

      candidate.preload = "auto";
      candidate.addEventListener("canplaythrough", () => {
        if (destroyed || audioOK) return;
        audio = candidate;
        audioOK = true;
      });
      candidate.load();
    }

    function nowMs() {
      return audioOK ? audio.currentTime * 1000 : simT;
    }

    function seekMs(t) {
      const clamped = Math.max(0, Math.min(duration, t));

      if (audioOK) audio.currentTime = clamped / 1000;
      simT = clamped;
      render(clamped);
    }

    function play() {
      if (nowMs() >= duration - 20) seekMs(0);
      playing = true;
      if (audioOK) audio.play();
      ui.player.dataset.playbackStarted = "true";
      lastTick = performance.now();
      cancelAnimationFrame(rafId);
      loop();
      setPlayIcon(true);
    }

    function pause() {
      playing = false;
      if (audioOK) audio.pause();
      cancelAnimationFrame(rafId);
      setPlayIcon(false);
    }

    function loop() {
      rafId = requestAnimationFrame(loop);
      if (!audioOK && playing) {
        const t = performance.now();

        simT += t - lastTick;
        lastTick = t;
      }
      let current = nowMs();

      if (current >= duration) {
        current = duration;
        pause();
      }
      render(current);
    }

    function setPlayIcon(isPlaying) {
      ui.playIcon.dataset.playing = String(isPlaying);
      ui.playIcon.querySelector("svg").innerHTML = isPlaying ? PAUSE_ICON : PLAY_ICON;
    }

    /* Render — pure function of t (plus the started flag: the resting
       widget shows an empty fingerprint — nothing is known at 0:00). */
    function render(t) {
      const started = playing || t > 0;

      ui.positionLine.style.left = `${pct(t, duration)}%`;
      ui.currentTime.textContent = fmt(t);

      ui.clips.forEach(({ el: node, utt, emotionClass, revealMs }) => {
        node.classList.toggle("vf-pending", !started || t < utt.startMs);
        node.classList.toggle("hover", (t >= utt.startMs && t <= utt.endMs) || utt === hoverUtt);
        // Neutral until the emotion resolves.
        if (emotionClass) node.classList.toggle(emotionClass, t >= revealMs);
      });
      ui.speakerLabels.forEach(({ el: node, tMs }) => {
        node.classList.toggle("vf-pending", !started || t < tMs);
      });
      ui.emotionSpans.forEach(({ el: node, tMs }) => {
        node.classList.toggle("vf-visible", t >= tMs);
      });
      ui.behaviorTags.forEach(({ el: node, tMs }) => {
        node.classList.toggle("vf-visible", t >= tMs);
      });
      ui.behaviours.forEach(({ el: node, tMs }) => {
        node.classList.toggle("vf-pending", t < tMs);
      });

      let lastUtt = null;

      ui.utterances.forEach(({ el: node, utt }) => {
        const visible = started && t >= utt.startMs;

        node.classList.toggle("vf-visible", visible);
        node.classList.toggle("active", t >= utt.startMs && t <= utt.endMs);
        if (visible) lastUtt = node;
      });
      if (playerHoverX !== null) {
        scrollFeedsFromPlayerX(playerHoverX);
      } else if (playing && lastUtt && !scrollHeld.has(ui.transcriptPanel)) {
        scrollPanelEnd(transcriptScroller, ui.transcriptPanel);
      }

      let lastSignal = null;

      ui.signals.forEach(({ el: node, tMs }) => {
        const visible = t >= tMs;

        node.classList.toggle("vf-visible", visible);
        if (visible) lastSignal = node;
      });
      ui.signalsEmpty.style.display = lastSignal ? "none" : "";
      if (playing && lastSignal && !scrollHeld.has(ui.signalsPanel)) {
        scrollPanelEnd(signalsScroller, ui.signalsPanel);
      }

      const value = meterAt(data.signals, t);
      const crit = value >= data.meta.fraudThreshold;
      const warn = value >= 55 && !crit;

      ui.riskFill.style.height = `${value}%`;
      ui.riskValue.textContent = `${Math.round(value)}%`;
      ui.risk.classList.toggle("vf-crit", crit);
      ui.risk.classList.toggle("vf-warn", warn);
      root.classList.toggle("vf-critical", crit);

      ui.verdict.classList.toggle("vf-visible", t >= data.verdict.tMs);
      ui.actions.forEach(({ el: node, tMs }) => {
        node.classList.toggle("vf-visible", t >= tMs);
      });
    }

    /* Controls ──────────────────────────────────────────────────────── */

    // The whole plate is one play/pause control. A starting click on the
    // fingerprint begins playback from that spot; a pausing click never
    // moves the position. Interactive entries (bubbles, signal rows) carry
    // their own actions and don't toggle.
    function seekFromEvent(event) {
      const rect = ui.dataviz.getBoundingClientRect();
      const x = (event.touches ? event.touches[0].clientX : event.clientX) - rect.left;

      seekMs((x / rect.width) * duration);
    }

    function onRootClick(event) {
      if (event.target.closest(".vf-utt, .vf-sig")) return;
      event.preventDefault();
      if (playing) {
        pause();
      } else {
        if (event.target.closest(".pg-player-dataviz")) seekFromEvent(event);
        play();
      }
    }

    root.addEventListener("click", onRootClick);

    // Same hover line the playground binds on its media containers; the
    // cursor's X over the fingerprint also drives the transcript and the
    // signal feed — the same data rotated 90°. The mapping counts only the
    // revealed part of the timeline (up to the end of the last revealed
    // clip), matching the partially revealed feeds; `render` re-applies
    // the stored X, so a newly revealed clip recomputes the positions.
    function scrollFeedsFromPlayerX(clientX) {
      const rect = ui.player.getBoundingClientRect();
      const t = nowMs();
      let revealedEndMs = 0;

      data.transcript.forEach((utt) => {
        if (utt.startMs <= t) revealedEndMs = Math.max(revealedEndMs, utt.endMs);
      });
      if (!revealedEndMs) return;

      const ratio = (((clientX - rect.left) / rect.width) * duration) / revealedEndMs;

      transcriptScroller.toRatio(ratio);
      signalsScroller.toRatio(ratio);
    }

    ui.player.addEventListener("mousemove", (event) => {
      const rect = ui.player.getBoundingClientRect();

      ui.player.style.setProperty("--pg-hover-x", `${event.clientX - rect.left}px`);
      ui.player.dataset.hover = "true";
      scrollHeld.add(ui.transcriptPanel);
      scrollHeld.add(ui.signalsPanel);
      playerHoverX = event.clientX;
      scrollFeedsFromPlayerX(playerHoverX);
    });
    ui.player.addEventListener("mouseleave", () => {
      ui.player.dataset.hover = "false";
      scrollHeld.delete(ui.transcriptPanel);
      scrollHeld.delete(ui.signalsPanel);
      playerHoverX = null;
      scrollPanelEnd(transcriptScroller, ui.transcriptPanel);
      scrollPanelEnd(signalsScroller, ui.signalsPanel);
    });

    /* Player ↔ transcript hover link. */

    const uttNodeByUtt = new Map(ui.utterances.map(({ el: node, utt }) => [utt, node]));
    const clipNodeByUtt = new Map(ui.clips.map(({ el: node, utt }) => [utt, node]));

    // Clip hover captions: emotion name left of the total time, transcript
    // line next to the current time — the fingerprint pattern. The hover
    // also lights the utterance's bubble in the transcript.
    ui.clips.forEach(({ el: node, utt }) => {
      node.addEventListener("mouseenter", () => {
        if (utt.emotion) {
          ui.emotionCaption.textContent = capitalize(utt.emotion);
          ui.emotionCaption.style.color = `rgba(var(--emotion-${utt.emotion}-RGB), 1)`;
          ui.emotionCaption.classList.add("visible");
        }
        ui.transcriptCaption.querySelector("span").textContent = utt.text;
        ui.transcriptCaption.classList.add("visible");
        uttNodeByUtt.get(utt)?.classList.add("vf-hover");
      });
      node.addEventListener("mouseleave", () => {
        ui.emotionCaption.classList.remove("visible");
        ui.transcriptCaption.classList.remove("visible");
        uttNodeByUtt.get(utt)?.classList.remove("vf-hover");
      });
    });

    // And the reverse: hovering a bubble lights its clip on the timeline
    // (`hoverUtt` keeps it lit through the render loop while playing).
    ui.utterances.forEach(({ el: node, utt }) => {
      node.addEventListener("mouseenter", () => {
        hoverUtt = utt;
        clipNodeByUtt.get(utt)?.classList.add("hover");
      });
      node.addEventListener("mouseleave", () => {
        hoverUtt = null;
        const now = nowMs();

        if (!(now >= utt.startMs && now <= utt.endMs)) {
          clipNodeByUtt.get(utt)?.classList.remove("hover");
        }
      });
    });

    /* Signal ↔ utterance ↔ timeline links ───────────────────────────── */

    // Behavior tags in utterance headers seek to the signal moment.
    ui.behaviorLinks.forEach(({ el: node, tMs }) => {
      node.addEventListener("click", (event) => {
        event.preventDefault();
        seekMs(tMs);
      });
    });

    // Clicking a bubble seeks to its start (the canonical transcript
    // bubble is interactive — honor the affordance).
    ui.utterances.forEach(({ el: node, utt }) => {
      node.addEventListener("click", (event) => {
        if (event.target.closest(".pg-behavior-link")) return;
        seekMs(utt.startMs);
      });
    });

    // Clicking a signal scrolls the transcript to its evidence utterance
    // and flashes it — the review-report highlight.
    let evidenceTimer = null;

    function utteranceNodeAt(tMs, speaker) {
      let found = null;

      ui.utterances.forEach(({ el: node, utt }) => {
        if ((speaker == null || utt.speaker === speaker) && utt.startMs <= tMs) found = node;
      });
      return found;
    }

    ui.signals.forEach(({ el: node, signal }) => {
      node.addEventListener("click", () => {
        const target = utteranceNodeAt(signal.tMs, signal.speaker);

        if (!target) return;
        ui.utterances.forEach(({ el: item }) => item.classList.remove("is-evidence-highlighted"));
        target.classList.add("is-evidence-highlighted");

        const panelRect = ui.transcriptPanel.getBoundingClientRect();
        const targetRect = target.getBoundingClientRect();

        transcriptScroller.to(
          ui.transcriptPanel.scrollTop +
            targetRect.top -
            panelRect.top -
            (panelRect.height - targetRect.height) / 2
        );
        clearTimeout(evidenceTimer);
        evidenceTimer = setTimeout(() => target.classList.remove("is-evidence-highlighted"), 2000);
      });
    });

    // Keyboard control is opt-out (`{ keyboard: false }`): on documentation
    // pages hijacking Space/arrows from the page would be rude.
    function onKeydown(event) {
      const tag = event.target.tagName;

      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "BUTTON" || tag === "SELECT") return;
      if (event.code === "Space") {
        event.preventDefault();
        playing ? pause() : play();
      }
      if (event.code === "ArrowRight") seekMs(nowMs() + 2000);
      if (event.code === "ArrowLeft") seekMs(nowMs() - 2000);
    }
    if (opts.keyboard !== false) window.addEventListener("keydown", onKeydown);

    render(0);

    const controller = {
      replay() {
        seekMs(0);
        play();
      },
      seek(t) {
        seekMs(t);
      },
      destroy() {
        destroyed = true;
        pause();
        clearTimeout(evidenceTimer);
        transcriptScroller.stop();
        signalsScroller.stop();
        root.removeEventListener("click", onRootClick);
        window.removeEventListener("keydown", onKeydown);
        root.textContent = "";
        root.classList.remove("velma-fraud-widget", "dark-mode", "vf-critical");
      },
    };

    // Debug handle for the console / tests.
    window.VelmaFraudWidget._last = controller;
    return controller;
  }

  window.VelmaFraudWidget = { mount };

  // Self-mount for the exported standalone page: data travels as inline
  // JSON next to the widget root. The tools page has no such element — the
  // studio module mounts explicitly there.
  function autoMount() {
    const dataEl = document.getElementById("velma-fraud-data");
    const root = document.querySelector("[data-vf-widget]");

    if (dataEl && root && !root.hasChildNodes()) {
      try {
        mount(root, JSON.parse(dataEl.textContent));
      } catch (error) {
        console.error("Velma Fraud Demo: invalid inline data", error);
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", autoMount);
  } else {
    autoMount();
  }
})();
