# Curriculum Employability Skills: project health and runtime review

Review date: 2026-09-22  
Baseline reviewed: `d80a3f7`, branch `codex/bespoke-readiness-foundations`  
Scope: repository architecture, six existing lesson runtimes, release-state evidence, CI and quality gates, local assets/links, accessibility, responsive behavior, offline/static-host assumptions, and canonical builder guardrails. BeSpoke application internals and curriculum fact-checking were handled by other workstreams. No lesson HTML or teaching PDF was changed in this workstream.

## Decision

**The repository foundation is usable and the full configured quality command passes, but the six existing lessons do not have fresh evidence for blanket teaching-release approval.** Three are correctly labeled QA. The three labeled ready have unresolved current runtime/accessibility evidence that conflicts with the locked release gates. The dashboard now says six lessons are “available,” which accurately describes launchability without claiming readiness.

The strongest current positives are local/self-hosted delivery, complete core resource links, critical validator passes, a repaired canonical template, reproducible CI, and a substantially stronger BeSpoke test path. The main readiness blockers are one-screen viewport failures, two verified cases of actually clipped mobile content, serious axe findings outside the first-slide ratchet, missing instructor prompt panels required by the product definition, and historical sign-off evidence that does not match the current files.

## Score for the existing lesson fleet

| Category | Score | Evidence |
|---|---:|---|
| Accessibility | 1/4 | The configured ratchet passes, but it explicitly permits first-slide violations and all-slide testing found serious issues in every lesson. |
| Performance | 2/4 | Videos use `preload="none"` and fonts/assets are local. The working tree is about 1.1 GB and several media assets are 35–41 MB; no performance budget or classroom-network benchmark is enforced. |
| Responsive behavior | 1/4 | Every lesson exceeds the locked one-screen rule at one or more required viewports; Employee Accountability has verified unreachable mobile content. |
| Theming/brand | 3/4 | All critical palette/theme validators pass, the 56-option library is synchronized, and the canonical template now uses self-hosted tokenized fonts. Finished lessons still need rendered acceptance. |
| Implementation integrity | 2/4 | CI and the full local gate pass, but release labels/evidence and product behavior are not fully aligned, and important a11y coverage is first-slide only. |
| **Total** | **9/20 (poor release readiness)** | This score covers the six lesson fleet, not the newly repaired BeSpoke workflow. |

## Findings

### F1. The configured accessibility pass is a regression ratchet, not a clean result (P1)

`scripts/a11y-check.mjs:1-14` states that it audits only the first slide and permits committed findings. The allowlist at `scripts/a11y-baseline.json:9-27` currently permits:

- Communicating with the Public: two color-contrast nodes and seven list nodes.
- Controlling Anger: seven list nodes.
- Employee Accountability: seven list nodes.
- Interview Skills: one unnamed progressbar and seven list nodes.
- Problem Solving and Decision Making: seven list nodes.
- Time Management: clean on slide 1.

The list issue comes from generated sidebar markup such as `lesson-employee-accountability/index.html:4146` and `lesson-interview-skills/index.html:4233`, where a list item is assigned `role="button"` and loses list-item semantics. Interview’s progressbar has no accessible name at `lesson-interview-skills/index.html:4127`.

A separate active-slide scan at 1280x720 found serious findings beyond slide 1 in **all six lessons**:

- Time Management slide 27, “Over-Commitment”: `scrollable-region-focusable`.
- Interview Skills slide 11, “Researching the Employer”: `scrollable-region-focusable`; slide 19, “Basic Interview Tips”: `color-contrast`.
- Employee Accountability slide 8, “Why Accountability Matters for Your Career”: `scrollable-region-focusable`.
- Communicating with the Public slide 1: `color-contrast`; slides 10, “The Communication Cycle,” and 12, “Hearing vs. Listening”: `scrollable-region-focusable`.
- Controlling Anger slides 5, 12, and 26: `scrollable-region-focusable`.
- Problem Solving and Decision Making slide 13, “Let’s Try It Together”: `scrollable-region-focusable`.

These scrollable slides need a keyboard-focusable scrolling region or a layout that does not require internal scrolling. A passing ratchet means no regression beyond the current baseline. It does not satisfy the release checklist’s accessibility gate.

### F2. Reachable scrolling and actual clipping are different; both matter under the locked one-screen rule (P1)

The governing spec requires the active slide to be fully visible on one screen at 360x800, and the sidebar plus active slide to be fully visible at 768x1024 and 1920x1080 (`SPOKES-Agent-Execution-Spec.md:61-68,83-93`; `docs/release-checklist.md:7-13`). The lesson CSS generally uses `overflow-y:auto`, so most measured over-height slides remain reachable by touch or wheel. That behavior is not content loss, but it still fails the explicit one-screen gate.

