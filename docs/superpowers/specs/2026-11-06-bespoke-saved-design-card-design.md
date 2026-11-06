# BeSpoke: show the team's saved design when they open it

Date: Friday, November 6, 2026. Requested by Britt. Must ship before the teacher announcement email and the Money Management pilot. Revised the same day after a second review (Sol) checked it against the code; Britt agreed to every revision.

## Problem

On November 6 Britt saved a Money Management design on one machine and opened it on another. The save worked: it reached the shared store at 9:10 AM Eastern, and the second machine almost certainly loaded it. Britt still couldn't tell whether the screen showed the saved design or the starting presets. The only signal today is one sentence in the session bar ("Money Management team session. Shared version saved …. This browser matches the shared design."), and the slides look much like any other look.

Teams will come back to their design after weeks away. They will not remember what they picked. If they can't tell what's saved, they'll redo work, save over a good design, or stop trusting BeSpoke.

Britt's words: "We need to concretely show what design was saved. Leave no room for guessing."

Teams already make progress across sessions. Opening loads the latest save, they change it, and they save again. Words typed on all five sample slides are saved and come back. This work makes that visible.

Who edits: Britt gives the team code to one person per team (the spokesperson). Everyone else gets the read-only view link. Two machines editing one lesson usually means the same person switching devices.

## Goals

1. When a team opens their lesson, a card above the slides says plainly that this is their saved design and when it was saved.
2. The card shows enough of the design that a team recognizes it.
3. The card tells teams how to change the words on a slide.
4. When two real versions compete, the team chooses explicitly. BeSpoke never picks for them.
5. A "See all choices" view lists every choice, and says which version it lists.
6. After the card closes, a compact status stays visible, so the team always knows whether the screen is saved.

## Non-goals

- No change to the saved-design format, the selection schema, or the Netlify service. No service redeploy.
- The service API and its revision protection stay as they are. The page adds one new save path: an explicit "Replace it" confirmation (state 5).
- No new editing features. Text on all five slides is already editable in Make it yours.
- No version history browser. The ⋯ menu's existing history stays as it is.

## Anti-goals (failure even if it technically works)

- The card or badge says "saved" while the screen differs from the acknowledged save.
- The card says "saved" or "not saved yet" before BeSpoke has actually heard back from the service.
- BeSpoke replaces the team's saved design with browser changes, or the reverse, without a click.
- A "Replace it" click made for one version is reused to replace a different, newer version.
- The card is so easy to miss that the November 6 confusion repeats, or so heavy that it gets in the way of editing.

## Solution

Two pieces, shown on the edit page and on view links:

- **The card**: a large card above the slide preview. It appears on each successful opening of a team's lesson, including a reload that reopens it. **OK** closes it for that opening.
- **The status badge**: a compact badge in the top bar that is always visible once a team session is open. View links have no badge (state 10). It shows one of: **Checking…**, **Saved**, **Saving…**, **Changes not saved**, **Save failed**, **Couldn't check**. Clicking it opens **See all choices**.

The card and the badge only say "saved" when the design on screen matches the save the service has acknowledged. "Matches" uses the existing `baseSelectionKey`: the key of the design as rebuilt on open (after any conversion), or of the design just saved. The page keeps that rebuilt design as the saved snapshot, separate from the editable design, so the two can't get mixed up. A stored design that differs from the rebuilt one only in shape is not a change (as `converted-open.mjs` already treats it).

The mockup Britt chose is the "A" panel shown in chat on November 6. The colors and names in it were placeholders.

### 1. Checking

From entering the code until the service answers, the card says **Checking your team's saved design…** and the badge says **Checking…**. Nothing else claims a state.

### 2. Couldn't check

If the open request fails (no connection, service error, invalid response): **We couldn't check your team's saved design. Your browser work is still here.** with a **Try again** button. The badge says **Couldn't check**. Autosave does not run. A rejected code keeps today's code-entry error handling.

### 3. Saved design opened (the main case)

A green-bordered card:

- Heading: **You're looking at your team's saved design**
- The save time in the viewer's local time, for example "Saved Friday, November 6 at 9:10 AM".
- The starting look's name. Once a design has been edited, `startingPoint` becomes `custom` and the original look's name is gone. In that case, say "Your own design". Builder's call: find a better label only if the data already holds the base look.
- Swatches with names for the main colors, and the font pair.
- One line: "Choose Make it yours, then select text on a slide to change it." Builder's call: adjust to match the stage the team lands on, as long as it's accurate.
- Buttons: **See all choices** and **OK**.

The badge says **Saved**.

### 4. After a change

The card closes on the first change. The badge switches to **Changes not saved**, then **Saving…** while autosave or Save for the team runs, then **Saved** with the new time once the service acknowledges the save, or **Save failed** if it doesn't. If the team edits again while a save is in flight, the badge goes back to **Changes not saved** when that save returns.

### 5. Two versions compete

