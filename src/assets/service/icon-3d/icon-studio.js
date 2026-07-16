import * as THREE from "three";
import {
  CONFIG,
  clamp,
  createCamera,
  createEntityRenderer,
  createIconModel,
  createScene,
  disposeObject,
  getManifest,
  resizeCamera,
  updateSceneLight,
} from "./model-icon-3d.js";

const MAX_PIXEL_RATIO = 2;
// World units mapped onto the stage height; the tile is 38 units.
const VIEW_HEIGHT = 60;
// Effective icon width used by the position math: tile plus bevel margin.
const TILE_SPAN = 40;
// World-unit padding that keeps the icon off the stage edges at 0/100.
const POSITION_PAD = 3;
const ROTATION_EASE = 0.12;
const CURSOR_PITCH = 0.5;
const CURSOR_YAW = 0.65;
// The pad's horizontal axis maps the key-light angle within ±90° so the
// resulting light X stays monotonic; the readout shows the X coordinate.
const LIGHT_RANGE = {
  angleMin: -90,
  angleMax: 90,
  yMin: -200,
  yMax: 240,
};

const STUDIO = {
  icon: "velma",
  size: 1,
  // Like background-position-x: 0 pins the icon to the left stage edge,
  // 100 to the right, 50 centers it — it never leaves the stage.
  position: 50,
  rotation: { x: 0, y: 0, z: 0 },
  stage: {
    aspect: 16 / 9,
    background: "slate-900",
  },
  light: {
    keyIntensity: 1.33,
    ambientIntensity: 2.48,
    angle: 0,
    y: 80,
    z: 80,
  },
  animation: {
    preset: "off",
    speed: 0.25,
    amplitude: 0.35,
    pause: false,
  },
};
const STUDIO_DEFAULTS = JSON.parse(JSON.stringify(STUDIO));
const SHADOW_DEFAULTS = {
  opacity: CONFIG.shadow.opacity,
  bleed: CONFIG.shadow.bleed,
};
const RESET_GROUPS = {
  icon: [
    "size",
    "position",
    "rotation.x",
    "rotation.y",
    "rotation.z",
    "shadowOpacity",
    "colorBleed",
  ],
  light: [
    "light.keyIntensity",
    "light.ambientIntensity",
    "light.angle",
    "light.y",
    "light.z",
  ],
  stage: ["stage.aspect", "stage.background"],
  animation: [
    "animation.preset",
    "animation.speed",
    "animation.amplitude",
    "animation.pause",
  ],
};
const ICON_NAMES = {
  velma: "Velma",
  transcript: "Transcription",
  deepfake: "Deepfake Detection",
  redaction: "PII/PHI Redaction",
  music: "Music & Speech Detection",
  "stt-med": "Medical Transcription",
  "ai-music": "AI Music Detection",
  language: "Language Detection",
  accent: "Accent Identification",
  emotions: "Emotion Detection",
  "voice-match": "Voice Match",
};

const stage = document.querySelector("[data-icon-studio-stage]");

if (stage) {
  getManifest()
    .then((manifest) => {
      initStudio(manifest);
    })
    .catch((error) => {
      console.warn(error);
    });
}

function initStudio(manifest) {
  const canvas = document.createElement("canvas");

  canvas.className = "icon-studio__canvas";
  canvas.setAttribute("aria-hidden", "true");
  stage.appendChild(canvas);

  const renderer = createEntityRenderer(canvas);
  const scene = createScene(STUDIO.light, renderer, "pricing");
  const camera = createCamera();
  const studio = {
    manifest,
    canvas,
    renderer,
    scene,
    camera,
    model: null,
    pad: null,
    // Actual (eased) rotation; targets derive from STUDIO plus hover/animation.
    current: { ...STUDIO.rotation },
    animOffset: { x: 0, y: 0 },
    hover: {
      inside: false,
      frozen: false,
      nx: 0,
      ny: 0,
    },
    controlsByPath: new Map(),
  };

  rebuildModel(studio);
  bindControls(studio);
  initIconDropdown(studio);
  initStageHover(studio);
  initLightPad(studio);
  initPalette(studio);
  applyStage(studio);
  updateResets(studio);
  requestAnimationFrame((time) => frame(studio, time));
}

