# Repository registry (Modulate Design System)

Index of notable functional blocks for developer navigation. Add a short description here when introducing new blocks.

---

## Theme toggle

**Script:** `src/assets/js/theme-toggle.js`  
**Styles:** `src/styles/theme-toggle.css` (shared control).  
**Used in:** `src/includes/header.html` (prototype popover toggle), `src/includes/nav-island.html` (DS pages), `src/includes/layout.html` (script tag), `src/includes/ds-layout.html` (script tag).

Switches between light and dark theme. Supports multiple `.theme-toggle` elements at once. The storage key is taken from `body[data-theme-storage-key]`, which keeps prototype pages and design-system pages independent (`prototype-theme` vs `design-system-theme`). The initial theme is applied by a small inline script right after `<body>` in layouts so the correct theme is set before first paint (avoids flash). Landing pages (index-landing, docs, pricing) are intentionally light-only and have no theme toggle.

---

## Navigation island

**Markup:** `src/includes/nav-island.html`  
**Styles:** `src/styles/nav-island.css`  
**Used in:** `src/includes/ds-layout.html`, `src/includes/layout.html`, `src/includes/landing-layout.html`.

Fixed-position element in the bottom-left corner of every page. Contains four icon-links for cross-navigation between the design system (`/`), prototype landing (`/index-landing/`), dashboard (`/dashboard/overview/`), and UI Architecture (`/ui/`). On DS pages the include also renders the theme toggle (controlled by the Nunjucks variable `islandThemeToggle`). The island is semi-transparent at rest and becomes fully opaque on hover, using `backdrop-filter` and `opacity` transition with the shared timing tokens.

---

## Prototype internal nav toggle

**Script:** `src/assets/js/prototype-internal-nav-toggle.js`  
**Markup:** `src/includes/dashboard-nav-macros.html` wraps `/internal/…` links in `.prototype-internal-nav`.  
**Styles:** `src/styles/dashboard/layout.css` (`body.prototype-hide-internal-nav` hides that wrapper); `src/styles/footer.css` (`.footer-prototype-tools__switch` matches the theme-toggle look).  
**Used in:** `src/includes/layout.html` and `src/includes/landing-layout.html` (inline class restore from `localStorage` before paint + script tag), `src/includes/footer.html` (technical panel with DS links and the switch). The script always syncs `body.prototype-hide-internal-nav` from storage even when the current page has no internal nav links (e.g. landing). The switch label is a `<label for="…">` so the text toggles the control too.

The footer panel under the Modulate blurb contains a switch **Internal admin links** (same pill control as the theme toggle, but not using the `.theme-toggle` class so `theme-toggle.js` does not bind to it). State persists in `localStorage` under `prototype-internal-nav-hidden` (`1` = hidden). Default is links visible (`aria-checked="true"` on the switch). Cross-navigation links (DS main, UI Architecture) were moved to the nav island.

---

## Header user menu

**Script:** `src/assets/js/header-menu.js`  
**Markup:** `src/includes/header.html` (user trigger + popover), `src/includes/dashboard-nav-macros.html` (shared nav macros consumed by the header popover and sidebar).  
**Styles:** `src/styles/dashboard/header.css` (`.prototype-header__user-*`, `.prototype-header__popover*`).

Dropdown menu: trigger shows user name + chevron; click opens popover. Account and organization lines and the full dashboard/internal link list come from the same Nunjucks macros as the desktop sidebar (`dashboard_nav_meta`, `dashboard_nav_main`). On viewports under 768px, `.prototype-header__popover-nav` also renders the primary header links (Conversations, Playground, Docs, Dashboard) ahead of that list, matching the hidden top bar. Appearance + theme toggle and Log out follow. Popover aligned to right, below trigger with gap. Close on outside click or Escape. Theme toggle in popover and in header both bound by theme-toggle.js.

---

## UI structure visualizer

**Script:** `src/assets/js/ui-visualizer.js`  
**Data:** `ui.yaml` with two root keys: **current** (product) and **target** (prototype for this repo). Each is an array of routes; every section is a node `section:` with **widget**, **widgets**, or **text-content**. Optional per route: **title_deprecated** (string) — shown struck through before **title** in the Route column when set.  
**Page:** `src/ui.html` (UI Architecture).  
**Styles:** `.ui-viz` + `.ui-viz__*` in `src/styles/ui-visualizer.css`.

