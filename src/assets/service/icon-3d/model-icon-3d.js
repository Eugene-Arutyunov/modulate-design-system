import * as THREE from "three";
import { SVGLoader } from "three/addons/loaders/SVGLoader.js";

const MANIFEST_URL = "/assets/service/icon-3d/icons.json";
const MAX_PIXEL_RATIO = 2;
const CONFIG = {
  tile: {
    size: 38,
    radius: 9,
    depth: 5,
    bevelThickness: 0.5,
    bevelSize: 0.5,
    color: "var(--m__color-gray-100)",
    roughness: 0.5,
    clearcoat: 0.65,
    clearcoatRoughness: 0.57,
  },
  glyph: {
    depth: 2.3,
    bevel: 0,
    lift: 1.3,
    roughness: 0.66,
    clearcoat: 1,
    clearcoatRoughness: 0.47,
  },
  shadow: {
    blur: 1.6,
    tint: 1.3,
    opacity: 0.13,
    bleed: 0.2,
  },
  reflection: {
    envMapIntensity: 0.59,
  },
  authTile: {
    size: 38,
    radius: 9,
    depth: 5,
    bevelThickness: 0.5,
    bevelSize: 0.5,
    color: "var(--m__color-gray-100)",
    roughness: 0.5,
    clearcoat: 0.7,
    clearcoatRoughness: 0.57,
  },
  authGlyph: {
    depth: 2.3,
    bevel: 0,
    lift: 1.3,
    roughness: 0.66,
    clearcoat: 1,
    clearcoatRoughness: 0.47,
  },
  authShadow: {
    blur: 1.6,
    tint: 1.3,
    opacity: 0.19,
    bleed: 0.5,
  },
  authReflection: {
    envMapIntensity: 0.59,
  },
  view: {
    pricing: {
      height: 46,
      scrollPitch: 0.3,
      cursorZone: 100,
      cursorPitch: 0.5,
      cursorYaw: 0.65,
      baseRotation: { x: 0, y: 0, z: 0 },
    },
    auth: {
      height: 54,
      scale: 1,
      baseRotation: { x: 0.12, y: -1.06, z: 0 },
      activeRotation: { x: 0.12, y: -0.84, z: 0 },
      activeLift: 18,
      activeScale: 1.08,
    },
  },
  light: {
    pricing: {
      keyIntensity: 1.33,
      ambientIntensity: 2.48,
      angle: 0,
      y: 80,
      z: 80,
    },
    auth: {
      keyIntensity: 1.49,
      ambientIntensity: 2.58,
      angle: 0,
      y: 80,
      z: 80,
    },
  },
};
const DEFAULT_CONFIG = JSON.parse(JSON.stringify(CONFIG));

let manifestPromise;
let frameHandle = 0;
let rebuildHandle = 0;
const entities = new Set();
const environmentTextures = new WeakMap();
const pointer = {
  x: 0,
  y: 0,
};

window.addEventListener("pointermove", (event) => {
  pointer.x = event.clientX;
  pointer.y = event.clientY;
});

