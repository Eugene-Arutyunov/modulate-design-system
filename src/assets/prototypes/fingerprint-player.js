import { renderFingerprint } from "../service/fingerprint/fingerprint.js";

// Adapt the existing prototype fixtures to the same renderer used by Tools.
// Keep detector-specific tracks intact; they are not transcript fingerprints.
document.querySelectorAll("[data-fingerprint-player]").forEach((source) => {
  const durationSec = source.querySelector("[data-total-time]").textContent.trim()
    .split(":").reduce((total, part) => total * 60 + Number(part), 0);
  const names = Array.from(source.querySelectorAll(".speaker-label"),
    (label) => label.textContent.trim());
  const clips = Array.from(source.querySelectorAll(".transcript-clip"), (clip) => ({
    speaker: Number(clip.dataset.speakerIndex || 1),
    startSec: parseFloat(clip.style.left) * durationSec / 100,
    durationSec: parseFloat(clip.style.width) * durationSec / 100,
    emotion: Array.from(clip.classList).find((name) => name.startsWith("emotion-"))?.slice(8),
  }));
  const host = document.createElement("div");
  const speakers = Math.max(1, names.length, ...clips.map((clip) => clip.speaker));
  renderFingerprint(host, { durationSec, speakers, clips }, {
    player: true,
    names,
    labels: names.length > 0,
  });
  const player = host.firstElementChild;
  player.dataset.fingerprintPlayer = "ready";
  if (!clips.length) {
    player.querySelector(".pg-player-dataviz").replaceWith(
      source.querySelector(".pg-player-dataviz"),
    );
  }
  source.replaceWith(player);
});
