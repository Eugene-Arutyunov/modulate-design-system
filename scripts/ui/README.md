# UI Scheme and comparison

For AI agents: first read [the feature instructions](../../src/service/AGENTS.md).

Scheme (`/ui/`) and Compare (`/ui/compare/`) share navigation and the same complete page table.
Scheme shows the structure recorded in `src/service/ui.yaml`. Compare shows prototype/production screenshots and descriptions of differences. Missing pages have a dash.

## Rendering

Eleventy renders both tables into HTML using `scripts/ui/render.js`. The browser
only enhances screenshot fading and handles image errors; it does not fetch data
to construct the page. Native links and accordions work without JavaScript.
The dev watcher rebuilds on `.ui-audit/latest/` changes, including image approval
receipts. Missing local results leave comparison cells empty. Production builds
need local reviewed artifacts present at build time to include comparisons; the
renderer does not copy images into `_site`. The existing local image server or
the portable report export serves those images. Git still ignores audit files.

## Start

```sh
npm ci
npx playwright install chromium
npm run dev
```

Open `http://localhost:8080/ui/`. The normal dev server serves local comparison results and images. `npm run ui:serve` can also serve an existing build on port 4611.

## Screenshots

For interactive review, use the installed regular Chrome and its existing signed-in session. Do not open a fresh Chrome for Testing login for every review. Capture at the comparison viewport without resizing the resulting image; verify its dimensions before publishing it to Compare. Avoid reduced-resolution in-app browser captures.

With the dev server running:

```sh
# Capture every available prototype without production access.
npm run ui:audit -- --all --prototype-only

# Sign in in the dedicated browser, then close the recorder to save the session.
npm run ui:audit -- --login
# Sign in in the opened window; capture resumes automatically.
# This keeps the session in memory. Firefox sessions are not imported.

# Optional: save a separate local session for later runs.
npm run ui:login
npm run ui:audit
```

The default comparison covers Overview, API Keys (default and Create API Key), Usage, Billing, Organization, Conversations and Review Queue. Production routes/selectors must match the authenticated product. Review Queue uses /dashboard/conversations/review-queue. Other prototype-only URLs may return 404 on production. A failed production capture preserves the prototype screenshot and reports the reason.

```sh
npm run ui:audit -- --all --workers=2
npm run ui:audit -- --only=dashboard-home,dashboard-api-keys
npm run ui:audit -- --prototype=http://127.0.0.1:4611
```

CLI values use `--name=value`; worker count is capped at four. `--output=.ui-audit/trial` isolates a trial. `--auth=path/to/session.json` selects another saved login.

## Capture settings

Page IDs, structures and audit scenarios live in `src/service/ui.yaml`. Local overrides can be set in `.ui-audit/config.json`:

```json
{
  "role": "Organization owner in the chosen demo organization",
  "viewport": { "width": 1440, "height": 1000 },
  "theme": "light",
  "timeout": 20000,
  "pages": {
    "dashboard-api-keys": {
      "route": "/dashboard/api-keys",
      "production": { "ready": "main", "mask": [".dynamic-value"] }
    }
  }
}
```

Per-state overrides use `pages.<id>.scenarios.<state>.production` (`steps`, `ready`, `visible`, `scope`, `mask`). Region overrides use `pages.<id>.regions.<region-id>`. Use production selectors observed in the actual product. The saved session determines the organization/permissions; `role` is a descriptive label.

Captures use a fixed viewport, DPR, locale, timezone and theme, wait for fonts and a stable image, and hide prototype notice/tool controls. Different live data can create pixel differences; review the findings before assigning development tasks. A changed prototype is marked for recapture.

Production requests allow GET, HEAD and OPTIONS. Verified read-only POST endpoints can be listed in `readOnlyPostPaths`. Steps support click, check and hover for navigation/opening UI. The included Create API Key scenario only opens the form.

Local artifacts are ignored by Git:

- `.ui-audit/auth.json`: saved login, never served by the dev server.
- `.ui-audit/latest/results.json` and lossless WebP images: current comparison.

New page screenshots, region crops and pixel differences are saved as lossless WebP, preserving dimensions and pixels. Existing PNG reports remain readable. To convert an existing capture set in place:

```sh
node scripts/ui/migrate-webp.js
# Another set:
node scripts/ui/migrate-webp.js --input=.ui-audit/trial
```

Stop capture jobs before converting. The converter verifies every pixel, updates screenshot references (including regions) and then removes the replaced PNGs. Reviewed findings and all other report fields are preserved.

## Export

```sh
npm run ui:report
```

The output folder contains `index.html` and `images/` and opens offline. Share the whole folder. `--input=.ui-audit/trial` selects another capture; `--output=.ui-audit/review-report` selects an empty output folder.

## Checks

```sh
npm run test:ui
# With npm run dev running:
node tests/ui/browser.js
node tests/ui/capture.js
```

Capture tests use a separate local fixture and never populate the production comparison.

Incremental captures preserve the other rows, including when signing in again. Each row retains its own capture URLs, viewport and role; compare equivalent roles and data. Reviewed per-capture comments can be stored in `reviewedFindings` in the local results file; both Compare and the exported report use these instead of raw DOM findings. A new capture resets these comments.

## Review format

Compare keeps element differences below each production screenshot. Use `reviewedElements` on a saved check for concise `{ "element": "Filter bar", "difference": "Production …; prototype …" }` entries. `comparisonNotes` is a list of data, catalog or permission caveats shown under “View data diff”; these are not confirmed missing UI. Existing `reviewedFindings` remain supported as a fallback. A new capture resets reviewed content for that state.