Measured active slides whose `scrollHeight` exceeded `clientHeight` by more than 2 px:

| Lesson | 360x800 | 768x1024 | 1920x1080 | Hidden/unreachable subset |
|---|---:|---:|---:|---|
| Time Management | 20 | 5 | 2 | Slides 5 and 11 use hidden overflow at all three sizes; observed text remained visible, so this is flagged for author inspection rather than called proven content loss. |
| Interview Skills | 19 | 2 | 0 | 0 |
| Employee Accountability | 17 | 2 | 0 | Slides 3 and 30 at 360x800 use hidden overflow. |
| Communicating with the Public | 20 | 8 | 2 | 0 |
| Controlling Anger | 18 | 4 | 1 | 0 |
| Problem Solving and Decision Making | 12 | 4 | 1 | 0 |

Two visually verified examples establish the distinction:

1. **Reachable internal scroll, but fails one-screen rule:** open `lesson-communicating-with-the-public/index.html` at 360x800, open the sidebar, and choose slide 20, “Practice: Role-Play Scenarios” (`lesson-communicating-with-the-public/index.html:2948`). The active slide is `overflow-y:auto`, 800 px high with a 1,559 px scroll height. A wheel/touch scroll reaches the full 759 px range and the final “Instructor Resource Available” controls. This is not clipped content. It is a large internal scroll that contradicts the locked one-screen requirement. Visual captures: [top](communication-mobile-top-2026-09-22.png) and [bottom](communication-mobile-bottom-2026-09-22.png).

2. **Actually clipped/unreachable:** open `lesson-employee-accountability/index.html` at 360x800, open the sidebar, and choose slide 30, “Write Your SMART Goal” (`lesson-employee-accountability/index.html:3814-3816`). The active slide is `overflow-y:hidden`, 800 px high with a 953 px scroll height. The final cards extend to y=872.8 behind the fixed navigation and cannot be reached by touch/wheel. Only a script-set `scrollTop` exposed the hidden 153 px. Visual capture: [clipped slide 30](accountability-mobile-clipping-2026-09-22.png). Slide 3, “Warm-Up: Share Your Story” (`lesson-employee-accountability/index.html:3155`), also has 87 px hidden at this viewport.

The raw counts should therefore be read as one-screen gate failures, not as a claim that every over-height slide loses content.

### F3. “Ready” registry states are stronger than the current evidence supports (P1)

The registry marks Time Management, Interview Skills, and Employee Accountability `ready` with every quality gate `pass` (`lesson-registry.json:30,53-57`; `:69,92-96`; `:108,131-135`). Current evidence conflicts with those claims:

- F1 shows current serious accessibility issues.
- F2 shows current locked viewport failures and proven clipping.
- The product definition requires a hidden-by-default View Prompt/Hide Prompt panel for every interaction (`docs/final-product-definition.md:57-68`). A literal search across all six lesson HTML files found no `View Prompt`, `Hide Prompt`, `instructor prompt`, or `prompt panel` implementation.
- The March runtime record is tied to `e5f756c` plus same-pass fixes (`docs/qa-reports/manual-runtime-qa-evidence-2026-03-01.md:4-14`), covers only the dashboard and the three then-ready lessons, and says screenshots are in OpenClaw session logs rather than in this repository (`:39,73,107,141`). It claims prompt toggles worked (`:64-65,98-99,132-133`), which is not true of the current lesson files.

The three QA lessons appropriately retain pending accessibility, multimodal, brand, and engagement gates (`lesson-registry.json:147,170-174`; `:186,211-215`; `:227,250-254`). Do not promote any label based only on the configured gate.

The dashboard’s former “6 lessons ready to teach” language counted both `qa` and `ready`. It now says “6 lessons available” at `Dashboard.html:903-910`; registry states were not changed.

### F4. The canonical builder template was a foundation blocker; it is now bounded and gated (fixed)

Before correction, `SPOKES Builder/template.html` produced 18 critical validator failures and depended on Google Fonts. It now:

- self-hosts three font faces and uses `--font-heading` / `--font-body` (`:21-57`);
- includes skip-link, live-region, named progressbar, semantic nav controls, 44 px targets, focus styles, keyboard/touch guards, reduced-motion handling, persistence, video pause, and chapter disclosure behavior;
- includes the required W divider and preserves the W/I/P/E/A role mapping (`:1897-1930`);
- preserves the required `theme-override` integration point (`:1849`);
- resolves its local fixture resources.

Current template result: **68 PASS, 3 WARN, 0 CRITICAL**. The warnings are expected skeleton placeholders: heading hierarchy and no authored checkpoint/activity content.