function getManifest() {
  if (!manifestPromise) {
    manifestPromise = fetch(MANIFEST_URL).then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to load ${MANIFEST_URL}`);
      }

      return response.json();
    });
  }

  return manifestPromise;
}

function ensureFrameLoop() {
  if (!frameHandle) {
    frameHandle = requestAnimationFrame(renderFrame);
  }
}

function renderFrame(time) {
  frameHandle = 0;

  entities.forEach((entity) => {
    if (!entity.visible) {
      return;
    }

    updateEntity(entity, time);
    renderEntity(entity);
  });

  if (entities.size) {
    ensureFrameLoop();
  }
}

function createScene(lightConfig, renderer, renderMode = "pricing") {
  const scene = new THREE.Scene();
  const ambient = new THREE.AmbientLight(0xffffff, lightConfig.ambientIntensity);
  const key = new THREE.DirectionalLight(0xffffff, lightConfig.keyIntensity);

  scene.add(ambient, key);
  scene.userData.renderer = renderer;
  scene.userData.renderMode = renderMode;
  scene.userData.ambientLight = ambient;
  scene.userData.keyLight = key;
  updateSceneLight(scene, lightConfig);
  updateSceneEnvironment(scene);

  return scene;
}

function updateSceneEnvironment(scene) {
  const renderer = scene.userData.renderer;
  const intensity = clamp(getRenderConfig(scene.userData.renderMode).reflection.envMapIntensity, 0, 1);

  scene.environment = intensity > 0 && renderer
    ? getStudioEnvironment(renderer)
    : null;
  scene.environmentIntensity = 1;
}

function getRenderConfig(renderMode = "pricing") {
  if (renderMode === "auth") {
    return {
      tile: CONFIG.authTile,
      glyph: CONFIG.authGlyph,
      shadow: CONFIG.authShadow,
      reflection: CONFIG.authReflection,
    };
  }

  return {
    tile: CONFIG.tile,
    glyph: CONFIG.glyph,
    shadow: CONFIG.shadow,
    reflection: CONFIG.reflection,
  };
}

function updateSceneLight(scene, lightConfig) {
  const angle = lightConfig.angle * Math.PI / 180;
  const { ambientLight, keyLight } = scene.userData;

  if (!ambientLight || !keyLight) {
    return;
  }

  ambientLight.intensity = lightConfig.ambientIntensity;
  keyLight.intensity = lightConfig.keyIntensity;
  keyLight.position.set(Math.sin(angle) * 60, lightConfig.y, lightConfig.z);
}

function getStudioEnvironment(renderer) {
  if (environmentTextures.has(renderer)) {
    return environmentTextures.get(renderer);
  }

  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0x111118);
  const addPanel = (width, height, red, green, blue, x, y, z, rotationX, rotationY) => {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(width, height),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(red, green, blue),
        side: THREE.DoubleSide,
      }),
    );

    mesh.position.set(x, y, z);
    mesh.rotation.set(rotationX, rotationY, 0);
    envScene.add(mesh);
  };

  addPanel(80, 30, 0.7, 0.72, 0.82, 0, 30, 10, -Math.PI / 2.2, 0);
  addPanel(40, 50, 0.28, 0.32, 0.46, -34, 0, 8, 0, Math.PI / 2.5);
  addPanel(30, 40, 0.5, 0.42, 0.32, 34, 4, 0, 0, -Math.PI / 2.6);
  addPanel(90, 50, 0.08, 0.08, 0.11, 0, -32, 0, Math.PI / 2, 0);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTexture = pmrem.fromScene(envScene, 0.04).texture;

  pmrem.dispose();
  environmentTextures.set(renderer, envTexture);

  return envTexture;
}

function createCamera() {
  const camera = new THREE.OrthographicCamera(-24, 24, 24, -24, 0.1, 500);
  camera.position.set(0, 0, 120);
  camera.lookAt(0, 0, 0);

  return camera;
}

function resizeCamera(camera, width, height, viewHeight) {
  const aspect = width / Math.max(height, 1);
  const viewWidth = viewHeight * aspect;

  camera.left = -viewWidth / 2;
  camera.right = viewWidth / 2;
  camera.top = viewHeight / 2;
  camera.bottom = -viewHeight / 2;
  camera.updateProjectionMatrix();

  return {
    viewWidth,
    viewHeight,
  };
}

function roundedRectShape(width, height, radius) {
  const x = -width / 2;
  const y = -height / 2;
  const shape = new THREE.Shape();

  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + height - radius);
  shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  shape.lineTo(x + radius, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);

  return shape;
}

const SurfaceUV = {
  xy(vertices, index) {
    return new THREE.Vector2(vertices[index * 3], vertices[index * 3 + 1]);
  },
  generateTopUV(geometry, vertices, a, b, c) {
    return [this.xy(vertices, a), this.xy(vertices, b), this.xy(vertices, c)];
  },
  generateSideWallUV(geometry, vertices, a, b, c, d) {
    return [
      this.xy(vertices, a),
      this.xy(vertices, b),
      this.xy(vertices, c),
      this.xy(vertices, d),
    ];
  },
};

function createMaterial(fill, host, options = {}) {
  const material = new THREE.MeshPhysicalMaterial({
    color: resolveColor(fill, host),
    roughness: clamp(options.roughness ?? 0.48, 0, 1),
    metalness: 0,
    clearcoat: clamp(options.clearcoat ?? 0.18, 0, 1),
    clearcoatRoughness: clamp(options.clearcoatRoughness ?? 0.65, 0, 1),
    side: THREE.DoubleSide,
  });

  material.userData.fill = fill;
  material.envMapIntensity = clamp(options.envMapIntensity ?? 1, 0, 1);

  if (options.map) {
    material.map = options.map;
    material.color.set(0xffffff);
  }

  return material;
}

function resolveColor(fill, host) {
  const computed = getComputedStyle(host);
  const rawColor = fill === "currentColor"
    ? computed.color
    : fill.replace(/var\((--[^)]+)\)/g, (match, property) => {
      return computed.getPropertyValue(property).trim() || match;
    });

  try {
    return new THREE.Color(rawColor);
  } catch (error) {
    return new THREE.Color(computed.color);
  }
}

function updateMaterialColors(root, host) {
  root.traverse((object) => {
    if (!object.material) {
      return;
    }

    const fill = object.material.userData.fill;

    if (!fill) {
      return;
    }

    if (fill === "tile") {
      return;
    }

    object.material.color.copy(resolveColor(fill, host));
  });
}

function createTile(host, tileFill, parts, lightConfig, renderConfig) {
  const { tile } = renderConfig;
  const texture = createTileSurfaceTexture(parts, host, tileFill, lightConfig, renderConfig);
  const geometry = new THREE.ExtrudeGeometry(
    roundedRectShape(tile.size, tile.size, tile.radius),
    {
      depth: tile.depth,
      bevelEnabled: true,
      bevelThickness: tile.bevelThickness,
      bevelSize: tile.bevelSize,
      bevelSegments: 3,
      curveSegments: 14,
      UVGenerator: SurfaceUV,
    },
  );
  geometry.translate(0, 0, -tile.depth);
  const material = createMaterial("tile", host, {
    map: texture,
    roughness: tile.roughness,
    clearcoat: tile.clearcoat,
    clearcoatRoughness: tile.clearcoatRoughness,
    envMapIntensity: renderConfig.reflection.envMapIntensity,
  });
  const mesh = new THREE.Mesh(geometry, material);

  mesh.userData.tileFill = tileFill;
  mesh.receiveShadow = true;

  return mesh;
}

function createTileSurfaceTexture(parts, host, tileFill, lightConfig, renderConfig) {
  const { glyph, shadow, tile } = renderConfig;
  const resolution = 512;
  const pixelsPerUnit = resolution / tile.size;
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  const surfaceColor = resolveColor(tileFill, host);
  const lightAngle = lightConfig.angle * Math.PI / 180;
  const neutral = { r: 30, g: 32, b: 40 };

  canvas.width = resolution;
  canvas.height = resolution;
  context.fillStyle = toRgb(surfaceColor);
  context.fillRect(0, 0, resolution, resolution);

  if (shadow.bleed > 0.01) {
    parts.forEach((part) => {
      const box = getPartBox(part);

      if (!box) {
        return;
      }

      const color = resolveColor(part.fill, host);

      if (color.r > 0.93 && color.g > 0.93 && color.b > 0.93) {
        return;
      }

      const grow = (
        box.max.x - box.min.x + box.max.y - box.min.y
      ) * 0.25 + shadow.bleed * 5;
      const x = (box.min.x - grow + tile.size / 2) * pixelsPerUnit;
      const y = (tile.size / 2 - (box.max.y + grow)) * pixelsPerUnit;
      const width = (box.max.x - box.min.x + grow * 2) * pixelsPerUnit;
      const height = (box.max.y - box.min.y + grow * 2) * pixelsPerUnit;

      context.save();
      context.filter = `blur(${(40 + 50 * shadow.bleed).toFixed(0)}px)`;
      context.globalAlpha = Math.min(0.5, 0.14 * shadow.bleed);
      context.fillStyle = toRgb(color);
      context.beginPath();
      roundedCanvasRect(context, x, y, width, height, Math.min(width, height) * 0.4);
      context.fill();
      context.restore();
    });
  }

  parts.forEach((part) => {
    const box = getPartBox(part);

    if (!box) {
      return;
    }

    const color = resolveColor(part.fill, host);
    const [red, green, blue] = getShadowColor(color, neutral, shadow);
    const z = glyph.lift + part.layer * glyph.depth;
    const drop = 0.8 + z * 0.55;
    const offsetX = -Math.sin(lightAngle) * drop;
    const offsetY = -drop * 0.75;
    const grow = z * 0.35;
    const x = (box.min.x + offsetX - grow + tile.size / 2) * pixelsPerUnit;
    const y = (tile.size / 2 - (box.max.y + offsetY + grow)) * pixelsPerUnit;
    const width = (box.max.x - box.min.x + grow * 2) * pixelsPerUnit;
    const height = (box.max.y - box.min.y + grow * 2) * pixelsPerUnit;

    context.save();
    context.filter = `blur(${(34 * shadow.blur * (1 + z * 0.04)).toFixed(1)}px)`;
    context.globalAlpha = shadow.opacity;
    context.fillStyle = `rgb(${red}, ${green}, ${blue})`;
    context.beginPath();
    roundedCanvasRect(context, x, y, width, height, Math.min(width, height) * 0.25);
    context.fill();
    context.restore();
  });

  const texture = new THREE.CanvasTexture(canvas);

  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.repeat.set(1 / tile.size, 1 / tile.size);
  texture.offset.set(0.5, 0.5);

  return texture;
}

function getShadowColor(color, neutral, shadow) {
  const tint = clamp(shadow.tint, 0, 2);
  const mix = (a, b, amount) => Math.round(a + (b - a) * amount);
  const [red, green, blue] = getSrgbChannels(color);
  const dark = [red * 0.55, green * 0.55, blue * 0.55];
  const vivid = [red * 0.9, green * 0.9, blue * 0.9];

  if (tint <= 1) {
    return [
      mix(neutral.r, dark[0], tint),
      mix(neutral.g, dark[1], tint),
      mix(neutral.b, dark[2], tint),
    ];
  }

  return [
    mix(dark[0], vivid[0], tint - 1),
    mix(dark[1], vivid[1], tint - 1),
    mix(dark[2], vivid[2], tint - 1),
  ];
}

function getPartBox(part) {
  const box = new THREE.Box2();

  part.shapes.forEach((shape) => {
    shape.getPoints(10).forEach((point) => {
      box.expandByPoint(new THREE.Vector2(point.x - 16, 16 - point.y));
    });
  });

  return box.isEmpty() ? null : box;
}

function roundedCanvasRect(context, x, y, width, height, radius) {
  if (context.roundRect) {
    context.roundRect(x, y, width, height, radius);
    return;
  }

  context.rect(x, y, width, height);
}

function toRgb(color) {
  const [red, green, blue] = getSrgbChannels(color);

  return `rgb(${red}, ${green}, ${blue})`;
}

function getSrgbChannels(color) {
  const srgb = color.clone().convertLinearToSRGB();

  return [
    Math.round(clamp(srgb.r, 0, 1) * 255),
    Math.round(clamp(srgb.g, 0, 1) * 255),
    Math.round(clamp(srgb.b, 0, 1) * 255),
  ];
}

function parseIconParts(icon) {
  const loader = new SVGLoader();

  return icon.parts
    .map((part) => {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${icon.viewBox}">${part.svg}</svg>`;
      const parsed = loader.parse(svg);
      const shapes = parsed.paths.flatMap((path) => SVGLoader.createShapes(path));

      return {
        ...part,
        shapes,
      };
    })
    .filter((part) => part.shapes.length);
}

