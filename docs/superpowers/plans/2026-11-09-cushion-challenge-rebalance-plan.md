# Cushion Challenge Rebalance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the saving habit, not the tax refund, decide how Jess does, and add class pick changes, Back with redo and quieter screen reader output.

**Architecture:** All money and navigation state moves into one pure model block inside the game's inline script, between `/* cushion-model:start */` and `/* cushion-model:end */`. The render code only reads the model. A Node check script cuts that block out of the HTML, evaluates it with `node:vm`, and asserts every path, so it tests the game's real code.

**Tech Stack:** One self-contained HTML file with ES5-style inline script (matching the file), Node 20+ for the check, no new dependencies.

**Spec:** `docs/superpowers/specs/2026-11-09-cushion-challenge-rebalance-design.md`

## Global Constraints

- `GAME` = `lesson-Money-Management/Part-2-Save-Money-Before-You-Spend-It-Britt/cushion-challenge.html`. `GUIDE` = `lesson-Money-Management/Teacher-Resources/Part2_Save_First_Teachers_Guide.py`. `CHECK` = `scripts/check-cushion-math.mjs`.
- Values: goal $250, pay $400 a week, 4 paydays a month, tire $120, fee $12 at the start of months 2, 3 and 4, jar dip $40 in month 3, pictures $30, default split $25 a week, refund choices $0 / $100 / $300 / $600 of $1,200.
- Event order: Month 1 save. Month 2 fee, saving, pictures. Month 3 fee, saving (automatic only), jar dip, tire. Month 4 fee, saving, refund. Cushion floors at $0.
- Never retype the `var KEY = ...` line; tool output shows its value as `[REDACTED]`. Saved state gets `v: 2`; anything else is discarded.
- SPOKES palette and fonts only; 44px targets; visible focus.
- Kickers "Month 1" to "Month 4"; steps "Meet Jess, Month 1, Month 2, Month 3, Month 4, How it went, Your turn".
- Prose in the guide and docs: no em dashes.

## Review Focus

1. A class pick left unrevealed, then Back pressed: the pending pick stays pending on that screen and adds no money. Pinned in Task 2 (`pendingPickAddsNothing`).
2. Change this answer on Month 1 after reaching How it went: every later answer, and the steps, go back to before Month 1. Pinned in Task 2 (`changeClearsLater`).
3. Reload while viewing an earlier screen through Back: same screen, same cushion. Pinned in Task 2 (`serializeRoundTrip`) by running the model on `JSON.parse(JSON.stringify(state))`.
4. Old v1 saved progress in localStorage: discarded, game starts at Meet Jess. Pinned in Task 2 (`loadRejectsV1`).
5. Save what's left plus automatic saving: the split uses $25 a week and the habit part reflects it. Pinned in Task 2 (`defaultSplit`).

---

### Task 1: The check script, failing

**Files:**
- Create: `scripts/check-cushion-math.mjs`

**Interfaces:**
- Consumes: the text of `GAME`.
- Produces: `node scripts/check-cushion-math.mjs` exits 0 when every assertion passes, 1 otherwise, printing one line per failed check.

