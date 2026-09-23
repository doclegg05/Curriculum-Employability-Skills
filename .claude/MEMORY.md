# Project Memory

## Project Overview
- **Name**: SPOKES Employability Skills Curriculum
- **Description**: 6 self-contained interactive HTML lesson decks + dashboard launcher, validated against SPOKES-STANDARD.md; plus BeSpoke, the instructor visual-design wizard for the next 6 lessons
- **Tech stack**: Static HTML/CSS/JS (one index.html per lesson), Python validator/tooling, no build step. BeSpoke: static wizard on GitHub Pages + Netlify function (Node 22) for shared Save/Open/Send. Node only for tests (Playwright, axe-core)
- **Repo**: origin = doclegg05/Curriculum-Employability-Skills (dev); publisher = SPOKES-Skills/Employability-Skills-Curriculum (public Pages); t9 = /Volumes/T9 backup mirror

## Current Status
(as of 2026-09-23, `origin/main` = `efe2e8e`)
- **Six existing lessons: OUT OF QA, READY FOR TEACHING** (Britt, 2026-09-23). This supersedes the 2026-09-22 review's "no blanket teaching release" verdict. Registry, Dashboard fallback, README and Project Plan updated to match the same day.
- **BeSpoke: built, deployed, live-verified 2026-09-22** (`docs/bespoke/verification-2026-09-22.md`). Private per-lesson team links, encrypted shared Save/Open, History, Download/Open backup, Send to Britt → receipt-confirmed draft PR. Scope is visual design only (colors, fonts, layouts, cards); no lesson is built by it.
- **Moving to Phase 2 (Round 2): the next six lessons** — Goal Setting, Money Management (Budget), Professionalism and Diversity, Knowing Your Rights in the Workplace, Communicating Assertively, Workplace Ethics. Unbuilt; March 2027 soft target. Building needs separate Britt authorization + complete approved content.
- Quality gate (`scripts/quality.sh`) green in CI; re-checked locally 2026-09-23 (validators, validator tests, BeSpoke Python tests, 26 Node handoff/provision tests, registry sync). Browser/a11y portions not re-run that day.

