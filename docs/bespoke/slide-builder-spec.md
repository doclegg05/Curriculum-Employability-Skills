# BeSpoke slide builder spec

Status: draft for Britt's review, 2026-09-23. Nothing here is built yet.

Britt's direction (2026-09-23): teams build a lesson's look one small decision at a time. Each decision changes the preview at once, is listed in a change history, and persists. Choices already made: see the color step as a mockup first (`bespoke/mockups/color-roles.html`), design four slide types, and make the builder the wizard rather than a side path. The similarity meter stays and must measure real lessons.

Implementation is split into three plans, each shippable on its own:

1. **Design model.** Saved-design format v2, color and contrast rules, slide-piece CSS, validators, lesson CSS generation, and the similarity meter. `docs/superpowers/plans/2026-09-23-slide-builder-design-model.md`.
2. **Builder interface.** The steps below, the live preview, and the change history. Written after Plan 1 lands and Britt has tried the mockup.
3. **Migration and rollout.** Converting saved v1 designs, switching teams over, and retiring the v1 wizard.

## What a team does

| Step | Decisions | Preview shows |
|---|---|---|
| 1. Lesson and team | Unchanged from today | Title slide |
| 2. Colors | Two primary and up to three secondary palette colors, then a color for each role | Title and content slides |
| 3. Fonts and background | Font pairing, background pattern | Content slide |
| 4. Title slide | Text position, logo position, background (solid or gradient) | Title slide |
| 5. Chapter divider | Text position, watermark letter on or off | Divider slide |
| 6. Video slide | Frame, background | Video slide |
| 7. Bullet list | Card look | Content slide with cards and a list |
| 8. Activity | Box look | Activity slide |
| 9. Review and send | Unchanged: save, send to Britt, receipt | Every slide type in turn |

Each step holds two or three decisions with two to four options each. Every option changes the preview. The existing browser sweep (`scripts/test-bespoke-browser.mjs`, "every option in every design step changes the preview") extends to the new steps.

Pointing at an option previews it without choosing it, as the current wizard does. Every choice goes into a change history with undo. Choices save to the browser draft at once, and to the shared team design through the existing autosave and Save.

## Colors and roles

A team picks from the 11-color palette in `template.html` `:root` (CLR-01). Picking colors doesn't paint anything by itself. Each color gets a job through a role:

| Role | Paints | Must be readable against |
|---|---|---|
| `sidebar` | Sidebar background | Text color is chosen for it. The builder overrides all of the template's sidebar text rules, which assume a dark sidebar and pass 4.5:1 only on Navy and Royal |
| `titleBackground` | Title slide background, first gradient stop, left panel of the split layout | |
| `titleBackgroundEnd` | Second gradient stop, right panel of the split layout | |
| `titleText` | Title | Both title backgrounds: 3:1 (large text) |
| `subtitle` | Subtitle and copyright line | Both title backgrounds: 4.5:1 |
| `contentBackground` | Content slide background. Only White or Mist | |
| `heading` | Slide and card headings | Content background: 3:1 |
| `body` | Paragraphs, card text, list text. Only Royal, Navy or Gray | Content background: 4.5:1 |
| `accent` | Rules, card edges, list arrows, active chapter | Content background: 3:1 (WCAG 1.4.11) |
| `button` | Handout and video buttons | Text color is chosen for it |
| `dividerBackground` | Chapter divider background | Text color is chosen for it |

The rules:

- A role may use the team's picked colors plus the neutrals White, Mist, Royal, Navy and Gray. Neutrals are always available so every design can stay readable.
- Gold and Green never color text (CLR-05, CLR-06).
- On a button, divider or solid activity box, the builder picks White or Royal text, whichever contrasts more. Every palette color has one of them at 4.5:1 or better.
- Options that fail a rule are shown switched off with the ratio and the requirement ("1.1:1 on White, needs 3:1"). This is what the mockup does.
- Slide pieces declare every text-on-surface pair they create, including tinted surfaces. A design is valid only if every pair it produces passes. The same check runs in the browser, the Netlify service and the Python submission tools.

## Slide pieces

The pieces live in one data file, `SPOKES Builder/role-components.json`. It also holds the palette and the role table above. Each option's CSS may use only role variables (`--role-*`), palette variables and plain values. It may not contain hex colors. Each option lists the color pairs it creates.

