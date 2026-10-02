# Changelog

## 0.1.0 — 2026-10-02

**Breaking.** Emotion tokens follow the Emotion model update: the supported
vocabulary shrinks to `angry`, `disgusted`, `afraid`, `happy`, `neutral`,
`other`, `sad`, `surprised`, `unknown`.

- Removed all `--emotion-*-group` variables (`attack-rejection`,
  `threat-uncertainty`, `excited-engaged`, `low-energy-negative`,
  `calm-grounded`, `neutral`). The structure is now flat: one
  `--emotion-<name>` per supported emotion; emotions sharing a register share
  a value.
- Removed per-emotion variables for dropped emotions: `calm`, `confident`,
  `interested`, `amused`, `excited`, `proud`, `affectionate`, `hopeful`,
  `relieved`, `curious`, `frustrated`, `contemptuous`, `anxious`, `stressed`,
  `concerned`, `ashamed`, `fear`, `disappointed`, `bored`, `tired`,
  `confused`.
- Added `--emotion-other`. Neutral, Other and Unknown share gray-600; in the
  fingerprint Neutral still reads differently (clips render muted), while
  Other/Unknown paint at full opacity.
- Added `--emotion-<name>-RGB` triplets to the published tokens (previously
  site-only) for `rgba()` composition.

Consumers referencing removed variables get unset values (transparent
rendering) — migrate to the 9 canonical names.
