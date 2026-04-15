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

**Colored icons** (brand/vendor logos):

- resolves class-based fills to inline `fill` attributes before stripping `<style>`
- removes only editor junk (`class`, `id`, `data-name`, `style`, `xmlns`)
- keeps all visual attributes (`fill`, `stroke`, etc.)
- the `<symbol>` has no `fill="currentColor"` — colors are fixed and do not change on hover

To mark an icon as colored, add its base filename (without `.svg`) to the `COLORED_ICONS` set at the top of `scripts/generate-svg-sprite.js`:

```js
const COLORED_ICONS = new Set(["google", "microsoft", "facebook"]);
```

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
3. Run `npm run icons:build`.
4. Use the icon with `<use href="#file-name">`.

## Notes

- **`overview-muted.svg`** → **`#overview-muted`**: same three bars as **`overview.svg`**, with **`fill-opacity="0.3"`** on the top two rectangles and full opacity on the bottom bar. Used in online docs only; not listed on the design-system icon grid.
- The build script is `scripts/generate-svg-sprite.js`.
- `npm run build`, `npm run build:clean`, and `npm run dev` regenerate the sprite automatically before running.
- Do not edit `src/includes/service/svg-icons-sprite.html` by hand. It is generated.
- Colored icon symbols render identically regardless of CSS `color` or `fill` on the parent element.
