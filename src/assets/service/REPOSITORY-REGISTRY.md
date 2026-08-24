# Repository registry (Modulate Design System)

Index of notable functional blocks for developer navigation. Add a short description here when introducing new blocks.

---

## Home page

**Page:** `src/index.html` → `/`

“Design at Modulate” — the site root. A short intro describing what lives on the site (design system reference, the “By Design” blog, prototypes, tools), followed by a promo grid of teaser cards (`.home-promo`, styles in `src/styles/service/home.css`, script `src/assets/service/home-promo.js`). Extends `service/layout.html`. The design-system documentation itself lives at `/design-system/` (`src/design-system.html`, formerly the root page).

Promo grid: two card sizes (full width and 50%, gap `--m__gap-xl`), two behaviors. One-big-link cards (`.home-promo__card--link`) navigate as a whole — either an `<a>` card or a `[data-promo-link]` block with JS click delegation (inner hovers work, clicks are unified, `preventDefault` keeps showcase controls from changing state); the posts card holds several independent links. Cards: selected blog posts (three `posts-list` columns under one shared title), palette (the Icon Studio background-dropdown composition, 5:4, populated by home-promo.js from `--m__color-*` tokens with the same family order/exclusions), 3D icons (3×2 `data-model-icon-3d` home-mode grid on a `slate-900` plaque, needs the icon-3d importmap + `model-icon-3d.js` module included at the end of the page), components (2:1, a flex-wrap brick cluster ~70% plus a static copy of the playground Detection sidebar chunk ~30%; sidebar links and option-list items are `<span>`s so the card has a single click zone), typography specimens, and the Page composition illustration (`service/ui-arch-diagram-layout.html`) linking to `/ui/`. The home 3D icon slots use their own classes (not `.docs-icon-row__item`) because `docs-icon-copy.js` binds click-to-copy to that class globally. Fingerprints and infographics cards are planned but not built yet.

---

## Tools section

**Pages:** `src/tools/index.html` → `/tools/`; `src/tools/icon-studio.html` → `/tools/icon-studio/`; `src/tools/modulate-fingerprint.html` → `/tools/modulate-fingerprint/`; `src/tools/scatterplot.html` → `/tools/scatterplot/`; `src/tools/velma-fraud-demo-widget.html` → `/tools/velma-fraud-demo-widget/`; `src/tools/charts.html` → `/tools/charts/`; `src/tools/online-docs/*` → `/tools/online-docs/*`; `src/tools/square-element.html` → `/tools/square-element/`.

Working tools around the design system, grouped on the index into three lists: **Studios** (screenshot sandboxes — Icon Studio, Modulate Fingerprint), **Builders** (constructors — Scatterplot: responsive/screenshot preview of `#conv-scatter` with JSON export/import; Velma Fraud Demo Widget), and **Documents** (technical documents — Chart.js Integration, direct links to the two online-doc case studies, plus “There has to be a square element”, moved from the blog with no redirect). The index reuses the blog-index list pattern (`posts-list`, `posts-list-col-title`).

---

## Blog section

**Pages:** `src/blog/index.html` → `/blog/` (“By Design”)  
**Individual posts:**

- `src/blog/layers.html` → `/blog/layers/` — April 6, 2026 — What the System Is Made Of (table of the five layers with live token and component examples, `.layers-table` in `blog.css`)
- `src/blog/page-composition.html` → `/blog/page-composition/` — April 7, 2026 — The Page Composition Rule
- `src/blog/layouts.html` → `/blog/layouts/` — April 13, 2026 — Time as the Main Axis (includes “Part 2. Mobile Responsiveness Out of the Box” and “Part 3. Adjusting the Type Scale”, formerly separate posts at `/blog/mobile/` and `/blog/type-scale/`, merged with no redirects)
- `src/blog/graphic-style.html` → `/blog/graphic-style/` — June 8, 2026 — Why Have Your Own Graphic Style
- `src/blog/color.html` → `/blog/color/` — June 18, 2026 — Color Under a Purple Lightbulb (embeds the palette-lamp figure)
- `src/blog/icons.html` → `/blog/icons/` — July 7, 2026 — Five Requirements for Icons
- `src/blog/fingerprints.html` → `/blog/fingerprints/` — placeholder page, no date or text yet
- `src/blog/not-a-designer.html` → `/blog/not-a-designer/` — 30 Jul 2026 — Why You Can’t Seriously Say “I’m Not a Designer” (standalone, by Ilya Sinelnikov)

**Includes:** `src/includes/service/post-meta.html` — the meta line above each post title: “← Blog” link (overridable via `backHref`/`backLabel`), author(s) with round photos, date (`postDate` Nunjucks variable; the whole author/date block is omitted when neither `postDate` nor `postAuthor` is set, as on the Fingerprints placeholder; `postAuthor` + `postAuthorPhoto` replace the default Eugene Arutyunov; optional `postCoAuthor` + `postCoAuthorPhoto` add a second author).  
**Author photos:** `src/assets/images/authors/` (square JPEG).  
**Styles:** `src/styles/service/blog.css` — `.post-meta` (meta line, `.post-meta__photo` round avatar), `.posts-list` (plain column of `.posts-list__item` rows on the index: bold title link with a `.posts-list__caption` date or “Soon” running inline right after the title), `.posts-list-col-title` (uppercase semi-mono column titles, after `models-nav__col-title`, no rule line), `.layers-table` (layers post: token stacks and live components inside table cells), `.read-next` (full-width `m__button-primary-outline` at the end of a post), `.navbar-blog-row` (homepage row that places the blog link next to `ids-navbar`).  
**Navigation:** linked from `src/includes/service/nav-island.html` as “Blog”, from the design-system page next to `ids-navbar`, and from the docs header (`src/includes/service/header.html` renders “Home”, “Design System”, “Blog”, and “Tools” on every DS page; the current page is plain text, not a link).

Blog for design system development history. Each post is a standalone page extending `service/layout.html`, with the post-meta include above a `h1.loud` title (Gothic display font, same as the design system main page); the spacer before the meta line is `m__space XL` everywhere, matching the homepage (the header itself carries no bottom margin). Posts end with a “Read next” full-width outline button (`a.read-next`: regular-weight label, bold post title) — the next post in the series, or the next by date for standalone posts (the Icons and Fingerprints posts have none yet). The index (titled “By Design”, `h1.loud`) groups posts into three columns (temporary launch navigation, forward chronological order): System Foundations Series and Graphic Style Series, and Recent posts. Unpublished posts carry a “Soon” caption: Fingerprints is unlinked, “I’m Not a Designer” (standalone, out of the Graphic Style series) is written and linked; the Typography post was cancelled. “There has to be a square element” moved to the Tools Documents list (`/tools/square-element/`, uses `backHref`/`backLabel` on the post-meta include). Dates are short captions running inline after the title (`6 Apr`; the year appears only when it isn’t the current one).

---

## Theme toggle

**Script:** `src/assets/service/theme-toggle.js`  
**Styles:** `src/styles/service/theme-toggle.css` (shared control).  
**Used in:** `src/includes/service/header.html` (prototype popover toggle), `src/includes/service/nav-island.html` (DS pages), `src/includes/prototypes/layout.html` (script tag), `src/includes/service/layout.html` (script tag).

Switches between light and dark theme. Supports multiple `.theme-toggle` elements at once. The storage key is taken from `body[data-theme-storage-key]`, which keeps prototype pages and design-system pages independent (`prototype-theme` vs `design-system-theme`). The initial theme is applied by a small inline script right after `<body>` in layouts so the correct theme is set before first paint (avoids flash). Landing pages (docs, pricing) are intentionally light-only and have no theme toggle.