function createIconMeshes(parts, host, options = {}, renderConfig) {
  const { glyph } = renderConfig;
  const group = new THREE.Group();

  parts
    .slice()
    .sort((a, b) => a.layer - b.layer)
    .forEach((part) => {
      part.shapes.forEach((shape) => {
        const glyphDepth = options.depth ?? glyph.depth;
        const layerSpan = Math.max(1, part.layerSpan || 1);
        const bevelSize = glyph.bevel;
        const bevelThickness = bevelSize > 0 ? bevelSize * 0.9 : 0;
        const geometry = new THREE.ExtrudeGeometry(shape, {
          depth: glyphDepth * layerSpan,
          bevelEnabled: bevelSize > 0,
          bevelThickness,
          bevelSize,
          bevelSegments: 3,
          curveSegments: 10,
        });
        const material = createMaterial(part.fill, host, {
          roughness: glyph.roughness,
          clearcoat: glyph.clearcoat,
          clearcoatRoughness: glyph.clearcoatRoughness,
          envMapIntensity: renderConfig.reflection.envMapIntensity,
        });
        const mesh = new THREE.Mesh(geometry, material);

        geometry.computeVertexNormals();
        mesh.position.set(
          -16,
          16,
          glyph.lift + part.layer * glyphDepth + bevelThickness,
        );
        mesh.scale.y = -1;
        group.add(mesh);
      });
    });

  return group;
}