`scripts/quality.sh:14-18` now validates the canonical template and runs 47 validator regression tests. The validator’s font-token checks now ignore `@font-face` declarations while still detecting hardcoded font use in selectors (`scripts/validate-lesson.py:165-167,352-377`; covered in `scripts/test_validator.py`).

### F5. Quality automation is now portable and covers the new foundation (fixed, with one remaining scope gap)

The original `quality.sh` stopped on macOS Bash 3 because it used `mapfile`. It now uses a Bash-3-compatible read loop (`scripts/quality.sh:30-39`), discovers every `test_bespoke*.py` suite, verifies the Word intake fingerprint, and runs BeSpoke browser and generated-design tests when pinned browser dependencies are present (`:23-60`).

The final full run passed:

- all six lesson critical validators;
- canonical template: 68 pass / 3 warn / 0 critical;
- 47 validator tests;
- registry/dashboard sync across all fallback fields;
- schema and Word intake drift checks;
- 24 BeSpoke Python tests;
- 16 BeSpoke browser scenarios;
- six generated font pairs plus chapter/effect computed-style checks;
- 56-option theme/library synchronization;
- readability baseline: all six under grade 8, median 6.0;
- first-slide axe ratchet: passed with the allowed findings listed in F1.

`scripts/quality.sh:75-86` still limits the committed lesson a11y gate to the first-slide ratchet. Full-slide, locked-viewport, and keyboard-scrolling coverage should be added before using CI as release evidence. Also, local runs explicitly skip browser/a11y checks if `node_modules/playwright` and `axe-core` are absent; CI installs them.

### F6. Dashboard fallback integrity is stronger (fixed)

The offline `FALLBACK_LESSONS` mirror was previously checked only for title and status. `scripts/check-registry-sync.py:20-29,159-177` now compares title, description, theme, path, status, slide count, video count, and implemented-interaction count. The current six entries match.

The Controlling Anger registry note mechanically said 31 slides while both the DOM and registry count are 33. The note is now 33. No status or gate was changed.

### F7. Local static/offline delivery is generally sound; one optional activity requires the internet (positive with disclosure)

- Both direct `file://` and local HTTP dashboard runs rendered six lesson cards with valid local paths. Direct file use emits the expected failed-fetch warning for `lesson-registry.json` and then uses the embedded fallback; this is handled behavior.
- The lesson validator reports all local `href`, `src`, and `poster` references resolve in all six lessons.
- Each lesson contains linked lesson-plan, teacher-guide, and rubric material. PDF counts on disk are: Time 16, Interview 8, Employee Accountability 10, Communicating 5, Anger 11, Problem Solving 10.
- Fonts, images, video, captions, and core PDFs are local. The optional Anger Jeopardy activity is an external dependency at `lesson-controlling-anger/index.html:3708,3717`; offline learners cannot use it.
- GitHub Pages and the quality workflow were green at baseline `d80a3f7`; before local edits, the served Dashboard hash matched the local file. This confirms deployment alignment at the reviewed baseline, not the uncommitted fixes.

### F8. Several active guidance links and historical status statements are stale (P2)

- `SPOKES-Agent-Execution-Spec.md:15,33,38`, `SPOKES Builder/build-process.md:180`, and `SPOKES Builder/ppt-to-spokes/SKILL.md:106,172` reference missing `SPOKES Builder/brand-palette.md`, although README says it was absorbed into `SPOKES-STANDARD.md` and archived.
- `SPOKES-Project-Plan.md:169` references missing `SPOKES Builder/quality-gate.md`.
- `docs/migration-status.md:3-5,30-33` says the release tag was never created and tells the reader to create it. `git tag -l release-2026-03-01-p1` shows it exists.
- `SPOKES-Project-Plan.md:5,14-17` still says only two lessons are in QA and uses the June 2026 plan. Current program language is six future team lessons with a soft March 2027 phase target.

Lead integration corrected these active links, aligned the execution spec's authority order with SPOKES-STANDARD.md, marked the old project milestones historical, and corrected the release-tag statement. Historical findings above describe the reviewed baseline. The current review and builder handoff are linked from the active guidance.

## Per-lesson evidence matrix

“Overflow” is the number of active slides taller than the active-slide viewport, reported as 360 / 768 / 1920 counts. Most are reachable internal scrolls; only the hidden subset in F2 is proven inaccessible.