Loads YAML → `normalizeUiData()` → `renderUIStructure()`. Renders three columns per row (Route title, Current, Target). Static diagram: `src/includes/ui-arch-diagram.html` (`<aside class="ui-arch-diagram">` with both columns), `ui-arch-diagram-structure.html` (left: route + list), `ui-arch-diagram-layout.html` (right: 4 section blocks). Full diagram on `src/ui.html`; index uses only the layout include inside `<aside class="ui-arch-diagram ui-arch-diagram--layout-only">`. Grid and `min-height` are in `ui-visualizer.css`; surface, padding, and radius come from the shared prose `aside` rule in `page-composition/wrappers.css`.

---

## Shared text content styles

**Styles:** `src/styles/components/text.css`

Global tag-level styles for prose elements: headings, paragraphs, links, inline code, lists, and preformatted blocks. Rules apply to bare HTML tags and cover the entire page; no wrapper class is required. Also defines `.caption` — secondary/meta text at `--m__font-size-s` with `--m__text-caption-color`; links inside use the same text color with an underline and `--m__text-hover-color` on hover (same timing as default links).

---

## Docs chrome (navbar + footnotes)

**Styles:** `src/styles/ids-components/navbar.css`, `src/styles/ids-components/footnotes.css`  
**Scripts:** `src/assets/js/navbar.js`, `src/assets/js/footnotes.js`  
**Bundle:** included from `src/css-bundle.njk`; `main.js` imports the scripts on design-system pages (`ds-layout.html`).

Segmented docs nav (`ids-navbar` / `ids-nav-item`) and footnote popovers (`ids-footnote-link` / `ids-footnote`). The footnote `<aside class="ids-footnote">` resets the shared prose `aside` styling from `page-composition/wrappers.css` inside `footnotes.css`. Class names keep the `ids-` prefix for historical reasons; there is no page-level `.ids` wrapper.

---

## Interaction timing tokens

**Styles:** `src/styles/tokens/animations.css`.

Shared timing tokens for hover behavior. The system defines instant hover, animated unhover, and shared easing as tokens, while leaving the exact transitioned properties up to the component author.

---

## SVG icon sprite flow

**Source:** `src/assets/service/images/svg-icons-source/*.svg`  
**Build script:** `scripts/generate-svg-sprite.js`  
**Generated include:** `src/includes/service/svg-icons-sprite.html`  
**Usage docs:** `SVG-ICON-SPRITE.md`.

Raw SVG files are normalized into one hidden sprite include. The generator removes internal SVG styles and presentational attributes, drops helper shapes with `fill: none`, assigns symbol ids from filenames, and sets icons up for `currentColor`. Layouts include the sprite globally, and icons are rendered via `<use href="#icon-name">`.

---

## Dashboard navigation icons

**Markup:** `src/includes/dashboard-nav-sidebar.html` (imports macros), `src/includes/dashboard-nav-macros.html` (single source for sidebar + mobile menu links), `src/includes/header.html` (imports the same macros for the bar and popover).  
**Styles:** `src/styles/dashboard/layout.css`, `src/styles/dashboard/header.css`.

Dashboard page navigation in the prototype uses the shared SVG sprite for page icons. Link targets and order are defined once in `dashboard-nav-macros.html` (`dashboard_nav_meta` + `dashboard_nav_main` with variant `sidebar` or `popover`). The sidebar starts with one caption-style link (organization); the account email link appears only in the header popover. Then dashboard icon links, then internal tool links; the prototype header logo uses sprite symbol `#mod-icon`. Primary header links are defined in `primary_nav('bar'|'popover'|'landing')`: full bar + popover on signed-in pages; **landing** (`index-landing`, `isLanding`) shows only Playground and Docs before Sign in.

---

## Docs page

**Page:** `src/docs.html`  
**Permalink:** `/docs/`  
**Script:** `src/assets/js/docs.js`  
**Styles:** `src/styles/docs.css`