function createIconModel(icon, host, options = {}, lightConfig = CONFIG.light.pricing) {
  const model = new THREE.Group();
  const renderConfig = getRenderConfig(options.renderMode);
  const parts = parseIconParts(icon);
  const iconMeshes = createIconMeshes(parts, host, options, renderConfig);

  if (options.showTile !== false) {
    const tile = createTile(
      host,
      options.tileFill ?? renderConfig.tile.color,
      parts,
      lightConfig,
      renderConfig,
    );

    model.add(tile);
    model.userData.tile = tile;
  }

  model.add(iconMeshes);
  model.userData.iconMeshes = iconMeshes;

  return model;
}

function createCanvas(className) {
  const canvas = document.createElement("canvas");

  canvas.className = className;
  canvas.setAttribute("aria-hidden", "true");

  return canvas;
}

function createEntityRenderer(canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
  });

  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.LinearToneMapping;

  return renderer;
}

function setHostReady(host) {
  const fallback = host.querySelector("svg");

  host.classList.add("m__model-icon-3d-ready");
  host.setAttribute("data-model-icon-3d-status", "ready");

  if (fallback) {
    fallback.style.opacity = "0";
  }
}

function setHostError(host, error) {
  host.setAttribute("data-model-icon-3d-status", "error");
  host.setAttribute("data-model-icon-3d-error", error.message);
  console.warn("3D model icon fallback:", error);
}

