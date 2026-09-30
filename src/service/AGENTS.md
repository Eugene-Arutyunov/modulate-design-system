# UI Scheme and Compare

Applies to the Scheme/Compare feature, including its renderer, styles and scripts.

## Sources and files

- `/ui/` shows structure; `/ui/compare/` shows visual comparisons.
- `src/service/ui.yaml`: `current` = observed production; `target` = prototype.
- `src/prototypes/` and `src/includes/prototypes/`: prototype source of truth.
- `scripts/ui/render.js`: HTML renderer called by the Eleventy `uiTable` shortcode.
- `src/assets/service/ui-visualizer.js`: image fade/error enhancement only; no data fetching.
- `src/styles/service/ui-visualizer.css`: shared table appearance.
- `src/assets/service/ui-review.js`: shared review model for the page and offline export.
- `scripts/ui/`: data building, capture, privacy checks, serving and export. Read its README for commands.
- `.ui-audit/latest/results.json` and images: private/local working content, not committed.
- `ui-public/`: separately reviewed public checks and lossless images, committed for deployment.
  `manifest.json` binds approved metadata and images to their hashes; never copy the
  whole local audit directory here. `scripts/ui/published.js` validates before rendering
  and copies only referenced images into `_site/ui-audit/`.
- `src/includes/service/ui-updated.html`: shared editorial update date.

## Rows and schema

Use one table row per page, tab or reviewed state, including dialogs such as
`API Keys: Create key`. Use a meaningful common prefix: `Behaviors: Roles`,
`Detection Package: Edit`, `Data Management: Export`.

**Pricing is the exception:** keep one Pricing row with its model subsections
inside it. Do not split Pricing into separate rows.

The directory rows are `Internal: Users`, `Internal: Organizations` and
`Internal: Unverified Signups`. Do not prepend Internal to every internal page:
standalone pages retain names such as Platform Usage, Reports and Email Status.

Keep stable kebab-case IDs shared between `current` and `target`. Missing sides
use `route: —` and `sections: []`. Preserve URL trailing slashes and hashes as
observed. Do not infer production paths from prototype paths. Multiple rows may
share a production URL; capture scenarios specify the tab or dialog to open.
Use a single `default` scenario for a separated row, retaining its required steps.

`text-content` means a flat text block; `widget` means one framed/card block;
`widgets` means multiple items within one frame. Keep block names consistent
between the two sides. Shared headers, sidebars and footers do not belong in individual page
schema sections. Review shared interactive states as separate rows when requested,
e.g. `Header: Account menu`, using the host page URL and an open-menu scenario.
Mark these rows `kind: component` on both schema sides. Render them only in Compare, in a separate
Components table after Pages, with the same columns and styles. Never render
component rows or a Components section in Scheme. A component absent
from the DS (such as Pagination) has no prototype image, but still shows its
`prototypeNotes` with a bold `To do: Component name` and an action description. Their visual differences may still be documented in Compare.
Exclude development sandboxes and redirect-only pages.

## Rendering and rebuilds

Tables, notes, accordions and links must be in the initial HTML. Do not restore
client-side table construction or Loading placeholders. Eleventy reads the scheme
and privacy-filtered local results at build time. The dev watcher includes
`.ui-audit/latest/`; changes to results, review receipts and images rebuild the
pages. Missing results produce rows with dashes. Invalid results show an error.
Local audit source files are never copied into the site. CI uses `UI_AUDIT_SOURCE=public`;
a clean checkout falls back to the reviewed `ui-public` dataset.
Verify the served HTML after updates, not only the source JSON. If the watcher
serves old content, run `npx eleventy`, reload and verify again before reporting success.

## Presentation

- Keep the same layout on Scheme and Compare, with the switch before the heading.
- Show the shared update date below the heading with a .25rem gap, primary text
  color and the same size as table column headers. Update it when the feature/content changes;
  it is the content update date, not the visitor's current date.
- Keep screenshots at full column width, capped at 560px preview height. Fade the
  final 80px only when cropped; clicking opens the full-resolution image.
- Keep URL hover styling. Do not show `Sample data · personal and confidential
  values replaced` or `Prototype not available`; use a dash for a missing image.
  Privacy metadata and enforcement remain in place even without visible labels.
  Missing-side dashes belong in the URL row, aligned with the opposite route link,
  not in the screenshot preview row.

In Compare only, below the update date, show a bold `Table of Contents` label
and a plain vertical list of text anchor links (not an accordion). Scheme must
not show this navigation. The links use
the normal table body size (`--m__font-size-s`) to the available sections:
Issues (`#general-issues`), Pages (`#pages`) and Components (`#components`).
The screen comparison table is preceded by the heading `Pages`.
Issues uses `#general-issues` with no subtitle. Render a three-column
table: Element / Prototype / Production. Element names use the normal small body size (`--m__font-size-s`) in bold,
not code tags or badges. In the Production cell, put the
recommendation below the value and the affected locations in a closed accordion.
Reuse the main comparison table class, column widths and spacing; do not invent
a separate table style. Accordion labels in both tables use the same font size as table column headers (`--ui-viz-caption-size`), bold weight and
primary text color (`--m__text`). Accordion body text also uses the table header
font size, with regular weight and primary color. Align body text with the
summary label, leaving the disclosure arrow in a separate gutter. Preserve per-issue anchors and links back to the screen comparisons.

