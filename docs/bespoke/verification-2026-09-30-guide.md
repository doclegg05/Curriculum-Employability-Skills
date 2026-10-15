# BeSpoke guided mode verification, 2026-09-30

Branch `claude/bespoke-guided-workflow`, built on `codex/bespoke-guided-builder`. Spec: `docs/superpowers/specs/2026-09-30-bespoke-guided-workflow-design.md`. Plan: `docs/superpowers/plans/2026-09-30-bespoke-guided-mode.md`.

This records what was run and what was seen. It does not establish hosted readiness or teacher readiness.

## What was built

An optional **Guide me step by step** walk-through on the Start stage. It asks 40 questions, one per screen, slide by slide: starting look, shared look, then title slide, chapter divider, text boxes, video slide and activity. The free editor is unchanged. The guide writes the same saved design, so the schema, the model, the catalog and the Netlify service are untouched.

## Commands and results

| Command | Result |
|---|---|
| `node --test scripts/test-bespoke-guide.mjs` | 30 tests, 0 failures |
| `node scripts/test-bespoke-guided-browser.mjs` | 20 scenarios passed, no runtime errors or external requests |
| `node scripts/test-bespoke-builder-browser.mjs` | 14 scenarios passed (same as before the change) |
| `node scripts/test-bespoke-streamlined-workflow.mjs` | 6 scenarios passed |
| `bash scripts/quality.sh` | `quality.sh: all checks passed` |
| `git diff codex/bespoke-guided-builder --stat -- bespoke/selection-v2.schema.json bespoke/builder-model.mjs bespoke/builder-catalog.json netlify` | no output |

`quality.sh` prints one line starting `FAIL`: `scripts/test-fixtures/bespoke/selection-invalid-slug.json`. That is the intentional negative fixture, run with `--expect-fail`.

The accessibility check on guided screens was confirmed able to fail: injecting an unlabeled button into the panel makes the same axe call report `button-name`.

## Looked at by hand

Screenshots of the title layout, title color, and text box layout screens at 1440 px wide, and of the title color and title recap screens at 390 px wide.

- The sample pictures are 16:9 miniatures of the real slides, legible, with the chosen one outlined.
- Color suggestions show a plain readability note under each color.
- On a 390 px phone the question starts below the header, notices and stage list that the existing builder already stacks, so the samples need a scroll. Next stays reachable after scrolling. This matches the free editor's layout and was not changed.

## Findings

1. **Hover preview looped.** Hovering a hard-to-read color made the preview's advisory box appear, which grew the page by 230 px, shifted the scroll under the pointer, ended the hover, and repeated. Hover previews now redraw only the slide.
2. **Across and Balanced grid look the same at laptop width.** At 1440 px wide the preview is 752 px wide and both box layouts render as two columns. At 1920 px wide they differ (three or four columns against two). This is existing preview behavior and affects the free editor too. The guided sweep runs at 1920 px for that reason, so it cannot catch an option that is dead only below that width.
3. **Video body text is hidden by the model**, so the guide asks no text-color question for the video slide.
4. **Reopening the page with no design change** re-applies the shared design and returns to the Start stage. The guide's position is kept, and Start offers Continue guide. After a real choice, reopening returns to the guide directly.

## Not verified

- No teacher has used the guide. The Money Management pilot is the next check.
- Hosted save, reopen on another computer, and Send were not exercised with a guided design.
- The every-sample sweep covers one viewport size. The phone and keyboard scenarios cover a handful of screens, not all 40.
- Shared-look questions reuse the builder's Shared/Custom note, which uses some of its own wording. That text is excluded from the plain-language check.