- [ ] **Step 1: Write the loader.** Read `GAME`, take the text between `/* cushion-model:start */` and `/* cushion-model:end */`, run it in `vm.createContext({})`, and read `CushionModel` from the context. If either marker is missing, print `model block not found in GAME` and exit 1.
- [ ] **Step 2: Write the assertions** listed in Task 2's tests, using the model API from Task 2's Interfaces. Helper `play(answers, opts)` drives `choose`, `reveal` and `next` from the fresh state to How it went (screen 8) and returns `summary(state)`.
- [ ] **Step 3: Run it.** `node scripts/check-cushion-math.mjs`. Expected: `model block not found in GAME`, exit 1. (Today's math lives in render code, so this is the red run.)

### Task 2: The pure model

**Files:**
- Modify: `GAME` inline script, new block near the top of the IIFE.

**Interfaces (all on `CushionModel`, every function returns a new state and never mutates its input):**
- Constants: `GOAL, PAY, WEEKS, TIRE, FEE, JAR, PICS, DEFAULT_SPLIT, REFUND_TOTAL` with the Global Constraints values.
- Screens: `0 intro, 1 save1, 2 acct, 3 auto, 4 pics, 5 tire, 6 snap, 7 refund, 8 results, 9 firstStep`. `QUESTION_SCREEN = {save1:1, acct:2, auto:3, pics:4, snap:6, refund:7}`.
- `fresh() -> {v:2, screen:0, furthest:0, answers:{}, revealed:{}}`
- `choose(state, name, value, classMode) -> state`: no-op if `revealed[name]`. Class mode sets the answer only (a pending pick can be replaced). Solo sets the answer and `revealed[name] = true`.
- `reveal(state, name) -> state`: sets `revealed[name]` if answered.
- `next(state) -> state`: `screen + 1` (max 9), `furthest = max(furthest, screen)`.
- `back(state) -> state`: `screen - 1` (min 0).
- `changeAnswer(state, name) -> state`: deletes answers and reveals for `name` and every question whose screen is greater; `furthest = screen`.
- `isCounted(state, name) -> boolean`: answered, revealed, and `QUESTION_SCREEN[name] <= state.screen`.
- `summary(state) -> {rows:[{label, amt, month}], cushion, habit, refund, shortfall, tireHit}`. Walks the event order, applying only counted answers and applying month 3 only when `state.screen >= 5`. `amt` is the real change after the $0 floor. `habit` is the cushion before the refund row. `tireHit` is true once month 3 has applied.
- `headline(sum) -> "habit" | "covered-refund" | "covered-short" | "refund" | "short"`: habit if `habit >= GOAL`; otherwise covered-* if the tire hit and `shortfall === 0`, refund variant when `cushion >= GOAL`; otherwise `refund` if `cushion >= GOAL`, else `short`.
- `load(raw) -> state`: returns `raw` when it is an object with `v === 2`, a numeric `screen` in 0 to 9, and object `answers` and `revealed`; otherwise `fresh()`.

**Tests in `CHECK` (names are the printed labels):**
- `good10`: save1 10, bankon, auto yes, pics planned, snap ask, refund 0: `shortfall 0`, `habit 40`, `cushion 40`, headline `covered-short`. Same with refund 300: headline `covered-refund`.
- `good25`: as good10 with save1 25, refund 0: `cushion 280`, headline `habit`.
- `feePath`: save1 25, fee, auto yes, planned, refund 0: `cushion 244`. `jarPath`: same with jar: `cushion 240`.
- `saveLeft`: save1 0, auto no, any account: `shortfall 120` on every combination.
- All 192 combinations of save1 {10,25,50,0} x acct {jar,fee,bankon} x auto {yes,no} x pics {emergency,planned} x refund {0,100,300,600} (snap ask): `habit + refund === cushion`; habit equal across the four refunds; fee and jar cushion `<=` bankon cushion; `shortfall === max(0, 120 - cushionBeforeTire)` where `cushionBeforeTire` is read from the rows; `headline` is one of the five keys.
- `pendingPickAddsNothing`: class mode, choose save1 50 without reveal: `summary.cushion 0`; choose 25 then reveal: cushion 100; choose 50 after reveal: still 100.
- `backIsPointInTime`: play good25 to screen 8, `back` to screen 3: cushion equals the cushion of a fresh play stopped at screen 3; `next` five times: cushion 280 again, nothing doubled.
- `changeClearsLater`: from screen 8 go back to screen 1, `changeAnswer(save1)`: answers has no save1, acct, auto, pics, snap or refund; `furthest 1`; cushion 0.
- `serializeRoundTrip`: at several screens, `summary(load(JSON.parse(JSON.stringify(s))))` deep-equals `summary(s)`.
- `loadRejectsV1`: `load({screen:4, cushion:90})` deep-equals `fresh()`.
- `defaultSplit`: save1 0, auto yes, bankon, planned, refund 0: `habit` equals 25x4x3 minus 120 = 180.
- `modeSwitchNoMoney`: class pick unrevealed then the same state read as solo: cushion unchanged (the model takes no mode in `summary`).

- [ ] **Step 1:** Add the model block with the interfaces above.
- [ ] **Step 2:** `node scripts/check-cushion-math.mjs`. Expected: every label `ok`, exit 0.
- [ ] **Step 3:** Break `TIRE` to 60 in the block, run `CHECK`, expect failures; restore it.

### Task 3: Render reads the model

**Files:**
- Modify: `GAME` script below the model block, and the `<main>` and `#announce` markup.

**Interfaces:**
- Consumes: all of Task 2.
- Produces: no new names beyond the file.

- [ ] **Step 1:** Replace `fresh/add/applyChoice/p3done` and every `s.cushion` and `s.ledger` read with `CushionModel` calls. `meter()` and `weekLedger(month)` read `summary(s)`.
- [ ] **Step 2:** Choices stay enabled while unrevealed in class mode; disabled once revealed. A–D keys skip disabled buttons, as now.
- [ ] **Step 3:** Back button (`.ghost`, `data-go="back"`) on screens 1 to 9. On a screen where `s.screen < s.furthest` and its question is revealed, add a **Change this answer** ghost button (`data-change="<name>"`). Steps: index up to `furthest` shows done, current shows `aria-current`.
- [ ] **Step 4:** Copy per the spec: monthly kickers and steps, choice details with monthly totals, $120 tire, monthly fee wording, the results split ("From her saving habit", "From her tax refund"), the tire line first when covered, and the five headline texts.
- [ ] **Step 5:** Remove `aria-live` from `<main>`; `#announce` becomes `aria-live="polite"`. Announce row changes only after a solo pick, a Reveal, or a Next onto a screen beyond the old `furthest`. Change this answer announces "This answer and the ones after it were cleared."
- [ ] **Step 6:** `start()` uses `CushionModel.load`; `render()` saves `s` under the existing `KEY` line.
- [ ] **Step 7:** `node scripts/check-cushion-math.mjs` exits 0; `grep -n 'aria-live' GAME` shows only `#announce` with `polite`; `wc -l GAME` under 800.

### Task 4: Teacher's Guide text and stale note

**Files:**
- Modify: `GUIDE` lines 114-262, `lesson-Money-Management/lesson-structure.md` Known stale items.

- [ ] **Step 1:** In `GUIDE`, change Payday labels to Month labels, the $60 tire to $120, the fee note to "$12 every month", the jar dip to $40 in Month 3, "four paydays" to "four months of paydays", the Results note to describe the habit and refund split, and add a tip on Back and Change this answer.
- [ ] **Step 2:** `python3 -c "import ast,sys; ast.parse(open(sys.argv[1]).read())" GUIDE` exits 0, and `grep -nE '\$60\b|\$15\b|Payday [0-9]|loses \$12 right away' GUIDE` prints nothing.
- [ ] **Step 3:** Add to Known stale items: the guide PDF lags its updated source until rebuilt with `reportlab`; the lesson plan still uses Payday labels.

### Task 5: Verify and commit

- [ ] **Step 1:** Run every Definition of done check in the spec that runs here; list the browser and VoiceOver checks as Britt's.
- [ ] **Step 2:** Commit spec, plan, `CHECK`, `GAME`, `GUIDE` and `lesson-structure.md` on `t3/continue-money-management-lesson`.
