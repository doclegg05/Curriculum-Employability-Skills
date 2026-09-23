# BeSpoke slide builder spec

Status: draft for Britt's review, 2026-09-23. Nothing here is built yet.

Britt's direction (2026-09-23): teams build a lesson's look one small decision at a time, the way a PowerPoint user builds a master slide from a choice of layouts. Each decision offers 3 or 4 samples, changes the preview at once, is listed in a change history, and persists. Choices already made: see the color step as a mockup first (`bespoke/mockups/color-roles.html`), design four slide types, give teams a say in each card's layout, colors and type, and make the builder the wizard rather than a side path. The similarity meter stays and must measure real lessons. Teams won't start from a released lesson's look; most will want theirs to differ.

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
| 4. Title slide | Colors, logo position, layout | Title slide |
| 5. Chapter divider | Colors, watermark letter, layout | Divider slide |
| 6. Video slide | Colors, frame, title style, layout | Video slide |
| 7. Bullet list | Card look, layout, title style, colors | Content slide with cards |
| 8. Activity | Colors, label style, layout | Activity slide |
| 9. Review and send | Unchanged: save, send to Britt, receipt | Every slide type in turn |

Each step holds two to four decisions with two to four samples each. Plan 2 shows the samples as thumbnails drawn from the real CSS, the way PowerPoint shows a master slide's layouts. Every option changes the preview. The existing browser sweep (`scripts/test-bespoke-browser.mjs`, "every option in every design step changes the preview") extends to the new steps.

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

| Slide type | Decision | Samples |
|---|---|---|
| Title | Colors | Solid, gradient, light |
| Title | Logo | Above the title, top corner |
| Title | Layout | Centered, left, bottom left, split panels |
| Chapter divider | Colors | Solid, gradient, light |
| Chapter divider | Watermark letter | Show, hide |
| Chapter divider | Layout | Centered, left, band, big number |
| Video | Colors | Light, tinted, dark |
| Video | Frame | Plain, accent frame |
| Video | Title style | Regular, large, small caps |
| Video | Layout | Title above, side by side, title banner |
| Bullet list | Card look | Left rail, outline, filled, top band |
| Bullet list | Layout | Two columns, three across, rows, numbered |
| Bullet list | Title style | Regular, large, small caps |
| Bullet list | Colors | Light, tinted, bold |
| Activity | Colors | Light, tinted, solid |
| Activity | Label style | Small caps, heading font, pill |
| Activity | Layout | Box, callout, label banner, side label |
| Background | Pattern | Plain, dot grid, diagonal, crosshatch |

That is 57 samples across 18 decisions. A few combinations don't work together (split panels with light title colors, a band divider with light colors, a label banner with a pill label). The data file lists them, and the builder switches them off with the reason, the same way it handles an unreadable color.

**Fonts.** SPOKES-STANDARD keeps one font pairing across a lesson (THM-02) and has headings use the heading font (TYP-03). So teams choose the pairing once, in step 3, and each card type gets a title style (regular, large or small caps) within the heading font. A per-card font choice would break both rules. The validator only warns on hard-coded font names, so it would not catch the break.

**Checked while writing the plan.** `scripts/check-v2-layouts.mjs` renders every sample on the template at 1280×720, one decision at a time, and fails on collisions, clipping, overflow, or a layout that isn't where its name says. All 53 layout-bearing samples pass. Its first versions passed broken CSS and missed real faults: rows and three-across overflowing four cards, and side-by-side video stacking because of the template's flex spacers. The final version catches deliberately broken CSS.

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
- **D12 and THM-04** (vary card styles by chapter). v2 gives each card type its own look, chosen once per lesson. Per-chapter variation isn't planned; Britt deferred card design to this spec.
- **The six presets** stop being starting points, and released lessons aren't offered as starting points either (Britt, 2026-09-23).
- **Dark lessons** (the Dark Royal pattern, THM-05) are left out of v2 at first. A dark theme needs full color inversion and its own role rules.
- **The design brief** (`bespoke/brief.js`) suggests v1 library choices. Plan 2 decides whether it seeds v2 palette picks or retires.

## The design brief: recommendation

Britt asked for a recommendation before deciding.

The brief (`bespoke/brief.js`) asks four questions and picks a whole v1 design. It works by scoring every v1 library option on energy, warmth and formality. To keep it for v2 it would need new scores for 57 samples and 11 roles, and it would pick most choices for the team.

| | Keep the brief for v2 | Retire it |
|---|---|---|
| Team experience | A ready-made start after four questions | Teams start from sensible defaults and make each choice |
| Fits the master-slide approach | Partly. It chooses for the team, then they edit | Yes. Every choice is the team's own |
| Differentiation | Built in: it steers away from released lessons | Comes from the meter, which shows the closest lesson live |
| Work | Score 57 samples and 11 roles; retune after pilots | Delete `brief.js`, its tests and the Describe the feel step |
| Risk | Suggestions that feel wrong to teachers (the scores are untested with teams) | Some teams may stall on a blank start |

**Recommendation: retire it.** The builder's whole point is small decisions the team makes itself, and the meter already does the brief's one unique job, keeping lessons distinct. If the Money Management pilot shows teams stalling on the color step, add a single "Suggest two colors" button there, which picks two palette colors far from every released lesson using the fingerprints. That is a few lines on top of Plan 1, not a second design engine. v1 designs saved with a brief keep it; Plan 3 drops it when converting them to v2.

## Open questions for Britt

1. The brief: retire it as recommended above, or keep it?
2. Should the similarity meter warn when a design shares more than a set number of dimensions with a released lesson, or only show the number?