This applies when the browser draft differs from the team's latest save **and** someone saved after this browser's last acknowledged save, so a newer revision exists.

The card says: "This browser has changes from November 3 that aren't in the team's saved design. The team's design was saved again on November 5 at 2:15 PM." Use the local draft's last-change time if one is stored; otherwise leave out that date. Both buttons are required:

- **Use the team's saved design**: loads the latest save. The browser changes go to the recovery copy (`keepRecoveryCopy`) first. If the recovery copy can't be stored, say so and don't load, so nothing is lost.
- **Keep these changes**: keeps the browser draft. The badge says **Changes not saved**. Autosave stays off.

Until a button is clicked, the screen shows the browser draft unchanged, and autosave is off.

After **Keep these changes**, **Save for the team** asks first (Britt, November 6): "This will replace the design saved Thursday, November 5 at 2:15 PM. Replace it?" with **Replace it** and **Cancel**.

- **Replace it** sends the save with exactly the revision named in the question as the expected revision. If the service answers that a newer save exists (409), BeSpoke shows the new save time and asks again. It never fetches a newer revision and reuses the earlier yes.
- **Cancel**, Escape, a failed request or a reload leave the browser draft in place and autosave off. After a reload, state 5 appears again.
- The replaced version can be brought back from the ⋯ menu save history (**Use these choices**) while it is among the 10 most recent saves the service lists.

Today this case shows **Load latest shared design** and **Keep this browser draft** links in the session bar (`ui.cloudConflict`). The new card replaces them. The builder decides whether to reuse their handlers.

Claude's call (second builder check): state 5 hangs off a shared conflict state, not only the open flow. When a save mid-session gets a 409 (another save landed), the state 5 card reopens above the slides with both buttons, and the badge says **Changes not saved**. A mid-session conflict is the likeliest real route to two versions, so it gets the same explicit choice.

### 6. Browser ahead of its own save

When the browser draft differs from the save but no newer save exists (for example, a reload mid-edit), it is the team's own newest work, not a competing version. Claude's call: BeSpoke saves it as soon as the open answers, instead of waiting for the 30-second idle autosave, so "Saving…" is true while it shows. The card says **Your latest changes are being saved for the team**, the badge says **Saving…**, and after the acknowledged save the card turns into the green state 3 card with the new time. If that save fails, the badge says **Save failed** and the card says the changes are only in this browser.

### 7. No save yet

There's no green "saved" styling for this state.

- If the screen shows the untouched starting presets: **Your team hasn't saved a design yet. You're looking at the starting presets.**
- If the browser holds work that was never saved: **Your team hasn't saved a design yet. The changes on screen are only in this browser until you choose Save for the team.**

Both include the "Choose Make it yours…" line and **OK**. The badge says **Changes not saved**, or nothing until the first change for the untouched presets. Builder's call on that badge detail.

### 8. Work made before the code was entered

Claude's call: keep the October 30 rule in `docs/bespoke/decisions.md`. Since PR #68 the code comes first, so this is rare. If a save exists, the browser work goes to the recovery copy and the save loads, as today. The state 3 card then adds one line: "Work from this browser before you entered the code is in ⋯ > Recover previous draft." If no save exists, state 7's second wording applies.

### 9. Saved design updated on open

`ui.convertedUnsaved` is set when a stored v2 design opens with changes from conversion to the current design standard (`bespoke/converted-open.mjs`). The screen then differs from the save, so the green "saved" treatment doesn't apply. The card says **Opened your team's saved design with updates. These updates haven't been saved yet.** It keeps the existing conversion note and shows the badge **Changes not saved** until the next acknowledged save. v1 saves are handled by their own path and treated the same way: not "saved" until saved.

### 10. View-only sessions

View links (`team-view.mjs`) show the state 3 card with the date, look, colors and fonts, and keep **See all choices** and **OK**. No editing line, no save or replace actions. The heading can say "You're looking at this team's saved design". That's the builder's call. If the open fails, show state 2's wording without the browser-work sentence.

Claude's calls (second builder check): viewers get no status badge, because they can't save and the card covers what they need. When the view applies conversion (a v1 save, or a v2 save that `convertToStandard` changes), the heading says **You're looking at this team's saved design, shown with updates to the current design standard**, so the card never claims an exact match it doesn't have.

### 11. See all choices

A dialog or panel listing the starting look, the color for each role, the fonts, and each slide's choices, including its sample words. Its heading names the source:

- **Choices in the saved design**: from the acknowledged saved snapshot.
- **Choices you're editing**: from the current design, when it differs from the save. When the two differ, offer both, with the saved one first.

In state 9 the saved list shows the design as rebuilt on open, headed **Choices in the saved design, with updates**, next to the existing list of conversion changes. Claude's call: the old stored values are already described by that change list.

Reuse existing labels from `builder-catalog.json` and the review summary code (`review-tools.mjs`, `similarity.mjs` field labels). Plain names only, no internal ids.

