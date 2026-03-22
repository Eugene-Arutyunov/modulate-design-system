# Repository registry (Modulate Design System)

Index of notable functional blocks for developer navigation. Add a short description here when introducing new blocks.

---

## Theme toggle

**Script:** `src/assets/js/theme-toggle.js`  
**Styles:** `src/styles/theme-toggle.css` (shared control), `src/styles/ds-theme-toggle.css` (fixed docs placement).  
**Used in:** `src/includes/header.html` (prototype toggle control), `src/includes/layout.html` (script tag), `src/includes/ds-layout.html` (fixed docs toggle + script tag).

Switches between light and dark theme. Supports multiple `.theme-toggle` elements at once, so the prototype header toggle and the fixed docs toggle stay in sync. The storage key is taken from `body[data-theme-storage-key]`, which keeps prototype pages and design-system pages independent (`prototype-theme` vs `design-system-theme`). The initial theme is applied by a small inline script right after `<body>` in layouts so the correct theme is set before first paint (avoids flash).

---

## Header user menu

**Script:** `src/assets/js/header-menu.js`  
**Markup:** `src/includes/header.html` (user trigger + popover).  
**Styles:** `src/styles/dashboard/header.css` (`.prototype-header__user-*`, `.prototype-header__popover*`).

Dropdown menu: trigger shows user name + chevron; click opens popover (Account link, Appearance + theme toggle, Log out). Popover aligned to right, below trigger with gap. On mobile, Dashboard/Playground links are hidden; user menu and theme toggle remain. Close on outside click or Escape. Theme toggle in popover and in header both bound by theme-toggle.js.

---

## UI structure visualizer

**Script:** `src/assets/js/ui-visualizer.js`  
**Data:** `ui.yaml` with two root keys: **product** (actual structure in the product) and **prototype** (target structure for this repo). Each is an array of routes; every section is a node `section:` with **widget**, **widgets**, or **text-content**.  
**Page:** `src/ui.html` (UI Architecture).  
**Styles:** `.ui-viz` + `.ui-viz__*` in `src/styles/ui-visualizer.css`.

Loads YAML → `normalizeUiData()` → `renderUIStructure()`. Renders two columns per route (product vs prototype). Prototype is the target structure for this repository; when the product catches up, update the `product` block in `ui.yaml`. Static diagram: `src/includes/ui-arch-diagram.html` (aside with both columns), `ui-arch-diagram-structure.html` (left: route + list), `ui-arch-diagram-layout.html` (right: 4 section blocks). Full diagram on `src/ui.html`; index uses only the layout include inside `<aside class="ui-arch-diagram ui-arch-diagram--layout-only">`. Styles in `ui-visualizer.css` under `.ui-arch-diagram`.

---

## Shared text content styles

**Styles:** `src/styles/typography.css`  
**Class:** `.m__text-content`.

Shared tag styling for unstructured HTML text blocks: headings, paragraphs, links, inline code, and lists. Use this class for dashboard/text-content sections and footer copy so prose renders consistently across docs and product pages.

---

## Interaction timing tokens

**Styles:** `src/styles/animations.css`.

Shared timing tokens for hover behavior. The system defines instant hover, animated unhover, and shared easing as tokens, while leaving the exact transitioned properties up to the component author.

---

## SVG icon sprite flow

**Source:** `src/assets/images/svg-icons-source/*.svg`  
**Build script:** `scripts/generate-svg-sprite.js`  
**Generated include:** `src/includes/assets/svg-icons-sprite.html`  
**Usage docs:** `SVG-ICON-SPRITE.md`.

Raw SVG files are normalized into one hidden sprite include. The generator removes internal SVG styles and presentational attributes, drops helper shapes with `fill: none`, assigns symbol ids from filenames, and sets icons up for `currentColor`. Layouts include the sprite globally, and icons are rendered via `<use href="#icon-name">`.

---

## Dashboard navigation icons

**Markup:** `src/includes/dashboard-nav-sidebar.html`, `src/includes/header.html`  
**Styles:** `src/styles/dashboard/layout.css`, `src/styles/dashboard/header.css`.

Dashboard page navigation in the prototype uses the shared SVG sprite for page icons. The prototype header logo also uses sprite symbol `#mod-icon`. Current page-icon mapping is explicit in markup so each link stays easy to read and reorder.

---

## Behaviors dashboard page

**Page:** `src/dashboard/behaviors.html`  
**UI structure:** `ui.yaml`.

Placeholder dashboard page added to use the existing `behaviors` icon and keep dashboard navigation aligned with the available icon set.

---

## Layouts: design system vs prototype

Two separate page wrappers:

- **Design system / docs:** `src/includes/ds-layout.html` — docs shell with design-system header/footer, shared styles and scripts. Used by the main design-system pages.
- **Prototype / product pages:** `src/includes/layout.html` — product shell with dashboard header, theme script, content block, and shared product footer.

---

## Auth layout

**Markup:** `src/includes/auth-layout.html`  
**Styles:** `src/styles/auth-layout.css`

Standalone two-column layout for auth screens. No dashboard header or footer. Left column: flex-column with logo header, centered form main area, and legal footer. Right column: solid `--m__bg-accent-color` fill, hidden on mobile. Used by all three auth pages.

---

## Textfield component

**Styles:** `src/styles/textfield.css`  
**Tokens:** `--m__textfield-padding`, `--m__textfield-radius`, `--m__textfield-label-size` in `src/styles/tokens/ui-components.css`.  
**Class:** `.m__textfield`

Label + input pair. Label sits above the input. Input uses `--m__ui-control-color` background, `--m__ui-border-color` border, and focus outline via `--m__text-hover-color`. Works with `type="email"` and `type="password"`.

---

## Auth screens

**Pages:** `src/auth/login.html`, `src/auth/signup.html`, `src/auth/reset-password.html`  
**Layout:** `src/includes/auth-layout.html`  
**UI structure:** `ui.yaml` (routes `/auth/login/`, `/auth/signup/`, `/auth/reset-password/`).

Three auth screens using `.auth-form` + `.m__textfield` + `.m__button`. Sign in has email and password fields. Create account has email only, button "Continue". Reset password has email only, button "Send reset link".

---

## Dashboard charts

**Script:** `src/assets/js/dashboard-charts.js`  
**Data:** `dashboard-charts-7d.json` (static snapshot, passthrough-copied to site root).  
**Includes:** `src/includes/dashboard/overview/credit-balance-over-time.html`, `usage-by-model.html`, `requests-by-status.html`.  
**Styles:** `.chart-container`, `.chart-empty` in `src/styles/dashboard/layout.css`.  
**Library:** Chart.js 4.4.0 via CDN, loaded conditionally with `chartJs: true` in page front matter.

Three charts on the dashboard overview page: Credit Balance Over Time (line), Usage by Model (stacked bar), Requests by Status (stacked bar). The script fetches the JSON data file at runtime, processes `usageStats` and `creditHistory`, and renders Chart.js canvases. Theme-aware: reads CSS custom properties for grid and label colors.