function rebuildModel(studio) {
  const icon = studio.manifest.icons[STUDIO.icon];

  if (!icon) {
    return;
  }

  if (studio.model) {
    studio.scene.remove(studio.model);
    disposeObject(studio.model);
  }

  studio.model = createIconModel(
    icon,
    stage,
    { renderMode: "pricing" },
    STUDIO.light,
  );
  studio.model.rotation.set(
    studio.current.x,
    studio.current.y,
    studio.current.z,
  );
  studio.scene.add(studio.model);
}

function frame(studio, time) {
  const target = { ...STUDIO.rotation };
  const { hover, animOffset } = studio;

  if (hover.inside && !hover.frozen) {
    target.x += -hover.ny * CURSOR_PITCH;
    target.y += -hover.nx * CURSOR_YAW;
  }

  animOffset.x = 0;
  animOffset.y = 0;

  const preset = STUDIO.animation.preset;

  if (preset === "x" || preset === "y") {
    animOffset[preset] = animationValue(time) * STUDIO.animation.amplitude;
    target[preset] += animOffset[preset];
  }

  studio.current.x += (target.x - studio.current.x) * ROTATION_EASE;
  studio.current.y += (target.y - studio.current.y) * ROTATION_EASE;
  studio.current.z += (target.z - studio.current.z) * ROTATION_EASE;

  if (studio.model) {
    studio.model.rotation.set(
      studio.current.x,
      studio.current.y,
      studio.current.z,
    );
    studio.model.position.x = positionToWorldX();
    studio.model.scale.setScalar(STUDIO.size);
  }

  render(studio);
  renderLightPad(studio);
  requestAnimationFrame((nextTime) => frame(studio, nextTime));
}

// Back-and-forth swing in -1..1. With pause enabled each swing is followed
// by a hold of the same duration as the movement phase.
function animationValue(time) {
  const cycles = time * 0.001 * STUDIO.animation.speed;

  if (!STUDIO.animation.pause) {
    return Math.sin(cycles * Math.PI * 2);
  }

  const u = cycles % 2;

  if (u < 0.5) {
    return -Math.cos(Math.PI * u * 2);
  }

  if (u < 1) {
    return 1;
  }

  if (u < 1.5) {
    return Math.cos(Math.PI * (u - 1) * 2);
  }

  return -1;
}

// background-position-x math: the travel range is the view width minus the
// icon span and edge padding, so 0/100 leave a margin at the stage edge.
function positionToWorldX() {
  const viewWidth = VIEW_HEIGHT * STUDIO.stage.aspect;
  const travel = Math.max(
    0,
    (viewWidth - TILE_SPAN * STUDIO.size) / 2 - POSITION_PAD,
  );

  return travel * ((STUDIO.position - 50) / 50);
}

function render(studio) {
  const rect = studio.canvas.getBoundingClientRect();

  if (!rect.width || !rect.height) {
    return;
  }

  const pixelRatio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
  const width = Math.max(1, Math.round(rect.width * pixelRatio));
  const height = Math.max(1, Math.round(rect.height * pixelRatio));

  if (studio.canvas.width !== width || studio.canvas.height !== height) {
    studio.canvas.width = width;
    studio.canvas.height = height;
  }

  resizeCamera(studio.camera, width, height, VIEW_HEIGHT);
  studio.renderer.setSize(width, height, false);
  studio.renderer.render(studio.scene, studio.camera);
}

