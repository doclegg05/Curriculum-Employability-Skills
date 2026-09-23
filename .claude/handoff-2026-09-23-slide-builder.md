# Handoff: BeSpoke slide builder, 2026-09-23

Read this, then `.claude/MEMORY.md`, then the spec. Written at the end of a long session so the next one can pick up without the conversation.

## Where things stand

- `main` is at `04f6f9f`. Everything from this session up to the plan is merged and live on Pages. See the table below.
- Plan 1 execution is in progress on branch `claude/slide-builder-design-model`, which is pushed but has no PR yet.
  - **Task 1: complete and reviewed** (`2a12145`, data file `SPOKES Builder/role-components.json`).
  - **Task 2: implemented, NOT reviewed** (`9dfb9ce`, `bespoke/design-model.mjs`). The implementer reports 11/11 tests passing.
  - Tasks 3–8: not started.

## Resume Plan 1

Use `superpowers:subagent-driven-development` with `docs/superpowers/plans/2026-09-23-slide-builder-design-model.md`. Britt chose this method.

1. Check out `claude/slide-builder-design-model`.
2. The SDD ledger lives at `.superpowers/sdd/2026-09-23-slide-builder-design-model/progress.md`. It is git-ignored, so it exists only in the worktree it was written in: `.claude/worktrees/bespoke-wizard-ui-review-c1971a/`. If it's missing, recreate it from this section.
3. Run the Task 2 review first. Base is `2a12145`, head `9dfb9ce`. Then continue with Task 3.
4. Ledger contents to carry over:
   - Pre-flight scan: every task pair is consistent (the controller ran Tasks 1–3, 6 and 8's code while writing the plan).
   - **Ruling:** Task 7's expected intake row becomes `| Title slide, Layout | Centered |`, not the plan's `| Title slide, Text position | Center |`. The data file names the decision "Layout" and the option "Centered"; the plan text predates the catalog revision. Cost if wrong: one test string.
   - Task 1 deferred minor: `test_option_css_has_no_hex_and_only_known_role_variables` checks `--role-*` names but not bare palette variables such as `var(--muted)`.
5. Model choice that worked: `haiku` for implementers (the plan contains the full code), `sonnet` for task reviewers, the most capable model for the final whole-branch review.
6. Before Plan 1 merges, Britt redeploys the Netlify service from the branch, because Task 5 changes what the service accepts. Steps are under "Netlify service" below.

## What Britt decided this session

- **Direction.** BeSpoke becomes a step-by-step slide builder, like building a PowerPoint master slide. Each decision offers 3–4 samples, updates the preview, is tracked and persists.
- **Colors.** The team picks 2 primary and up to 3 secondary palette colors, then assigns them to 11 roles. A mockup is live at `bespoke/mockups/color-roles.html`.
- **Slide types.** Four: chapter divider, video, bullet list, activity. Teams choose layout, colors and type for each.
- **No starting points** from the released lessons; teams want theirs to differ.
- **Rollout.** The builder replaces the wizard (Plan 3).
- **Similarity meter.** Keep it and make it accurate. Plan 1 Task 8 measures the six real decks.
- **Card design** is delegated to Claude's judgement. The result is 57 samples across 18 decisions in the data file.

## Open decisions for Britt

1. **Design brief:** retire it (recommended) or keep it? The consequences table is in `docs/bespoke/slide-builder-spec.md`, "The design brief: recommendation".
2. **Meter:** should it warn above a threshold, or only show the number?
3. **Released decks:** patch their download-button contrast? The library fix (PR #28) doesn't reach them.
4. **Textures:** strengthen them? The library's are 3–8% opacity, and two are nearly invisible.
5. **Old PRs:** #14 and #15 (money-management design submissions, 2026-09-19 and 09-21) are still open. They're v1 Send-to-Britt proposals; Britt decides whether to close them.

## Key documents

| File | What it is |
|---|---|
| `docs/bespoke/slide-builder-spec.md` | The spec: steps, roles and contrast rules, the 57-sample catalog, fonts (THM-02/TYP-03), lesson CSS output, meter, reopened decisions, brief recommendation |
| `docs/superpowers/plans/2026-09-23-slide-builder-design-model.md` | Plan 1: eight TDD tasks with full code |
| `SPOKES Builder/role-components.json` | The catalog (on the feature branch) |
| `bespoke/mockups/color-roles.html` | Color-step mockup (live) |
| `.claude/MEMORY.md` | Project memory. The decision log has the 2026-09-23 rows |

Plans 2 (builder interface) and 3 (migration and rollout) aren't written yet. Write them after Plan 1 lands.

## PRs merged this session

| PR | What |
|---|---|
| #25 | Design brief step, starting point, closest-lesson meter, wizard layout fixes; `brief` in the payload |
| #26, #32 | Memory updates |
| #27 | Color lead opens on the content slide |
| #28 | Download-button AA contrast for every lead; Split Hero, Diagonal Split and title-rule repairs; `check-title-layouts.mjs`, `test_bespoke_theme_contrast.py` |
| #29 | Background textures shown on the content slide |
| #30 | Color-roles mockup |
| #31 | Per-chapter card picker; browser sweep "every option changes the preview" |
| #33 | Slide-builder spec and Plan 1 |

## Netlify service

- Site `spokes-bespoke`, ID `2e3cf93e-2c1c-4a73-93b0-b825f7ce9ca3`. Live deploy: `6ab3ebad54816f0e2b364fa9` (PR #25 schema).
- Claude stages the service; Britt runs the deploy. The permission check blocked Claude's deploy call, so don't route around it.
  - Stage: `node scripts/bespoke-stage-service.mjs "<new folder outside the repo>"`, then byte-compare the staged files with the branch.
  - Deploy (Britt, from inside the stage folder): `npx netlify-cli deploy --prod --site 2e3cf93e-2c1c-4a73-93b0-b825f7ce9ca3 --dir netlify/site --functions netlify/functions`
- The Netlify CLI on the Mac is logged in as Britt.
- Checks after a deploy that need no secrets: the site's published deploy ID, an OPTIONS preflight (expect 204), and a POST with a bogus access code (expect 403 "code").
- Private auto-memory `bespoke-netlify-deploy` holds the same details.

## Lessons from this session

- **Every "the preview doesn't change" report had the same root cause.** A choice rendered on a slide where it has no effect, or the preview didn't mirror the template. The fix pattern: open the step on the slide where the choice shows, mirror the template's markup, and scale library px/rem (`--pv-px = 100cqi / 1280`). `scripts/test-bespoke-browser.mjs` has a sweep that fails if any option leaves the preview unchanged.
- **Prove a checker can fail before trusting a pass.** The title-layout and v2-layout checkers both passed broken CSS in their first versions.
- **The released decks have drifted from the registry and palette.** They use photo title backgrounds and off-palette colors such as Time Management's `rgb(16, 32, 51)`. Parse CSS and you measure the wrong thing; measure pixels.
- **The template's active slides are flex columns with `::before`/`::after` spacers.** A layout that switches a slide to grid must hide them.
- **A stale browser cache can look like a bug.** In the local browser pane, refresh with `fetch(url, {cache: 'reload'})` before re-testing; on Pages, a hard refresh.