Documentation page. Uses `landing-layout.html` — unauthenticated header (Playground + Docs + Pricing + Sign in), light theme. Two-column layout (`dashboard-layout`): left sidebar lists models loaded from `/assets/data/models.json` with `.m__tag-flat` status labels; right panel shows per-model tabs (Overview / API Spec / Quickstart) via `.m__segmented-control`. Overview is rendered from cached model data. API Spec fetches `/assets/data/model-docs/{identifier}/openapi.yaml` and shows it in `.docs-code-block` with a download button. Quickstart fetches `/assets/data/model-docs/{identifier}/quickstart.md` → `marked.parse()` → `hljs.highlightElement()`; example links come from `models.json`. Marked and highlight.js loaded from CDN via `{% block scripts %}`. Works fully without a backend.

---

## Model documentation data files

**Data:** `src/assets/data/models.json` — model list with all metadata and example project links.  
**Docs:** `src/assets/data/model-docs/{model_identifier}/openapi.yaml` and `quickstart.md` — one directory per model.

Static files committed to the repo; served as-is by Eleventy passthrough copy (`src/assets`). To add a model: add an entry to `models.json` and create the corresponding `model-docs/{identifier}/` directory.

---

## Models page

**Page:** `src/models.html`  
**Permalink:** `/models/`  
**Script:** `src/assets/js/models.js`  
**Styles:** `src/styles/docs.css` (shared with docs)

Public models/pricing page. Uses `landing-layout.html`. Loads model list from `/assets/data/models.json` and renders one `.pricing-card` per model with base cost, feature costs, quotas, and accepted formats. The nav item is called "Models" in all three nav variants (landing, bar, popover). Works fully without a backend.

---

---

## Playground page

**Page:** `src/playground.html`  
**Permalink:** `/playground/`

Placeholder page for the interactive API playground. Uses `landing-layout.html` — unauthenticated header, light theme. Playground link in all nav variants now points to `/playground/` instead of `#`.

---

## Conversations page

**Page:** `src/conversations.html`  
**Permalink:** `/conversations/`

Empty placeholder page for conversations. Uses `layout.html`.

---

## Organization dashboard page

**Page:** `src/dashboard/organization.html`  
**Permalink:** `/dashboard/organization/`  
**UI structure:** `ui.yaml` (`dashboard-organization`).

Dashboard page with sidebar; placeholder sections for organization intro, details, members, and pending invites.

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
**Tokens:** `--m__control-inset-padding`, `--m__textfield-radius`, `--m__textfield-label-size` in `src/styles/tokens/ui-components.css`.  
**Class:** `.m__textfield`

Label + input pair. Label sits above the input. Input uses `--m__ui-control-color` background, `--m__ui-border-color` border, and focus outline via `--m__text-hover-color`. Works with `type="email"` and `type="password"`.

---

## Auth screens

**Pages:** `src/auth/login.html`, `src/auth/signup.html`, `src/auth/reset-password.html`, `src/auth/org-select.html`  
**Layout:** `src/includes/auth-layout.html`  
**UI structure:** `ui.yaml` (routes `/auth/login/`, `/auth/signup/`, `/auth/reset-password/`, `/auth/org-select/`).

Four auth screens using `.auth-form` + `.m__textfield` + `.m__button`. Sign in has email and password fields. Create account has email only, button "Continue". Reset password has email only, button "Send reset link". Select organization shows an `.m__option-list` of orgs with `.m__tag` role labels, and a form to create a new org with a secondary button.

---

## Option list component

**Styles:** `src/styles/option-list.css`  
**Class:** `.m__option-list`

A group of interactive list items that share a single rounded border. Functionally a set of buttons (each item navigates immediately on click); visually the border-radius applies to the group container, not individual rows. Rows are separated by a border-bottom. Each item is a flex row with a label (`__item-label`) and an optional tag cluster (`__item-tags`) pushed to the right. Hover state uses `--m__ui-control-color`.

---

## Tag component

**Styles:** `src/styles/components/tag.css`  
**Class:** `.m__tag`, `.m__tag-flat`

Small inline label for metadata. `.m__tag` shows a bordered outline using `currentColor`. `.m__tag-flat` shows a tinted background derived from `currentColor` — wrap in a parent with an explicit color for semantic variants (e.g. success for "released" status). Default color is `--m__text-caption-color`.