| Slide type | Decision | Options |
|---|---|---|
| Title | Text position | Center, left, bottom-left, split (two panels) |
| Title | Background | Solid, gradient |
| Title | Logo | Above the title, top corner |
| Chapter divider | Text position | Center, left |
| Chapter divider | Watermark letter | Show, hide |
| Video | Frame | Plain, accent frame |
| Video | Background | Content color, accent tint |
| Bullet list | Card look | Left rail, outline, filled |
| Activity | Box look | Tinted, outline, solid |
| Background | Pattern | Plain, dot grid, diagonal, crosshatch |

The split title reuses the layout repaired in PR #28, which came from the released Interview Skills lesson. `scripts/check-title-layouts.mjs` gains the v2 title options.

## What a finished lesson gets

The generator writes one `<style id="theme-override">` block (THM-01), as today. It contains:

1. Self-hosted font faces and the font-pairing overrides (TYP-02, unchanged from v1).
2. Role variables on `body`, for example `--role-heading: var(--mauve);`, plus the generated inks (`--role-button-ink`) and RGB triples for tints (`--role-accent-rgb: 55, 181, 80;`). No new hex values appear, so CLR-01 and CLR-02 hold.
3. The CSS of each chosen option.

The build contract becomes `bespoke-build-contract/v2`. It records the roles and the options. `scripts/bespoke-check-design.py` accepts v1 and v2 contracts.

## Similarity meter

The meter compares a design with the six released lessons on 11 dimensions: the nine measurable roles, the font pairing and the background pattern. It excludes `titleBackgroundEnd` and `dividerBackground`, because released lessons use per-chapter gradients there.

The lesson values come from measuring the real decks, not the preset table. A script opens each `lesson-*/index.html` at 1280×720:

- Surfaces (sidebar, title background, content background) are read from screenshots. Every sampled pixel votes for its nearest palette color, and the majority wins.
- Text colors, the card accent and solid buttons come from computed styles.
- The font pairing is the first font in the title's font list that a catalog pairing uses.
- The pattern comes from `theme-registry.json`.

The results go in a generated file, `bespoke/lesson-fingerprints.json`, which records where each value came from. `quality.sh` re-measures and fails if the file is stale.

Measuring showed why the old meter was off. The released decks have moved past the registry and the palette. Time Management's sidebar is `rgb(16, 32, 51)` with a teal overlay, several title slides are photos under overlays, and Communicating with the Public's title font list starts with Bookman Old Style. Mapping to the nearest palette color is an approximation for these, but it matches what learners see. A value the script can't measure (Time Management's see-through buttons) is left empty and never counts as shared.

This replaces today's preset comparison, which differs from the real lessons: Problem Solving's registered divider isn't its preset's, and real lessons vary cards by chapter while the meter compared one style.

## What stays the same

Private team links, the Netlify service, encryption, revisions and conflicts, history, backups, Send to Britt and receipts don't change. During the switch-over the service and all validators accept `bespoke-selection/v1` and `bespoke-selection/v2`, dispatching on the `schema` field. Redeploy the service before merging any change to what it accepts (see `.claude/MEMORY.md` decision log, 2026-09-23).

## Decisions this reopens

- **D6 and `AGENT_THEMING_GUIDELINES.md` line 60** ("Do not rewrite the colorLead/registry color model"). Roles replace the color lead for v2 designs. The six released lessons keep their v1 entries.
- **D7** (the wizard shows the library catalog). v2 uses its own slide-piece file. The v1 library stays for released lessons and v1 designs.
- **D12 and THM-04** (vary card styles by chapter). v2 starts with one bullet-list look per lesson. Per-chapter variation would return as a later option if Britt wants it.
- **The six presets** stop being starting points. A team could still start from a released lesson's measured colors.
- **Dark lessons** (the Dark Royal pattern, THM-05) are left out of v2 at first. A dark theme needs full color inversion and its own role rules.
- **The design brief** (`bespoke/brief.js`) suggests v1 library choices. Plan 2 decides whether it seeds v2 palette picks or retires.

## Open questions for Britt

1. Should the six released lessons be offered as starting points ("start from Interview Skills' colors")?
2. Is one bullet-list look per lesson enough, or should chapters vary as in v1?
3. Should teams choose video and activity looks per chapter, or once per lesson?
4. Should the brief stay as a way to seed the color picks?