function initStageHover(studio) {
  const { hover } = studio;

  stage.addEventListener("pointermove", (event) => {
    const rect = stage.getBoundingClientRect();

    hover.inside = true;
    hover.nx = clamp(
      (event.clientX - (rect.left + rect.width / 2)) / (rect.width / 2),
      -1,
      1,
    );
    hover.ny = clamp(
      (event.clientY - (rect.top + rect.height / 2)) / (rect.height / 2),
      -1,
      1,
    );
  });

  // Leaving the stage unfreezes: the next visit orbits again, returning to
  // the captured base rotation whenever the cursor is away.
  stage.addEventListener("pointerleave", () => {
    hover.inside = false;
    hover.frozen = false;
  });

  // Click captures the current pose as the new base rotation and freezes
  // cursor tracking until the pointer leaves the stage.
  stage.addEventListener("click", () => {
    if (!hover.inside || hover.frozen) {
      return;
    }

    STUDIO.rotation.x = round(studio.current.x - studio.animOffset.x);
    STUDIO.rotation.y = round(studio.current.y - studio.animOffset.y);
    STUDIO.rotation.z = round(studio.current.z);
    hover.frozen = true;
    syncControl(studio, "rotation.x");
    syncControl(studio, "rotation.y");
    syncControl(studio, "rotation.z");
    updateResets(studio);
  });
}

function bindControls(studio) {
  document.querySelectorAll("[data-icon-studio]").forEach((control) => {
    const path = control.getAttribute("data-icon-studio");
    const value = getStudioValue(path);

    if (value === undefined) {
      return;
    }

    studio.controlsByPath.set(path, control);
    control.value = value;
    updateOutput(control, value);
    syncRangeProgress(control);
    control.addEventListener("input", () => {
      const next = Number(control.value);

      setStudioValue(path, next);
      updateOutput(control, next);
      syncRangeProgress(control);
      applySetting(studio, path);
      updateResets(studio);
    });
  });

  document
    .querySelectorAll("[data-icon-studio-anim-preset]")
    .forEach((control) => {
      control.checked = control.value === STUDIO.animation.preset;
      control.addEventListener("change", () => {
        if (control.checked) {
          STUDIO.animation.preset = control.value;
          updateResets(studio);
        }
      });
    });

  const pause = document.querySelector("[data-icon-studio-anim-pause]");

  if (pause) {
    pause.checked = STUDIO.animation.pause;
    pause.addEventListener("change", () => {
      STUDIO.animation.pause = pause.checked;
      updateResets(studio);
    });
  }

  document.querySelectorAll("[data-icon-studio-reset]").forEach((button) => {
    button.addEventListener("click", () => {
      resetGroup(studio, button.getAttribute("data-icon-studio-reset"));
    });
  });
}

function initIconDropdown(studio) {
  const details = document.querySelector("[data-icon-studio-icon-dropdown]");

  if (!details) {
    return;
  }

  const use = details.querySelector("[data-icon-studio-icon-use]");
  const name = details.querySelector("[data-icon-studio-icon-name]");

  details.querySelectorAll("[data-icon-studio-icon-option]").forEach(
    (option) => {
      option.addEventListener("click", () => {
        STUDIO.icon = option.getAttribute("data-icon-studio-icon-option");

        if (use) {
          use.setAttribute("href", `#${STUDIO.icon}`);
        }

        if (name) {
          name.textContent = ICON_NAMES[STUDIO.icon] || STUDIO.icon;
        }

        details.open = false;
        rebuildModel(studio);
      });
    },
  );

  closeOnOutsidePress(details);
}

function resetGroup(studio, group) {
  const paths = RESET_GROUPS[group];

  if (!paths) {
    return;
  }

  paths.forEach((path) => {
    setStudioValue(path, getDefaultValue(path));
    syncControl(studio, path);
  });

  if (group === "icon") {
    rebuildModel(studio);
  }

  if (group === "light") {
    applyLight(studio);
    syncLightPad(studio);
    // The glyph drop shadows baked into the tile texture follow the light
    // angle, so refresh them too.
    rebuildModel(studio);
  }

  if (group === "stage") {
    applyStage(studio);
  }

  if (group === "animation") {
    document
      .querySelectorAll("[data-icon-studio-anim-preset]")
      .forEach((control) => {
        control.checked = control.value === STUDIO.animation.preset;
      });

    const pause = document.querySelector("[data-icon-studio-anim-pause]");

    if (pause) {
      pause.checked = STUDIO.animation.pause;
    }
  }

  updateResets(studio);
}