function scheduleModelRebuild() {
  if (rebuildHandle) {
    return;
  }

  rebuildHandle = requestAnimationFrame(() => {
    rebuildHandle = 0;
    entities.forEach((entity) => {
      rebuildEntity(entity);
    });
    ensureFrameLoop();
  });
}

function rebuildEntity(entity) {
  if (entity.type === "stack") {
    updateSceneLight(entity.scene, CONFIG.light.auth);
    updateSceneEnvironment(entity.scene);
    const transforms = getModelTransforms(entity.models);

    entity.models.forEach((model) => {
      entity.scene.remove(model);
      disposeObject(model);
    });
    entity.models = createStackModels(
      entity.tiles,
      entity.manifest,
      entity.scene,
      transforms,
    );
    entity.isReady = false;
    return;
  }

  const lightConfig = getLightConfig(entity.mode);

  updateSceneLight(entity.scene, lightConfig);
  updateSceneEnvironment(entity.scene);
  entity.scene.remove(entity.model);
  disposeObject(entity.model);
  entity.model = createIconModel(
    entity.icon,
    entity.host,
    entity.modelOptions,
    lightConfig,
  );
  entity.scene.add(entity.model);
  entity.viewHeight = getViewConfig(entity.mode).height;
  entity.isReady = false;
}

function disposeObject(root) {
  root.traverse((object) => {
    if (object.geometry) {
      object.geometry.dispose();
    }

    if (!object.material) {
      return;
    }

    const materials = Array.isArray(object.material)
      ? object.material
      : [object.material];

    materials.forEach((material) => {
      if (material.map) {
        material.map.dispose();
      }

      material.dispose();
    });
  });
}

function initIntersection(entity, host) {
  const observer = new IntersectionObserver((entries) => {
    entity.visible = entries.some((entry) => entry.isIntersecting);
  }, {
    rootMargin: "160px",
  });

  observer.observe(host);
  entity.visible = true;
}

function initStandaloneIcon(host, icon) {
  const mode = host.getAttribute("data-model-icon-3d-mode") || "pricing";
  const lightConfig = getLightConfig(mode);
  const viewConfig = getViewConfig(mode);
  const canvas = createCanvas("m__model-icon-3d__canvas");
  const renderer = createEntityRenderer(canvas);
  const scene = createScene(lightConfig, renderer, mode === "auth" ? "auth" : "pricing");
  const camera = createCamera();
  const modelOptions = {
    showTile: true,
    renderMode: mode === "auth" ? "auth" : "pricing",
  };
  const model = createIconModel(icon, host, modelOptions, lightConfig);
  const entity = {
    type: "icon",
    mode,
    icon,
    host,
    canvas,
    renderer,
    scene,
    camera,
    model,
    modelOptions,
    viewHeight: viewConfig.height,
    hoverWeight: 0,
    isReady: false,
    visible: true,
  };

  scene.add(model);
  host.appendChild(canvas);
  initIntersection(entity, host);
  entities.add(entity);
}