---

## Dashboard charts

**Script:** `src/assets/js/dashboard-charts.js`  
**Data:** `dashboard-charts.json` (static snapshot with 30 days of data, passthrough-copied to site root).  
**Includes:** `src/includes/dashboard/overview/credit-balance-over-time.html`, `usage-by-model.html`, `requests-by-status.html`.  
**Styles:** `.chart-container`, `.chart-empty`, `.m__segmented-control` in `src/styles/dashboard/layout.css`.  
**Library:** Chart.js 4.4.0 via CDN, loaded conditionally with `chartJs: true` in page front matter.

Three charts on the dashboard overview page: Credit Balance Over Time (line), Usage by Model (stacked bar), Requests by Status (stacked bar). Each chart has a "Last 7 days / 30 days" radio toggle that filters data client-side. The script fetches the full JSON data file at runtime, filters by selected period, and renders Chart.js canvases. Chart instances are stored and destroyed on re-render. Theme-aware: reads CSS custom properties for grid and label colors.

## Design-system chart samples

**Script:** `src/assets/js/ds-charts.js`
**Page:** Charts section in `src/index.html`.
**Library:** Chart.js 4.4.0 via CDN, loaded from `ds-layout.html`.

Two sample charts (line and stacked bar) rendered with hardcoded data on the design-system documentation page. Demonstrates the opinionated Chart.js configuration that all product charts should follow. Re-renders on theme change via MutationObserver.

---

## Online Docs prototype

**Page:** `src/online-docs.html`, `src/online-docs/toxmod.html`, `src/online-docs/prosocial.html`  
**Permalink:** `/online-docs/`, `/online-docs/toxmod/`, `/online-docs/prosocial/`  
**Layout:** `src/includes/prototypes/online-docs-layout.html` (includes `service/svg-icons-sprite.html` for `<use>` icons in case study markup).  
**Styles:** `src/styles/prototypes/online-docs.css`  
**Include:** `src/includes/assets/activision-logo.html` (Activision wordmark SVG, `currentColor`, used on the ToxMod case study footer).  
**Wrapper:** `.m__online-doc-wrapper` sets default body ink **`rgb(20, 20, 50)`** and `a { color: inherit }` (title hero keeps its own theme). **`p.accent`** and **`aside.online-doc-callout`** body copy use accent blue **`rgb(40, 95, 235)`**; links in the callout use **`rgb(35, 84, 207)`** with hover **`rgb(40, 95, 235)`**. **`h1`** in the wrapper uses `--m__font-mono`. **`h4.online-doc-kicker`** — uppercase kicker. **`m__text-width`** — **80%** / **100%** mobile. **`aside.online-doc-callout`**: **2× right padding**; **`online-doc-callout-block`** — **`margin-bottom: 1.5rem`**; first grid class **`online-doc-callout-sequence`** with **`online-doc-callout-item`** (icon + **`__body`**) and sprite **`#behaviors`**, **`#overview-muted`**, **`#done`**, **`#decrease`** (prosocial case study); second grid has **`mark`** + thick blue underline on headline figures; **`m__sequence`** **two columns**, **`--m__font-size-xl`**, **`strong`** mono; **print:** page breaks + letter sheet like `.title-container`. **`.title-container__footer`**: one flex row (**`align-items: baseline`**), **`title-container__footer-spacer`** (`flex: 1`) pushes contact links right; on narrow viewports the spacer line-breaks so links sit on the next row. **`title-container__logo-slot--activision`**: **`bottom: -0.35em`** (visual nudge vs. text links).

Print-oriented document prototype. **Experimental / isolated:** doc-specific variables and components belong only in `online-docs.css`, not in `src/styles/tokens/` or other shared DS files, until the pattern is promoted. Uses `online-docs-layout.html` (no product header or footer). Wrapper `.m__online-doc-wrapper` is a centered reading column; `@page { size: letter }` with margins, break rules, `12pt` print body, and `print-color-adjust: exact`. Browser print headers/footers are turned off in the print dialog, not via CSS. Index links to two sample case studies.
