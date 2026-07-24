# Going Public: Staged Release Plan

## Ground rules

- **Nothing is deleted.** Hiding a page means removing every link that leads to it —
  navigation, listings, cards, "read next" buttons. The page itself keeps building and
  stays reachable by direct URL, so we can keep working on it.
- **The corner nav island** ([nav-island.html](src/includes/service/nav-island.html)) is
  treated as semi-secret and **does not change** across releases. It keeps its full set of
  links (Home, Design System, Blog, Tools, Log in, Dashboard, Playground, UI Scheme).
- **The top header nav** ([header.html](src/includes/service/header.html)) shows only
  sections that have been released.
- A visible page must never link to a hidden page. The per-release checklists below
  enumerate exactly which links appear when.
- **The home page stays about the blog and the design system.** Prototypes are never
  advertised there; they live behind the corner nav and direct links.
- Release order is mostly dictated by blog posts; a few releases ship prototypes with no
  new post.

### Implementation mechanism

One source of truth: a `releaseStage` number (Eleventy global data, e.g.
`src/_data/release.js`, overridable by an env var for local preview). Templates gate
links and list items with `{% if releaseStage >= N %}`. Advancing a release = bumping one
number plus the copy edits listed for that release. Keep every gate conditional on that
single value so any stage can be previewed locally.

**Important:** this machinery is temporary. The final step of the plan (see
"Cleanup" after Release 12) is to delete the `releaseStage` variable and every gate,
leaving plain ungated templates identical to the internal repo.

---

## Release 1 — Launch: the design system core + "I'm Not a Designer"

**Ships:** the design system (tokens, components, typography) and the standalone post
*Why You Can't Seriously Say "I'm Not a Designer"*.

| Surface | Exact changes |
|---|---|
| Top nav | Shows **Home, Design System, Blog**. Tools hidden until R9. |
| Home `/` | Intro copy rewritten: the site is the design system reference + the "By Design" blog (no mention of prototypes or tools). "Selected blog posts" lists only *I'm Not a Designer* (plus the "Design is a big thing — Soon" teaser, pending the teaser decision, OQ‑1). Promo cards visible: **Color palette, Components, Typography**. Hidden cards: **3D icons** (→ R9), **UI scheme** (→ R3). |
| Design System `/design-system/` | Visible: intro + layers table, **Color**, **Layout** (Units, Gaps, Spacers, Paddings, Radius, Border width; **Page composition subsection hidden** → R3), **Typography**, **Components**, **Graphics with flat SVG icons only** (the 3D-icon blocks hidden → R9, the Charts subsection hidden → R4), **Animations**. `ids-navbar` and the intro paragraph reflect only visible content. |
| Blog `/blog/` | Single column, no series titles yet: *Why You Can't Seriously Say "I'm Not a Designer"*. |
| Tools, prototypes, `/ui/` | All hidden. |

## Release 2 — Post: What the System Is Made Of

**Ships:** `/blog/layers/`.

| Surface | Exact changes |
|---|---|
| Blog `/blog/` | New column **System Foundations Series** with this post; the standalone designer post moves to a **Recent posts** column. |
| Home `/` | Selected posts: both posts. |
| Posts | In `/blog/layers/`, "read next → The Page Composition Rule" stays hidden until R3. |

## Release 3 — Post: The Page Composition Rule + UI scheme

**Ships:** `/blog/page-composition/` and `/ui/`.

| Surface | Exact changes |
|---|---|
| Blog `/blog/` | Post added to the Foundations column. |
| Home `/` | **UI scheme promo card** appears (links `/ui/`). Selected posts updated (curate to ~4 rows from here on). |
| Design System | **Page composition** subsection of Layout becomes visible. |
| Posts | `/blog/layers/` "read next" appears. In `/blog/page-composition/`, "read next → Time as the Main Axis" stays hidden until R5. |

## Release 4 — Prototype: Dashboard

**Ships:** the platform prototype — auth flow + dashboard + docs stub. **Without**
Playground, Conversations, the Moderation queue, and Pricing. No new blog post, no home
page changes: the prototype is reached via the corner nav island and direct links only.

