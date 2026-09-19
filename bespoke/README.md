# Bespoke (prototype)

Instructor design-choice wizard for Round 2 SPOKES lessons. Hosted from this repo on GitHub Pages.

## Try it

1. Open the Pages site root, then **`/bespoke/`**  
   Example: `https://<org-or-user>.github.io/Curriculum-Employability-Skills/bespoke/`
2. Or open `bespoke/index.html` from the curriculum hub (**Dashboard.html** → “Open Bespoke”).
3. Pick a lesson + spokesperson, choose a **theme preset** (or edit every option), watch the **Spokes Model** preview, then **Submit Spoke Signal**.

Steps: Lesson & team · Theme preset · Color lead · Sidebar & background · Title & dividers · Cards · Fonts · Your content · Review & submit. The preview follows the step (title slide → content slide) and shows the same 16:9 frame at every screen size; catalog ids live in a collapsed **For builders** note on Review.

## What ships in this prototype

- Loads **`SPOKES Builder/bespoke-library-catalog.json`** for selectable options (cards, dividers, title slides, textures, color leads, sidebars)
- UI keys = `{family}.{slug}` (e.g. `cards.top-accent`); intake / selection payload persists **slug only**
- Six theme presets: Professional, Modern, Serious, Light-hearted, Fun, Outspoken (starters; all editable after)
- Demo-first Spokes Model (sample content, not a full lesson build)
- Opt-in vary card style by WIPPEA chapter (D12) with THM-04 adjacent uniqueness
- Emits filled `content-intake-template.md` shape + `selection.json` (D11)
- Spoke Signals: browser opens a labeled GitHub issue (no token in the browser); Action opens a lesson-tagged PR
- Docs: `SPOKES Builder/bespoke-library-ids.md` · visual ref: `SPOKES Builder/library-preview.html`

## Catalog sources

| File | Role |
|------|------|
| `SPOKES Builder/bespoke-library-catalog.json` | Authoritative option list (from card-library workstream) |
| `bespoke/catalog.json` | Lessons, presets, font pairings, color-lead preview cues |
| `SPOKES Builder/theme-library.css` | CSS snippets agents copy into `theme-override` |

## Spoke Signals

1. Submit downloads `*-selection.json` and `*-content-intake.md`.
2. Open the pre-filled **Spoke Signal** issue (or paste the JSON between the payload markers).
3. Workflow `.github/workflows/spoke-signals.yml` creates `docs/phase-2/submissions/<lesson>/<date>/` and opens a PR tagged with the lesson id.
4. Britt reviews; **merge = greenlight to build** (D10).

Manual test path: Actions → **Spoke Signals** → Run workflow → paste JSON into `payload_json`.

## Decisions

See `docs/bespoke/decisions.md` (greenlit lock file mirrored from the project store).
