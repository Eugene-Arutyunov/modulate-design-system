# SVG icon sprite flow

Source icons live in `src/assets/images/svg-icons-source/` as raw SVG files.

## What gets generated

Run:

```bash
npm run icons:build
```

This generates:

- `src/includes/service/svg-icons-sprite.html`

That file is a hidden SVG sprite. Each source SVG becomes one `<symbol>`:

- `account.svg` -> `<symbol id="account">`
- `api-key.svg` -> `<symbol id="api-key">`
- `api-docs.svg` -> `<symbol id="api-docs">`

The sprite is included globally in both layouts:

- `src/includes/ds-layout.html`
- `src/includes/layout.html`

## Cleanup rules

During generation, the script:

- removes XML headers, `<defs>`, `<style>`, and other editor metadata
- drops helper shapes whose fill resolves to `none`

**Monochrome icons** (default):

- strips all `class`, `id`, `data-name`, `fill`, `stroke`, and inline `style` attributes
- applies `fill="currentColor"` on the generated `<symbol>`
- icon inherits color from where it is used

**Colored icons** (brand/vendor logos and product signal icons):

- resolves class-based fills to inline `fill` attributes before stripping `<style>`
- removes only editor junk (`class`, `id`, `data-name`, `style`, `xmlns`)
- keeps all visual attributes (`fill`, `stroke`, etc.)
- the `<symbol>` has no `fill="currentColor"` — colors are fixed and do not change on hover

To mark an icon as colored, add its base filename (without `.svg`) to the `COLORED_ICONS` set at the top of `scripts/generate-svg-sprite.js`:

```js
const COLORED_ICONS = new Set(["google", "microsoft", "facebook"]);
```

## Icon palette colors

Product icons that need fixed accent fills use tokens from **`src/styles/tokens/colors.css`**:

| Token                        | Default value        | Typical use                           |
| ---------------------------- | -------------------- | ------------------------------------- |
| **`--m__icon-red-color`**    | `rgb(255, 53, 84)`   | Alerts, deepfake, medical/STT accents |
| **`--m__icon-yellow-color`** | `rgb(255, 200, 0)`   | Music-related accents                 |
| **`--m__icon-gray-color`**   | `rgb(153, 153, 153)` | Secondary accent shapes               |
| **`--m__icon-white-color`**  | `rgb(255, 255, 255)` | Light accent stripes on dark shapes   |
| **`--m__icon-purple-color`** | `rgb(124, 58, 237)`  | Brand accents (same as code-accent)   |

Do not hardcode RGB in source SVGs or reuse emotion/UI palette values for these accents — reference the icon tokens so palette updates stay centralized. The design-system **Icon Color Palette** section on the home page documents the same tokens.

In a colored source SVG:

- **`fill="var(--m__icon-red-color)"`** (or yellow, gray, white, purple) — fixed accent; does not follow parent `color`
- **`fill="currentColor"`** — monochrome part; inherits `color` from where the icon is used

Example:

```xml
<rect x="4.975" y="4.975" width="4.727" height="3.708" fill="var(--m__icon-red-color)" />
<rect x="11.878" y="4.975" width="14.347" height="3.708" fill="currentColor" />
```

CSS custom properties cascade into sprite symbols referenced via `<use>`, so `var(--m__icon-…-color)` resolves at render time from `:root`.

## How to use an icon

```html
<svg viewBox="0 0 32 32" aria-hidden="true">
  <use href="#account"></use>
</svg>
```

If the source file is named `billing.svg`, the symbol id is `billing`.

## How to add or update icons

1. Put the raw SVG file into `src/assets/images/svg-icons-source/`.
2. Keep the filename stable, because it becomes the symbol id.
3. For colored product icons, map editor fills to **`var(--m__icon-…-color)`** or **`currentColor`** as above; add the filename to **`COLORED_ICONS`** if needed.
4. Run `npm run icons:build`.
5. Use the icon with `<use href="#file-name">`.

## Notes

- **`overview-muted.svg`** → **`#overview-muted`**: same three bars as **`overview.svg`**, with **`fill-opacity="0.3"`** on the top two rectangles and full opacity on the bottom bar. Used in online docs only; not listed on the design-system icon grid.
- **`music.svg`** → **`#music`**: colored icon — inner circle uses **`var(--m__icon-yellow-color)`**; outer ring uses **`currentColor`**. Listed in **`COLORED_ICONS`**.
- **`ai-music.svg`** → **`#ai-music`**: colored icon — left rings use **`var(--m__icon-yellow-color)`** and **`currentColor`**; right bars use **`var(--m__icon-yellow-color)`**, **`currentColor`**, and **`var(--m__icon-white-color)`**. Listed in **`COLORED_ICONS`**.
- **`deepfake.svg`** → **`#deepfake`**: colored icon — top bars use **`var(--m__icon-red-color)`**; bottom bars use **`currentColor`**. Listed in **`COLORED_ICONS`**.
- **`stt-med.svg`** → **`#stt-med`**: colored icon — all bars use **`var(--m__icon-red-color)`**. Listed in **`COLORED_ICONS`**.
- **`velma.svg`** → **`#velma`**: colored icon — accent shapes use **`var(--m__icon-purple-color)`**; other shapes use **`currentColor`**. Listed in **`COLORED_ICONS`**.
- **`redaction.svg`** → **`#redaction`**: monochrome; inherits **`currentColor`**.
- **`github.svg`** → **`#github`**: monochrome; inherits **`currentColor`** (used on auth OAuth buttons).
- **`apple.svg`** → **`#apple`**: monochrome; inherits **`currentColor`** (used on auth OAuth buttons).
- The build script is `scripts/generate-svg-sprite.js`.
- `npm run build`, `npm run build:clean`, and `npm run dev` regenerate the sprite automatically before running.
- Do not edit `src/includes/service/svg-icons-sprite.html` by hand. It is generated.
- Colored icon symbols render identically regardless of CSS `color` or `fill` on the parent element — except shapes explicitly set to **`currentColor`**.
