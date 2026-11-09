# Project Memory

## Project Overview
- **Name**: SPOKES Employability Skills Curriculum
- **Description**: 6 self-contained interactive HTML lesson decks + dashboard launcher, validated against SPOKES-STANDARD.md; plus BeSpoke, the instructor visual-design wizard for the next 6 lessons
- **Tech stack**: Static HTML/CSS/JS (one index.html per lesson), Python validator/tooling, no build step. BeSpoke: static wizard on GitHub Pages + Netlify function (Node 22) for shared Save/Open/Send. Node only for tests (Playwright, axe-core)
- **Repo**: origin = doclegg05/Curriculum-Employability-Skills (dev); publisher = SPOKES-Skills/Employability-Skills-Curriculum (public Pages); t9 = /Volumes/T9 backup mirror

## Current Status
(as of 2026-11-06, `origin/main` = `66c7657`)
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
- **Date**: 2026-11-09
- **What we worked on**: Money Management Part 2, the Cushion Challenge game. A path simulation showed only the tax refund decided whether Jess reached $250. Brainstormed and wrote a design (Sol review folded in), planned five tasks, built them inline on branch `t3/continue-money-management-lesson` (commits `aac8554`..`8da0497`), then an opus whole-branch review and one fix pass.
- **What we decided**: each payday stage is a month (weekly save counts 4 times), $120 tire, $12 fee every month, $40 jar dip, refund choices unchanged; How It Went splits habit and refund and says first when savings covered the tire; class picks change until Reveal; Back on every screen with Change this answer (redo clears later answers); only `#announce` (polite) speaks. Money lives in a pure model block checked by `scripts/check-cushion-math.mjs` (now in `quality.sh`). Design `docs/superpowers/specs/2026-11-09-cushion-challenge-rebalance-design.md`.
- **Where we left off**: `main` is at `6d57ab8` on GitHub (game, guide PDF rebuilt with the last two fixes, whole-lesson plan draft, lesson map). Browser test and `quality` green on `main`; Pages deployed. Left: VoiceOver pass.

