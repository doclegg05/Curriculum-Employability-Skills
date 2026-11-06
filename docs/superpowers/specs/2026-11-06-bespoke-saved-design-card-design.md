# BeSpoke: show the team's saved design when they open it

Date: November 6, 2026. Requested by Britt. Must ship before the teacher announcement email and the Money Management pilot.

## Problem

On November 6 Britt saved a Money Management design on one machine and opened it on another. The save worked: it reached the shared store at 9:10 AM Eastern, and the second machine almost certainly loaded it. Britt still couldn't tell whether the screen showed the saved design or the starting presets. The only signal today is one sentence in the session bar ("Money Management team session. Shared version saved …. This browser matches the shared design."), and the slides look much like any other look.

Teams will come back to their design after weeks away. They will not remember what they picked. If they can't tell what's saved, they'll redo work, save over a good design, or stop trusting BeSpoke.

Britt's words: "We need to concretely show what design was saved. Leave no room for guessing."

Teams already make progress across sessions. Opening loads the latest save, they change it, and they save again. Words typed on all five sample slides are saved and come back. This work makes that visible. It doesn't change how saving works.

## Goals

1. When a team opens their lesson, a card above the slides says plainly that this is their saved design and when it was saved.
2. The card shows enough of the design that a team recognizes it.
3. The card tells teams they can click any words on a slide to change them.
4. When the browser holds changes that were never saved for the team, the team must choose explicitly between the saved design and those changes. BeSpoke never picks for them.
5. A "See all choices" view lists every choice in the saved design.

## Non-goals

- No change to the saved-design format, the selection schema, or the Netlify service. No service redeploy.
- No new editing features. Text on all five slides is already editable through Make it yours (the Text section, and clicking text on a slide).
- No version history browser. The ⋯ menu's existing history stays as it is.
- No change to how Save, Open or Send work underneath.

## Anti-goals (failure even if it technically works)

- The card claims "this is your saved design" while the screen differs from the save.
- BeSpoke quietly replaces the team's saved design with leftover browser changes, or the reverse, without a click.
- The card is so easy to miss that the November 6 confusion repeats, or so heavy that it gets in the way of editing.

## Solution

One card above the slide preview that states what the team is looking at, in every opening state below.

### 1. Opening a lesson that has a saved design (option A, chosen by Britt)

Once the code is accepted and the saved design has loaded, a green-bordered card sits above the slide preview:

- Heading: **You're looking at your team's saved design**
- Saved date and time in the viewer's local time, for example "Saved Thursday, November 6 at 9:10 AM".
- The starting look's name. Once a design has been edited, `startingPoint` becomes `custom` and the original look's name is gone. In that case, say "Your own design". Builder's call: find a better label only if the data already holds the base look.
- Swatches with names for the main colors, and the font pair.
- One line: "Click any words on a slide to change them."
- Buttons: **See all choices** and **OK**. OK closes the card for this session.

The mockup Britt approved is the "A" panel shown in chat on November 6. The colors and names in it were placeholders.

### 2. After the first change

As soon as the design differs from the saved design, the card leaves for the rest of the session. The existing session bar line ("This browser has changes that are not in the shared design.") carries the state from there. Builder's call: whether that line needs to be more prominent. Keep it in the spirit of "no guessing".

### 3. No save yet

The same card position, without the green "saved" styling: **Your team hasn't saved a design yet. You're looking at the starting presets.** Include the "Click any words…" line and OK.

### 4. Unsaved browser changes left over

When the browser holds changes that aren't in the team's latest save, a card in the same position says so. For example: "This browser has changes from November 3 that were never saved for the team." Use the local draft's last-change time if one is stored; otherwise leave out the date. It has two buttons, both required:

- **Use the team's saved design**: loads the latest save. Keep the existing recovery copy behavior (`keepRecoveryCopy`), so the browser changes can still be recovered from the ⋯ menu.
- **Keep these changes**: keeps the browser draft. The session bar then says the screen is not the saved design, until the team saves.

Today this case either keeps the draft with a toast or shows **Load latest shared design** / **Keep this browser draft** links in the session bar (`ui.cloudConflict`). The new card replaces that experience on open. The builder decides whether to reuse those buttons' handlers or replace them.

"Leftover changes" means: the browser draft differs from the team's latest save **and** someone saved after this browser's last save (a newer revision exists). That is the only case where two real versions compete.

Claude's call (builder check, November 6): when no newer save exists, the browser draft is simply this team's newest work, for example after a reload mid-edit. It is not a leftover. Today autosave finishes saving it. The card then says **Your latest changes are being saved for the team**, and after the save it shows the normal green card with the new time. Britt can overrule this.

After **Keep these changes** when a newer save exists (Britt, November 6, option b): **Save for the team** asks first. "This will replace the design saved Monday at 2:15 PM. Replace it?" with **Replace it** and **Cancel**. Replace saves the browser version over the newer one. The replaced version stays in the save history (⋯ menu, **Use these choices**), so it can be brought back. Cancel changes nothing. Autosave stays off until the team chooses. It never replaces a newer save on its own. The service's revision check stays as it is. The page re-sends with the newer revision as the expected one only after the team clicks **Replace it**.

This case should be rare. Britt gives the team code to one person per team (the spokesperson). Everyone else gets the read-only view link. Two machines editing one lesson usually means the same person switching devices.

