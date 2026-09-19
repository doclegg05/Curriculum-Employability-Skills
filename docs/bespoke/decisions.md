# Bespoke decisions — prototype (greenlit)

**Status: GREENLIT** (Britt, 2026-09-18). Build the prototype.

Source of truth at greenlight: project store `docs/bespoke-open-questions.md`. This file mirrors the locked table into the curriculum repo.

## Locked

| Item | Decision |
|------|----------|
| D6 | Keep existing colors; present for choice / legal mix-match. |
| D7 / library | Same product as wizard: catalog of colors, cards, layouts the wizard displays. |
| D10 | Submit → PR; Britt sole gate; merge = greenlight to build lesson. |
| D11 | Wizard fills `content-intake-template.md`; template canonical. |
| D12 | Opt-in vary card styles by chapter / topic; function = different library pieces for different jobs. |
| Hosting | Same repo; GitHub Pages; no custom domain required for prototype. |
| Wizard | One app; team ≈ lesson + spokesperson; demo-first Spokes Model; submit → Action → lesson-tagged PR. |
| Presets | Six: Professional, Modern, Serious, Light-hearted, Fun, Outspoken. Fully editable after pick. |
| Timeline | Undetermined; prototype. |
| Build shape | Library + wizard together (one product). |

## Build workstreams

1. Core: catalog + wizard UI + demo preview + dashboard link + Spoke Signals Action — this PR
2. Library: expanded selectable card/layout variations feeding the catalog — parallel workstream

## Library registration

Wizard loads `SPOKES Builder/bespoke-library-catalog.json` (see companion card-library PR). UI keys are `{family}.{slug}`; registry/intake fields store **slug only**. Color leads remain display/choice only (D6). Docs: `SPOKES Builder/bespoke-library-ids.md`.

## Concept brief

`docs/briefs/instructor-lesson-studio-concept-2026-09-17.md` (when merged from the briefs PR). Follow where it does not conflict with this lock file — **decisions win**.