---

## Navigation island

**Markup:** `src/includes/service/nav-island.html`  
**Styles:** `src/styles/service/nav-island.css`  
**Script:** `src/assets/service/nav-island.js`  
**Used in:** `src/includes/service/layout.html`, `src/includes/prototypes/layout.html`, `src/includes/prototypes/landing-layout.html`, `src/includes/prototypes/auth-layout.html` (without the theme toggle).

Fixed-position element in the bottom-left corner of every page. Hidden by default; the Option-N hotkey (`event.altKey` + `event.code === 'KeyN'`, ignored while typing in a field) toggles it, and the × button hides it. The open state is kept in `sessionStorage` under `nav-island-open` (`1` = open), so the island survives navigation within the tab; a small inline script in the include restores it before first paint, and `nav-island.js` owns the hotkey and buttons. Contains links for cross-navigation between the home page (`/`), design system (`/design-system/`), blog (`/blog/`), tools (`/tools/`), login (`/auth/login/`), dashboard (`/dashboard/home/`), playground (`/playground/velma/`), and UI Scheme (`/ui/`). The include also renders the theme toggle (controlled by the Nunjucks variable `islandThemeToggle`).

---

## Prototype notice banner

**Markup:** `src/includes/prototypes/prototype-banner.html` (markup + inline dismiss script)  
**Styles:** `src/styles/prototypes/banner.css`  
**Used in:** `src/includes/prototypes/layout.html`, `src/includes/prototypes/landing-layout.html`, `src/includes/prototypes/auth-layout.html` (before the header / auth columns).

Full-width yellow band (`--m__bg-highlight` yellow, `slate-900` ink) at the very top of every prototype page: “This is a design prototype — the real product lives at platform.modulate.ai”, with a × button on the right. Rendered `hidden` and un-hidden by the inline script before first paint unless the `prototype-banner-dismissed=1` cookie is set; the × sets that cookie for a year (`path=/`), so dismissal sticks across all prototype pages. Not used on design-system pages or the online-doc case studies.

---

## Prototype internal nav toggle

**Script:** `src/assets/prototypes/prototype-internal-nav-toggle.js`  
**Markup:** `src/includes/prototypes/dashboard-nav-macros.html` wraps `/internal/…` links in `.prototype-internal-nav`.  
**Styles:** `src/styles/prototypes/layout.css` (`body.prototype-hide-internal-nav` hides that wrapper); `src/styles/service/footer.css` (`.footer-prototype-tools__switch` matches the theme-toggle look).  
**Used in:** `src/includes/prototypes/layout.html` and `src/includes/prototypes/landing-layout.html` (inline class restore from `localStorage` before paint + script tag), `src/includes/prototypes/footer.html` (the switch sits in the bottom `.footer-nav` row next to the copyright and legal links). The script always syncs `body.prototype-hide-internal-nav` from storage even when the current page has no internal nav links (e.g. landing). The switch label is a `<label for="…">` so the text toggles the control too.

The footer bottom row contains the **Internal admin links** switch (same pill control as the theme toggle, but not using the `.theme-toggle` class so `theme-toggle.js` does not bind to it), pushed to the end of the row via `margin-left: auto`. State persists in `localStorage` under `prototype-internal-nav-hidden` (`1` = hidden). Default is links visible (`aria-checked="true"` on the switch). On dashboard pages (`page.url` starts with `/dashboard/`) the footer renders as `.footer--minimal` — the top columns (logo, blurb, contact) are hidden and only this bottom row is shown.

---

## Header user menu

**Script:** `src/assets/prototypes/header-menu.js`  
**Markup:** `src/includes/service/header.html` (user trigger + popover), `src/includes/prototypes/dashboard-nav-macros.html` (shared nav macros consumed by the header popover and sidebar).  
**Styles:** `src/styles/prototypes/header.css` (`.prototype-header__user-*`, `.prototype-header__popover*`).

Dropdown menu: trigger shows user name + chevron; click opens popover. Account and organization lines and the full dashboard/internal link list come from the same Nunjucks macros as the desktop sidebar (`dashboard_nav_meta`, `dashboard_nav_main`). On viewports under 768px, `.prototype-header__popover-nav` also renders the primary header links (Conversations, Playground, Docs, Dashboard) ahead of that list, matching the hidden top bar. Appearance + theme toggle and Log out follow. Popover aligned to right, below trigger with gap. Close on outside click or Escape. Theme toggle in popover and in header both bound by theme-toggle.js.

---

## UI structure visualizer

**Script:** `src/assets/service/ui-visualizer.js`  
**Data:** `src/service/ui.yaml` with two root keys: **current** (product) and **target** (prototype for this repo). Each is an array of routes; every section is a node `section:` with **widget**, **widgets**, or **text-content**. Optional per route: **title_deprecated** (string) — shown struck through before **title** in the Route column when set.  
**Page:** `src/service/ui.html` (UI Architecture).  
**Styles:** `.ui-viz` + `.ui-viz__*` in `src/styles/service/ui-visualizer.css`.

Loads YAML → `normalizeUiData()` → `renderUIStructure()`. Renders three columns per row (Route title, Current, Target). Static diagram: `src/includes/service/ui-arch-diagram.html` (`<aside class="ui-arch-diagram">` with both columns), `ui-arch-diagram-structure.html` (left: route + list), `ui-arch-diagram-layout.html` (right: 4 section blocks). Full diagram on `src/service/ui.html`; index uses only the layout include inside `<aside class="ui-arch-diagram ui-arch-diagram--layout-only">`. Grid and `min-height` are in `ui-visualizer.css`; surface, padding, and radius come from the shared prose `aside` rule in `page-composition/wrappers.css`.

---

## Shared text content styles

**Styles:** `src/styles/components/text.css`

Global tag-level styles for prose elements: headings, paragraphs, links, inline code, lists, and preformatted blocks. Rules apply to bare HTML tags and cover the entire page; no wrapper class is required. Also defines `.caption` — secondary/meta text at `--m__font-size-s` with `--m__text-caption-color`; links inside use the same text color with an underline and `--m__text-hover-color` on hover (same timing as default links).

---

## Design system main page layout

**Styles:** `src/styles/service/ds-main-page.css`  
**Scripts:** `src/assets/service/docs-icon-copy.js` — click on a Graphics → Icons tile copies a standalone SVG (resolved fills) to the clipboard.  
**Used in:** `src/design-system.html` (e.g. Graphics → Icons `.docs-icon-row`, Animations `.docs-animation-samples`).  
**Bundle:** `src/css-bundle.njk`.

Section-specific layout for the long design-system page (`/design-system/`); kept separate from `color-palette.css` (swatches and emotion showcase).

---

## Palette lamp page

**Page:** `src/service/palette-lamp.html` → `/palette-lamp/`  
**Figure include:** `src/includes/service/palette-lamp-figure.html` (tiles data + stage markup; shared by the page and the Color blog post)  
**Styles:** `src/styles/service/palette-lamp.css` (including the `.palette-lamp-embed` variant for in-post embedding)  
**Script:** `src/assets/service/palette-lamp.js`  
**Graphic:** `src/includes/assets/palette-lamp.svg`  
**Bundle:** `src/css-bundle.njk`.

