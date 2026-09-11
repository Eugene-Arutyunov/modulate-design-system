# Repository instructions for AI agents

## UI Scheme and Compare

When working on `/ui/`, `/ui/compare/`, their screenshots, review data, rendering,
styles or capture/export scripts, first read [src/service/AGENTS.md](src/service/AGENTS.md).
It contains the agreed presentation, update and privacy rules for this feature.
For capture commands and artifact formats, also read [scripts/ui/README.md](scripts/ui/README.md).

Before editing, confirm the active checkout/worktree and branch. Work in the
checkout selected by the user; do not silently switch to the main checkout.
Keep unrelated changes intact. Commit/push only when requested. `.ui-audit/`
contains local artifacts and private source captures; it is intentionally ignored
by Git and must not be force-added as a folder.