“Issues” groups identical measured style differences on at least two distinct pages, with matching viewport, theme and role. It lists the prototype/production values, a shared-component recommendation and links back to the affected captures. Old prototype fingerprints are excluded from these groups. Repeated labels inside a single modal do not establish a site-wide issue. Automatically detected, unreviewed differences are labeled as candidates for confirmation; pixel percentages stay out of the element list. The offline export uses the same review model.

### Anonymization before capture

Apply this workflow to both Prototype and Production, including pages, dialogs
and components. Internal captures require the additional receipts described below.
Keep originals and unreviewed candidates under `.ui-audit/private/`. Use `semantic-capture.js` with an authorized
Playwright page to replace specifically reviewed text fields before capture:

```js
const { captureCandidate } = require('./scripts/ui/semantic-capture');
await captureCandidate(page, [
  { selector: '.reviewed-email-cell', kind: 'email' },
  { selector: '.reviewed-code-cell', kind: 'code' },
  { selector: '.reviewed-name-cell', kind: 'name' },
], '.ui-audit/private/candidates/example.webp');
```

These selectors are examples, not production selectors. Inspect each state's DOM
and supply exact field selectors; never target entire rows or generic buttons.
Supported kinds: name, organization, email, keyName, code, number; `text` supplies
an explicit reviewed replacement. Same input/kind gets the same synthetic value.
Numeric/code replacements preserve character count and punctuation. Names and
emails require visual inspection for wrapping. No events or server writes occur;
original text is restored after capture, including on failure. Existing files
cannot be overwritten. Lossless screenshots preserve CSS pixel dimensions.

This helper does not approve privacy, handle private canvas/chart content, or
bypass browser access restrictions. Review the full candidate before updating
public metadata and hash receipts. Never compute pixel scores on synthetic data.
The old `public-capture-dom.js` / `redact-image.js` raster workflow is legacy;
do not use it for new captures. Blurred text is not an automatic privacy approval.

Serving and report export require `latest/public-internal.json` (version 1,
`images` mapping each Internal filename to its SHA-256 digest) and a check with
`privacy: { version: 1, reviewed: true }`. A changed file invalidates approval.
The receipt is a record of manual review, not an automated privacy guarantee.
Internal filenames must start with `internal-`. Do not put raw findings, source
DOM, customer URLs or private data into public check metadata. No pixel-diff score
is computed on synthetic replacements. Production-only pages show a dash on the prototype side; do not add an unavailable
caption. New captures must use field replacement before rendering and be reviewed again.

### Explicitly reviewed shared issues

A check may contain `sharedIssues` for a confirmed shared-component issue, including
one initially confirmed location. The review model groups these by stable `id`
and adds links from each applicable check. Stale fingerprints, blocked/error checks
and checks without both comparison images are excluded. This is separate from the
automatic two-page grouping above.

```json
{
  "sharedIssues": [{
    "id": "page-subtitle-color",
    "title": "Page subtitle color",
    "property": "color",
    "prototype": "var(--m__text)",
    "production": "rgb(150, 150, 170)",
    "recommendation": "Use color: var(--m__text) for page descriptions in the shared subtitle style.",
    "element": "Page subtitle"
  }]
}
```

The values above illustrate a reviewed issue; verify them for new captures.
Keep group metadata consistent across checks sharing an ID. Use real CSS values
or verified DS tokens, never descriptive text in CSS value fields. Add the issue
to all applicable captured states in the requested scope, preserving unrelated
metadata. Verify the resulting affected-location count in the served Compare page.
If the watcher leaves old output, run `npx eleventy` and reload. These entries stay
in ignored local results; committing the renderer does not publish their content.

## Deployable Compare content

`ui-public/` is a versioned, explicitly reviewed subset of the private local audit.
It contains allowlisted check metadata, lossless WebP images, and hash receipts.
It contains no authentication, raw findings, raw DOM, pixel diffs, or private URLs.
Do not copy `.ui-audit` wholesale or mark unreviewed screenshots as approved.

CI sets `UI_AUDIT_SOURCE=public`. A clean checkout also falls back to this dataset;
local development can continue to use `.ui-audit/latest`. The build validates the
metadata/image hashes and copies only referenced images to `_site/ui-audit`.
A mismatch fails the build. Receipts certify a manual privacy review, not an
automated guarantee. Re-review changed pixels before regenerating their hashes.

The published subset contains 48 states (60 images).
See [PRIVACY-REVIEW.md](PRIVACY-REVIEW.md) for capture history and unresolved states.
Unapproved captures remain local until sanitized and reviewed.
Run `UI_AUDIT_SOURCE=public npm run build` and `npm run test:ui` before publishing.

### Read-only interactive browser fallback

When the interactive browser cannot modify DOM, save its observed
`document.documentElement.outerHTML` and readable stylesheets (`{href, css}`)
as `{html, styles}` in a private local JSON file. Do not collect storage/cookies.
`node scripts/ui/snapshot-capture.js snapshot.json rules.json .ui-audit/private/candidates/state.webp`
renders that frozen state in local Chrome. It removes executable markup, blocks
page network requests, and embeds only public production WOFF2 fonts. This is a
rendered snapshot, not a new live capture: inspect responsive layout and assets.
Canvas pixels are not preserved by DOM serialization. Do not publish a snapshot
with missing charts or assets; retain the previous reviewed image and report the
unresolved state. Images, hidden values and private graphics require separate review.
The output is always unapproved until manually inspected. `identity` handles
mixed name/email text nodes while preserving punctuation and empty placeholders.
