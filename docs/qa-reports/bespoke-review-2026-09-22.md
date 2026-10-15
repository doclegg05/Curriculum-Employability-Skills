# BeSpoke pipeline review and foundation changes

Scope: refreshed baseline d80a3f7, six Round 2 lesson choices, file handoff through teacher Teams/OneDrive. No lessons, production records, real account access, deployment, PR, or publication created. Parent owns browser save/reopen UX and teaching-team materials; this report covers pipeline and design handoff.

## Findings addressed

1. **P1: Same-day proposals silently replaced each other.** Baseline writer addressed packages only by lesson/date and overwrote both selection and intake; issue workflow used the same branch for every team on that lesson/date. A second teacher/team submission could erase the first proposal. Current `scripts/bespoke-write-submission.py:87-116` uses a validated date plus 16-character selection SHA, refuses divergent files at an existing destination, preserves completed intake on exact retry, stages all four files before rename. `.github/workflows/spoke-signals.yml:89-99` uses that identifier for branch and a path allowlist. Regression covers two different same-day proposals and exact retry preserving teacher-completed intake.

2. **P1: Validation was disconnected from writes.** Baseline writer accepted arbitrary schema-matching lesson/date text; `lesson.id='../../escape'` wrote under `docs/escape/...` in a temporary directory. Baseline registry apply accepted off-catalog theme choices. Validator crashed with AttributeError on `theme='invalid'` despite already finding a schema type error. Current `scripts/bespoke_support.py:14-21`, writer line 88, apply line 197, and workflow lines 75-82 validate before mutation. Schema now limits to six current lesson IDs and unblocked catalog values; date validity/whitespace names/explicit chapter variation are checked (`scripts/validate-bespoke-selection.py:116-151`). Invalid objects, traversal attempts, invalid calendar dates, unknown lessons and off-brand values are covered.

3. **P1: Apply could downgrade released lessons or overwrite a newer pending proposal.** Baseline `upsert_lesson_registry` always set `bespoke-pending`, preserving slide counts but changing status and theme. Current `scripts/bespoke-apply-selection.py:197-217` validates and works on copies, rejects any built/released existing lesson, and requires the exact current digest when replacing a different pending proposal. This remains an explicit builder operation after Britt approval; issue submission never applies registries. Tests prove rejection leaves input registries unchanged and a stale digest cannot replace a current proposal.

4. **P1: Intake falsely promoted demo text and lost most canonical structure.** Baseline writer assigned preview bullets to Warm-Up and myth/reality to Introduction and omitted P1–A with a claim full content was delivered through OneDrive. Current `scripts/bespoke-write-submission.py:32-83` reads the actual canonical template, fills only known overview metadata, preserves all stages and the content agent's additional source/KEEP VERBATIM/approval sections, and appends preview copy explicitly labeled sample-only. User pipes/newlines cannot break metadata tables and embedded backtick fences cannot break sample boundaries. Regression covers all seven stages and fence preservation.

5. **P1: No deterministic appearance artifact linked approved choices to final HTML.** Current `scripts/bespoke_design.py:18-99` automatically assembles `design.css` and `build-contract.json` during intake; maps seven chapters; selects self-hosted fonts; substitutes catalog scopes; records selection/library/template/CSS digests. It explicitly overrides every canonical heading/body selector, so hardcoded base fonts cannot defeat teacher choice. `scripts/bespoke-check-design.py:45-66` rejects wrong/missing provenance, changed CSS, wrong chapter map, missing font files, or absent dark class. This is a static contract check, not computed visual certification. The teacher-approved original design file is retained alongside artifacts.

6. **P1: Two confirmed library choices violated existing rules.** `gradient-fill` cards force white text across a gold gradient (ordinary-text contrast failure); `split-panel` divider overwrites its `::after` chapter watermark. Both are blocked with reasons in source catalog (`SPOKES Builder/bespoke-library-catalog.json:94-95,221-222`) and theme manifest (`SPOKES Builder/theme-options.json:334-335,500-501`), excluded from generated selection enums, explicitly marked BLOCKED in generated agent-facing CSS, and tested against submission. Outspoken now selects `stamp-frame` and `gold-rail`, keeping an existing bold style. This does not certify every remaining combination.

