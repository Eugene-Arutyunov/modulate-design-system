# UI Scheme and comparison

For AI agents: first read [the feature instructions](../../src/service/AGENTS.md).

Scheme (`/ui/`) and Compare (`/ui/compare/`) share navigation and the same complete page table.
Scheme shows the structure recorded in `src/service/ui.yaml`. Compare shows prototype/production screenshots and descriptions of differences. Missing pages have a dash.

## Updating screenshots

```sh
npm ci && npx playwright install chromium   # once per checkout
npm run ui:refresh
```

That is the whole workflow. `ui:refresh`:

1. Finds rows that need a new capture: the prototype changed since its screenshot
   (fingerprint), a side has no image, or the production image is older than 30 days.
2. Builds the prototype site and captures it headless; captures production headless and
   read-only (only GET/HEAD/OPTIONS requests leave the browser).
3. Replaces private values **in the page before the screenshot** (`anonymize.js`) and
   refuses to capture while anything private is still visible, including chart labels.
4. Saves private candidates to `.ui-audit/private/runs/<stamp>/` and opens a review page
   (`http://127.0.0.1:4612/`) with the current and new image side by side.
5. You look at each image in full, tick the good ones and press **Publish selected**. This
   copies them to `ui-public/`, updates hash receipts, fingerprints, capture dates and the
   Compare update date, and removes superseded images.

Then run `npm run test:ui`, open `/ui/compare/` (`npm run dev`) and commit `ui-public/` and
`src/includes/service/ui-updated.html` when asked.

The first production capture opens a browser window to sign in to Modulate. The session is
saved outside the repository (`~/Library/Application Support/modulate-ui-audit/session.json`,
readable only by you) and reused until production expires it; then the window opens again.

| Command | Purpose |
| --- | --- |
| `npm run ui:refresh -- --dry-run` | List what would be captured and why |
| `npm run ui:refresh -- --only=dashboard-usage,dashboard-billing` | Selected rows (both sides) |
| `npm run ui:refresh -- --all --side=prototype` | Every row, one side |
| `npm run ui:refresh -- --no-review` | Capture only; review later |
| `npm run ui:review` | Reopen the review page for the latest run |
| `npm run ui:publish -- --approve=all` | Publish the latest run without the page (after looking at every image) |
| `npm run ui:publish -- --approve=dashboard-usage:production` | Publish selected captures |
| `npm run ui:login` / `npm run ui:logout` | Sign in again / delete the saved session |

Other options: `--max-age=14` (production age in days), `--workers=4`,
`--prototype=http://127.0.0.1:8080` (use a running server instead of building),
`--no-login` (fail instead of opening the sign-in window, for unattended runs).

### Where capture settings live

- Prototype states: `audit.scenarios` in `src/service/ui.yaml` (steps, `visible`, `scope`).
  Component rows (`kind: component`) are cropped to `scope`; other rows are full page.
- Production states: [`production.yaml`](production.yaml): URL, steps to open a tab or
  dialog, crop scope, DPR, and readiness conditions for live data and charts.
  `same_as` reuses another row's capture. Editing it does not mark prototypes stale.
- Replacements: [`anonymize.js`](anonymize.js). Prototype fixtures are an explicit
  substitution list. Production is replaced by meaning: table columns by header (users,
  emails, UUIDs, codes, organizations, tags, key names), every non-`example.com` email,
  IP addresses, the signed-in user's name (read from the page header) and organization,
  and API key names and timestamps on the user's own pages. Credit balances and amounts
  are not sensitive (user decision) and stay unchanged, so they match the charts.
  Distinct organizations get distinct synthetic names. UUID colour dots are re-derived
  from the synthetic UUID.
- Optional private words that must never appear (one per line):
  `~/Library/Application Support/modulate-ui-audit/stoplist.txt`. Keep real names there,
  not in the repository.

Captures use 1440 × 1000, light theme, UTC, `en-US`, reduced motion, fonts loaded and a
stable image. A capture is discarded when production shows `Failed to load`, live data
does not arrive in time, charts are missing, the page re-renders during replacement or the
leftover check finds a private value. Fix the rule, then run the command again.

When a check blocks a capture, extend `anonymize.js` (prototype: add the fixture to
`PROTOTYPE_SUBSTITUTIONS`; production: handle the column or field by meaning) instead of
publishing an older or incomplete image.

## Rendering

Eleventy renders both tables into HTML using `scripts/ui/render.js`. The browser
only enhances screenshot fading and handles image errors; it does not fetch data
to construct the page. Native links and accordions work without JavaScript.

CI sets `UI_AUDIT_SOURCE=public`. A clean checkout also falls back to `ui-public/`.
If `.ui-audit/latest/results.json` exists (from the low-level `npm run ui:audit`), it
overrides `ui-public/` in the local Compare page; move it away to see published results.
`ui:audit` stores unanonymized local pixel diffs and is not part of publishing.

## Review format

Compare keeps element differences below each production screenshot. Use `reviewedElements` on a saved check for concise `{ "element": "Filter bar", "difference": "Production …; prototype …" }` entries. `comparisonNotes` is a list of data, catalog or permission caveats shown under “View data diff”; these are not confirmed missing UI. Existing `reviewedFindings` remain supported as a fallback.

A new screenshot keeps the row's notes; `ui:publish` lists rows whose notes should be
re-checked against the new image. Edit notes directly in `ui-public/results.json`, then
refresh the receipt: `npm run ui:publish` does it on the next publish, or recompute
`manifest.json` `results` (SHA-256 of `results.json`).

“Issues” groups identical measured style differences on at least two distinct pages, with matching viewport, theme and role. It lists the prototype/production values, a shared-component recommendation and links back to the affected captures. Old prototype fingerprints are excluded from these groups. Repeated labels inside a single modal do not establish a site-wide issue. Automatically detected, unreviewed differences are labeled as candidates for confirmation; pixel percentages stay out of the element list. The offline export uses the same review model.

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

## Published content (`ui-public/`)

`ui-public/` is the versioned, reviewed Compare dataset: allowlisted check metadata,
lossless WebP images and hash receipts. `manifest.json` binds `results.json` and every
image to SHA-256 hashes; `public-internal.json` lists Internal images. Each check has
`privacy: { version: 1, reviewed: true }` and `captured: { prototype, production }` dates.
It contains no authentication, raw DOM, pixel diffs or private URLs.

The build validates metadata/image hashes and copies only referenced images to
`_site/ui-audit`; a mismatch fails the build. Receipts record a manual review, not an
automated privacy guarantee. Never copy `.ui-audit/` into it or edit image bytes.

See [PRIVACY-REVIEW.md](PRIVACY-REVIEW.md) for the capture history.

## Export

```sh
npm run ui:report
```

The output folder contains `index.html` and `images/` and opens offline. Share the whole folder.

## Checks

```sh
npm run test:ui
# With npm run dev running:
node tests/ui/browser.js
node tests/ui/capture.js
```
