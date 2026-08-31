# Syncing with modulate-design-site

There are two repositories; this one is the **working repo**:

| | This repo (working) | `../modulate-design-site` (publishing) |
|---|---|---|
| Hosted at | GitHub (`Eugene-Arutyunov/modulate-design-system`) | GitLab (`modulate/modulate-design-site`) |
| Purpose | All design work: the design system, blog, prototypes, tools | Publishing to [design.modulate.ai](https://design.modulate.ai) via GitLab CI/CD |
| Shows | The complete final state of everything | Only what is released |

The repos are not linked by git — Eugene's machine is the bridge, and **each side only
pulls; nothing is ever pushed from one repo into the other.**

## Release gating lives only there

The site repo overlays release gates (`{% if releaseStage >= N %}` in templates,
`src/_data/releaseStage.mjs`), its CI/hosting files, `robots.txt` and its own docs on
top of this repo's `main`. None of that ever comes here: this repo stays free of
`releaseStage` and always shows the full final state. The overlay is enumerated in the
site repo's `SYNC.md`; the release schedule is its `RELEASE-PLAN.md`.

## Forward direction (this repo → site)

Runs **from the site repo**, by Eugene:
`scripts/sync-from-design-system.sh` overwrites the site tree with this repo's `main`
and re-applies the overlay; `.design-system-source` there records the commit of this
repo it was last synced from. Merging into `main` here does **not** publish anything —
publication happens only when that sync runs and the site repo's `main` is pushed
(that push deploys to production).

## Reverse direction (site → this repo)

The blog and the home page may be edited in either repo. Edits made on the site side
are carried back here by hand so this repo stays the complete final state:

1. Read `.design-system-source` in the site repo — the base commit of the last sync.
   Anything in the site tree that differs from that base and is not overlay is a
   site-side edit to carry back.
2. Diff the trees (`diff -qr ../modulate-design-site/src src`), set the overlay aside:
   `src/_data/`, `src/robots.txt`, gate-only diffs in templates, `eleventy.config.js`
   robots passthrough, `package.json` `check:infra`, plus the site-only root files.
3. Copy the genuinely edited files over, **stripping the gates**: drop the
   `{% if releaseStage >= N %}` / `{% endif %}` wrapper lines keeping their content,
   and drop `{% else %}` branches entirely (the else branch is the pre-release
   placeholder — site-only by definition).
4. Mind file renames (blog post slugs have been renamed on the site side before):
   `git mv` first, then copy content, then fix references (other posts' links,
   `REPOSITORY-REGISTRY.md`).
5. Build, review, commit to `main` here, push.

Last reverse sync: August 25, 2026 (blog post renames + editorial pass, palette-lamp
toggle, layouts→page-composition part move, carried from site commit `d43c289`).