7. **P2: Library source CSS contained prose and unrelated overrides.** `backgroundTextures.plain` began with raw explanation text that contaminated the selector; `sidebarColors.royal` was a copy of the full royal lead, changing backgrounds/headings/buttons. Both source snippets and generated theme-library.css are corrected. Regression confirms clean plain background and sidebar-only override. Generator/library sync checks pass. Parent browser audit also isolated Fun preset divider chapter-label contrast (70% white on primary); bold-full-bleed now uses full canonical white and the library was regenerated. Lead recheck passed all 18 preset/view combinations.

8. **P2: GitHub issue path assumed verification after PR creation.** Workflow now runs schema validation and all Bespoke Python regression tests before creating the draft, stores temporary input outside tracked workspace, restricts committed files to the submission folder, requests doclegg05 review and comments with the actual resulting PR URL. Current GitHub documentation says token-created opened/synchronize/reopened PR workflows enter an approval-required state, so approval and full quality before merging are explicitly required. Source: https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow (checked September 22, 2026). Britt-only approval requires repository protection settings; merely requesting her review is not access control. No remote settings were changed or tested.

## Workflow for beginner teachers

Teachers save a team file and place it in the existing shared folder. Britt/builder ingests the downloaded or locally synced file with one command:

`python3 scripts/bespoke-write-submission.py "/absolute/path/to/team-selection.json"`

No GitHub account or terminal step is required from a teacher. No automatic OneDrive watching/sync integration is claimed. `docs/bespoke/builder-handoff.md` documents intake, retries, approval, registry dry run, design contract installation and final checks. Parent should link it from the required builder guidance and main BeSpoke README.

## Verification evidence

- Baseline: 11 existing Python Bespoke tests passed despite the reproduced defects.
- Updated: **24 Python Bespoke tests pass**, including malformed types, traversal, unknown lessons, invalid dates, blocked choices, same-day independent proposals, exact retry retaining intake edits, released-lesson protection, stale pending selection, all six starter presets, canonical intake preservation, and positive/negative final HTML contract fixtures.
- `python3 scripts/generate-selection-schema.py --check`: pass.
- `python3 scripts/check-library-sync.py`: pass, 56 catalog options/56 manifest entries, generator current.
- `python3 scripts/generate-theme-library.py --check`: pass.
- Workflow embedded JS parses in an async wrapper (matching github-script execution). PyYAML is unavailable in this runtime; no live GitHub workflow run performed.
- Synthetic CLI ingestion generated four files plus validated GitHub outputs in `/tmp/bespoke-handoff-smoke` only.
- Headless Chromium loaded a temporary canonical-template fixture with generated overrides for **all six font pairings**. Computed title, card, matrix, body and chapter-label fonts matched each chosen pairing. External HTTP requests were blocked. No new repo lesson files were created. Fixtures at `/tmp/bespoke-font-contract-smoke`.

## Remaining limits / required release work

- Full chosen-combination visual/contrast/projector/mobile acceptance remains necessary. Static CSS identity cannot detect a later inline override, entirely different markup, missing component content, or every cascade/contrast problem. The checker states this limit.
- Base template initially omitted the Warm-Up divider and hardcoded fonts; project-health agent repaired these foundations. Persistent computed-design regression runs against that corrected template.
- Authoritative file ownership, original source completeness, KEEP VERBATIM approval and OneDrive permissions require the coordinator/team handoff. The browser/ZIP/JSON file does not authenticate a teacher or synchronize ongoing edits.
- Updating two registry JSON files is an explicit local builder action; no cross-file transaction or background multi-writer locking exists. Pending digest precondition prevents stale proposals; perform this step in the build branch under one coordinator.
- No automatic new-lesson generator, content authoring, deployment, or final lesson release was created.


## Final follow-up verification

`node scripts/test-bespoke-design.mjs` now persistently verifies all six generated
font pairings and static final contracts against the corrected canonical template.
It additionally checks title border, divider border, card border/outline, sidebar,
background texture, color-lead effects and the I/chapter-2 card variation through
Chromium computed styles. It passed after the template repair. Generated fixtures
are temporary and removed automatically. All 24 Python Bespoke tests also pass
against the corrected template.

Bounded frontend peer review found the recovery path accepted any numeric saved
step, so localStorage `{step:999,stepId:"unknown"}` could cause a render failure
instead of recovery UX. Sent the precise finding to root (frontend owner) for
clamping/validation. No root-owned frontend files were edited by this agent.