// Show each Reset only when something in its group differs from defaults.
function updateResets(studio) {
  Object.entries(RESET_GROUPS).forEach(([group, paths]) => {
    const button = document.querySelector(
      `[data-icon-studio-reset="${group}"]`,
    );

    if (!button) {
      return;
    }

    const dirty = paths.some((path) => {
      const value = getStudioValue(path);
      const fallback = getDefaultValue(path);

      return typeof value === "number"
        ? Math.abs(value - fallback) > 0.001
        : value !== fallback;
    });

    button.hidden = !dirty;
  });
}

// "shadowOpacity" and "colorBleed" live in the shared render config (they are
// baked into the tile texture); everything else is studio state.
function getStudioValue(path) {
  if (path === "shadowOpacity") {
    return CONFIG.shadow.opacity;
  }

  if (path === "colorBleed") {
    return CONFIG.shadow.bleed;
  }

  return path.split(".").reduce((value, key) => {
    return value && value[key] !== undefined ? value[key] : undefined;
  }, STUDIO);
}

function getDefaultValue(path) {
  if (path === "shadowOpacity") {
    return SHADOW_DEFAULTS.opacity;
  }

  if (path === "colorBleed") {
    return SHADOW_DEFAULTS.bleed;
  }

  return path.split(".").reduce((value, key) => {
    return value && value[key] !== undefined ? value[key] : undefined;
  }, STUDIO_DEFAULTS);
}

function setStudioValue(path, nextValue) {
  if (path === "shadowOpacity") {
    CONFIG.shadow.opacity = nextValue;
    return;
  }

  if (path === "colorBleed") {
    CONFIG.shadow.bleed = nextValue;
    return;
  }

  const keys = path.split(".");
  const lastKey = keys.pop();
  const target = keys.reduce((value, key) => value[key], STUDIO);

  target[lastKey] = nextValue;
}

function applySetting(studio, path) {
  if (path === "shadowOpacity" || path === "colorBleed") {
    rebuildModel(studio);
    return;
  }

  if (path.startsWith("light.")) {
    applyLight(studio);
    syncLightPad(studio);
    return;
  }

  if (path === "stage.aspect") {
    applyStage(studio);
  }
}

function applyLight(studio) {
  updateSceneLight(studio.scene, STUDIO.light);

  if (studio.pad) {
    updateSceneLight(studio.pad.scene, STUDIO.light);
  }
}

function syncControl(studio, path) {
  const control = studio.controlsByPath.get(path);

  if (!control) {
    return;
  }

  const value = getStudioValue(path);

  control.value = value;
  updateOutput(control, value);
  syncRangeProgress(control);
}

function syncRangeProgress(control) {
  if (control.type !== "range") {
    return;
  }

  const min = Number(control.min);
  const max = Number(control.max);
  const value = Number(control.value);
  const progress = max === min ? 0 : ((value - min) / (max - min)) * 100;

  control.style.setProperty(
    "--icon-studio-range-progress",
    `${progress}%`,
  );
}

function applyStage(studio) {
  const background = `var(--m__color-${STUDIO.stage.background})`;

  stage.style.aspectRatio = String(STUDIO.stage.aspect);
  stage.style.backgroundColor = background;

  if (studio.pad) {
    studio.pad.pad.style.backgroundColor = background;
  }

  const swatch = document.querySelector("[data-icon-studio-bg-swatch]");
  const name = document.querySelector("[data-icon-studio-bg-name]");

  if (swatch) {
    swatch.style.backgroundColor = background;
  }

  if (name) {
    name.textContent = STUDIO.stage.background;
  }
}