function getModelTransforms(models) {
  const transforms = new Map();

  models.forEach((model) => {
    transforms.set(model.userData.term, {
      position: model.position.clone(),
      rotation: model.rotation.clone(),
      scale: model.scale.clone(),
    });
  });

  return transforms;
}

function createStackModels(tiles, manifest, scene, transforms = new Map()) {
  return tiles
    .map((tile, index) => {
      const icon = manifest.icons[tile.getAttribute("data-model-icon-3d")];

      if (!icon) {
        return null;
      }

      const model = createIconModel(icon, tile, {
        tileFill: "var(--auth-layout-icon-bg)",
        renderMode: "auth",
      }, CONFIG.light.auth);

      model.userData.term = tile.dataset.term;
      model.userData.host = tile;
      model.userData.index = index;
      const transform = transforms.get(model.userData.term);

      if (transform) {
        model.position.copy(transform.position);
        model.rotation.copy(transform.rotation);
        model.scale.copy(transform.scale);
      } else {
        model.rotation.set(
          CONFIG.view.auth.baseRotation.x,
          CONFIG.view.auth.baseRotation.y,
          CONFIG.view.auth.baseRotation.z,
        );
      }

      scene.add(model);

      return model;
    })
    .filter(Boolean);
}

function initStack(stack, manifest) {
  const tiles = Array.from(stack.querySelectorAll("[data-model-icon-3d]"));

  if (!tiles.length) {
    return;
  }

  const canvas = createCanvas("m__model-icon-3d-stack__canvas");
  const renderer = createEntityRenderer(canvas);
  const scene = createScene(CONFIG.light.auth, renderer, "auth");
  const camera = createCamera();
  const models = createStackModels(tiles, manifest, scene);
  const entity = {
    type: "stack",
    host: stack,
    tiles,
    manifest,
    canvas,
    renderer,
    scene,
    camera,
    models,
    viewHeight: CONFIG.view.auth.height,
    isReady: false,
    visible: true,
  };

  stack.prepend(canvas);
  initIntersection(entity, stack);
  entities.add(entity);
}

function updateEntity(entity, time) {
  if (entity.type === "stack") {
    updateStackEntity(entity);
    return;
  }

  updateMaterialColors(entity.model, entity.host, "var(--m__bg-surface)");

  if (entity.mode === "demo") {
    updateDemoRotation(entity);
    return;
  }

  if (entity.mode === "pricing") {
    const viewConfig = CONFIG.view.pricing;
    const rect = entity.host.getBoundingClientRect();
    const viewportCenter = window.innerHeight / 2;
    const p = clamp((rect.top + rect.height / 2 - viewportCenter) / viewportCenter, -1, 1);

    entity.model.rotation.x = viewConfig.baseRotation.x + p * viewConfig.scrollPitch;
    entity.model.rotation.y = viewConfig.baseRotation.y;
    entity.model.rotation.z = viewConfig.baseRotation.z;
    return;
  }

}

function updateDemoRotation(entity) {
  const viewConfig = getViewConfig(entity.mode);
  const rect = entity.host.getBoundingClientRect();
  const pad = viewConfig.cursorZone;
  const inside = pointer.x >= rect.left - pad
    && pointer.x <= rect.right + pad
    && pointer.y >= rect.top - pad
    && pointer.y <= rect.bottom + pad;
  const targetWeight = inside ? 1 : 0;
  const easing = inside ? 0.16 : 0.07;

  entity.hoverWeight += (targetWeight - entity.hoverWeight) * easing;

  const viewportCenter = window.innerHeight / 2;
  const scrollPosition = clamp(
    (rect.top + rect.height / 2 - viewportCenter) / viewportCenter,
    -1,
    1,
  );
  const nx = clamp((pointer.x - (rect.left + rect.width / 2)) / (rect.width / 2), -1, 1);
  const ny = clamp((pointer.y - (rect.top + rect.height / 2)) / (rect.height / 2), -1, 1);
  const cursorX = -ny * viewConfig.cursorPitch;
  const cursorY = -nx * viewConfig.cursorYaw;

  entity.model.rotation.x = (
    viewConfig.baseRotation.x + scrollPosition * viewConfig.scrollPitch
  ) * (1 - entity.hoverWeight)
    + cursorX * entity.hoverWeight;
  entity.model.rotation.y = viewConfig.baseRotation.y * (1 - entity.hoverWeight)
    + cursorY * entity.hoverWeight;
}

function getLightConfig(mode) {
  return mode === "auth" ? CONFIG.light.auth : CONFIG.light.pricing;
}

