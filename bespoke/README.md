# Bespoke (prototype)

Instructor design-choice wizard for Round 2 SPOKES lessons. Hosted from this repo on GitHub Pages.

## Try it

1. Open the Pages site root, then **`/bespoke/`**  
   Example: `https://<org-or-user>.github.io/Curriculum-Employability-Skills/bespoke/`
2. Or open `bespoke/index.html` from the curriculum hub (**Dashboard.html** → “Open Bespoke”).
3. Pick a lesson + spokesperson, choose a **theme preset** (or edit every option), watch the **Spokes Model** preview, then **Submit Spoke Signal**.
4. Choices save on this computer as you go. On Review, **Copy view link for your team** (read-only) and **Copy edit link (team lead only)** (this computer). The team cannot change or submit from the view link.

Steps: Lesson & team · Theme preset · Color lead · Sidebar & background · Title & dividers · Cards · Fonts · Your content · Review & submit. The preview follows the step (title slide → content slide) and shows the same 16:9 frame at every screen size; catalog ids live in a collapsed **For builders** note on Review. Instructors never need a design file.

## What ships in this prototype

- Loads **`SPOKES Builder/bespoke-library-catalog.json`** for selectable options (cards, dividers, title slides, textures, color leads, sidebars)
- Preview styles come from **`SPOKES Builder/theme-options.json`** (same CSS the generator writes to `theme-library.css`) injected into template markup
- UI keys = `{family}.{slug}` (e.g. `cards.top-accent`); intake / selection payload persists **slug only**
- Six theme presets: Professional, Modern, Serious, Light-hearted, Fun, Outspoken (starters; all editable after)
- Demo-first Spokes Model (sample content, not a full lesson build)
- Opt-in vary card style by WIPPEA chapter (D12) with THM-04 adjacent uniqueness
- Lead choices auto-save in this browser. A view link (`#v=`, compressed `bespoke-selection/v1`) is read-only and does not write that draft. An edit link (`#e=`, secret token) restores the editable draft on this computer only. `scripts/bespoke-write-submission.py` is the single source of `content-intake.md` in the PR (FID-7)
- Spoke Signals: the lead’s browser opens a labeled GitHub issue (no token in the browser); Action opens a lesson-tagged PR. Design-file download/open stays under **For builders**
- Docs: `SPOKES Builder/bespoke-library-ids.md` · visual ref: `SPOKES Builder/library-preview.html`

## Catalog sources

| File | Role |
|------|------|
| `SPOKES Builder/bespoke-library-catalog.json` | Authoritative option list (optional `blocked` + `reason`) |
| `SPOKES Builder/theme-options.json` | Uncommented CSS snippets (FID-3 single source) |
| `bespoke/catalog.json` | Lessons, presets, font pairings, color-lead preview cues |
| `SPOKES Builder/theme-library.css` | Generated agent-facing library (`generate-theme-library.py`) |
| `bespoke/selection.schema.json` | Generated selection payload schema (`generate-selection-schema.py`) |

## Spoke Signals

1. The team lead submits from an editable session. The issue body still carries `bespoke-selection/v1` between the payload markers (unchanged Action contract).
2. Open the pre-filled **Spoke Signal** issue (or, if the issue URL is too long, a builder downloads the design file from **For builders** and adds `selection.json` between the payload markers).
3. Workflow `.github/workflows/spoke-signals.yml` runs `bespoke-write-submission.py` to create `docs/phase-2/submissions/<lesson>/<date>/{selection.json,content-intake.md}` and opens a PR tagged with the lesson id.
4. Britt reviews; **merge = greenlight to build** (D10). Registry upsert via `bespoke-apply-selection.py` is available as a script but not yet wired into the Action.

View links are not a submit path. There are no accounts (D2): edit rights are the secret token saved with the lead draft in this browser.

Manual test path: Actions → **Spoke Signals** → Run workflow → paste JSON into `payload_json`.

## Decisions

See `docs/bespoke/decisions.md` (greenlit lock file mirrored from the project store).