Light-only standalone illustration page. Left side shows primitive palette colors as one continuous five-column grid, grouped in palette order and sorted dark-to-light within each group. The grid uses the design-system palette while the lamp is on, then switches to a more neutral comparison palette when the lamp is off. Right side shows a minimal inline SVG fluorescent lamp with CSS-driven `purple-500` glow; the checkbox below it toggles the `.is-on` state. The figure itself lives in the include and keeps its own light context, so the embedded copy on `/blog/color/` stays light in the dark theme.

---

## Docs chrome (navbar + footnotes)

**Styles:** `src/styles/service/ids-navbar.css`, `src/styles/service/ids-footnotes.css`  
**Scripts:** `src/assets/service/ids-navbar.js`, `src/assets/service/ids-footnotes.js`  
**Bundle:** included from `src/css-bundle.njk`; `main.js` imports the scripts on design-system pages (`service/layout.html`).

Segmented docs nav (`ids-navbar` / `ids-nav-item`) and footnote popovers (`ids-footnote-link` / `ids-footnote`). The footnote `<aside class="ids-footnote">` resets the shared prose `aside` styling from `page-composition/wrappers.css` inside `footnotes.css`. Class names keep the `ids-` prefix for historical reasons; there is no page-level `.ids` wrapper.

---

## Interaction timing tokens

**Styles:** `src/styles/tokens/animations.css`.

Shared timing tokens for hover behavior. The system defines instant hover, animated unhover, and shared easing as tokens, while leaving the exact transitioned properties up to the component author.

---

## SVG icon sprite flow

**Source:** `src/assets/images/svg-icons-source/*.svg`  
**Build script:** `scripts/generate-svg-sprite.js`  
**Generated include:** `src/includes/service/svg-icons-sprite.html`  
**Usage docs:** `src/assets/service/SVG-ICON-SPRITE.md`.

Raw SVG files are normalized into one hidden sprite include. The generator removes internal SVG styles and presentational attributes, drops helper shapes with `fill: none`, assigns symbol ids from filenames, and sets icons up for `currentColor`. Layouts include the sprite globally, and icons are rendered via `<use href="#icon-name">`.

---

## 3D model icon flow

**Sources:** `src/assets/images/svg-icons-3d-source/*.svg`  
**Layer maps:** `src/assets/images/svg-icons-3d-source/layers/*.layers.json`  
**Build script:** `scripts/generate-icon-3d-manifest.js`  
**Generated data:** `src/assets/service/icon-3d/icons.json`  
**Renderer:** `src/assets/service/icon-3d/model-icon-3d.js`  
**Import map:** `src/includes/service/icon-3d-importmap.html`  
**Styles:** `src/styles/components/model-icon-3d.css`, `src/styles/service/icon-studio.css`  
**Icon Studio:** `src/tools/icon-studio.html` + `src/assets/service/icon-3d/icon-studio.js` → `/tools/icon-studio/`  
**Usage docs:** `src/assets/service/ICON-3D.md`.

Browser-rendered model icons use Three.js to extrude SVG shapes into rounded white tiles. The 3D source flow is separate from the flat sprite: prepared 3D SVGs take priority, and the existing flat SVG source acts as fallback for icons without a dedicated 3D drawing. Virtual layers come from `data-3d-layer`, sidecar `shapeLayers`, or base layer `0`; `shapeLayerSpans` lets a shape occupy multiple glyph-depth layers. Runtime settings live in the renderer’s `CONFIG` sections: shared `glyph` and `shadow`, plus per-context `light` and `view` values. Pricing renders individual front-facing tiles with scroll pitch; auth renders the whole overlapping row in one canvas/scene while the existing hover zones keep controlling `data-stack-focus`; `home` mode drives the 6-per-row grids on the design-system page and `/blog/icons/` with canvas bleed into the grid gaps. Icon Studio (`/tools/icon-studio/`) is the screenshot workbench: one icon on a full-width stage with aspect and base-palette background controls, a 2D light pad, cursor orbit with click-to-capture pose, and an optional oscillating rotation.

---

## Modulate Fingerprint tool

**Page:** `src/tools/modulate-fingerprint.html` → `/tools/modulate-fingerprint/`
**Scripts:** `src/assets/service/fingerprint/fingerprint.js` (generator + renderers), `src/assets/service/fingerprint/fingerprint-studio.js` (page wiring)
**Styles:** `src/styles/service/fingerprint-studio.css` (control chrome reused from `icon-studio.css` via the shared `icon-studio` class on `<main>`).

