# SVG icon sprite flow

Source icons live in `src/assets/images/svg-icons-source/` as raw SVG files.

## What gets generated

Run:

```bash
npm run icons:build
```

This generates:

- `src/includes/assets/svg-icons-sprite.html`

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
- removes internal `class`, `id`, `data-name`, `fill`, `stroke`, and inline style attributes
- drops helper shapes whose fill resolves to `none`
- applies `fill="currentColor"` on each generated `<symbol>`

The result is a clean icon system with no internal styling. Icons inherit color from the place where they are used.

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

- The build script is `scripts/generate-svg-sprite.js`.
- `npm run build`, `npm run build:clean`, and `npm run dev` regenerate the sprite automatically before running.
- Do not edit `src/includes/assets/svg-icons-sprite.html` by hand. It is generated.
