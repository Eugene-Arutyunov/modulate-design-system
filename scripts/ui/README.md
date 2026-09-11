# UI Scheme and comparison

Scheme (`/ui/`) and Compare (`/ui/compare/`) share navigation and the same complete page table.
Scheme shows the structure recorded in `src/service/ui.yaml`. Compare shows prototype/production screenshots and descriptions of differences. Missing pages have a dash.

## Start

```sh
npm ci
npx playwright install chromium
npm run dev
```

Open `http://localhost:8080/ui/`. The normal dev server serves local comparison results and images. `npm run ui:serve` can also serve an existing build on port 4611.

## Screenshots

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