function getViewConfig(mode) {
  return mode === "auth" ? CONFIG.view.auth : CONFIG.view.pricing;
}

function updateStackEntity(entity) {
  const rect = entity.host.getBoundingClientRect();
  const firstModel = entity.models[0];

  if (!firstModel || !rect.width || !rect.height) {
    return;
  }

  const tileRect = firstModel.userData.host.getBoundingClientRect();
  const worldPerPx = entity.viewHeight / Math.max(rect.height, 1);
  const tileWorld = tileRect.width * worldPerPx;
  const stepWorld = entity.models.length > 1
    ? (rect.width - tileRect.width) * worldPerPx / (entity.models.length - 1)
    : 0;
  const viewWidth = entity.viewHeight * (rect.width / Math.max(rect.height, 1));
  const activeTerm = entity.host.dataset.stackFocus || entity.models[0].userData.term;

  entity.models.forEach((model, index) => {
    const isActive = model.userData.term === activeTerm;
    const targetScale = (tileWorld / CONFIG.authTile.size)
      * CONFIG.view.auth.scale
      * (isActive ? CONFIG.view.auth.activeScale : 1);
    const targetX = -viewWidth / 2 + tileWorld / 2 + index * stepWorld;
    const targetY = isActive ? 1.3 : 0;
    const targetZ = isActive ? CONFIG.view.auth.activeLift : index * 0.08;

    model.position.x += (targetX - model.position.x) * 0.18;
    model.position.y += (targetY - model.position.y) * 0.18;
    model.position.z += (targetZ - model.position.z) * 0.22;
    model.scale.x += (targetScale - model.scale.x) * 0.18;
    model.scale.y += (targetScale - model.scale.y) * 0.18;
    model.scale.z += (targetScale - model.scale.z) * 0.18;
    const targetRotation = isActive
      ? CONFIG.view.auth.activeRotation
      : CONFIG.view.auth.baseRotation;

    model.rotation.x += (targetRotation.x - model.rotation.x) * 0.16;
    model.rotation.y += (targetRotation.y - model.rotation.y) * 0.16;
    model.rotation.z += (targetRotation.z - model.rotation.z) * 0.16;
    updateMaterialColors(
      model,
      model.userData.host,
      isActive ? "var(--auth-layout-icon-bg-active)" : "var(--auth-layout-icon-bg)",
    );
  });
}

