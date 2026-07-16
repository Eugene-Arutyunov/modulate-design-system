---
permalink: false
---

# 3D Model Icon Flow

3D model icons use a separate source flow from the flat SVG sprite. The flat
sprite remains the fallback and the copy-friendly icon source, while the 3D
flow stores SVG shapes as browser-rendered extrusion data.

## Files

- `src/assets/images/svg-icons-3d-source/*.svg` stores SVG files prepared for
  extrusion.
- `src/assets/images/svg-icons-3d-source/layers/*.layers.json` stores optional
  virtual layer maps and layer spans. Shape indices follow SVG document order.
- `scripts/generate-icon-3d-manifest.js` generates
  `src/assets/service/icon-3d/icons.json`.
- `src/assets/service/icon-3d/model-icon-3d.js` renders individual icon tiles
  and the shared auth icon stack.

## Layering

The generator resolves a shape layer in this order:

1. `data-3d-layer` on the SVG shape.
2. The matching index in `shapeLayers` from `*.layers.json`.
3. The base layer, `0`.

The sidecar form keeps Illustrator exports clean while still allowing a
designer or developer to tune depth ordering without editing path data.

```json
{
  "id": "velma",
  "shapeLayers": [0, 1, 1]
}
```

`shapeLayerSpans` controls how many base glyph depths a shape occupies. A value
of `2` starts at the shape’s layer and spans that layer plus the next one.
Fractional values are allowed: `0.5` makes a shape half as thick as the base
glyph depth, `1.5` makes it half a layer thicker (see `voice-match`, where the
span of each bar follows its height).

```json
{
  "id": "deepfake",
  "shapeLayers": [0, 0, 0, 0],
  "shapeLayerSpans": [2, 2, 1, 1]
}
```

## Colors

The generator maps source hex fills to design-system tokens where possible.
Black becomes `currentColor`, prepared accent fills become palette tokens, and
white becomes `var(--m__bg-surface)` so spacer shapes match the tile face.

## Runtime

Pages include `service/icon-3d-importmap.html` before loading
`/assets/service/icon-3d/model-icon-3d.js`. Markup keeps the original SVG inside
the tile as fallback; the renderer hides it only after a canvas is ready.

## Auth stack icon set

The auth icon stack (`includes/prototypes/auth-layout-models-panel.html`)
lists every available tile in the markup. The `data-model-icon-3d-icons`
attribute on the stack element is the default-set config: a space- or
comma-separated list of `data-term` values. Icons missing from the list are
hidden (tile, hover zone, and 3D model), and `--auth-layout-icon-count` is
updated so the overlap stays correct. Removing the attribute shows all icons.

The settings panel lives only on the sandbox page `/auth/3d-icons-sandbox/`
(`prototypes/platform/auth/3d-icons-sandbox.html`, include
`includes/prototypes/auth-icon-3d-settings.html`); the other auth pages show
the configured result without controls. The panel holds the auth-specific
render controls plus per-icon checkboxes (`data-model-icon-3d-icon`) that
toggle the set live. The panel component is `.icon-3d-settings`
(`styles/components/model-icon-3d.css`); the sandbox adds
`.icon-3d-settings--left`.

## Icon Studio

`/icon-studio/` (`service/icon-studio.html`,
`assets/service/icon-3d/icon-studio.js`, styles
`styles/service/icon-studio.css`) is a screenshot workbench: one icon on a
full-width stage with adjustable aspect (2:1–5:4) and a background from the
base palette. Controls sit in-flow above the stage: icon, size, horizontal
position, rotation X/Y/Z, light (angle and height on a 2D pad, Z and
intensities as sliders), shadow opacity, and color bleed. Tile and glyph
geometry are not editable there. Moving the cursor over the stage orbits the
icon; a click captures the pose as the new base rotation and freezes tracking
until the pointer leaves the stage. An optional oscillating rotation around
one axis (speed and amplitude, off by default) is available for animation
checks. The module imports shared blocks exported from `model-icon-3d.js`.

## Home rows

The 6-per-row 3D grids on the design-system home page and `/blog/icons/` use
`data-model-icon-3d-mode="home"`: the camera scale anchors to the host square
(`view.home.height`, 38 = exact tile match), and the canvas bleeds into the
grid gaps as rotation headroom (`.docs-icon-row--3d`,
`styles/service/ds-main-page.css`).