| Lesson | Registry | Static validator | First-slide ratchet | Additional active-slide axe | Overflow 360/768/1920 | Local resource evidence | Readiness judgment |
|---|---|---|---|---|---:|---|---|
| Time Management | ready, 37 slides, 5 videos | 71 pass, 0 warn, 0 critical | clean | slide 27 serious scroll-region issue | 20 / 5 / 2 | 16 PDFs; lesson plan, guide, rubric; local refs resolve | Not freshly release-certified; inspect two hidden-overflow layouts and complete all-slide/runtime acceptance. |
| Interview Skills | ready, 36, 2 | 67 / 4 / 0 | unnamed progressbar + 7 list nodes | slide 11 scroll-region; slide 19 contrast | 19 / 2 / 0 | 8 PDFs; core three present; local refs resolve | Hold ready claim until current accessibility and viewport evidence is clean. |
| Employee Accountability | ready, 35, 0 | 70 / 1 / 0 | 7 list nodes | slide 8 scroll-region | 17 / 2 / 0 | 10 PDFs; core three present; local refs resolve | Hold ready claim; mobile slides 3 and 30 have hidden overflow, with slide 30 visibly clipping content. |
| Communicating with the Public | qa, 33, 8 | 71 / 0 / 0 | 2 contrast + 7 list nodes | slide 1 contrast; slides 10 and 12 scroll-region | 20 / 8 / 2 | 5 PDFs; core three present; local refs resolve | QA status appropriate; pending gates and broad one-screen failures remain. |
| Controlling Anger | qa, 33, 4 | 71 / 0 / 0 | 7 list nodes | slides 5, 12, 26 scroll-region | 18 / 4 / 1 | 11 PDFs; core three present; local refs resolve; optional Jeopardy is online-only | QA status appropriate; resolve a11y/runtime issues and disclose or replace online-only activity for offline use. |
| Problem Solving and Decision Making | qa, 28, 4 | 71 / 0 / 0 | 7 list nodes | slide 13 scroll-region | 12 / 4 / 1 | 10 PDFs; core three present; local refs resolve | QA status appropriate; complete active-slide accessibility and device evidence. |

## Recommended bounded next work

### R1. Release-state reconciliation

Treat all six lessons as requiring current runtime evidence. Keep QA lessons in QA. For the three ready lessons, either fix and rerun all release gates or change the label/gate metadata through the normal approval process. Do not infer approval from the current CI pass.

### R2. Add release-grade runtime coverage

Extend the committed browser gate to visit every slide at 360x800, 768x1024, and 1920x1080; distinguish `overflow:auto` from `overflow:hidden`; fail on hidden content; test wheel/touch and keyboard access to intentional scroll regions; run axe on the active slide; and save compact evidence by lesson/slide. Keep the one-screen rule as the controlling contract unless the program explicitly changes that rule.

### R3. Fix lessons as a separate, reviewed batch

Prioritize Employee Accountability slides 3 and 30, the serious active-slide axe list in F1, the first-slide baseline violations, and required instructor prompt panels. These changes touch teaching runtimes and should be lesson-specific, visually reviewed, and followed by the full gate. They were intentionally not made in this foundation scope.

### R4. Repair source-of-truth links

Point active guidance to `SPOKES-STANDARD.md` / archived palette material, replace the missing quality-gate reference with `docs/release-checklist.md`, correct the existing release-tag statement, and refresh the project plan to six current lessons plus the March 2027 soft target.

### R5. Preserve offline expectations

Keep core lesson delivery local. Label the external Jeopardy activity optional/online-required or supply an approved local equivalent. Add a file-mode smoke test so the dashboard fallback and local lesson/resource links remain covered.

## Changes made by this workstream

No lesson HTML was changed. Bounded foundation edits were made to:

- `SPOKES Builder/template.html`: critical validator/a11y/navigation fixes, W divider, self-hosted tokenized fonts, local fixture assets, and preserved standard nav/theming contract.
- `scripts/quality.sh`: Bash 3 portability, canonical template validation, complete BeSpoke test discovery, Word-intake drift check, and browser/design harness integration.
- `scripts/validate-lesson.py` and `scripts/test_validator.py`: prevent false font-token warnings from `@font-face` while retaining selector enforcement.
- `scripts/check-registry-sync.py`: compare all dashboard fallback fields.
- `Dashboard.html`: change the launchable count from “ready to teach” to “available.”
- `lesson-registry.json`: correct only the Anger note’s stale 31-slide count to 33.

## Limitations

- No lesson content, assessment, source, or pedagogical fact-checking is included here.
- No lesson HTML or PDF was remediated.
- Captions were checked for track presence, not synchronized against every audio/video file.
- PDFs were inventoried and links resolved; every PDF page was not visually or assistive-technology audited.
- The all-slide axe scan used Chromium at 1280x720; it complements, but does not replace, human screen-reader/keyboard testing.
- The locked-viewport scan measured all active slides in Chromium and visually inspected the two examples in F2. It did not test Safari, Firefox, Windows, or physical touch devices.
- Live Teams/OneDrive workflow, coauthoring, tenant permissions, and synchronization were not exercised.
- The live GitHub/Pages check establishes the reviewed baseline only. No remote systems were changed and the uncommitted foundation fixes were not published.
