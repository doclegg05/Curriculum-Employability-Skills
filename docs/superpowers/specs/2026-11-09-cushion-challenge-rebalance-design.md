# Cushion Challenge: rebalance, class discussion, screen readers

Date: November 9, 2026. Status: approved by Britt in chat, ready to plan.

File: `lesson-Money-Management/Part-2-Save-Money-Before-You-Spend-It-Britt/cushion-challenge.html`. This round changes only that file, plus one check script.

## Problem

The Cushion Challenge teaches one idea: save a little first, automatically, somewhere safe. The game does not reward that idea today. A script that played all 192 paths found that every choice except the tax refund reaches the $250 goal exactly half the time, whatever the player picks. Refunds of $0 or $100 never reach it. Refunds of $300 or $600 always do. A player who saves $50 first every payday with every good habit ends at $140, while a player who saves nothing and puts $300 of the refund away wins.

Two classroom problems came up in the same review. Class mode locks the first answer the teacher enters, so the class cannot change its mind while it talks. There is also no Back button. A third problem is for screen reader users: the whole stage is a live region, so every screen is read out in full.

## Goals

1. The saving habit decides how Jess does. The refund still helps, and the results say plainly which part came from which.
2. In class mode, the teacher can change the class's pick until Reveal.
3. Back lets the class return to an earlier question and change its answer.
4. Screen readers hear the new question, the result and the cushion change, not the whole stage again.

## Non-goals

- A short segment version (for example `?length=short`). Planned for later.
- Rebuilding the Teacher's Guide PDF (it needs `reportlab`, which this Mac does not have), and updating the lesson plan. See Follow-ups. The guide's source text is in scope.
- Rewriting the story around a different character, or changing the Meet Jess video.
- Changing the $250 goal or its Urban Institute source.

## Anti-goals

These would count as failures even if the code works:

- A refund-only win shown as a success with no explanation.
- Numbers that are not believable for a SNAP family with $400 a week take-home.
- A learner who saves $10 a week with every good habit being told the plan failed the emergency.
- Back or Change this answer leaving the cushion, the ledger or the step list out of step with the answers on screen.

## Solution

Decided by Britt, November 9, 2026.

### Money math

Each payday stage now stands for one month of weekly paydays. The weekly save amount counts four times per stage.

| Item | Now | New |
|---|---|---|
| Stage | One payday | One month (4 paydays of $400) |
| Save first, $10 / $25 / $50 a week | Once per stage | Times 4 per month: $40 / $100 / $200 |
| Flat tire, month 3 | $60 | $120 |
| Account fee | $12 once | $12 at the start of months 2, 3 and 4 |
| Jar dip, month 3 | $15 | $40 |
| School pictures | $30 | $30, unchanged |
| Refund choices, month 4 | $0 / $100 / $300 / $600 of $1,200 | Unchanged |
| Goal | $250 | Unchanged |

Saving by hand still happens in months 2 and 4 and is skipped in the busy month 3. Automatic saving happens in months 2, 3 and 4. If Jess chose Save what's left and then says yes to automatic saving, the split uses $25 a week, as it does now.

Order of events within a month stays as it is today, and the cushion never drops below $0. Month 2: fee, saving, picture day. Month 3: fee, saving, jar dip, tire. Month 4: fee, saving, refund.

Outcomes the build must keep, checked by script (see Definition of done). Hand-worked paths:

- Good habits (safe account, automatic, pictures paid from the weekly plan) at $10 a week, refund $0: the cushion covers the $120 tire exactly, then ends at $40.
- Good habits at $25 a week, refund $0: reaches $250 ($280).
- Save what's left with no automatic saving: never covers the tire.
- The refund choice never changes what the habit built before the refund.
- The $10 a week good-habits path gets the "her habit covered the tire" message, whatever the refund. (The check covers headline selection, not only totals.)
- $25 a week, fee account, automatic, pictures planned, refund $0: $244, just under the goal. Each month's $12 fee is counted.
- $25 a week, jar, automatic, pictures planned, refund $0: $240. The $40 dip is counted.

Rules that hold on every one of the 192 paths:

