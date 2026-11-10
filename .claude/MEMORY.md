# Project Memory

## Project Overview
- **Name**: SPOKES Employability Skills Curriculum
- **Description**: 6 self-contained interactive HTML lesson decks + dashboard launcher, validated against SPOKES-STANDARD.md; plus BeSpoke, the instructor visual-design wizard for the next 6 lessons
- **Tech stack**: Static HTML/CSS/JS (one index.html per lesson), Python validator/tooling, no build step. BeSpoke: static wizard on GitHub Pages + Netlify function (Node 22) for shared Save/Open/Send. Node only for tests (Playwright, axe-core)
- **Repo**: origin = doclegg05/Curriculum-Employability-Skills (dev); publisher = SPOKES-Skills/Employability-Skills-Curriculum (public Pages); t9 = /Volumes/T9 backup mirror

## Current Status
(as of 2026-11-10; BeSpoke lines as of 2026-11-06)
- **Lesson showcase pass under way** (Britt, 2026-11-09): Level 1 repairs to the six released lessons are committed on worktree branch `t3/review-lessons-presentation-polish`, not pushed. Level 2 (room-size text) is next. Detail in Last Session.
- **BeSpoke is live and ready for hosted checks.** Pages serves `main`; the Netlify service is deploy `6ae4a32718993eaabe906eaf` from `fdf6fe4` (2026-10-30, [[bespoke-netlify-deploy]] in auto-memory). No service file changed since: PRs #68 (team code first, Send pop-up) and #69 (session switching, C1/C2) are page-only.
  - Team codes: all six open with edit access; a fake code and another lesson's code get 403 (2026-10-30).
  - View links: `BESPOKE_VIEW_KEYS` is set and live. On 2026-11-04 all six view codes opened with `access: view`; history and status with a view code got 403 `view`. Files in `~/BeSpoke-private/codes-2026-10-14/` (`view-links.html` to pin).
  - Hosted Save, Open and Send passed 2026-10-30 (first v2 design through the hosted path; test PRs #66 and #67 closed, not merged).
  - Saved designs: only `goal-setting` and `money-management` on `bespoke-drafts`, all Britt's tests. Plan: after Britt's hosted checks, delete the `bespoke-drafts` branch; the service recreates it from `main` on the next save, as before 2026-10-30.
- **PRs #70 and #71 merged 2026-11-05.** The #70 service deploy (`6aecad45`) kept the same function digest because the server bundle only uses `validateDesign`; the fix is page-only.
- **PR #72 open** (`feat/bespoke-saved-design-card`): a saved-design card and status badge so teams can tell what is saved (Britt, 2026-11-06, after her hosted check left her guessing). Page-only, no service deploy. `quality` green on `c4b2c8a`; 22 saved-card browser scenarios. Design `docs/superpowers/specs/2026-11-06-bespoke-saved-design-card-design.md`. Must merge before the teacher email and the pilot.
- **Rate limit unproven.** The service config sets Netlify's per-address limit (120 a minute). On 2026-11-04, 135 wrong-code POSTs sent one at a time all got 403 and none got 429; they may have spread past one minute. A parallel burst was blocked by the auto-mode classifier.
- **Merged since October 22:** open design standard (#61), BeSpoke open standard Part 1 (#56, #60; #59 closed, its work landed through #60), 8-character codes and `--reissue` (#51), print slides (#50), offline lessons package (#52), Coordinator note (#64, #65), Money Management lesson structure (#63).
- **Six existing lessons: OUT OF QA, READY FOR TEACHING** (Britt, 2026-09-23).
- **Phase 2 (Round 2):** Goal Setting, Money Management (Budget), Professionalism and Diversity, Knowing Your Rights in the Workplace, Communicating Assertively, Workplace Ethics. Unbuilt; March 2027 soft target. Building needs separate Britt authorization and complete approved content. `scripts/bespoke-apply-selection.py` still rejects v2, so an approved design goes into a lesson by hand through `build-contract.json` and `design.css`.
- **Money Management intro animation narrated** (PR #46, 2026-10-09). Rebuild steps: `lesson-Money-Management/intro-narration/script.md`.

## Last Session
- **Date**: 2026-11-10 (began 2026-11-09; worktree branch `t3/review-lessons-presentation-polish`, called `t3/987d1938` when the session started)
- **What we worked on**: Britt asked for a review of the six released lessons before showing them to many instructors and students. Design critique 26/40, technical audit 12/20, no blockers; report with line numbers in `.impeccable/critique/2026-11-10T00-30-25Z__lesson-index-html.md`. Then Level 1 of the showcase pass (repair): clicker keys (NAV-14), about 40 defect repairs in a `Showcase repair 2026-11` block at the end of each lesson's theme-override, seven AV1 videos re-saved as H.264, a 199 KB title JPEG for Communicating with the Public, each lesson down to its two registered typefaces, and a larger Jeopardy board on Controlling Anger slide 28 at Britt's request.
- **What we decided**: see the 2026-11-09 and 2026-11-10 rows in the decision log.
- **Where we left off**: Level 1 is committed on the worktree branch as `4b7bd85` (videos), `c22ef24` (template and NAV-14), `f2d1acb` (lessons, pictures, fingerprints) and `8d4232e` (browser test helper), not pushed. `scripts/quality.sh` passed in full in Britt's Terminal on 2026-11-09 before the commits; the only later changes were a lowered accessibility baseline and these notes. Next: design Level 2 with Britt's two choices (text scales with the screen; the sidebar keeps opening by default), then Level 3.

## Open Items
- [ ] **Lesson showcase pass, Level 1**: committed, not pushed (hashes in Last Session). Push and the pull request go through Britt's Terminal. Britt's calls still open: the Problem Solving closing slide lost its photo; Communicating with the Public labels changed from a handwriting font to Work Sans; the NAV-14 heading uses a colon, unlike the other 87.
- [ ] **Showcase Level 2 (room-size text) and Level 3 (covers, closings, one owned visual per lesson)**: not started. Level 2 inputs measured 2026-11-09: at 1280x720 slides already run past the screen in every lesson (3 to 11 with the sidebar open, 1 to 5 closed); Time Management statement slides 5 and 11 overflow at every size; Controlling Anger slide 29 is still 96px over at 1280x720 with the sidebar open; Interview Skills slide 31 overflows at 1280x720 with a panel open. Britt's call: Time Management and Problem Solving redefine five of the 11 colors in their own style block (the validator does not catch it). Not reviewed at all: Dashboard visuals, Round 2 draft decks, Money Management Part 2. The comparison checker is in the session scratchpad (`site/scan.html`); rebuild it under `scripts/` if Level 2 goes ahead.
- [ ] **Cushion Challenge on `main`** (pushed 2026-11-09 as `f76bf5e`, bypassing the required `quality` check). Browser test passed in Britt's Terminal 2026-11-09 (Chrome blocks .vtt on file://; the test ignores only that). `quality` green on `80fc9bc` and `6d57ab8`; Pages deployed (one transient Pages failure on `80fc9bc`, gone on the next run). Left: a VoiceOver pass in Safari.
- [ ] Cushion Challenge follow-ups: lesson plan Payday to Month labels; jar plus split deposit; short segment version; deferred minors in the branch ledger (Back arrow read aloud, pick change not announced, stale CSS comments).
- [ ] **Hosted checks** (Britt, Mac and phone): save on one device and open on the other; the view link shows View only and changes nothing; Leave session forgets the code. Record results in a dated verification note.
- [ ] **PR #72**: Britt merges; then the hosted checks below include the new card.
- [ ] BeSpoke browser tests, teardown race: on 2026-11-09 `test-bespoke-code-first.mjs` crashed `quality.sh` with "route.fulfill: Fetch response has been disposed" (a context closing under a proxied request). All seven catch-all proxies now go through `scripts/bespoke-test-proxy.mjs` (unit test `test-bespoke-test-proxy.mjs`, in `quality.sh`). The seven edited tests have not run in a browser since the change: confirm on Britt's next `quality.sh`. `test-bespoke-send-wait.mjs` also flaked in CI setup with goto and session-revision timeouts (four times by 2026-11-06); those are untouched.
- [ ] **Clear test saves** after the hosted checks: delete branch `bespoke-drafts` (head `b8e29b5` on 2026-11-04).
- [ ] **Auto-merge off** (Britt, GitHub repo Settings > General > Pull Requests > untick Allow auto-merge).
- [ ] **Rate limit**: run a burst of about 130 wrong-code POSTs inside one minute from Britt's Terminal and confirm a 429.
- [ ] **Money Management BeSpoke pilot** with a beginner spokesperson: open, edit, save, reopen, send. Real Teams/tenant behaviour never exercised. Watch the brief suggestions in `bespoke/brief.js` (Claude's judgement, not teacher-tested).
- [ ] **Teacher announcement email**: send after the hosted checks pass.
- [ ] BeSpoke service PAT (`BESPOKE_GITHUB_TOKEN`) expires about 2026-12-20. Calendar reminders 2026-12-06 and 2026-12-17. After renewing: keep `BESPOKE_DRAFT_KEY` and the code tables, verify Open and Save.
- [ ] Security review LOW items, Britt's call: a site-wide rate cap (about 300 a minute), refusing iCloud paths for the private folder, temp-then-rename writes in `--reissue`. Reviewer advised against a wrong-code lockout.
- [ ] **Design system (PR 2)**: copy `spokes-design-system/` from the main checkout into a worktree off `main`; drop theme packages, the four extra colors, frosted glass, emoji and Google Fonts links (self-host from `fonts/`); official logo bytes; add a `quality.sh` check. The untracked copy in the main checkout must go before that checkout pulls PR 2.
- [ ] **BeSpoke textures (PR 3)**: put the six background textures back beside Color block, Edge rail and Frame. Gradient-fill cards and `split-panel` dividers stay blocked for contrast.
- [ ] Open design standard deferred minors (2026-10-22 and 2026-10-23 reviews): logo checks miss `transform: scale`, HTML width/height, `clamp()`/`calc()`, `aspect-ratio`, `inline-size`, `border-radius`, CSS nesting and uppercase `IMG`; `+`/`~` rules always match; "logo" is a substring class match; `validate-lesson.py` is 1391 lines.
- [ ] **Benefits Cliff factory run** (branch `factory/benefits-cliff`, not pushed): needs a theme design, PDF handouts and the final source files.
- [ ] BeSpoke follow-ups from #59 (listed in that PR body). Largest: the drawer should overlay the slide below about 900px; apply toast over the pills; drawer wording.
- [ ] BeSpoke manual checks never done: 1101-1439px, tablet and phone widths, `BESPOKE_BROWSER=webkit` runs. Tablet and phone keep the old stacked layout; Guide me on a phone needs a scroll. Britt's call whether to redesign.
- [ ] `scripts/test-bespoke-canvas-shell.mjs` is not in `quality.sh`.
- [ ] Minor findings from the #42 review: Text boxes scope names the title bar when it is off; Divider picker lists Supporting text twice; element picker disabled in view-only sessions; focus order with More options open; one history entry per arrow key in a closed select on Windows.
- [ ] Preview width: at 1440px the Across and Balanced grid box layouts render the same. Britt's call.
- [ ] Per-box styling is parked on branch `codex/bespoke-direct-editor` (changes the saved format; Load latest can discard edits). Revisit only if teams ask.
- [ ] **Print slides**: sample-PDF approval and the teacher's paper check not recorded. After any lesson edit run `node scripts/capture-print-slides.mjs <lesson-folder>`. Britt's call: Interview Skills slide 31 and Time Management slide 30 accordions print model answers in the Student workbook. Deferred minors are in the 2026-10-09 review.
- [ ] **Offline lessons package** (#52 merged): Britt picks the download location and tries the zip on a Windows laptop.
- [ ] Intro animation: the Transportation tag sits on the Wants box edge from 0:27 to 0:33 while the narration says "able to get to work" (team fix in the design file). Master is -14.2 LUFS, the gate's lower edge. Narrator voice settings never listening-tested.
- [ ] **Publisher site is behind** (stuck at `fb9e202`, August 17). Britt decides whether BeSpoke belongs on the public site. Two live Pages sites; canonical URL undecided. Teams use `doclegg05.github.io`.
- [ ] Cleanup, Britt's call: remote branch `claude/bespoke-minimalist-slide-ui-33bd9c`, local `preserve/bespoke-canvas-shell`, its worktree, `claude/slide-builder-design-model`.
- [ ] **13 content findings from the 09-22 review**: confirm with Britt whether resolved or accepted. Not software work; do not silently rewrite.
- [ ] Library textures are 3 to 8% opacity; Quiet Center's short rule stretches to 120px; Split Hero's gold subtitle is low-contrast over blue (also in Interview Skills).
- [ ] Released lessons keep their own button CSS (white on `--accent`), so the library contrast fix does not reach them. Britt's call whether to patch.
- [ ] Expected WARNs: interview-skills CMP-01/02 and NAV-11/12, employee-accountability NAV-11; EA announcer omits "Slide X of Y".
- [ ] Dashboard: **do not re-propose unifying card art**. Open: grouping for 18 modules needs a registry field (Britt's call); ragged 4+2 last row above 1501px. Six rejected `Dashboard-*.html` prototypes and three fonts only they use are still committed; ask Britt again before deleting.
- [ ] Registry `slides`/`videos` fields: regenerate when decks change; `FALLBACK_LESSONS` in Dashboard.html must stay in sync (`check-registry-sync.py`).
- [ ] Critique items deliberately not actioned (locked nav engine and base CSS); parked design questions: WIPPEA badges, iceberg visual, chapter theming.
- [ ] Housekeeping: PDF generators are Windows-only with dead code; about 9.5 MB unreferenced images in communicating-with-the-public; about 350 MB of committed videos (consider LFS); governance doc overlap (Project Plan, Master Action Plan, Agent Execution Spec, Runbook, `conductor/`).

## Key Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-11-10 | Level 2 text scales with the screen | Britt's pick: a slide should look the same on any projector; about 19% larger than today at 1920x1080 |
| 2026-11-10 | Lessons keep opening with the sidebar showing | Britt's pick over starting closed on small screens; Level 2 fits slides around the open sidebar, which means smaller text on small screens |
| 2026-11-09 | Lesson showcase pass runs in three levels (repair, room-size text, showpiece), with a stop for Britt's review after each | Britt's pick; the lessons are released, so each level gets looked at before the next |
| 2026-11-09 | Page Down, Page Up, Home and End added to the lessons' key handler and the builder template (NAV-14) | Britt approved; presenter remotes send Page Down and the handler took arrows and Space only |
| 2026-11-09 | Seven AV1 lesson videos re-saved as H.264 under the same file names | Old Edge and Safari may not play AV1; 56 MB of growth accepted |
| 2026-11-09 | Controlling Anger slide 28 shows a drawn game board, not the Jeopardy thumbnail | The thumbnail carried a redrawn SPOKES mark (LOGO-01); the PNG stays in the folder, unreferenced |
| 2026-11-04 | Turn off auto-merge rather than require PR approval on `main` | Britt is the only reviewer and PRs open under her account, which GitHub will not let her approve; auto-merge is what lets a PR land without her |
| 2026-11-04 | The person on the Lesson & team form is the "spokesperson" in every page, guide and doc | The form label says Spokesperson; "Team Leader" in other copy named the same person differently |
| 2026-11-03 | One pending Send per browser stays | Teams are remote and never share a browser (`bespoke-teams-never-share-browsers` in auto-memory) |
| 2026-10-23 | LOGO-02 fails a filter or blend mode on any element around the logo, except a filter made only of `drop-shadow()` | A wrapper filter is the easiest way to whiten the logo for a dark slide; a drop-shadow adds a shadow without recoloring it |
| 2026-10-23 | A logo image with `alt=""` counts as the logo, not stand-in art | An empty alt marks it decorative, as Employee Accountability already does |
| 2026-10-23 | CRD-02 allows cards that lift on hover (with `:active`), background textures including dot-grid, grain, gradient-fill cards and a soft radial glow; frosted glass and emoji stay banned | Britt's calls on the Claude Design export review; the template gets its hover lift and statement glow back |
| 2026-10-23 | The template's warning-sign list marker becomes a mauve arrow | Britt: no emoji |
| 2026-10-23 | The logo may be any size, from a corner mark to a large title-slide logo; the text-only SPOKES wordmark may stand in where the image cannot load | Britt's calls (F35, F36) |
| 2026-10-23 | Design system work splits into PR 2 (import and fix) and PR 3 (BeSpoke textures), after PR 1 | Each lands on its own; PR 1 changes the rules the other two follow |
| 2026-10-23 | `components.md` deletes the glass card and animated gradient divider sections instead of marking them | No released lesson or the template uses them; CRD-02 bans both; the archive tag keeps the old text |
| 2026-10-22 | Open design standard: only the 11 colors, the SPOKES logo and readability are fixed; no theme packages; no color or font sign-off for builder-made designs | Britt wants variety between lessons; BeSpoke designs still need Britt's approval |
| 2026-10-22 | LOGO-01 and LOGO-02 are CRITICAL validator rules: the logo may be resized, never recolored, cropped, stretched or swapped | The logo is the one brand mark that must stay exact |
| 2026-10-22 | Old design rules kept at tag `archive/design-rules-v1` | Britt asked for a rollback point before the change |
| 2026-10-22 | Remerge the PR 56/59 stack with current main first, then fix the CI failures, before the review findings | Britt |

Rows before 2026-10-22 are in `.claude/MEMORY-archive.md`.

## Architecture Notes
- TWO GitHub repos, one history: publisher (`SPOKES-Skills/Employability-Skills-Curriculum`) is the public home + Pages site; origin (`doclegg05/...`) is the dev repo and the one that moves. Publisher carries no unique commits — catching up is `git push publisher main:main`. Both public; dev repo ALSO serves Pages.
- **BeSpoke**: v2 builder in `bespoke/` (`index.html`, `builder-app.mjs`, `builder-model.mjs`, `builder-catalog.json`, Guide me in `bespoke/guide/`; old wizard at `legacy.html`; GitHub Pages `/bespoke/`); service in `netlify/functions/bespoke-handoff.mjs` (site `spokes-bespoke`, publishes only `netlify/site`). Drafts encrypted on the `bespoke-drafts` branch; separate encryption key survives GitHub token rotation. Send → Spoke Signals Action (`.github/workflows/spoke-signals.yml`) → draft PR with selection, generated CSS, build contract. Proposals are PUBLIC (public repo); UI discloses this.
- **BeSpoke canvas shell** (2026-10-09): `bespoke/canvas.css` (loaded last), `canvas-shell.mjs` (Send moves between the bar and menu by stage), `canvas-toolbar.mjs` (pure placement and quick-control rules), `canvas-controls.mjs` (segmented control and color well over the native selects, which stay the source of truth). The floating toolbar and drawer apply at 1101px and wider; below that the stacked layout is unchanged. Stages live in `STEPS` (`team`, `start`, `slides`, `review`); use `onStage(id)`, never a numeric index. Tests: `scripts/test-bespoke-canvas-toolbar.mjs`, `scripts/test-bespoke-canvas-shell.mjs`; header actions other than Save, Undo and Redo sit in the menu, so tests use `clickMenuItem` and `openMoreMenu` from `scripts/bespoke-test-navigation.mjs`.
- Merging to `main` publishes BeSpoke: GitHub Pages builds from `main` (`/`). The Netlify service is separate and only changes when Britt deploys it.
- Verify a commit without disturbing a working tree: add a detached `git worktree`, symlink `node_modules`, and run `scripts/quality.sh` there. Running tests while editing the same tree contaminates the run.
- Claude cannot merge PRs here (the permission check blocks `gh pr merge`); Britt merges. Detail in Claude's private auto-memory (`britt-merges-pull-requests`).
- BeSpoke catalog/library: `SPOKES Builder/bespoke-library-catalog.json`, `theme-library.css`, `theme-options.json`; schema generated by `scripts/generate-selection-schema.py` (`--check` in CI). Builder procedure: `docs/bespoke/builder-handoff.md`; admin/provisioning: `docs/bespoke/auto-handoff-setup.md`.
- BeSpoke service deploys are staged by Claude and run by Britt (Netlify CLI). The site ID, command and post-deploy checks live in Claude's private auto-memory (`bespoke-netlify-deploy`). The service bundles the schema, so deploy it before merging any schema change. A changed Netlify env value (for example `BESPOKE_TEAM_KEYS`) reaches the function only on a new deploy; check an old code gets 403 afterward (detail in the same auto-memory file).
- Secrets: GitHub token in macOS Keychain + Netlify env; private team links/provisioning files live outside the repo. Never commit or log them.
- CI: `.github/workflows/quality.yml` runs `scripts/quality.sh`; gitleaks configured (`.gitleaks.toml`).
- All fonts are self-hosted in `fonts/` (Dashboard + all six decks, latin subsets). No external origins in shipped pages. TYP-05 enforces this.
- SPOKES-STANDARD.md is the single source of truth; validator scripts/validate-lesson.py enforces it via PostToolUse hook (scripts/hooks/validate-lesson-hook.sh).
- Six-way nav-engine drift exists: only reference signature switchTab(btn,panelId) has zero live call sites; three lessons use switchTab(event,tabId); consolidation is a future upgrade.
- Dashboard.html fetches lesson-registry.json with a hardcoded FALLBACK_LESSONS array for file:// use — keep both in sync when editing the registry.
- **Logo rules** (2026-10-22): `scripts/validate-lesson.py` imports `scripts/css_select.py` to match CSS rules against parsed elements and their ancestors (classes added by `classList` count as present). Filters and blend modes are also checked on the logo's ancestors. Logo tests live in `scripts/test_validator_logo.py`; `quality.sh` runs `test_validator*.py`.

- **Lesson edits reach BeSpoke.** `bespoke/lesson-fingerprints.json` records each released lesson's checksum and measured design (title layout, colors, fonts, cards), and `scripts/test-bespoke-similarity.mjs` pins some of those values. Any lesson edit needs the fingerprints regenerated, and a design-level edit can change what BeSpoke compares teams against. A title counts as split only while both panels are 25 to 75% wide (`scripts/generate-lesson-fingerprints.mjs:107`).

## Known Issues
- `bespoke/builder-app.mjs` is about 1,900 lines, over the 800-line guide. Existing before the canvas shell; not split.
- The canvas shell was verified on Chromium only. Safari's engine and the 1101-1439px range have not been looked at by a person.
- GitHub Pages runs Jekyll, so Liquid parses every `.md` file. A doc quoting `{{` breaks the whole Pages build, and nothing in `quality.sh` catches it. PR #38 excludes `docs/superpowers/`; other `.md` paths are still exposed.
- UNVERIFIED: Chrome may block `<track>` caption files over file:// (per-file opaque origins). Captions confirmed fine over http. Spot-check before promising captions on the double-click path.
- Two live Pages sites (publisher + dev repo), and they have diverged (publisher 46 commits behind as of 2026-09-23).
- a11y ratchet in quality.sh permits existing baseline violations — green gate is not a clean accessibility bill of health. Verification record flags lesson readability scores "below grade 8" as a caveat (wording ambiguous; check `readability-gate.mjs` output before citing).
- Not exercised anywhere: real Teams meetings, tenant permissions, OneDrive sync conflicts, every caption vs audio, every PDF page, every style combination.