| Surface | Exact changes |
|---|---|
| Auth `/auth/*` | Login, signup, reset password, invites, org select work. **The right column renders as an empty accent-blue half** — the 3D-icon models panel ([auth-layout-models-panel.html](src/includes/prototypes/auth-layout-models-panel.html)) is hidden until R9. The 3D-icons sandbox page stays unlisted. |
| Dashboard `/dashboard/*` | All dashboard pages visible. **Hidden inside the prototype nav** ([dashboard-nav-macros.html](src/includes/prototypes/dashboard-nav-macros.html)): the **Conversations** sidebar item (→ R12), the **Playground** header link (→ R6), the **Pricing** header link (→ R9, the page uses 3D icons). |
| Docs `/docs/` | Visible (stub pointing to docs.modulate.ai); same header gating as above. |
| Design System | **Charts** subsection of Graphics becomes visible (charts are live on the dashboard overview). |

## Release 5 — Post: Time as the Main Axis

**Ships:** `/blog/layouts/` — the merged post (main text + Part 2 Mobile Responsiveness +
Part 3 Adjusting the Type Scale).

| Surface | Exact changes |
|---|---|
| Blog `/blog/` | Post added; the Foundations column is complete. |
| Home `/` | Selected posts updated. |
| Posts | `/blog/page-composition/` "read next" appears. In `/blog/layouts/`, "read next → Why Have Your Own Graphic Style" stays hidden until R7. |

## Release 6 — Prototype: Playground

**Ships:** `/playground/*` (Velma, transcription, language, music, AI music, deepfake,
redaction). No new blog post, no home page changes.

| Surface | Exact changes |
|---|---|
| Playground `/playground/*` | All pages visible. |
| Dashboard prototype | The **Playground** link appears in the prototype header nav (all variants: bar, popover, landing). |

## Release 7 — Post: Why Have Your Own Graphic Style

**Ships:** `/blog/graphic-style/` — opens the Graphic Style series.

| Surface | Exact changes |
|---|---|
| Blog `/blog/` | New column **Graphic Style Series** with this post. |
| Home `/` | Selected posts updated. |
| Posts | In `/blog/graphic-style/`, "read next → Color Under a Purple Lightbulb" stays hidden until R8. |

## Release 8 — Post: Color Under a Purple Lightbulb

**Ships:** `/blog/color/`.

| Surface | Exact changes |
|---|---|
| Blog `/blog/` | Post added to the Graphic Style column. |
| Home `/` | Selected posts updated. |
| Posts | `/blog/graphic-style/` "read next" appears. In `/blog/color/`, "read next → Five Requirements for Icons" stays hidden until R9. |

## Release 9 — Post: Five Requirements for Icons + everything 3D

**Ships:** `/blog/icons/`, all 3D-icon material (it appears on the design-system page for
the first time), the Tools section, and the Pricing prototype.

| Surface | Exact changes |
|---|---|
| Top nav | **Tools** appears: Home, Design System, Blog, Tools. |
| Design System | The 3D-icon blocks in **Graphics** become visible. |
| Home `/` | **3D icons promo card** appears. Intro copy adds the tools/studios mention. Selected posts updated. |
| Tools `/tools/` | Page visible: **Studios** — Icon Studio; **Documents** — Chart.js Integration, the two online docs, *There has to be a square element*. Hidden: **Fingerprint Studio** (→ R10), **Scatterplot** (→ R11). |
| Blog `/blog/` | *Five Requirements for Icons* added to the Graphic Style column. |
| Posts | `/blog/color/` "read next" appears. |
| Auth prototype | The right column gets its **3D-icon models panel** back. |
| Pricing `/pricing/` | Visible; the **Pricing** link returns to the prototype header nav. |

## Release 10 — Post: Fingerprints + everything related

**Ships:** `/blog/fingerprints/` and every fingerprint surface.

| Surface | Exact changes |
|---|---|
| Blog `/blog/` | *Fingerprints* added to Recent posts (linked, date replaces "Soon"). |
| Home `/` | Selected posts updated. |
| Tools `/tools/` | **Fingerprint Studio** listed under Studios. |
| Elsewhere | Fingerprint graphics on already-visible pages are un-gated. |

## Release 11 — Tool: Scatterplot

**Ships:** `/tools/scatterplot/`.

| Surface | Exact changes |
|---|---|
| Tools `/tools/` | **Builders** column appears with Scatterplot. |

## Release 12 — Prototype: Conversations & Moderation queue

**Ships:** `/dashboard/conversations/`, conversation create/report pages, the moderation
queue and review pages.

| Surface | Exact changes |
|---|---|
| Dashboard prototype | The **Conversations** sidebar item appears; all conversation and moderation pages reachable. |