### 4b. Work made before the code was entered

Claude's call: keep the October 30 rule in `docs/bespoke/decisions.md`. Since PR #68 the code comes first, so this is rare. If a save exists, the browser work goes to the recovery copy and the save loads, as today. The green card then adds one line: "Work from this browser before you entered the code is in ⋯ > Recover previous draft." If no save exists, the work is kept, and the card says **Your team hasn't saved a design yet. The changes on screen are only in this browser until you choose Save for the team.**

### 4c. Older saves converted on open

Claude's call: when a v1 save is converted on open (`ui.convertedUnsaved`), show the saved card with its heading changed to **Your team's saved design, updated to the current version**, and keep the existing conversion note. Only Britt's test saves exist today, and they will be deleted, so this case is for safety only.

### 5. View-only sessions

View links (`team-view.mjs`) show the same saved-design card, with the date, look, colors and fonts. Leave out the "Click any words…" line and any choice buttons. The heading can stay as written, or say "You're looking at this team's saved design". That's the builder's call.

### 6. See all choices

This opens a readable list of the saved design: the starting look, the color for each role, the fonts, and each slide's choices, including its sample words. A dialog or panel is fine. Reuse existing labels from `builder-catalog.json` and the review summary code (`review-tools.mjs`, `similarity.mjs` field labels) instead of writing new wording. Plain names only, no internal ids.

## Constraints

- Static page on GitHub Pages. Plain ES modules in `bespoke/`, no build step, no new dependencies.
- Files that `scripts/bespoke-stage-service.mjs` copies to the service must not change. `bespoke/builder-model.mjs` is one of them. If shared logic is needed, put it in a page-only module. Otherwise the change needs a service redeploy, which this work avoids.
- Accessibility: the card is a labelled region, its buttons work with the keyboard, focus doesn't jump into it unasked, and status changes are announced politely (`aria-live`), as with the existing toasts.
- Wording follows the house style: plain, no em dashes. "Spokesperson", not "Team Leader".
- `bespoke/DESIGN.md` describes the screen layout. Update it if the card changes the layout it describes.
- Tests: add model or DOM checks in the style of the existing `scripts/test-bespoke-*.mjs` files, and add any new test file to `quality.sh`. The browser suites run in CI; Chromium can't run in the agent sandbox.

## Left to the builder

- Exact layout and styling of the card within the existing BeSpoke design tokens.
- Which colors count as "main" on the card (suggestion: title background, heading or title text, accent).
- Whether OK is remembered beyond the session. Default: no, so the card shows on every open.
- Test structure.

## Variables

- `BRANCH`: `feat/bespoke-saved-design-card`, cut from `origin/main`.
- `GATE`: `bash scripts/quality.sh`.
- `SERVICE_FILES`: the files `scripts/bespoke-stage-service.mjs` copies: `bespoke/builder-model.mjs`, `bespoke/builder-catalog.json`, `bespoke/catalog.json`, the selection schemas and `netlify/`.

## Workflow

1. **Plan.** Write the plan with `superpowers:writing-plans` and commit it on `BRANCH` before any code.
2. **Build.** Test first, one state at a time. Run `GATE` after each task.
3. **Verify.** Run every Definition of done check and report the actual output.
4. **Hand over.** Open one pull request. Britt merges it. No service deploy is needed if `SERVICE_FILES` are unchanged.

## Deliverables

- This design and its plan, committed on `BRANCH`.
- The card, the leftover-changes choice and the See all choices view in `bespoke/`, with tests wired into `scripts/quality.sh`.
- Updated `bespoke/DESIGN.md`, `bespoke/team-guide.html` (a line on the card and on clicking words to change them) and `docs/bespoke/decisions.md` (the "explicit choice, never automatic" rule).
- One pull request.

## Definition of done

- Every opening state has a test.
  - Check: run the new test file(s) with `node`.
    Expected: passing checks named for: saved design, after a change, no save yet, leftover changes (both buttons), view only, See all choices.
- No leftover change is replaced or kept without a click.
  - Check: a test opens a lesson with unsaved browser changes and a newer save.
    Expected: the design on screen is unchanged and both buttons show until one is clicked; after **Use the team's saved design**, the recovery copy holds the browser changes.
- A newer save is only replaced after **Replace it**.
  - Check: a test chooses **Keep these changes**, waits past the autosave delay, then clicks **Save for the team** and **Cancel**, then **Save for the team** and **Replace it**.
    Expected: no save request before **Replace it**; one save after it, sent with the newer revision as expected; the older version is listed in the save history.
- The card never claims a changed screen is the saved design.
  - Check: a test makes one edit after opening.
    Expected: the card is gone and the session bar says the browser has changes not in the shared design.
- The service is untouched.
  - Check: `git diff --stat origin/main -- bespoke/builder-model.mjs bespoke/builder-catalog.json bespoke/catalog.json netlify/ 'SPOKES Builder/'`
    Expected: no output.
- The gate passes.
  - Check: `bash scripts/quality.sh`
    Expected: exit 0 locally for the node suites, and the `quality` check green on the pull request.
- Britt sees it work on the live page.
  - Check: after merge, Britt saves on one machine and opens on another.
    Expected: the card shows the right save time and choices; Britt confirms there was no guessing.
