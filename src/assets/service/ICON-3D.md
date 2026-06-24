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