// Studio-specific palette rules on top of whatever the stylesheet defines:
// these families are hidden as backdrops, and the listed families come first
// in this order. Families missing from the list (including future ones)
// follow in stylesheet order.
const PALETTE_EXCLUDED_FAMILIES = ["orange", "yellow"];
const PALETTE_FAMILY_ORDER = [
  "slate",
  "white",
  "gray",
  "blue",
  "azure",
  "pink",
  "green",
  "red",
];

// The palette comes straight from the stylesheet: every --m__color-* custom
// property on :root, in declaration order. A palette change in the design
// system shows up here automatically; the studio only reorders families and
// drops the excluded ones.
function getPaletteTokens() {
  const tokens = [];
  const seen = new Set();

  Array.from(document.styleSheets).forEach((sheet) => {
    let rules;

    try {
      rules = sheet.cssRules;
    } catch (error) {
      return;
    }

    Array.from(rules).forEach((rule) => {
      if (!rule.selectorText || !rule.selectorText.includes(":root")) {
        return;
      }

      Array.from(rule.style).forEach((property) => {
        if (property.startsWith("--m__color-") && !seen.has(property)) {
          seen.add(property);
          tokens.push(property.slice("--m__color-".length));
        }
      });
    });
  });

  const familyOf = (token) => token.replace(/-\d+$/, "");
  const rankOf = (token) => {
    const rank = PALETTE_FAMILY_ORDER.indexOf(familyOf(token));

    return rank === -1 ? PALETTE_FAMILY_ORDER.length : rank;
  };

  return tokens
    .filter((token) => !PALETTE_EXCLUDED_FAMILIES.includes(familyOf(token)))
    .map((token, index) => ({ token, index }))
    .sort((a, b) => {
      return rankOf(a.token) - rankOf(b.token) || a.index - b.index;
    })
    .map((entry) => entry.token);
}

function initPalette(studio) {
  const details = document.querySelector("[data-icon-studio-palette]");
  const grid = details?.querySelector(".icon-studio__palette-grid");

  if (!details || !grid) {
    return;
  }

  const rootStyle = getComputedStyle(document.documentElement);

  getPaletteTokens().forEach((token) => {
    const button = document.createElement("button");
    const value = rootStyle.getPropertyValue(`--m__color-${token}`).trim();

    button.type = "button";
    button.className = "icon-studio__palette-color";
    button.textContent = token;
    button.style.backgroundColor = `var(--m__color-${token})`;
    button.style.color = isDarkColor(value) ? "#fff" : "rgb(30, 30, 40)";
    button.addEventListener("click", () => {
      STUDIO.stage.background = token;
      applyStage(studio);
      details.open = false;
      updateResets(studio);
    });
    grid.appendChild(button);
  });

  closeOnOutsidePress(details);
}

function isDarkColor(cssColor) {
  const match = cssColor.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);

  if (!match) {
    return false;
  }

  const [, red, green, blue] = match.map(Number);

  return red * 0.299 + green * 0.587 + blue * 0.114 < 130;
}

function closeOnOutsidePress(details) {
  document.addEventListener("pointerdown", (event) => {
    if (details.open && !details.contains(event.target)) {
      details.open = false;
    }
  });
}