The fingerprint studio: title and formal description, an Icon-Studio-like control panel above the fingerprint rendered directly on the page background (full container width, no stage plate; the Theme radios switch the player only, via frame-level `dark-mode`/`light-mode` classes plus `fp-theme-light` restating the `--ids__*` light values — dark by default, independent of the page theme; the studio also zeroes `--emotion-color-*` timings so re-renders don't replay the playground color fade), then an illustrated text in two sections. The conversation is generated data (`generateConversation`: turn-taking with two strongly dominant leads (the more speakers, the stronger the skew), long conversations growing monologues and longer clips (`longFactor`), neutral-heavy emotional arcs on the emotion groups from `tokens/colors.css`, behaviours on roughly every ~8th clip (hostile clips first, tense ones fill in), equal-window detection layers, optional per-speaker `biases` pinning emotion groups for curated examples; mulberry32 PRNG, so fixed seeds render identically) and can be exported/imported as JSON (`format: "modulate-fingerprint"`, v2 wraps the conversation together with the whole settings STATE). The renderer reuses the playground player dataviz markup and styles from the bundle (`.pg-player-dataviz`, `.transcript-clip emotion-*`, `.media-box#audio-player`, behaviour kiki glyphs — buba is retired); standalone instances get their height from the playground override (`--speaker-count × 3rem` strips); amplitude bars sit on the bottom of each lane; derived formats (equal windows, amplitude bars, speak-time bar, minis) use own `fp-*` classes. Hovering a clip (its whole vertical zone — clip nodes are full-height) shows captions: the emotion name in the emotion's color (instant in, fade out via the `.visible` transition switch) and a line of the fake transcript. With the player the emotion name sits to the left of the total time (an `fp-emotion-caption` span inside `.player-total-time`, flex row anchored right) and the transcript goes into the player's `clip-text-caption` slot (capped at 40% width, dissolving into the strip bg before the play button); without the player there is no transcript and the emotion name moves to an `fp-emotion-strip` below the rounded container, left-aligned, fixed-height so hover doesn't shift layout — both gated on the Emotions option. The generator gives every clip a `text` (stitched from `TRANSCRIPT_CHUNKS`, word count follows the clip duration). Controls in three columns: Conversation (mode Transcript/Detection; for transcript: speakers 1–7, a Speaker labels checkbox, a comma-separated names textarea prefilled with diverse defaults (John, Mary, Priya, Diego, Yuki, Amara, Viktor) — all hidden in detection), Display (player Theme first, length 1–20 min, width 50–100% of the container, then Emotions/Behaviors/Amplitude/Player checkboxes in one non-wrapping row), Data (Regenerate, Export/Import). The segmented controls use the DS component with the compact `S` variant added to `components/segmented-control.css` (smaller paddings, fixed xs type); the panel narrows the icon-studio label column to 3.4rem, top-aligns row labels, and adds 0.55rem between rows. The text part: “The base format” walks through the first-paragraph ideas, each illustrated by a preconfigured renderer instance (`[data-fp-demo]` + the `DEMOS` map in the studio script — player, standalone, single speaker, five speakers, bare clips, emotions + behaviours), then three icon tiles copied verbatim from the design-system Graphics → Icons row (`docs-icon-row`, `#emotions`/`#deepfake`/`#voice-match`, click-to-copy works via the shared layout script), a miniatures-in-a-table row (short conversations with per-speaker biases matching the titles; the longest bar leaves room for the duration label) and a brick-wall sample (`fingerprint-studio__bricks`: twenty label-less minis at exactly the table scale, flex-wrap flow with slightly roomier gaps). “Derived formats” is illustrated by a detection-mode demo, a speak-time bar built as a real player-component instance (`fp-speaktime`, per-segment hovers work, caption is just the share percent) and an amplitude demo, closing on the brand-imagery disclaimer. Every illustration gets an `m__space M` before and a doubled `m__space L` after (XL after the bricks, before the next section heading); demos are capped at the table width (640px). All renderer illustrations (the eight demos and the speak-time bar) carry a hard `dark-mode` class, so they stay dark regardless of the page theme. The old “Scale” heading is gone. The `fp-mini` plate is painted in the opposite theme (gray-900 on a light page, gray-50 in dark mode).

**Technology comparison** (added for the Velma LLM Battle, documented here with two live demos in “The base format”): lanes can be technologies instead of speakers — the same call analyzed by two engines, each lane with its own transcript variant (segmentation, timings and recognition differ, so the clip structures never match). The renderer supports it through generic per-clip hooks (`clip.classes`, optional `clip.emotion`, `clip.behaviourClasses`, `clip.behaviourModal`, `clip.behaviourAtSec`) plus a container `className` option (`fp-cmp` restyles the lane labels: no plate, lane 1 white, lane 2 dark gray, lifted in dark mode — anchored via `.pg-player-dataviz` to outweigh the later playground canon) a `laneHover` option (clip nodes confined to their own lane, so each lane hovers independently — a comparison-mode trait; the default keeps the full-column hover zone) and a `hoverCaptions` option (default true; false drops the hover transcript/emotion captions entirely — used by the selected-signal comparison players); player-less fingerprints with captions on grow a caption strip below the plate (transcript line left, emotion name right — the same pair the player chrome shows). The comparison looks live in `styles/prototypes/player.css` (“Technology comparison” section): stack-lane grays are theme-aware props on `.media-container` (`--fp-cmp-quiet-tech` gray-100 / dark gray-800 — one step off the player-bottom surface so the lane never merges with the chrome; `--fp-cmp-hit` exactly one palette step towards contrast — gray-200 in light, gray-700 in dark), `clip-guess` translucent guessed emotions, `clip-quiet` neutral for the heard lane's non-signal clips, and `clip-hit` on **every glyph-carrying stack clip** — the glyph is a catch (`behaviour-indicator--tech`) or a false positive (`--false`, red kiki — the clip fill stays gray); a miss simply leaves the lane quiet (the ghost glyph was retired as unreadable). Comparison glyphs are 1.5× the canon size and pulled further out of the clip's bottom-left corner (`.fp-cmp` indicator override); nuanced hairline separators (mixed from the same props) only where same-color clips touch. Comparison lanes are gapless: chunks butt against each other and both lanes span the full `durationSec` (no empty tail). Demo data in `buildComparisonDemo()` (fingerprint-studio.js), registry entries `comparison` / `comparison-signal`.

---

## Velma Fraud Demo Widget

**Page:** `src/tools/velma-fraud-demo-widget.html` → `/tools/velma-fraud-demo-widget/`; also mounted as the closing "base format" illustration on `/tools/modulate-fingerprint/` (default data, `{ keyboard: false }` so the docs page keeps Space/arrows)
**Scripts:** `src/assets/service/velma-fraud/velma-fraud-widget.js` (self-contained classic-script widget, `window.VelmaFraudWidget.mount(root, data, options?)` — the only global; no element ids, so it coexists with the fingerprint studio's `#audio-player`: the strip subset the playground keys on that id is restated class-scoped in the widget styles), `velma-fraud-studio.js` (page wiring: mount, JSON import/export, HTML export), `velma-fraud-config.js` (default conversation data converted from the prototype events JSON, with curated per-utterance emotions and per-signal meter weights)
**Styles:** `src/styles/service/velma-fraud-widget.css` (bundle: studio stage + widget on DS tokens), `src/assets/service/velma-fraud/velma-fraud-embed.css` (standalone export styles with baked dark-theme values, not linked on the site)
**Audio:** `src/assets/service/velma-fraud/velma-fraud-demo.mp3` (~1 MB sample call, passthrough copy).

Interactive fraud-call demo for the Webflow site: the prototype widget rebuilt on the canonical fingerprint player and the playground's visual language. The plate is hard dark-mode (the `dark-mode` class on the root resolves `--m__*`/`--ids__*` tokens), borderless with the widget-radius (the `.m__widget` canon); the timeline is `.pg-player-dataviz` with `transcript-clip emotion-*` lanes (Caller/Agent), kiki behaviour glyphs placed at their signal times (outline colored by the clip emotion active at that moment), the canonical hover captions (emotion name left of the total time as `vf-emotion-caption`, transcript line in the repositioned `clip-text-caption`), the playground hover line, plus a playhead. Playback is real: the mp3 drives the clock (`Audio` + `canplaythrough`), falling back to a simulated rAF clock; everything is a pure `render(t)` and recomputes on seek (space/arrows on the keyboard). The whole plate is one play/pause control (`cursor: pointer` on the root): a starting click on the fingerprint begins playback from that spot, a pausing click never moves the position, and interactive entries (bubbles, signal rows) carry their own actions without toggling; the play button keeps its own hover (white icon, scale up — instant in, eased out). The story starts from zero knowledge: the resting player is an empty fingerprint (inset `1.1em` from the plate edges), the first clip lands as neutral on play, each clip takes its emotion color once it resolves (at its emotion signal, else ~2.5s in — transcript emotion names and header behavior tags fade in on the same clocks), speaker labels (text-only, top-left of their lanes) appear at their identification signals, and clips butt against each other (config `endMs` = next `startMs`). Behaviour kiki glyphs are a step bigger (1.3em) and sit in the bottom-left corner of their clip — the same clip the transcript pins the behavior to. The top bar is the widget's own headline — one big line, bold lead + regular caption tail. The feed panels are `overflow: hidden`, so the wheel always stays with the page; their scrollTop is driven only programmatically (eased per frame) from: the cursor's Y over a panel (top — start of the feed, bottom — end), the cursor's X over the fingerprint (scrolls both the transcript and the signal feed — the same data rotated 90°; the mapping counts only the revealed part of the timeline and is re-applied by `render`, so a newly revealed clip recomputes the positions), the playback autoscroll (pins the feed to its very end, so the newest entry sits above the list's bottom padding; yields while the cursor holds a panel), and signal clicks (center the evidence utterance). The resting state — cursor away — returns a feed to its end. Pending feed entries take no space (`display: none` + `@starting-style` fade), so the scrollable extent covers only revealed content; the panel heads scroll away with their feeds. Clip and bubble hovers are linked both ways (timeline clip ↔ transcript bubble). The blocks speak the DS voice: eyebrow labels are the canonical semi-mono/regular/uppercase/0.06em pattern, numbers are sans + `tabular-nums` (no mono in the widget), tags are `m__tag`/`m__tag-flat` geometry (near-rectangular, `color-mix` borders/fills) — the DS rem tokens are restated as 1:1 em equivalents so the widget scales from its em base (rule documented in the CSS header). The transcript is the canonical `pg-transcript-utterance`: squircle bubbles alternating shoulders by role (Caller left, Agent right), semi-mono header (time · speaker · behavior · emotion), the emotion name colored via an inline `--ec` (set from JS as `--emotion-*-RGB`, so it works in the embed where the playground `ec-*` classes don't exist), the active bubble highlighted neutrally (`--m__border`, overriding the canon's emotion tint). Behavior signals surface in their utterance headers as `m__behavior-link S` entries (inline kiki as the icon, solid currentColor, gradient underline) with confidence percent — pinned to the last utterance of the signal's speaker that started before the signal; clicking one seeks to the signal moment, clicking a bubble seeks to its start. The signal feed rows carry an `m__tag-flat`-style kind tag in the kind's accent (language → calm, speaker → low-energy, deepfake → attack red, behavior → excited orange, emotion → the emotion's own color), `pg-confidence-cell`-geometry bars, and act as evidence links: clicking a signal scrolls the transcript to its utterance and flashes the review-report blue highlight (`is-evidence-highlighted`). The fraud risk lives in the third, narrowest feed column (`vf-risk`, grid 1/2 + 1/3 + 1/6 with transcript and signals): a vertical meter filling bottom-up in the state color (caption-white → warn orange → white), the threshold as a translucent dashed white line, the "Fraud risk" eyebrow head always on top, the live percent mid-column, and the verdict line ("Account takeover pattern · 94%") plus compact action tags ("Suspected fraud", "Manual review", state-colored `m__tag`s) revealing at the bottom (no layout space while hidden: `display: none` + `@starting-style`). Past the threshold the whole plate turns bright red (`vf-critical` on the root → `--m__color-red-600`) — which is why everything above the plate (top bar, transcript, signals, risk column; the canonical player and the emotion palette are the exceptions) paints in **grades of white**: local `--vf-*` alphas approximating the dark-theme tokens on the default bg (text 0.66, caption 0.45, border 0.2, surface 0.05, hover 0.18, separator 0.08 — documented at the top of the widget CSS), so the same values read on both grounds. The signal feed is a four-column table row — time · kind tag · label · confidence number — with thin horizontal separators only (no verticals, no confidence bars). Kind tags come in two looks: neutral (white text, thin white border — language/speaker/emotion) and suspicious (plus the red-600 fill — deepfake/behavior). The meter is driven purely by suspicious signals: each carries a `weight` in percent points in the config (deepfakes 30/15/10, behaviors 10/8/12/9 — sums to 94, crosses the 85 threshold at the third deepfake, 0:37); `meterKeyframes` is gone from the data. Studio page follows the scatterplot pattern: `icon-studio` panel (Replay; Export JSON / Import; Export HTML) + full-bleed responsive stage (frame 1140px → 100% under 1139px, em base 16px → 14px under 992px, panels stack under 768px). JSON envelope `format: "modulate-velma-fraud-demo"` v1 carries meta/transcript/signals/verdict/actions/meterKeyframes. HTML export builds a self-contained document: inlined `velma-fraud-embed.css` + `velma-fraud-widget.js` + the data as inline JSON (the widget self-mounts from `#velma-fraud-data`) + CoFo Sans Semi Mono regular inlined as a base64 `@font-face` (~58 KB, fetched from the site assets at export time); the mp3 is not embedded — upload it to Webflow assets and point `meta.audioUrl` at it.

---

## Velma LLM Battle page

**Page:** `src/tools/velma-llm-battle.html` → `/tools/velma-llm-battle/`  
**Styles:** `src/styles/prototypes/llm-battle.css` (bundle, after playground.css; `vlb-` prefix).

Design mock (not a working thing) of the battle page: Velma vs one STT+LLM stack on one call, always a duel — the stack's parts are picked in the sidebar. Fixed requirements: modularity works by itself, no toggles (the player is always there — the project has no "plain playground" mode; the strip set = the behaviors selection; the accuracy dashboard appears only when the recording has reference labels — preloaded demos; external uploads keep cost / speed / signal counts); the time-delta correctness criterion lives in the data only — visually a kiki always belongs to its clip (fingerprint gestalt, no offset marks); receipts and the transcript are modal windows (the prototype `modal-behaviors-*` canon via `service/modal-wrapper.njk` + `assets/prototypes/modals.js`), never the general layer; emotions for the stack are an option — "Guess emotions from text" in the stack dialog, off by default; a streaming state is acknowledged but not drawn.

Layout: sales default, no site header (`hideSiteHeader` flag in `service/layout.html`) and no page h1 — the page opens with the collapsed upload plate at canonical heights (no meta counter — `uploadPlateShowMeta = false`; canonical processing animation trimmed to four stages: Transcript → Speakers → Emotions → Behaviors). The Behaviors picker lives in the upload plate header, following the Playground `uploadPlateOptions` / `pg-velma-setup` pattern: a kiki “Set up behaviors” link followed by the plain “N behaviors” summary and backed by the dashboard `m__popover` / `m__popover-item` menu with DS primary checkboxes; its summary and item list are regenerated per selected recording, checked = the strips on the page. While open, the upload section and popover rise to z-index 1000 / 1001 so the menu paints above the player and surrounding content. Sidebar contains STT + LLM only — two dashboard secondary-outline `m__menu-button` model pickers backed by hidden native selects, each under its own semimono STT / LLM heading; their compact geometry, medium-weight value and dark chevron stay unchanged while the frame uses the quiet DS one-pixel secondary-outline treatment. The chevron sits at the matching `0.5rem` S-control inset, and text / chevron / border enter hover / focus / open with the DS instant token and leave over the DS 0.5s ease token. Their menus reuse the dashboard report-item selected row, bold label and checkmark treatment. A full-width, `font-size-s`, medium-weight secondary-outline “System prompt” button uses the same `radius-m` as the model fields and opens the prompt modal (`modal-behaviors-edit` canon: a primary `font-size-l` intro separated from the autogrow textarea by `spacer-m`, the full invented prompt incl. `{{stt_model}}`/`{{selected_behaviors}}` placeholders, Restore default / Cancel / Save footer), and the primary “Show emotions” checkbox preserves the medium label while its unchecked one-pixel frame uses the same quiet secondary-outline color as the fields and button; on whole-label hover both label and frame adopt the link color with the same instant-in / 0.5s-out timing, while checked remains accent. It re-renders the shared and signal players live. Per-behavior blocks are headed by plain h3 (no kiki links). The content-width, compact secondary-outline Transcript button matches the System prompt type/radius treatment and lives inside the shared player's chrome on the hover-transcript line's spot (JS re-adopts it after every render and repoints its `data-modal-open` at the current recording's transcript modal). Transcript and emotion captions appear and disappear instantly; the button disappears instantly with them but eases back over the DS 0.5s ease token. The current/hover time, transcript, emotion, total time and button share one `top: 50%` chrome centerline; the renderer's redundant static `.player-start-time` is hidden here so only the live position caption supplies `0:00`. The left time inset adds `0.6em` to `--padding`, matching the measured right inset; the left time/transcript group gets a `0.02em` optical lift to match the right baseline. Button and caption share a font-independent `3.14rem` left inset, so they swap at exactly one X-position and both sit one canonical `0.6em` gap after `0:00`, matching emotion → total time on the right. The caption is capped at the canonical 40% width and dissolves through a three-em gradient into the actual `bg-surface` immediately before the central play button. The hover line itself needs a page-scoped re-anchor: the canon positions `.clip-text-caption` against an in-box visualization the comparison player doesn't have (its dataviz is a sibling), which collapses the line to zero height — `llm-battle.css` re-anchors it into the chrome row on the button's spot. Receipt excerpts carry `m__behavior-link` chips on rows whose clip holds a detection (generated and handcrafted alike), and the verdict line keeps a `gap-m` of air above. The playground upload plate no longer carries a `margin-top` — the header gap is an explicit `m__space S` in `playground-layout.html`. Both the shared player and the per-behavior strips are rendered by `fingerprint.js` in the technology-comparison variant (see the Modulate Fingerprint tool section): agent lanes with genuinely different segmentation per lane (Velma — utterance clips with heard emotions; the stack — finer gapless VAD chunks with STT-flavored lowercase texts and emotion divergences when guessing is on), per-lane hover (`laneHover`), kikis anchored to the bottom-left corner of their clip (the renderer default — `behaviourAtSec` is deliberately not used: a mid-clip position let the enlarged comparison glyphs visually drift into the neighboring clip; the signal's exact moment lives in the receipt), every kiki a `data-modal-open` entry into its receipt modal. The stack lane paints by one rule everywhere: `clip-quiet-tech` base, `clip-hit` one-step-off highlight on every flagged chunk, translucent guessed-emotion color (`clip-guess`) when the toggle is on. Detection facts live in the chunk data (`behaviour`, `modal`, `false: true`), so kikis read identically on the shared player and in the strips — the red `--false` outline included; no ghost glyphs — a miss leaves the lane quiet. After the strips comes the dashboard: a pure-CSS scatter — efficient corner as a blurred gradient blob (the scatterplot tool's exact `rgba(0,255,0,.3)` + blur recipe), three balanced quadrant captions, middle-aligned axis captions “Flag accuracy” / “Threats caught” (the X one inside the plot), name-only dot labels (the stack dot labeled from the two sidebar selects, live) — and the metric pile of cards where each metric is two horizontal bars (Velma in `--m__success`, stack gray, the false-alarm bar red). Degradation rule: external uploads keep cost / speed / signal counts only. Headless-screenshot caveat: toggling the theme class after load freezes `transition: color` mid-flight under `--virtual-time-budget` — set the theme via localStorage (`design-system-theme`) before first paint instead.

**Four preloaded recordings, really switchable.** All data lives in the `CALLS` registry in the page's module script: per recording — Velma clips (`s/e/sp/emotion/text` + detections), stack chunks (gapless, `guess`/`behaviour`/`false`/`halluc`), the strip roster, the dashboard (scatter dots + card bars) and the receipts. Picking an item in the “Stream demo” menu (four items, `data-vlb-call`; the plate releases its `overflow` clip via `:has(... [data-open="true"])` while the menu is open, since four items don't fit the canonical plate height) collapses the plate back to `uploaded` (the menu click also stops propagation — the plate's own handler would re-expand it) and re-renders everything: shared player, strips (generated `.vlb-battle` blocks), dashboard, sidebar. Default is the **Everyday scenes** reel; the original **Harborview Bank** call is the fourth item (its receipts and transcript stay handcrafted Nunjucks modals; everything reel-side is generated into the DOM from data at load — receipts, per-reel transcript modals with scene markers, `vlb-utt-l/r` speaker-side alternation, event rows and muted-italic `vlb-halluc` hallucination chunks).

**The three scene reels** (short unrelated vignettes with diegetic sound interludes — movie-style) are built to showcase voice-native signals a text pipeline cannot see; sources: the prosody batch of the master behavior config (real signals: Sarcasm, Smile in the Voice, Accusatory Question, Reluctance, Unvoiced Disagreement, Request or order, Tone Missmatch [sic — config typo]) plus proposed signals from the deeptalk voice-signals brainstorm (`~/deeptalk-signals-brainstorm`), marked with a “Proposed signal” tag in their receipts: Read Not Said, Lost Attempt to Speak, Emphasis Placement, Question with No Room to Answer, Decision Sounds Like a Question, Courtesy Laughter, Swallowed Irritation, Loaded Pause. Each reel gives the stack honest text-visible catches (Inappropriate Speech / Action Plan Created / Future Planning ×2) and — the stack is prompted to search actively, so it over-flags — 2–4 characteristic false alarms per reel, each meaningful within the tech's limits: insult-shaped affection, “kill the old pipeline” as a threat, “order the pizza” as Request or order (surface-form match of a prosody signal), an odometer grievance as out-of-scope Complaints, corporate buzzword density as Unclear Speech, “big fan of the reorg” as Sarcasm (right spot, wrong reason — it was Unvoiced Disagreement), negotiation as Bargaining Manipulation, Monopoly's “I own you” as Harassment, board-game banter as Coercion. Each reel also repeats one behavior at least twice and leads with its strip (mirroring the bank call's Vishing ×2): reel 2 — Tone Missmatch ×2, reel 3 — Future Planning ×2 (both instances text-visible, so the stack honestly catches both). **Sound events**: each interlude is a short clip with `event: true` (~half the length of an utterance — the interludes are beats, not scenes) — on Velma's lane it paints neutral (no emotion was heard) and is marked by its `behaviour-indicator--event` kiki (text-colored outline — a hue no emotion uses); its receipt shows the FSD score vector of the new sound-events model (the Applause receipt carries the exact score list from the reference screenshot: Applause 0.9982, Laughter 0.9455…). The closing **Sound Events strip** (plain h3 “Sound Events”, rendered only for recordings with events) isolates them: Velma's lane quiet except the events, the stack's lane entirely quiet — it detects no sound events, which is the strip's point; the STT's hallucinated text over non-speech (“thank you”, “[music]”, “thanks for watching don't forget to subscribe”, “subtitles by the amara org community”, “♪”, “(crying)”) lives in the shared player, the transcripts and the event receipts' notes.

---

## Prosocial standalone export

**Script:** `scripts/export-prosocial-single-html.js`  
**Command:** `npm run export:prosocial:single`  
**Input:** built `/_site/tools/online-docs/prosocial/index.html` + `/_site/bundle.css` and `src/assets/fonts/*`  
**Output:** `dist-publish/prosocial-single/prosocial.html` + `dist-publish/prosocial-single/fonts/*`.

Builds a publish-ready single HTML version of the Prosocial online doc by inlining `/bundle.css` into a `<style>` tag, removing the favicon link, and copying only font files referenced by CSS into a sibling `fonts` folder.

---

## Dashboard navigation icons

**Markup:** `src/includes/prototypes/dashboard-nav-sidebar.html` (imports macros), `src/includes/prototypes/dashboard-nav-macros.html` (single source for sidebar + mobile menu links), `src/includes/service/header.html` (imports the same macros for the bar and popover).  
**Styles:** `src/styles/prototypes/layout.css`, `src/styles/prototypes/header.css`.

Dashboard page navigation in the prototype uses the shared SVG sprite for page icons. Link targets and order are defined once in `dashboard-nav-macros.html` (`dashboard_nav_meta` + `dashboard_nav_main` with variant `sidebar` or `popover`). The sidebar starts with one caption-style link (organization); the account email link appears only in the header popover. Then dashboard icon links, then internal tool links; the prototype header logo uses sprite symbol `#modulate`. Primary header links are defined in `primary_nav('bar'|'popover'|'landing')`: full bar + popover on signed-in pages; **landing** (`isLanding`, used by the docs and pricing pages) shows only Playground and Docs before Sign in.

---

## Docs page

**Page:** `src/prototypes/docs.html`  
**Permalink:** `/docs/`

Stub page. Uses `landing-layout.html` — unauthenticated header (Playground + Docs + Pricing + Sign in), light theme. A single paragraph pointing to the external documentation platform (`https://docs.modulate.ai/` with a trailing ↗). The former in-repo API docs prototype (models/jobs pages, `docs.js`, the model sidebar) was removed; the prototype landing page (`/index-landing/`) was removed as well — the prototype header brand and “Log out” now lead to `/auth/login/`, matching the product.

---

## Model documentation data files

**Data:** `src/assets/prototypes/data/models.json` — model list with all metadata and example project links.  
**Docs:** `src/assets/prototypes/data/model-docs/{model_identifier}/openapi.yaml` and `quickstart.md` — one directory per model.

Static files committed to the repo; served as-is by Eleventy passthrough copy (`src/assets`). To add a model: add an entry to `models.json` and create the corresponding `model-docs/{identifier}/` directory.

---

## Pricing page

**Page:** `src/prototypes/pricing.html`  
**Permalink:** `/pricing/`  
**Styles:** `src/styles/prototypes/docs.css` (shared with docs)

Public pricing page. Uses `landing-layout.html` — unauthenticated header (Playground + Docs + Pricing + Sign in), light theme. Six tabbed sections via `ids-navbar` / `ids-nav-item`: Velma, Transcription, Deepfake Detection, PII/PHI Redaction, Music & Speech Detection, Language Detection. Each section has an intro paragraph (where applicable) and a feature/pricing comparison table. Transcription uses a 5-column grouped-header table (English Fast Batch/Streaming + Multilingual Batch/Streaming); Language Detection uses a 2-column single-model table. The nav item is called "Pricing" in all three nav variants (landing, bar, popover). Works fully without a backend.

---

---

## Models navigation plaque

**Styles:** `src/styles/prototypes/models-nav.css`  
**Used in:** `src/prototypes/pricing.html` (family columns with tier prices, table layout) and `src/includes/prototypes/playground-nav-sidebar.html` (`.models-nav--vertical` — family groups stacked in the playground sidebar).  
**Bundle:** `src/css-bundle.njk`.

Surface plaque with model links grouped by family (Triage, Analysis, Redaction, Transcription, Detection). Family headers are semi-mono uppercase captions; links carry sprite icons and highlight on hover via `--m__text-hover-color`. The active sidebar link is bold.

**Include:** `src/includes/prototypes/models-pricing-col-headers.html` — mobile-only Batch/Streaming column header row for `--3` pricing tables; hidden on desktop, repeated at the start of each table body and after each group title on mobile.

---

## Playground page

**Page:** `src/prototypes/playground.html`  
**Permalink:** `/playground/`

Placeholder page for the interactive API playground. Uses `landing-layout.html` — unauthenticated header, light theme. Playground link in all nav variants now points to `/playground/` instead of `#`.

---

## Temporary analysis → playground redirects

**Remove by ~2026-07-01** — brief `/analysis/` URLs were shared externally before the playground rename was reverted.

**Include:** `src/includes/prototypes/temp-analysis-redirect.html` — shared `location.replace()` script for redirect stubs.

**Stubs:** `src/prototypes/_temp-redirects/analysis/` — eight minimal pages at `/analysis/` and `/analysis/{velma,redaction,transcription,deepfake,music,ai-music,language}/`, each redirecting to the matching `/playground/…` URL via meta refresh, JS, and a fallback link.

When removing: delete the include, the entire `_temp-redirects/analysis/` directory, and this registry section.

---

## Conversations page

**Page:** `src/prototypes/conversations.html`  
**Permalink:** `/dashboard/conversations/`

Empty placeholder page for conversations. Uses `layout.html`.

**Create page:** `src/prototypes/conversations/create.html`
**Permalink:** `/dashboard/conversations/create/`

Standalone dashboard upload page opened from the Conversations table `Create` action. Reuses the playground upload plate without the Velma `Set up behaviors` header row.

---

## Organization dashboard page

**Page:** `src/prototypes/platform/dashboard/organization.html`  
**Permalink:** `/dashboard/organization/`  
**UI structure:** `src/service/ui.yaml` (`dashboard-organization`).

Dashboard page with sidebar; placeholder sections for organization intro, details, members, and pending invites.

---

## Behaviors dashboard page

**Page:** `src/prototypes/platform/dashboard/behaviors.html`  
**UI structure:** `src/service/ui.yaml`.

Placeholder dashboard page added to use the existing `behaviors` icon and keep dashboard navigation aligned with the available icon set.

---

## Layouts: design system vs prototype

Two separate page wrappers:

- **Design system / docs:** `src/includes/service/layout.html` — docs shell with design-system header/footer, shared styles and scripts. Used by the main design-system pages.
- **Prototype / product pages:** `src/includes/prototypes/layout.html` — product shell with dashboard header, theme script, content block, and shared product footer.

---

## Full-bleed wrapper band

**Styles:** `src/styles/page-composition/wrappers.css` — `.m__wrapper.full-width` is full viewport width with horizontal padding matching `.prototype-header` (`1rem` via `--m__wrapper-full-width-outer-pad`). Child `.m__wrapper__surface` is a full-width panel (`--m__bg-surface-color`, `--m__widget-radius`). Nested `.m__wrapper__inset` uses `width` / `margin-inline` math so its content column aligns with a plain `.m__wrapper` (1050px cap and `0.7rem` side padding).

**Pages:** currently none in the repo (the former API-docs prototype pages used it); the pattern stays available as part of the design system.

---

## Auth layout

**Markup:** `src/includes/prototypes/auth-layout.html`  
**Styles:** `src/styles/prototypes/auth-layout.css`

Standalone two-column layout for auth screens. No dashboard header or footer. Left column: flex-column with logo header, centered form main area, and legal footer. Right column: solid `--m__bg-accent-color` fill, hidden on mobile. Used by all three auth pages.

---

## Textfield component

**Styles:** `src/styles/components/textfield.css`  
**Tokens:** `--m__control-inset-padding`, `--m__textfield-radius`, `--m__textfield-label-size` in `src/styles/tokens/ui-components.css`.  
**Class:** `.m__textfield`

Label + input pair. Label sits above the input. Input uses `--m__ui-control-color` background, `--m__ui-border-color` border, and focus outline via `--m__text-hover-color`. Works with `type="email"` and `type="password"`.

---

## Auth screens

**Pages:** `src/prototypes/platform/auth/login.html`, `src/prototypes/platform/auth/signup.html`, `src/prototypes/platform/auth/reset-password.html`, `src/prototypes/platform/auth/org-select.html`  
**Layout:** `src/includes/prototypes/auth-layout.html`  
**UI structure:** `src/service/ui.yaml` (routes `/auth/login/`, `/auth/signup/`, `/auth/reset-password/`, `/auth/org-select/`).

Four auth screens using `.auth-form` + `.m__textfield` + `.m__button-primary.M`. Sign in has email and password fields. Create account has email only, button "Continue". Reset password has email only, button "Send reset link". Select organization shows an `.m__option-list` of orgs with `.m__tag` role labels, and a form to create a new org with a secondary button.

**OAuth buttons:** `src/includes/prototypes/auth-oauth-buttons.html` — Google (colored), GitHub and Apple (monochrome `currentColor`). Included on sign-in and create-account pages.

**Models panel (right column):** `src/includes/prototypes/auth-layout-models-panel.html` — centered promo block (`max-width: 22rem`) with h1 and a single overlapping icon row spanning full promo width (overlap from icon count and size). The row lists every available model tile; the **`data-model-icon-3d-icons`** attribute on **`.auth-layout__icon-stack`** is the default-set config (space-separated `data-term` values; icons missing from the list are hidden). **`.auth-layout__promo-status`** shows a caption only while an icon is hovered (**`data-stack-focus`**); no icon is active at rest. **`.auth-layout__promo-links`** sit below the status bar and stay visible. Icons stack left-to-right with negative margin. Equal-width **`.auth-layout__icon-hover-zones`** sit above the stack. When 3D icon rendering is available, `model-icon-3d.js` draws the whole icon row as one scene and uses `data-stack-focus` to lift the active tile above the others. Icon tiles use a **`.light`** island; model links live on hover zones. Footer links and captions use base font size. Uses **`dark-vibrant`** theme. Shown on all auth layout pages; hidden below 768px with the right column.

**Auth icon stack script:** `src/assets/prototypes/auth-layout-icon-stack.js` — on pointer enter over a hover zone, sets **`data-stack-focus`** on **`.auth-layout__icon-stack`**; on pointer leave of the zones container, removes it so the stack returns to the resting state.

**3D icons sandbox:** `src/prototypes/platform/auth/3d-icons-sandbox.html` (`/auth/3d-icons-sandbox/`) — a copy of the sign-in screen plus the `.icon-3d-settings` panel (`src/includes/prototypes/auth-icon-3d-settings.html`) pinned over the left half: icon checkboxes and live render controls for the auth icon stack. No nav island (`hideNavIsland`). The other auth pages show the configured result without controls.

---

## Option list component

**Styles:** `src/styles/components/option-list.css`  
**Class:** `.m__option-list`

A group of interactive list items that share a single rounded border. Functionally a set of buttons (each item navigates immediately on click); visually the border-radius applies to the group container, not individual rows. Rows are separated by a border-bottom. Each item is a flex row with a label (`__item-label`) and an optional tag cluster (`__item-tags`) pushed to the right. Hover state uses `--m__ui-control-color`.

---

## Tag component

**Styles:** `src/styles/components/tag.css`  
**Class:** `.m__tag`, `.m__tag-flat`

Small inline label for metadata. `.m__tag` shows a bordered outline using `currentColor`. `.m__tag-flat` shows a tinted background derived from `currentColor` — wrap in a parent with an explicit color for semantic variants (e.g. success for "released" status). Default color is `--m__text-caption-color`.

---

## Dashboard charts

**Script:** `src/assets/prototypes/dashboard-charts.js`  
**Data:** `src/assets/prototypes/data/dashboard-charts.json` (static snapshot with 30 days of data, passthrough-copied to site root).  
**Includes:** `src/includes/prototypes/dashboard/overview/credit-balance-over-time.html`, `usage-by-model.html`, `requests-by-status.html`.  
**Styles:** `.chart-container`, `.chart-empty`, `.chart-status-bar`, `.m__segmented-control-primary` in `src/styles/prototypes/dashboard/layout.css` and `src/styles/page-composition/wrappers.css`.
**Library:** Chart.js 4.4.0 via CDN, loaded conditionally with `chartJs: true` in page front matter.

Three charts on the dashboard overview page: Credit Balance Over Time (line), Usage by Model (stacked bar), Requests by Status (stacked bar). Each chart has a "Last 7 days / 30 days" radio toggle that filters data client-side. The script fetches the full JSON data file at runtime, filters by selected period, and renders Chart.js canvases. Chart instances are stored and destroyed on re-render. Theme-aware: reads CSS custom properties for grid and label colors. Date filtering uses `fetchedAt` from the JSON as the anchor so mock data remains visible regardless of the current date.

Hover interaction uses `interaction: { mode: "index", intersect: false }` on all charts — the active zone covers the full chart height at each day position. On the line chart, `pointHoverRadius: 5` shows a dot on hover; bar charts use Chart.js default column highlighting. A `<p class="chart-status-bar">` element below each chart shows the date and dataset values for the hovered position via `mousemove` / `mouseleave` listeners attached once per canvas via `attachStatusBar`.

## Chart.js integration page

**Page:** `src/tools/charts.html` → `/tools/charts/`

Documentation of the opinionated Chart.js defaults with two live sample widgets and footnoted implementation details. Moved out of the blog (formerly `/blog/charts/`, then `/charts/`); linked from the Charts section of `src/design-system.html` and the Tools index.

---

## Design-system chart samples

**Script:** `src/assets/service/ds-charts.js`
**Page:** Charts section in `src/design-system.html`.
**Library:** Chart.js 4.4.0 via CDN, loaded from `ds-layout.html`.

Two sample charts (line and stacked bar) rendered with hardcoded data on the design-system documentation page. Demonstrates the opinionated Chart.js configuration that all product charts should follow. Re-renders on theme change via MutationObserver.

---

## Online Docs prototype

**Page:** `src/tools/online-docs/toxmod.html`, `src/tools/online-docs/prosocial.html`  
**Permalink:** `/tools/online-docs/toxmod/`, `/tools/online-docs/prosocial/`  
**Layout:** `src/includes/prototypes/online-docs-layout.html` (includes `service/svg-icons-sprite.html` for `<use>` icons in case study markup).  
**Styles:** `src/styles/prototypes/online-docs.css`  
**Include:** `src/includes/prototypes/activision-logo.html` (Activision wordmark SVG, `currentColor`, used on the ToxMod case study footer).  
**Wrapper:** `.m__online-doc-wrapper` sets default body ink **`rgb(20, 20, 50)`** and `a { color: inherit }` (title hero keeps its own theme). **`p.accent`** and **`aside.online-doc-callout`** body copy use accent blue **`rgb(40, 95, 235)`**; links in the callout use **`rgb(35, 84, 207)`** with hover **`rgb(40, 95, 235)`**. **`h1`** in the wrapper uses `--m__font-mono`. **`h4.online-doc-kicker`** — uppercase kicker. **`m__text-width`** — **80%** / **100%** mobile. **`aside.online-doc-callout`**: **2× right padding**; **`online-doc-callout-block`** — **`margin-bottom: 1.5rem`**; first grid class **`online-doc-callout-sequence`** with **`online-doc-callout-item`** (icon + **`__body`**) and sprite **`#behaviors`**, **`#overview-muted`**, **`#done`**, **`#decrease`** (prosocial case study); second grid has **`mark`** + thick blue underline on headline figures; **`m__sequence`** **two columns** on screen (**`--columns: 1`** / full-width items when **`width < 767px`**), **`--m__font-size-xl`**, **`strong`** mono; **print:** page breaks + letter sheet like `.title-container`. **`.title-container`**: when **`width < 767px`**, no horizontal negative margins; horizontal **`padding`** matches vertical (**`--online-doc-title-padding-block`**); hero **`h1`** **`font-size: 3em`** (wider viewports use **`3.5em`** from the wrapper rule). **`.title-container__footer`**: one flex row (**`align-items: baseline`**), **`title-container__footer-spacer`** (`flex: 1`) pushes contact links right; on narrow viewports the spacer line-breaks so links sit on the next row. **`title-container__logo-slot--activision`**: **`bottom: -0.35em`** (visual nudge vs. text links).

Print-oriented document prototype. **Experimental / isolated:** doc-specific variables and components belong only in `online-docs.css`, not in `src/styles/tokens/` or other shared DS files, until the pattern is promoted. Uses `online-docs-layout.html` (no product header or footer). Wrapper `.m__online-doc-wrapper` is a centered reading column; `@page { size: letter }` with margins, break rules, `12pt` print body, and `print-color-adjust: exact`. Browser print headers/footers are turned off in the print dialog, not via CSS. The former `/online-docs/` index page was removed; the two case studies are linked directly from the Tools index.