## Open Items
- [ ] **Cushion Challenge on `main`** (pushed 2026-11-09 as `f76bf5e`, bypassing the required `quality` check). Browser test passed in Britt's Terminal 2026-11-09 (Chrome blocks .vtt on file://; the test ignores only that). `quality` green on `80fc9bc` and `6d57ab8`; Pages deployed (one transient Pages failure on `80fc9bc`, gone on the next run). Left: a VoiceOver pass in Safari.
- [ ] Cushion Challenge follow-ups: lesson plan Payday to Month labels; jar plus split deposit; short segment version; deferred minors in the branch ledger (Back arrow read aloud, pick change not announced, stale CSS comments).
- [ ] **Hosted checks** (Britt, Mac and phone): save on one device and open on the other; the view link shows View only and changes nothing; Leave session forgets the code. Record results in a dated verification note.
- [ ] **PR #72**: Britt merges; then the hosted checks below include the new card.
- [ ] `scripts/test-bespoke-send-wait.mjs` flakes in CI setup (ECONNRESET, goto and session-revision timeouts; four times by 2026-11-06). Five other browser tests keep an unguarded `route.fetch` catch-all. Harden them.
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
| 2026-10-21 | Make it yours draws the slide on the fixed 960 canvas and scales it; it grows past 960 on wide windows and uses the column width when 960 would be below 45% | Britt: the slide wins over the toolbar (R21, R26); legibility floor (R23, R31) |
| 2026-10-21 | Escape closes the open Slide options drawer first; with it closed, Escape selects the slide background | Britt (R27) |
| 2026-10-21 | Sent to Britt view takes a follow-up note that saves and resends | Britt (R28); works with the deployed service, no function change |
| 2026-10-21 | Fix the critique's P1s on the branch before the PR; P2s become follow-ups | Britt (R21); score 28/40 against a 30 target |
| 2026-10-19 | BeSpoke "bolder showcase": stage names Lesson & team, Pick a look, Make it yours, Send; stage + filmstrip layout (mockup option A); moods Calm, Bold, Bright, Classic | Britt picked from the mockups; spec approved the same day |
| 2026-10-19 | Similarity meter becomes one line on Send, replacing the 2026-09-24 "prominent" placement | Britt's pick |
| 2026-10-19 | Unmerged GitHub branches are kept as `archive/<branch>` tags, not branches | Britt: 45 open branches cut to main plus PR #56 |
| 2026-10-15 | PR #56 remerge: main's twelve layout presets win; the PR's six new presets are not shipped | Britt's pick. Matches 3e7778e and main's one-layout-per-preset picker |
| 2026-10-15 | Fix PR #56 with one commit on top of the branch instead of rewriting its merges | No force-push on a shared branch; same pattern as 3e7778e |
| 2026-10-15 | Offline package embeds captions in its copy of each lesson; the released lessons keep their .vtt links | Chrome and Edge block caption files on file:// pages; the hosted site loads them, and the released lessons stay untouched |
| 2026-10-13 | Team codes become 8 characters (`K7QX-M3PD`), case, spaces and dash ignored | Britt: 32 characters is extreme; teams must be able to read and type a code. About 39.6 bits is enough for online guessing behind the per-address limit, and the code guards a design suggestion |
| 2026-10-13 | Recovery is admin-only: Britt resends the link or reissues the code (`--reissue`) | Britt's pick over email self-service, which needed an email provider, a new secret and stored contact emails |
| 2026-10-13 | Build access-code work on `main`, not the view-link branch | Britt's pick; lands on its own; the view-link branch's rotate mode gets folded in later |
| 2026-10-13 | `BESPOKE_TEAM_KEYS` and `team-env.json` are secrets | An 8-character code falls to its unsalted SHA-256 in minutes on one GPU (security review) |
| 2026-10-09 | Print slides prints saved slide pictures, not the live slides | Live slides size from the screen with vw/vh and clamp(); pictures match the screen in every browser |
| 2026-10-09 | Print capture runs at 1600x901 | 900 trips the lessons' max-height: 900px short-screen layout, which clips card text |
| 2026-10-09 | Print dialog always opens on the Student workbook | A remembered Teacher choice could send answers to a class set |
| 2026-10-09 | Lesson & team becomes its own first stage (four stages) | Britt chose it over a top-bar chip or a highlighted card so teams see it and identify themselves first; supersedes the 2026-09-24 decision that Start combines it with the starting looks. Nothing blocks navigation or Save; Send still needs the spokesperson |
| 2026-10-09 | Customize goes slide-first with a slim top bar, docked toolbar and Slide options drawer, built as a skin over the existing engine | Britt asked for a minimalist, Claude Design-like UI; keeping every element ID and the model, schema and service unchanged avoided a redeploy and kept 20+ browser suites meaningful |
| 2026-10-09 | The toolbar docks above the slide instead of following the selected element | An anchored toolbar covered the elements the next click needed |
| 2026-10-09 | Apply the Apple HIG pages to the toolbar as a skill test, but keep the project's 44px targets over the HIG's 28pt macOS default | Britt's test of the skill; the project rule is stricter. Only guidance checked against the pages was applied |
| 2026-10-09 | Intro narration says no percentages, names no income source, frames wants as "extras that make life better" | Topic map: dignity first, cite-or-abstain, no surplus budgets; the 50/30/20 bar stays visual only |
| 2026-10-09 | Narrate the exported MP4 directly instead of rebuilding the animation in HyperFrames | Britt's team owns the animation in Claude Design; audio on the MP4 keeps the picture bit-identical |
| 2026-10-09 | Level each ElevenLabs take before mixing; keep a gentle voice limiter rather than chase -13.7 LUFS | Takes came back up to 13 dB apart; harder limiting bought <1 dB of gate margin at audible cost |
| 2026-10-09 | Commit both MP4s (12.6 MB source, 14 MB narrated) to the branch | Britt's call; repo already carries lesson videos |
| 2026-10-09 | Turn on the repo's "Allow auto-merge" and arm it on PR #46 | Britt asked to merge #46 when CI passes; the setting was off. It stays on for future PRs |
| 2026-10-07 | Quick pick and BeSpoke teams only suggest a design; no readability or accessibility gates on their picks | Britt: the final design comes from her, the administrator and Claude Design. Detail in auto-memory `bespoke-is-advisory-not-final.md` |
| 2026-10-07 | Keep the nine October 2 presets and add three by hand instead of redesigning all twelve | Subtract before add; variety checks (own heading font, pairwise 7 of 13, sidebar cap 3) still pass. Britt can ask for a fuller redo after seeing all twelve |
| 2026-10-01 | Merge the Codex v2 builder (with Guide me) to `main`, replacing the wizard | Britt's call after the status review; quality gate green on the exact commit |
| 2026-10-01 | Keep the contextual preview editor (PR #42), not the direct editor with per-box styling | Same idea with no saved-design format change, so no service redeploy; per-box styling can come later if teams ask |
| 2026-10-01 | Preview edits only on the Slide designs stage; Guide me owns the preview while it runs | A click on the preview ended the guide or pulled the spokesperson off Review |
| 2026-10-01 | Redeploy the Netlify service from the PR head before merging | The service bundles the v2 schema and model; the new service still accepts v1, so the old wizard kept working in between |
| 2026-09-30 | Extend the Codex builder with an optional Guide me walk-through; do not build our own 8-step wizard, role model or palette | The Codex builder already had roles, history and a 3-stage flow chosen by a 2026-09-24 review; a parallel model would collide on file names and data shape |
| 2026-09-30 | Contrast stays advisory (no switched-off options); the guide shows a plain warning with the ratio | Matches the existing docs, schema and "no disabled swatches" decision; needs no schema or service change |
| 2026-09-30 | The guide's readability notes come from the model's own advisory, not a separate calculation | A separate calculation disagreed with the preview on textures and band dividers |
| 2026-09-30 | Text boxes ask the number of boxes before layout; video gets no body-text color question | Balanced grid looks like Across at the default count; video body text is hidden by default |
| 2026-09-23 | Slide builder replaces the wizard: per-role colors (mockup first), title positions, 4 slide types (chapter divider, video, bullet list, activity), accurate similarity meter | Britt: small decisions, each visible in the preview, tracked and persistent |
| 2026-09-23 | Preview must mirror the template (real markup, scaled library units) and every option must visibly change it | Britt's repeated "preview doesn't change" reports; guarded by a browser sweep |
| 2026-09-23 | BeSpoke adds a design brief step; its answers drive a starting design capped at 3–5 of 7 choices shared with any existing lesson | Presets were the six existing lessons' looks, so the default path copied a lesson |
| 2026-09-23 | Brief answers travel in an optional `brief` payload object; `variant` is a digit string | Answers must survive shared Save/Open; canonical JSON between Python and JS assumes no numeric fields |
| 2026-09-23 | For schema changes, redeploy the Netlify service before merging the wizard | The service bundles the schema and rejects unknown fields; the new service accepts old and new payloads |
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

## Known Issues
- `bespoke/builder-app.mjs` is about 1,900 lines, over the 800-line guide. Existing before the canvas shell; not split.
- The canvas shell was verified on Chromium only. Safari's engine and the 1101-1439px range have not been looked at by a person.
- GitHub Pages runs Jekyll, so Liquid parses every `.md` file. A doc quoting `{{` breaks the whole Pages build, and nothing in `quality.sh` catches it. PR #38 excludes `docs/superpowers/`; other `.md` paths are still exposed.
- UNVERIFIED: Chrome may block `<track>` caption files over file:// (per-file opaque origins). Captions confirmed fine over http. Spot-check before promising captions on the double-click path.
- Two live Pages sites (publisher + dev repo), and they have diverged (publisher 46 commits behind as of 2026-09-23).
- a11y ratchet in quality.sh permits existing baseline violations — green gate is not a clean accessibility bill of health. Verification record flags lesson readability scores "below grade 8" as a caveat (wording ambiguous; check `readability-gate.mjs` output before citing).
- Not exercised anywhere: real Teams meetings, tenant permissions, OneDrive sync conflicts, every caption vs audio, every PDF page, every style combination.