Issues value tags use `--m__success` for Prototype and `--m__error` for
Production, with lightly tinted backgrounds and borders. Keep CSS values readable
when they wrap. Prefer the actual DS token for prototype values where available
(e.g. `color: var(--m__text)`); use verified production CSS, not prose such as
“Visible drop shadow”. Recommendations should name the DS token to use.

Below page differences, show `Linked issues` as a closed accordion even for one
link; its body is comma-separated links, not a list. Follow it with `View data diff`
when present, then the small secondary outline squircle button `View pixel diff ↗`.
Keep a .25rem gap between adjacent accordions and .25em between the summary and
first body block. Use small disclosure arrows; label and arrow hover together,
with 0s ease on hover and .5s ease on exit.

## Updating content

1. Determine the requested scope from context; ask only for genuinely missing
   information. Inspect the source prototype and actual production UI.
2. Edit only affected YAML blocks. Preserve unrelated rows and local results.
3. When splitting/renaming a row, migrate its local check's `pageId`, `title`,
   `scenario` and `key`, and preserve screenshots and reviewed notes. Keep capture
   steps attached to the new row. Refresh fingerprints for a verified structural
   migration only; never mark an outdated screenshot current to hide staleness.
4. Add concrete `{ element, difference }` entries in `reviewedElements` below the
   production screenshot. Describe differing elements, not an overall verdict.
   Use `prototypeNotes` with the same `{ element, difference }` shape for requested
   prototype work; render these below the prototype image, including in export.
   Use `comparisonNotes` for dataset, access and state limitations. Do not call a
   different dataset or an unobserved state a design defect.
5. Put repeated measured style differences and specific shared-component fixes in
   Issues above the screen comparison table, through the shared review model. Do not
   invent measured CSS values or compute pixel scores on synthetic replacements.
   Use per-check `sharedIssues` for explicitly reviewed common issues (format in
   `scripts/ui/README.md`), rather than hardcoding content in the renderer. Link
   every applicable captured page in the requested scope, not only the first
   example: widget shadows apply where dashboard widgets exist; subtitle color
   applies where that subtitle exists. Distinguish scope inferred from shared
   components/schema from individually measured pages. Do not claim measurements
   for uninspected pages. Keep the same stable issue ID across affected checks.
6. Check the served Scheme/Compare data, image URLs and relevant layout in the
   browser. Run `npm run test:ui` for schema/model/capture changes; for a small
   spacing/text edit, a focused check is enough. Run `git diff --check`.
7. Report what changed and any uncaptured states. Code commits do not include local
   `.ui-audit` images/results. Deployable Compare content must be separately reviewed
   and included in `ui-public`; report any withheld states.

## Capture and privacy

**Use one command: `npm run ui:refresh`** (details in `scripts/ui/README.md`). It finds
stale rows, captures prototype and production headless, anonymizes, and opens a review
page from which approved images are published to `ui-public/`. Do not capture through
the Chrome extension, the in-app browser or ad-hoc scripts, and do not hand-edit
`ui-public` hashes. Run `npm run ui:refresh -- --dry-run` first to report the scope.

- **Sign-in.** The first production capture opens a window to sign in; the session is
  kept outside the repo and reused. If it has expired, tell the user a sign-in window is
  open and wait. Never ask for or type passwords, never log the user out.
- **Read-only.** Only GET/HEAD/OPTIONS reach production. Do not add steps that create keys,
  organizations or invites, send email, delete data or switch the active organization.
  Token-dependent states need a user-provided link; do not invent a successful state.
- **Anonymization happens in the page code before the screenshot.** Private text is
  replaced in the DOM with meaningful synthetic values of similar length (names, emails,
  organizations, codes, numbers), keeping styles, structure, dates, units, punctuation,
  headings, statuses and control labels. **Never mask, blur, crop out, paint over or
  otherwise edit an image**, and never re-render a frozen DOM snapshot. Canvas charts
  are kept unchanged (approved by the user) and are checked for private labels; if a
  chart shows private values, stop and ask.
- **Blocked capture = fix the rule.** When the leftover check, a load error or missing
  data cancels a capture, extend `scripts/ui/anonymize.js` or `scripts/ui/production.yaml`
  and run again. Never publish an older, partial or empty image as a fix; report the
  row as not updated instead.
- **Review before publishing.** Open every candidate at full size and check names,
  emails, IDs, keys, invite codes, charts, account chrome, wrapping and clipped text.
  Approve only what you inspected (`--approve=<id>:<side>` or the review page). Then
  re-check the listed rows' notes, run `npm run test:ui`, and verify `/ui/compare/`.
- **Private files.** Candidates, raw captures and the built capture site stay in
  `.ui-audit/private/` (ignored). Keep real names only in the local stop-list, never in
  the repository or in public check metadata; no raw DOM, customer values or secret URLs.

Published images are bound by `ui-public/manifest.json` (and `public-internal.json` for
Internal images); changed bytes fail the build. Receipts record manual review, not an
automatic guarantee. Do not force-add ignored captures or deploy/share a report without
the relevant user request.