- From her saving habit plus from her tax refund equals the final cushion.
- Changing only the refund never changes the habit part.
- The fee account and the jar never end higher than the same path with the safe account.
- The tire shortfall equals $120 minus the cushion just before the tire, or $0 if that is negative.
- Each path gets exactly one headline under the rules below.

### State: the cushion is calculated from the answers

Required, not optional. The cushion, the ledger and the split come from one pure function of the answers, which answers are revealed, and the screen being viewed. Nothing adds money while a screen draws. That way Back, Next, reload, Change this answer and mode switches cannot charge a fee, a save or the tire twice, or leave a stale charge behind.

- An unrevealed class pick never affects money.
- Switching between class and solo mode never changes money. An unrevealed pick stays unrevealed, with its Reveal button, until someone presses Reveal. (Claude's call.)
- Reloading the page partway through, including while viewing an earlier screen through Back, shows the same cushion, ledger and screen as before the reload.

### How It Went shows the split

The results screen breaks the cushion into two parts:

- **From her saving habit:** the cushion just before the refund is added, after every save, fee, dip, picture day and the tire.
- **From her tax refund:** the refund amount she chose.

The two add up to the final cushion. The screen also says whether her savings covered the flat tire, and by how much she was short if not.

Headline rules:

- The habit part alone reaches $250: celebrate the habit.
- The total reaches $250 only because of the refund: say the refund got her past the line this time, and that a flat tire does not wait for refund season.
- Neither reaches $250: keep the current "That's a start" tone.
- Whenever her savings covered the tire, the screen says so first, before any of the lines above, and never suggests her plan failed the emergency. Example: $10 a week with every good habit ends at $40 before the refund. It hears that her habit handled the flat tire, then that a bit more each payday would get her past $250. (Claude's call, from the anti-goal about the $10 saver.)

The existing What helped and What held her back lists stay.

### Class mode: change the pick before Reveal

After the teacher taps a choice or presses A to D, the other choices stay active. Tapping another choice or pressing another letter moves the pick. Reveal locks the choice and applies its money effect, as it does now. Solo mode is unchanged: a pick applies at once.

### Back, with redo

- A Back button on every screen after Meet Jess goes to the previous screen.
- An answered screen opened through Back shows its answer and result, locked, with a **Change this answer** button.
- Change this answer clears that answer and every later answer and reveal, then re-enables the choices. The cushion, ledger and step list go back to how they stood before that question.
- Pressing Next on a screen opened through Back, without changing anything, keeps the later answers and moves forward through them.
- Passing back through the flat tire screen (no choice there) is allowed. Its effects follow from the answers before it.
- The meter and ledger always show the cushion at the point in the story being viewed, not the latest total. Going Back to Month 2 shows the Month 2 cushion, and Next moves it forward again. The state tracks both the screen being viewed and the furthest screen reached. Back and Next do not announce cushion changes; only a new pick, a Reveal or a story event does. (Claude's call: it keeps the screen and the meter telling the same story.)

### Screen readers

- The stage is no longer a live region.
- A new screen moves focus to its heading, as now.
- Reveal, or a solo pick, moves focus to the result, as now.
- One polite live region (the existing `#announce`, changed from assertive) gives the short cushion change, for example "Flat tire repair: minus $120. Cushion is $0."
- Change this answer announces that this answer and the ones after it were cleared.

## Constraints

- SPOKES palette and fonts only, as the file's header comment says. Follow the accessibility rules in `SPOKES-STANDARD.md` Section 3: 44px touch targets, visible focus, keyboard reachable. Back and Change this answer are buttons.
- The game is a single self-contained HTML file with inline script, no build step and no libraries.
- **Saved progress.** The `KEY` line near the top of the script shows as `[REDACTED]` in some tool output. That is a display filter, not the real value. Never retype that line. Leave it as it is, and protect against old saved progress by adding a version number to the saved state and discarding any saved state without the current version.
- Facts and sources in the Why cards stay as they are, apart from wording that names amounts that changed.
- Jess's take-home stays $400 a week.

## Left to the builder

- **Exact copy** for the month headlines, choice labels and the split, within these rules: kickers read "Month 1" to "Month 4", the step list reads Meet Jess, Month 1 to Month 4, How it went, Your turn, and choice details show the monthly total (for example "Save $25 first each payday" with "$100 this month").
- Where Back sits in the actions row, and how the step list shows a screen opened through Back.
- How the check script reaches the game's math: extract the pure function, drive the page with Playwright (already used by the repo's BeSpoke tests), or another approach.

## Variables

- `BRANCH`: `t3/continue-money-management-lesson`, the current worktree branch.
- `GAME`: `lesson-Money-Management/Part-2-Save-Money-Before-You-Spend-It-Britt/cushion-challenge.html`.
- `CHECK`: the new math check script, named by the plan (for example `scripts/check-cushion-math.mjs`).
- `GUIDE`: `lesson-Money-Management/Teacher-Resources/Part2_Save_First_Teachers_Guide.py`.

## Workflow

1. **Plan.** Write the plan with `superpowers:writing-plans` and commit it on `BRANCH` before any code.
2. **Build.** Write `CHECK` first and watch it fail against today's math. Then move the money into the pure function, change the math, then class mode and Back, then screen reader behavior, then the guide text. Run `CHECK` after each step.
3. **Verify.** Run every Definition of done check and report the actual output.
4. **Hand over.** Open one pull request. Britt merges it.

## Deliverables

- This design and its plan, committed on `BRANCH`.
- The updated `GAME`.
- `CHECK`, runnable with `node`.
- `GUIDE` updated: the $120 tire, the $12 fee each month, the $40 jar dip, the Month labels, the habit and refund split, and a short note on Back and Change this answer.
- `lesson-Money-Management/lesson-structure.md` Known stale items: the guide PDF lags its source until rebuilt.
- One pull request.

## Definition of done

- The habit decides the outcome.
  - Check: `node CHECK`
    Expected: exit 0, with every hand-worked path and every all-path rule under Money math passing. Before the math change, the same script fails.
- Nothing is charged twice.
  - Check: `CHECK` (or a browser test) answers through Month 4, goes Back to Month 1 and Next to Month 4 twice, reloads on Month 2 while viewing it through Back, and switches class and solo mode with a pick unrevealed.
    Expected: the cushion and ledger after each step match the pure function's result for the same answers; the unrevealed pick adds nothing.
- The guide matches the game.
  - Check: `grep -nE '\$60\b|\$15\b|Payday [0-9]|loses \$12 right away' GUIDE`
    Expected: no output.
- The check reads the game's real code.
  - Check: break one constant in `GAME` (for example the tire cost), then run `node CHECK`.
    Expected: a failure. Restore the constant afterward.
- Back and Change this answer keep everything in step.
  - Check: in a browser, in class mode, answer through Month 4, go Back to Month 2, use Change this answer, pick differently, reveal, and go forward to How it went.
    Expected: Month 3 and Month 4 ask again; the cushion, ledger, step list and the split all match the new answers.
- The class pick can change before Reveal and not after.
  - Check: in class mode press A, then C, then Reveal, then A.
    Expected: C is revealed; pressing A afterward does nothing.
- Screen readers hear only what changed.
  - Check: `grep -n 'aria-live' GAME`
    Expected: one match, on `#announce`, set to `polite`.
  - Check: a VoiceOver pass on Mac Safari through one month.
    Expected: each screen reads its heading, Reveal reads the result, and the cushion change is read once.
- Old saved progress cannot break the game.
  - Check: play the current version partway, then load the new version in the same browser.
    Expected: the game starts fresh at Meet Jess with no errors in the console.
- Touch targets and focus meet the standard.
  - Check: inspect Back and Change this answer at phone width.
    Expected: at least 44px tall, with a visible focus ring.

## Follow-ups (not this round)

- Rebuild the Teacher's Guide PDF from its updated source once `reportlab` is available.
- The lesson plan (`Part2_Save_First_Lesson_Plan.docx` and `.pdf`) uses the Payday labels but no amounts. Change them to Month labels.
- The game lets an automatic split deposit go into the jar at home, which a real employer cannot do. Today's game does the same. Decide whether choosing the jar should rule out the split.
- The picture-day choice moves the cushion by $30 but never changes who reaches $250. That is acceptable for now.
- Short segment version for the 12-minute segment.