function renderEntity(entity) {
  const rect = entity.canvas.getBoundingClientRect();

  if (!rect.width || !rect.height) {
    return;
  }

  const pixelRatio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
  const width = Math.max(1, Math.round(rect.width * pixelRatio));
  const height = Math.max(1, Math.round(rect.height * pixelRatio));

  if (entity.canvas.width !== width || entity.canvas.height !== height) {
    entity.canvas.width = width;
    entity.canvas.height = height;
  }

  resizeCamera(entity.camera, width, height, getRenderViewHeight(entity, rect));

  entity.renderer.setSize(width, height, false);
  entity.renderer.render(entity.scene, entity.camera);

  if (!entity.isReady) {
    entity.isReady = true;

    if (entity.type === "stack") {
      entity.host.classList.add("m__model-icon-3d-stack-ready");
      entity.host.setAttribute("data-model-icon-3d-status", "ready");
      entity.models.forEach((model) => setHostReady(model.userData.host));
    } else {
      setHostReady(entity.host);
    }
  }
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getRenderViewHeight(entity, canvasRect) {
  if (entity.type !== "stack") {
    return entity.viewHeight;
  }

  const hostRect = entity.host.getBoundingClientRect();

  return entity.viewHeight * (canvasRect.height / Math.max(hostRect.height, 1));
}

function initSettingsControls() {
  document.querySelectorAll("[data-model-icon-3d-setting]").forEach((control) => {
    const path = control.getAttribute("data-model-icon-3d-setting");
    const currentValue = getConfigValue(path);

    if (currentValue === undefined) {
      return;
    }

    control.value = currentValue;
    updateSettingOutput(control, currentValue);
    control.addEventListener("input", () => {
      const nextValue = control.type === "number" || control.type === "range"
        ? Number(control.value)
        : control.value;

      setConfigValue(path, nextValue);
      updateSettingOutput(control, nextValue);

      if (applyLiveSetting(path)) {
        ensureFrameLoop();
        return;
      }

      scheduleModelRebuild();
    });
  });

  document.querySelectorAll("[data-model-icon-3d-reset]").forEach((button) => {
    button.addEventListener("click", () => {
      const paths = button
        .getAttribute("data-model-icon-3d-reset")
        .split(/[\s,]+/)
        .filter(Boolean);
      let needsRebuild = false;

      paths.forEach((path) => {
        setConfigValue(path, cloneConfigValue(getDefaultConfigValue(path)));
        updateControlsForPath(path);

        if (!applyLiveSetting(path)) {
          needsRebuild = true;
        }
      });

      if (needsRebuild) {
        scheduleModelRebuild();
        return;
      }

      ensureFrameLoop();
    });
  });
}

function applyLiveSetting(path) {
  if (path.startsWith("light.")) {
    entities.forEach((entity) => {
      const lightConfig = entity.type === "stack"
        ? CONFIG.light.auth
        : getLightConfig(entity.mode);

      updateSceneLight(entity.scene, lightConfig);
    });

    return true;
  }

  if (path.startsWith("view.")) {
    entities.forEach((entity) => {
      entity.viewHeight = entity.type === "stack"
        ? CONFIG.view.auth.height
        : getViewConfig(entity.mode).height;
    });

    return true;
  }

  if (path === "reflection.envMapIntensity" || path === "authReflection.envMapIntensity") {
    entities.forEach((entity) => {
      updateSceneEnvironment(entity.scene);
      updateRootEnvMapIntensity(entity.scene);
    });

    return true;
  }

  return false;
}

function updateRootEnvMapIntensity(root) {
  const intensity = clamp(getRenderConfig(root.userData.renderMode).reflection.envMapIntensity, 0, 1);

  root.traverse((object) => {
    if (!object.material) {
      return;
    }

    const materials = Array.isArray(object.material)
      ? object.material
      : [object.material];

    materials.forEach((material) => {
      material.envMapIntensity = intensity;
    });
  });
}

function getConfigValue(path) {
  return getConfigValueFrom(CONFIG, path);
}

function getDefaultConfigValue(path) {
  return getConfigValueFrom(DEFAULT_CONFIG, path);
}

function getConfigValueFrom(config, path) {
  return path.split(".").reduce((value, key) => {
    return value && value[key] !== undefined ? value[key] : undefined;
  }, config);
}

function setConfigValue(path, nextValue) {
  const keys = path.split(".");
  const lastKey = keys.pop();
  const target = keys.reduce((value, key) => value[key], CONFIG);

  target[lastKey] = nextValue;
}

function cloneConfigValue(value) {
  return value && typeof value === "object"
    ? JSON.parse(JSON.stringify(value))
    : value;
}

function updateControlsForPath(path) {
  document.querySelectorAll("[data-model-icon-3d-setting]").forEach((control) => {
    const controlPath = control.getAttribute("data-model-icon-3d-setting");

    if (controlPath !== path && !controlPath.startsWith(`${path}.`)) {
      return;
    }

    const value = getConfigValue(controlPath);

    control.value = value;
    updateSettingOutput(control, value);
  });
}

function updateSettingOutput(control, value) {
  const output = control.parentElement.querySelector("output");

  if (!output) {
    return;
  }

  output.textContent = typeof value === "number" ? formatNumber(value) : value;
}

function formatNumber(value) {
  if (Math.abs(value) >= 10) {
    return String(Math.round(value * 10) / 10);
  }

  return String(Math.round(value * 100) / 100);
}

function initModelIcons() {
  getManifest()
    .then((manifest) => {
      document.querySelectorAll("[data-model-icon-3d-stack]").forEach((stack) => {
        try {
          initStack(stack, manifest);
        } catch (error) {
          stack.setAttribute("data-model-icon-3d-status", "error");
          stack.setAttribute("data-model-icon-3d-error", error.message);
          console.warn("3D model icon stack fallback:", error);
        }
      });

      document.querySelectorAll("[data-model-icon-3d]").forEach((host) => {
        if (host.closest("[data-model-icon-3d-stack]")) {
          return;
        }

        const icon = manifest.icons[host.getAttribute("data-model-icon-3d")];

        if (icon) {
          try {
            initStandaloneIcon(host, icon);
          } catch (error) {
            setHostError(host, error);
          }
        }
      });

      initSettingsControls();
      ensureFrameLoop();
    })
    .catch((error) => {
      console.warn(error);
    });
}

initModelIcons();