## Cleanup — after the last release

When `releaseStage` has caught up with reality, **delete the gating machinery**: remove
`releaseStage` data, every `{% if releaseStage >= N %}` condition, and this plan's
release-specific copy variants. The public repo's templates become identical to plain
ungated markup. This is an explicit final task, not an afterthought.

---

## Visibility matrix

| Surface | Revealed in |
|---|---|
| Home, Design System (core, incl. flat icons), Blog, post *I'm Not a Designer* | R1 |
| Post *What the System Is Made Of* | R2 |
| Post *The Page Composition Rule*, `/ui/`, DS Page composition subsection | R3 |
| Auth + Dashboard + Docs, DS Charts subsection | R4 |
| Post *Time as the Main Axis* (with Parts 2–3) | R5 |
| Playground | R6 |
| Post *Why Have Your Own Graphic Style* | R7 |
| Post *Color Under a Purple Lightbulb* | R8 |
| Post *Five Requirements for Icons*, DS 3D icons, Tools + Icon Studio + Documents, Pricing, auth 3D panel | R9 |
| Post *Fingerprints*, Fingerprint Studio | R10 |
| Scatterplot | R11 |
| Conversations, Moderation queue | R12 |
| Gating machinery removed | Cleanup |
| `/tables/`, `/palette-lamp/`, `/ui.yaml`, 3D icons sandbox | never listed; direct URL only |

---

## Open questions

1. **"Soon" teasers:** should unpublished posts show as unlinked "Soon" rows (current
   style, creates anticipation) or should lists contain only published posts? Applies to
   the blog index columns, the home "Design is a big thing" teaser, and the Tools
   "Soon" captions. To decide before R1.

---

## Appendix — page inventory (for the implementing agent)

Current state of the site the gating applies to.

| Page / area | URL | Notes |
|---|---|---|
| Home | `/` | Intro, "Selected blog posts" (3 columns), promo cards: Color palette, 3D icons, Components, Typography, UI scheme |
| Design System | `/design-system/` | Sections: Color, Layout (incl. Page composition), Typography, Components, Graphics (flat icons, 3D icons, Charts), Animations; section nav `ids-navbar` |
| Blog index | `/blog/` | Columns: System Foundations Series, Graphic Style Series, Recent posts |
| Tools | `/tools/` | Studios (Icon Studio, Fingerprint Studio), Builders (Scatterplot), Documents (Chart.js Integration, 2 online docs, square element) |
| Auth prototype | `/auth/*` | Login, signup, reset, invites, org select, 3D sandbox (unlisted); right column = 3D models panel |
| Dashboard prototype | `/dashboard/*` | Overview, insights, behaviors, actions, jobs, API keys, usage, limits, billing, settings pages; header links to Playground/Pricing/Docs; sidebar link to Conversations |
| Playground prototype | `/playground/*` | 7 model pages |
| Conversations | `/dashboard/conversations/`, `/conversations/*` | Browse, create, report, moderation queue + review |
| Pricing / Docs | `/pricing/`, `/docs/` | Landing-layout pages; Pricing renders 3D icon tiles |
| UI scheme | `/ui/` | Diagram page; promo card on Home |
| Service pages | `/tables/`, `/palette-lamp/` | Internal, never listed |

### Blog posts

| Post | URL | State |
|---|---|---|
| Why You Can't Seriously Say "I'm Not a Designer" | `/blog/not-a-designer/` | standalone; R1 |
| What the System Is Made Of | `/blog/layers/` | Foundations series; R2 |
| The Page Composition Rule | `/blog/page-composition/` | Foundations series; R3 |
| Time as the Main Axis (incl. Parts 2–3: Mobile Responsiveness, Adjusting the Type Scale) | `/blog/layouts/` | Foundations series; R5 |
| Why Have Your Own Graphic Style | `/blog/graphic-style/` | Graphic Style series; R7 |
| Color Under a Purple Lightbulb | `/blog/color/` | Graphic Style series; R8 |
| Five Requirements for Icons | `/blog/icons/` | Graphic Style series; R9 |
| Fingerprints | `/blog/fingerprints/` | placeholder; R10 |
| There has to be a square element | `/tools/square-element/` | moved to Tools → Documents |

"Read next" chain: square element → layers → page-composition → layouts →
graphic-style → color → icons. Each button is revealed with the release of its target.
