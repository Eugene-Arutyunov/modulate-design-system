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
**Data:** `ui.yaml` (root: array of routes, or `{ version?, routes }`). Every section is a node `section:`; inside it either one **component**, or several (**components**), or **text-content** (named text block / prose section). Data reflects dashboard pages in `src/dashboard/`.  
**Page:** `src/ui.html` (UI Architecture).  
**Styles:** `.ui-viz` + `.ui-viz__*` in `src/styles/ui-visualizer.css`.

Loads YAML → `normalizeUiData()` → `renderUIStructure()`. Semantic DOM (article, ul, li) and stable class namespace for easy extension of data format, layout, and styles.

---

## Shared text content styles

**Styles:** `src/styles/typography.css`  
**Class:** `.m__text-content`.

Shared tag styling for unstructured HTML text blocks: headings, paragraphs, links, inline code, and lists. Use this class for dashboard/text-content sections and footer copy so prose renders consistently across docs and product pages.

---

## Layouts: design system vs prototype

Two separate page wrappers:

- **Design system / docs:** `src/includes/ds-layout.html` — docs shell with design-system header/footer, shared styles and scripts. Used by the main design-system pages.
- **Prototype / product pages:** `src/includes/layout.html` — product shell with dashboard header, theme script, content block, and shared product footer.

---

## Product footer

**Markup:** `src/includes/footer.html`  
**Styles:** `src/styles/footer.css`  
**Asset:** `src/includes/assets/modulate-logo-notag-black.html`.

Footer for product pages in `layout.html`: logo + company blurb, contact/support block, and legal links. Shares the same footer style module with the design-system footer; only the content differs.

---

## Design system footer

**Markup:** `src/includes/ds-footer.html`  
**Styles:** `src/styles/footer.css`  
**Asset:** `src/includes/assets/modulate-logo-notag-black.html`.

Footer for docs pages in `ds-layout`: same shared footer structure and styles, but with design-system workspace copy, Ilya Sinelnikov contact, and a minimal copyright line.