## Last Session
- **Date**: 2026-09-23
- **What we worked on**: Full folder review/orientation (read-only) and this memory refresh. Memory had not been updated since 2026-08-17; work between then and now happened in Codex/Cursor sessions and PRs #4–#21:
  - 2026-08-31: CI quality gate (`.github/workflows/quality.yml`), self-contained quality script, gitleaks (PRs #4–#6)
  - 2026-09-17: conference briefs captured (Money Management topics, instructor intake, lesson-studio concept)
  - 2026-09-18: Britt greenlit the BeSpoke prototype (`docs/bespoke/decisions.md`)
  - 2026-09-19 → 09-21: wizard prototype, UI polish, card/layout library, selection schema, theme library, apply-selection, edit-code view links (PRs #7–#16)
  - 2026-09-22: readiness foundations + project review (#17), Netlify auto-handoff (#18), durable team sessions (#19), live verification (#21)
- **What we decided**: Britt declared all six Phase 1 lessons out of QA and ready for teaching; project moves to Phase 2 (Round 2). Registry/README/Project Plan updated to match.
- **Where we left off**: Review delivered to Britt. Next candidates: publisher catch-up decision, Money Management pilot, teacher editorial pass.

## Open Items
- [ ] **Publisher site is 46 commits behind** (stuck at Aug 17 `fb9e202`). Britt to decide whether BeSpoke belongs on the public site before `git push publisher main:main`. Two live Pages sites still exist; canonical URL undecided.
- [ ] **Money Management BeSpoke pilot** with a beginner spokesperson: open, edit, save, reopen, send (review's "Now" step). Actual Teams/tenant behaviour never exercised.
- [ ] **13 content findings from 09-22 review** — confirm with Britt whether these were resolved or accepted as part of the ready decision (e.g. Interview Skills overwork example + AI-dependent grading; Employee Accountability 7-vs-"15" habits and 120-pt rubric; Controlling Anger unsafe assessment guidance/stale guide; Problem Solving survival-exercise inconsistency). Not software work; do not silently rewrite.
- [x] Synced to the 2026-09-23 "all six ready" decision: registry v1.3.0 (3 lessons qa→ready, pending gates→pass, dated note on all six), Dashboard FALLBACK_LESSONS + sync date, README status, SPOKES-Project-Plan header/summary (flags that its old "Phase 2: Pipeline" ≠ program Phase 2). quality.sh passed after.
- [x] Project `CLAUDE.md` reworded: 09-22 review is earlier evidence, not open release blockers.
- [ ] Britt-only approval is not enforced: `main` requires `quality` check but `required_pull_request_reviews` is null. Settings change is Britt's call.
- [ ] BeSpoke library: `gradient-fill` cards and `split-panel` dividers blocked pending contrast/watermark repairs.
- [ ] Expected WARNs to eventually fix: interview-skills CMP-01/02 + NAV-11/12 (qa-* classes), employee-accountability NAV-11 (showTab signature); EA announcer omits "Slide X of Y" (NAV-04 divergence).
- [ ] Dashboard (kept original design 2026-08-05; **do not re-propose unifying card art** — Britt values the six distinct images). Still open: (a) grouping/wayfinding for 18 modules needs a `group`/`track` registry field — Britt's product call; (b) ragged 4+2 last row above 1501px.
- [ ] Six rejected `Dashboard-*.html` prototypes + 3 fonts only they use (archivo, public-sans, schibsted-grotesk) still committed. Britt asked once, no answer — ask again before deleting.
- [ ] Registry `slides`/`videos` fields: regenerate when decks change; FALLBACK_LESSONS in Dashboard.html must stay in sync (checked by `check-registry-sync.py`).
- [ ] Critique items deliberately NOT actioned (locked nav engine/base CSS): chapter-header click force-navigates; playClickSound + reveal-item dead code; bounce easing on takeaway-num; sidebar/progress/slide-list layout transitions. Parked design questions: WIPPEA badges student-facing, iceberg metaphor as real visual, emotional-arc chapter theming.
- [ ] Consider running the CA polish patterns over the other 5 decks (invisible h3 on light panels, text-on-gold contrast, mobile flip-card flex collapse, square photos in circles).
- [ ] PDF generators (generate_teachers_guides.py, generate_presenter_notes.py) are Windows-only; teachers-guide script has ~1,400 lines of shadowed dead code.
- [ ] ~9.5 MB unreferenced ppt-inspiration images in communicating-with-the-public; image1.png is 10.5 MB unoptimized.
- [ ] Consider Git LFS / external hosting for ~350 MB of videos (24 MP4s committed directly).
- [ ] Governance doc sprawl: SPOKES-Project-Plan, Master-Action-Plan, Agent-Execution-Spec, Agent-Runbook + `conductor/` overlap. Candidate for consolidation.

## Key Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-09-23 | Six Phase 1 lessons declared out of QA and ready for teaching; project moves to Phase 2 (next six lessons) | Britt's call |
| 2026-09-22 | Supervised BeSpoke pilot approved; no blanket teaching release for the 6 existing lessons | Validators pass but content/assessment findings remain; automated pass ≠ instructional approval |
| 2026-09-22 | BeSpoke teacher workflow is visual design only; Word lesson-content form removed | Britt clarified scope; content writing stays a separate process |
| 2026-09-22 | Shared Save/Open via Netlify function + encrypted drafts; OneDrive is optional backup only | File-based OneDrive handoff was too easy to mistake for durable shared work (review F1) |
| 2026-09-18 | BeSpoke prototype greenlit; locks D6–D12 in `docs/bespoke/decisions.md` | Britt greenlight after 09-17 conference briefs |
| 2026-08-05 | Dashboard keeps the card grid (canon), judged at two craft bars instead of a new visual world | Britt declined four rolled directions in a row; the form was never the problem, the execution was |
| 2026-08-05 | Card art is generated from the registry, not sourced as images | `icon`, `colorLead` and `texture` already exist per lesson; drawing from them fixes the six-unrelated-styles problem with product truth and revives the dead ICON_MAP the 22/40 critique flagged |
| 2026-08-05 | Per-lesson text colour is chosen by verified contrast, not by taste | White clears AA on blue/royal/mauve, royal ink on green/gold; this is the root fix for the critique's P1 CTA-contrast failure |
| 2026-08-03 | Registry statuses: 3 lessons "ready", 3 stay "qa" | Notes said release-approved but status stuck at qa; dashboard showed "0 Ready" |
| 2026-08-03 | Hook lives in .claude/settings.json (shared), not settings.local.json | Local file is per-machine; hook is team infrastructure |
| 2026-08-03 | Validator WARNs surface real divergences instead of auto-passing | Perfect 68/0/0 scores were partly hardcoded; honesty over optics |
| 2026-08-03 | big-rocks.vtt gets music-descriptor cues, not speech captions | Video verified music-only with on-screen text (whiteboard animation) |
| 2026-08-03 | Classroom type scale: 19px root font at ≥1600×920, per deck | Britt found content too small at 1920×1080; decks are rem-based so one lever scales all; scoped to avoid the ≤900px fit-guard |
| 2026-08-03 | Scale/override blocks go at the END of theme-override | Media queries don't add specificity; later same-specificity rules silently win — bit us twice (CWP icons, PSDM closing h2) |

## Architecture Notes
- TWO GitHub repos, one history: publisher (`SPOKES-Skills/Employability-Skills-Curriculum`) is the public home + Pages site; origin (`doclegg05/...`) is the dev repo and the one that moves. Publisher carries no unique commits — catching up is `git push publisher main:main`. Both public; dev repo ALSO serves Pages.
- **BeSpoke**: wizard in `bespoke/` (GitHub Pages `/bespoke/`); service in `netlify/functions/bespoke-handoff.mjs` (site `spokes-bespoke`, publishes only `netlify/site`). Drafts encrypted on the `bespoke-drafts` branch; separate encryption key survives GitHub token rotation. Send → Spoke Signals Action (`.github/workflows/spoke-signals.yml`) → draft PR with selection, generated CSS, build contract. Proposals are PUBLIC (public repo); UI discloses this.
- BeSpoke catalog/library: `SPOKES Builder/bespoke-library-catalog.json`, `theme-library.css`, `theme-options.json`; schema generated by `scripts/generate-selection-schema.py` (`--check` in CI). Builder procedure: `docs/bespoke/builder-handoff.md`; admin/provisioning: `docs/bespoke/auto-handoff-setup.md`.
- Secrets: GitHub token in macOS Keychain + Netlify env; private team links/provisioning files live outside the repo. Never commit or log them.
- CI: `.github/workflows/quality.yml` runs `scripts/quality.sh`; gitleaks configured (`.gitleaks.toml`).
- All fonts are self-hosted in `fonts/` (Dashboard + all six decks, latin subsets). No external origins in shipped pages. TYP-05 enforces this.
- SPOKES-STANDARD.md is the single source of truth; validator scripts/validate-lesson.py enforces it via PostToolUse hook (scripts/hooks/validate-lesson-hook.sh).
- Six-way nav-engine drift exists: only reference signature switchTab(btn,panelId) has zero live call sites; three lessons use switchTab(event,tabId); consolidation is a future upgrade.
- Dashboard.html fetches lesson-registry.json with a hardcoded FALLBACK_LESSONS array for file:// use — keep both in sync when editing the registry.

## Known Issues
- UNVERIFIED: Chrome may block `<track>` caption files over file:// (per-file opaque origins). Captions confirmed fine over http. Spot-check before promising captions on the double-click path.
- Two live Pages sites (publisher + dev repo), and they have diverged (publisher 46 commits behind as of 2026-09-23).
- a11y ratchet in quality.sh permits existing baseline violations — green gate is not a clean accessibility bill of health. Verification record flags lesson readability scores "below grade 8" as a caveat (wording ambiguous; check `readability-gate.mjs` output before citing).
- Not exercised anywhere: real Teams meetings, tenant permissions, OneDrive sync conflicts, every caption vs audio, every PDF page, every style combination.
