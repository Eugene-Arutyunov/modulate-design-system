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
    const left = el("div", "vf-top__left");
    const title = el("span", "vf-top__title", meta.title || "Velma Triage");

    left.appendChild(title);
    if (meta.subtitle) title.appendChild(el("span", "vf-top__subtitle", ` · ${meta.subtitle}`));
    top.appendChild(left);
    top.appendChild(el("span", "vf-top__mode", "Demo clock"));
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

    data.transcript.forEach((utt) => {
      const clip = el("div", `transcript-clip emotion-${utt.emotion || "neutral"} vf-pending`);
      const clipViz = el("div", "clip-visualization");

      clip.dataset.speakerIndex = utt.speaker;
      clip.style.left = `${pct(utt.startMs, duration)}%`;
      clip.style.width = `${pct(utt.endMs - utt.startMs, duration)}%`;
      clip.appendChild(clipViz);
      clip._vfUtt = utt;
      viz.appendChild(clip);
      ui.clips.push({ el: clip, utt });
    });
    dataviz.appendChild(viz);

    const labels = el("div", "speaker-labels");

    [1, 2].forEach((index) => {
      const label = el("div", "speaker-label");

      label.dataset.speakerIndex = index;
      label.style.bottom = `${((2 - index) * 100) / 2}%`;
      label.appendChild(el("span", "", data.meta.speakers?.[index]?.label || `Speaker ${index}`));
      labels.appendChild(label);
    });
    dataviz.appendChild(labels);

    // Behaviour glyphs fire exactly at their signal times, on the speaker's
    // lane; the outline takes the emotion of the clip active at that moment.
    const indicators = el("div", "behaviour-indicators");

    data.signals
      .filter((signal) => signal.type === "behavior")
      .forEach((signal) => {
        const indicator = el("div", "behaviour-indicator vf-pending");
        const icon = el("span", "behaviour-icon behaviour-icon--kiki");

        indicator.dataset.speakerIndex = signal.speaker || 1;
        indicator.dataset.behaviourIndex = "1";
        indicator.dataset.emotion = emotionAt(data, signal.speaker || 1, signal.tMs);
        indicator.style.left = `${pct(signal.tMs, duration)}%`;
        icon.title = signal.label;
        icon.innerHTML = KIKI_SVG;
        indicator.appendChild(icon);
        indicators.appendChild(indicator);
        ui.behaviours.push({ el: indicator, tMs: signal.tMs });
      });
    dataviz.appendChild(indicators);
    container.appendChild(dataviz);

    const strip = el("div", "media-box");

    strip.id = "audio-player";
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

  function buildThreshold(meta) {
    const threshold = el("div", "vf-meter__threshold");

    threshold.style.left = `${meta.fraudThreshold}%`;
    threshold.dataset.label = `Threshold ${meta.fraudThreshold}%`;
    return threshold;
  }

  function buildMeter(data, ui) {
    const section = el("div", "vf-meter");

    // TEMPORARY: two meter variants stacked — the owner picks one, the
    // other gets deleted (both are driven by the same keyframes).

    // V1 — gradient bar over the emotion-group palette.
    const head = el("div", "vf-meter__head");
    const bar = el("div", "vf-meter__bar");
    const fill = el("div", "vf-meter__fill");

    head.appendChild(el("span", "vf-meter__label", "Fraud risk confidence"));
    head.appendChild(el("output", "vf-meter__value", "0%"));
    bar.appendChild(fill);
    bar.appendChild(buildThreshold(data.meta));

    // V2 — big tabular value + plain single-color confidence bar.
    const alt = el("div", "vf-meter2");
    const altValue = el("output", "vf-meter2__value", "0%");
    const altBar = el("div", "vf-meter2__bar");
    const altFill = el("div", "vf-meter2__fill");

    altBar.appendChild(altFill);
    altBar.appendChild(buildThreshold(data.meta));
    alt.appendChild(altValue);
    alt.appendChild(altBar);

    // Verdict — the playground "This is …" statement anchored to the player.
    const [statementText, detailText] = splitVerdict(data.verdict.label);
    const verdict = el("div", "vf-verdict pg-verdict-statement danger");
    const title = el("h2", "pg-verdict-statement-title");
    const link = el("a", "pg-verdict-statement-link", statementText);
    const details = el("div", "pg-verdict-statement-details");

    link.href = "#audio-player";
    title.appendChild(link);
    if (detailText) details.appendChild(el("span", "pg-verdict-statement-stat", detailText));

    const confidenceStat = el("span", "pg-verdict-statement-stat");

    confidenceStat.appendChild(
      el("span", "pg-verdict-statement-stat-value", `${data.verdict.confidence}%`)
    );
    confidenceStat.appendChild(document.createTextNode(" confidence"));
    details.appendChild(confidenceStat);

    const timeStat = el("span", "pg-verdict-statement-stat");

    timeStat.appendChild(el("span", "pg-verdict-statement-stat-value", fmt(data.verdict.tMs)));
    details.appendChild(timeStat);
    verdict.appendChild(title);
    verdict.appendChild(details);

    // Actions as canonical tags; tone follows the action's meaning.
    const actions = el("div", "vf-actions");
    const tones = ["m__tag--error", "m__tag--muted", "m__tag--error"];

    data.actions.forEach((action, index) => {
      const tag = el("span", `m__tag ${tones[index] || "m__tag--muted"} vf-action`, action.label);

      actions.appendChild(tag);
      ui.actions.push({ el: tag, tMs: action.tMs });
    });

    section.appendChild(head);
    section.appendChild(bar);
    section.appendChild(alt);
    section.appendChild(verdict);
    section.appendChild(actions);

    ui.meterFill = fill;
    ui.meterValue = head.querySelector(".vf-meter__value");
    ui.meter2 = alt;
    ui.meter2Fill = altFill;
    ui.meter2Value = altValue;
    ui.verdict = verdict;
    return section;
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

      (behaviors[utt.id] || []).forEach((signal) => {
        const wrap = el("span", "pg-transcript-behavior");
        const link = el("a", "pg-behavior-link");

        link.href = "#audio-player";
        link.innerHTML = KIKI_SVG;
        link.appendChild(document.createTextNode(signal.label));
        wrap.appendChild(link);
        wrap.appendChild(
          el("span", "pg-transcript-behavior-confidence", `${signal.confidence}%`)
        );
        header.appendChild(wrap);
        ui.behaviorLinks.push({ el: link, tMs: signal.tMs });
      });

      header.appendChild(el("span", "pg-transcript-emotion", capitalize(emotion)));
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

    data.signals.forEach((signal) => {
      const item = el("div", "vf-sig");
      const row = el("div", "vf-sig__row");
      const conf = el("div", "vf-sig__conf");
      const bar = el("div", "vf-sig__bar");
      const fill = el("div", "vf-sig__fill");

      item.dataset.kind = signal.type;
      // Emotion signals carry the emotion's own color; other kinds get
      // their accent from the stylesheet.
      if (signal.type === "emotion" && signal.emotion) {
        item.style.setProperty("--vf-sig-RGB", `var(--emotion-${signal.emotion}-RGB)`);
      }
      row.appendChild(el("span", "vf-sig__type", signal.type));
      row.appendChild(el("span", "vf-sig__time", fmt(signal.tMs)));
      fill.style.width = `${signal.confidence}%`;
      bar.appendChild(fill);
      conf.appendChild(bar);
      conf.appendChild(el("span", "vf-sig__val", `${signal.confidence}%`));
      item.appendChild(row);
      item.appendChild(el("div", "vf-sig__label", signal.label));
      item.appendChild(conf);
      list.appendChild(item);
      ui.signals.push({ el: item, tMs: signal.tMs, signal });
    });

    panel.appendChild(head);
    panel.appendChild(list);
    ui.signalsPanel = panel;
    ui.signalsEmpty = empty;
    return panel;
  }

  // The last clip of the speaker that started before t — its emotion colors
  // the behaviour glyph outline.
  function emotionAt(data, speaker, tMs) {
    let emotion = "neutral";

    data.transcript.forEach((utt) => {
      if (utt.speaker === speaker && utt.startMs <= tMs && utt.emotion) emotion = utt.emotion;
    });
    return emotion;
  }

  function meterAt(keyframes, t) {
    if (!keyframes.length) return 0;
    if (t <= keyframes[0].tMs) return keyframes[0].value;
    for (let i = 0; i < keyframes.length - 1; i += 1) {
      if (t >= keyframes[i].tMs && t < keyframes[i + 1].tMs) {
        const span = keyframes[i + 1].tMs - keyframes[i].tMs;
        const progress = span > 0 ? (t - keyframes[i].tMs) / span : 1;
        // Ease into each step rather than a linear crawl.
        const eased = Math.min(1, progress * 3);

        return keyframes[i].value + (keyframes[i + 1].value - keyframes[i].value) * eased;
      }
    }
    return keyframes[keyframes.length - 1].value;
  }

  // Scroll a feed panel to keep its newest visible entry in view without
  // ever scrolling the page itself.
  function scrollPanelTo(panel, node) {
    const target = node.offsetTop + node.offsetHeight - panel.clientHeight;

    if (target > panel.scrollTop) panel.scrollTo({ top: target, behavior: "smooth" });
  }

  /* Mount ─────────────────────────────────────────────────────────────── */

  function mount(root, data) {
    const duration = data.meta.durationMs;
    const ui = {
      clips: [],
      behaviours: [],
      utterances: [],
      signals: [],
      actions: [],
      behaviorLinks: [],
    };

    root.classList.add("velma-fraud-widget", "dark-mode");
    root.textContent = "";
    root.appendChild(buildTopBar(data.meta));
    root.appendChild(buildPlayer(data, ui));
    root.appendChild(buildMeter(data, ui));

    const main = el("div", "vf-main");

    main.appendChild(buildTranscript(data, ui));
    main.appendChild(buildSignals(data, ui));
    root.appendChild(main);

    const modeTag = root.querySelector(".vf-top__mode");

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
        if (modeTag) modeTag.textContent = "Audio synced";
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

    /* Render — pure function of t. */
    function render(t) {
      ui.positionLine.style.left = `${pct(t, duration)}%`;
      ui.currentTime.textContent = fmt(t);

      ui.clips.forEach(({ el: node, utt }) => {
        node.classList.toggle("vf-pending", t < utt.startMs);
        node.classList.toggle("hover", t >= utt.startMs && t <= utt.endMs);
      });
      ui.behaviours.forEach(({ el: node, tMs }) => {
        node.classList.toggle("vf-pending", t < tMs);
      });

      let lastUtt = null;

      ui.utterances.forEach(({ el: node, utt }) => {
        const visible = t >= utt.startMs;

        node.classList.toggle("vf-visible", visible);
        // `active` is the canonical playground class — the bubble tints
        // with the utterance's own emotion color (`--ec`).
        node.classList.toggle("active", t >= utt.startMs && t <= utt.endMs);
        if (visible) lastUtt = node;
      });
      if (playing && lastUtt) scrollPanelTo(ui.transcriptPanel, lastUtt);

      let lastSignal = null;

      ui.signals.forEach(({ el: node, tMs }) => {
        const visible = t >= tMs;

        node.classList.toggle("vf-visible", visible);
        if (visible) lastSignal = node;
      });
      ui.signalsEmpty.style.display = lastSignal ? "none" : "";
      if (playing && lastSignal) scrollPanelTo(ui.signalsPanel, lastSignal);

      const value = meterAt(data.meterKeyframes, t);
      const crit = value >= data.meta.fraudThreshold;
      const warn = value >= 55 && !crit;

      ui.meterFill.style.width = `${value}%`;
      ui.meterFill.style.setProperty("--vf-fill", `${Math.max(value, 1) / 100}`);
      ui.meterValue.textContent = `${Math.round(value)}%`;
      ui.meterValue.classList.toggle("vf-crit", crit);
      ui.meterValue.classList.toggle("vf-warn", warn);
      ui.meter2Fill.style.width = `${value}%`;
      ui.meter2Value.textContent = `${Math.round(value)}%`;
      ui.meter2.classList.toggle("vf-crit", crit);
      ui.meter2.classList.toggle("vf-warn", warn);

      ui.verdict.classList.toggle("vf-visible", t >= data.verdict.tMs);
      ui.actions.forEach(({ el: node, tMs }) => {
        node.classList.toggle("vf-visible", t >= tMs);
      });
    }

    /* Controls ──────────────────────────────────────────────────────── */

    ui.strip.querySelector("[data-action='play-pause']").addEventListener("click", (event) => {
      event.preventDefault();
      playing ? pause() : play();
    });

    // Scrub on the visualization; the strip itself is the play button.
    let scrubbing = false;

    function seekFromEvent(event) {
      const rect = ui.dataviz.getBoundingClientRect();
      const x = (event.touches ? event.touches[0].clientX : event.clientX) - rect.left;

      seekMs((x / rect.width) * duration);
    }

    ui.dataviz.addEventListener("mousedown", (event) => {
      scrubbing = true;
      seekFromEvent(event);
    });
    ui.dataviz.addEventListener(
      "touchstart",
      (event) => {
        scrubbing = true;
        seekFromEvent(event);
      },
      { passive: true }
    );

    function onMove(event) {
      if (scrubbing) seekFromEvent(event);
    }
    function onUp() {
      scrubbing = false;
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onUp);

    // Same hover line the playground binds on its media containers.
    ui.player.addEventListener("mousemove", (event) => {
      const rect = ui.player.getBoundingClientRect();

      ui.player.style.setProperty("--pg-hover-x", `${event.clientX - rect.left}px`);
      ui.player.dataset.hover = "true";
    });
    ui.player.addEventListener("mouseleave", () => {
      ui.player.dataset.hover = "false";
    });

    // Clip hover captions: emotion name left of the total time, transcript
    // line next to the current time — the fingerprint pattern.
    ui.clips.forEach(({ el: node, utt }) => {
      node.addEventListener("mouseenter", () => {
        if (utt.emotion) {
          ui.emotionCaption.textContent = capitalize(utt.emotion);
          ui.emotionCaption.style.color = `rgba(var(--emotion-${utt.emotion}-RGB), 1)`;
          ui.emotionCaption.classList.add("visible");
        }
        ui.transcriptCaption.querySelector("span").textContent = utt.text;
        ui.transcriptCaption.classList.add("visible");
      });
      node.addEventListener("mouseleave", () => {
        ui.emotionCaption.classList.remove("visible");
        ui.transcriptCaption.classList.remove("visible");
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

        ui.transcriptPanel.scrollTo({
          top:
            ui.transcriptPanel.scrollTop +
            targetRect.top -
            panelRect.top -
            (panelRect.height - targetRect.height) / 2,
          behavior: "smooth",
        });
        clearTimeout(evidenceTimer);
        evidenceTimer = setTimeout(() => target.classList.remove("is-evidence-highlighted"), 2000);
      });
    });

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
    window.addEventListener("keydown", onKeydown);

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
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
        window.removeEventListener("touchmove", onMove);
        window.removeEventListener("touchend", onUp);
        window.removeEventListener("keydown", onKeydown);
        root.textContent = "";
        root.classList.remove("velma-fraud-widget", "dark-mode");
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