### Switching lessons

If the team switches lessons or leaves the session while a request is pending, the late answer is ignored, as the existing `draftGeneration` and session checks already do. The card and badge always describe the lesson on screen.

## Constraints

- Static page on GitHub Pages, which rebuilds on merge. Plain ES modules in `bespoke/`, no build step, no new dependencies.
- No file in `SERVICE_FILES` may change. If shared logic is needed, put it in a page-only module.
- Accessibility: the card is a labelled region, its buttons work with the keyboard, focus doesn't jump into it unasked, and state changes are announced politely (`aria-live`), as with the existing toasts. The badge's state is in its text, not only its color.
- Wording follows the house style: plain, no em dashes. "Spokesperson", not "Team Leader".
- `bespoke/DESIGN.md` describes the screen layout. Update it for the card and badge.
- Tests: model or DOM checks in the style of the existing `scripts/test-bespoke-*.mjs` files, wired into `scripts/quality.sh`. The browser suites run in CI; Chromium can't run in the agent sandbox.

## Left to the builder

- Exact layout and styling of the card and badge within the existing BeSpoke design tokens.
- Which colors count as "main" on the card (suggestion: title background, heading or title text, accent).
- Test structure.

## Variables

- `BRANCH`: `feat/bespoke-saved-design-card`, cut from `origin/main`.
- `GATE`: `bash scripts/quality.sh`.
- `SERVICE_FILES`: the list in `scripts/bespoke-stage-service.mjs`: `netlify.toml`, `netlify/functions`, `netlify/site`, `bespoke/selection.schema.json`, `bespoke/selection-v2.schema.json`, `bespoke/builder-model.mjs`, `bespoke/background-structures.mjs`, `bespoke/font-slots.mjs`, `bespoke/builder-catalog.json`, `bespoke/catalog.json`, `SPOKES Builder/bespoke-library-catalog.json`.

## Workflow

1. **Plan.** Write the plan with `superpowers:writing-plans` and commit it on `BRANCH` before any code.
2. **Build.** Test first, one state at a time. Run the focused test file after each task and `GATE` before handoff.
3. **Verify.** Run every Definition of done check and report the actual output.
4. **Hand over.** Open one pull request. Britt merges it. No service deploy is needed.

## Deliverables

- This design and its plan, committed on `BRANCH`.
- The card, the status badge, the replace confirmation and See all choices in `bespoke/`, with tests wired into `scripts/quality.sh`.
- Updated `bespoke/DESIGN.md`, `bespoke/team-guide.html` (the card, the badge, and how to change slide words) and `docs/bespoke/decisions.md` (the "explicit choice, never automatic" rule and "saved means acknowledged").
- One pull request.

## Definition of done

- Every state has a test.
  - Check: run the new test file(s) with `node`.
    Expected: passing checks named for states 1 to 11 and lesson switching.
- Nothing says "saved" before the service answers, or after a failure.
  - Check: tests with a pending open, a failed open, and a failed save.
    Expected: the card and badge show Checking, Couldn't check and Save failed; neither shows Saved or "hasn't saved".
- Saved means acknowledged and matching.
  - Check: a test edits while a save is in flight, then lets the save return.
    Expected: the badge shows Changes not saved, not Saved.
- No competing version is replaced or kept without a click.
  - Check: a test opens a lesson with browser changes and a newer save, waits past the autosave delay, then clicks **Use the team's saved design**.
    Expected: no save request before the click; the screen is unchanged until the click; afterward the recovery copy holds the browser changes. With recovery storage failing, the save is not loaded.
- **Replace it** applies only to the version it named.
  - Check: a test chooses **Keep these changes**, clicks **Save for the team** then **Cancel**, reloads, then **Save for the team** and **Replace it** while the fake service has received another save.
    Expected: no save request before **Replace it**; the request carries the named revision; the 409 brings a new question with the newer time; no save goes through until the second **Replace it**.
- Viewers can inspect but not change.
  - Check: a view-only test.
    Expected: the card, **See all choices** and **OK** show; no editing line, Save or Replace.
- The service is untouched.
  - Check: `git diff --stat origin/main -- netlify.toml netlify bespoke/selection.schema.json bespoke/selection-v2.schema.json bespoke/builder-model.mjs bespoke/background-structures.mjs bespoke/font-slots.mjs bespoke/builder-catalog.json bespoke/catalog.json 'SPOKES Builder/bespoke-library-catalog.json'`
    Expected: no output.
- The gate passes.
  - Check: `bash scripts/quality.sh`
    Expected: exit 0 locally for the node suites, and the `quality` check green on the pull request.
- Britt sees it work on the live page.
  - Check: after merge and the Pages rebuild, Britt saves on one machine and opens on another.
    Expected: the card shows the right save time and choices, the badge says Saved, and Britt confirms there was no guessing.