// The pad renders a sphere in the tile material, lit by the same scheme as
// the icon, so dragging the knob previews the light move on a neutral shape.
function initLightPad(studio) {
  const pad = document.querySelector("[data-icon-studio-light-pad]");
  const knob = pad?.querySelector(".icon-studio__light-knob");

  if (!pad || !knob) {
    return;
  }

  const canvas = document.createElement("canvas");

  canvas.className = "icon-studio__light-pad-canvas";
  canvas.setAttribute("aria-hidden", "true");
  pad.prepend(canvas);

  const renderer = createEntityRenderer(canvas);
  const scene = createScene(STUDIO.light, renderer, "pricing");
  const camera = createCamera();
  const tileColor = getComputedStyle(document.documentElement)
    .getPropertyValue("--m__color-gray-100")
    .trim();
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(15, 48, 32),
    new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(tileColor || "#dcdce6"),
      roughness: CONFIG.tile.roughness,
      metalness: 0,
      clearcoat: CONFIG.tile.clearcoat,
      clearcoatRoughness: CONFIG.tile.clearcoatRoughness,
    }),
  );

  sphere.material.envMapIntensity = CONFIG.reflection.envMapIntensity;
  scene.add(sphere);
  studio.pad = {
    pad,
    knob,
    canvas,
    renderer,
    scene,
    camera,
  };

  const applyFromEvent = (event) => {
    const rect = pad.getBoundingClientRect();
    const px = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    const py = clamp((event.clientY - rect.top) / rect.height, 0, 1);

    STUDIO.light.angle = LIGHT_RANGE.angleMin
      + px * (LIGHT_RANGE.angleMax - LIGHT_RANGE.angleMin);
    STUDIO.light.y = LIGHT_RANGE.yMin
      + (1 - py) * (LIGHT_RANGE.yMax - LIGHT_RANGE.yMin);
    applyLight(studio);
    syncLightPad(studio);
    updateResets(studio);
  };

  let dragging = false;

  pad.addEventListener("pointerdown", (event) => {
    // The vertical Z slider inside the pad handles its own pointer events.
    if (event.target.closest("input")) {
      return;
    }

    dragging = true;
    pad.setPointerCapture(event.pointerId);
    applyFromEvent(event);
  });
  pad.addEventListener("pointermove", (event) => {
    if (dragging) {
      applyFromEvent(event);
    }
  });
  pad.addEventListener("pointerup", () => {
    if (!dragging) {
      return;
    }

    dragging = false;
    // The glyph drop shadows baked into the tile texture follow the light
    // angle, so refresh them once the drag settles.
    rebuildModel(studio);
  });

  syncLightPad(studio);
}

function syncLightPad(studio) {
  if (!studio.pad) {
    return;
  }

  const { knob } = studio.pad;
  const output = document.querySelector("[data-icon-studio-light-output]");
  const px = (STUDIO.light.angle - LIGHT_RANGE.angleMin)
    / (LIGHT_RANGE.angleMax - LIGHT_RANGE.angleMin);
  const py = 1
    - (STUDIO.light.y - LIGHT_RANGE.yMin)
    / (LIGHT_RANGE.yMax - LIGHT_RANGE.yMin);

  knob.style.left = `${(px * 100).toFixed(1)}%`;
  knob.style.top = `${(py * 100).toFixed(1)}%`;

  if (output) {
    const lightX = Math.sin(STUDIO.light.angle * Math.PI / 180) * 60;

    output.textContent = `x ${Math.round(lightX)} · y ${
      Math.round(STUDIO.light.y)
    } · z ${Math.round(STUDIO.light.z)}`;
  }
}

function renderLightPad(studio) {
  if (!studio.pad) {
    return;
  }

  const { canvas, renderer, scene, camera } = studio.pad;
  const rect = canvas.getBoundingClientRect();

  if (!rect.width || !rect.height) {
    return;
  }

  const pixelRatio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
  const width = Math.max(1, Math.round(rect.width * pixelRatio));
  const height = Math.max(1, Math.round(rect.height * pixelRatio));

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  resizeCamera(camera, width, height, 40);
  renderer.setSize(width, height, false);
  renderer.render(scene, camera);
}

function updateOutput(control, value) {
  const output = control.parentElement.querySelector("output");

  if (!output) {
    return;
  }

  output.textContent = typeof value === "number" ? String(round(value)) : value;
}

function round(value) {
  return Math.round(value * 100) / 100;
}
