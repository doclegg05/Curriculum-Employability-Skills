# BeSpoke Saved-Design Card Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When a team opens their BeSpoke lesson, a card and a status badge say exactly what is on screen (saved, not saved, checking, competing versions), and the team can read every saved choice.

**Architecture:** A pure state module decides the card and badge from a small snapshot of session facts. A pure summary module turns a design into readable rows. A thin DOM module draws them. `builder-app.mjs` and `team-view.mjs` gather the facts and call the DOM module; the only new save behavior is an explicit "Replace it" path in `cloudSave`. No file the service bundles changes.

**Tech Stack:** Plain ES modules in `bespoke/`, no build step. Node `node:test` for pure modules. Playwright (`scripts/bespoke-test-browser.mjs`, `scripts/bespoke-dev-server.mjs`) with an intercepted fake service for browser tests.

**Spec:** `docs/superpowers/specs/2026-11-06-bespoke-saved-design-card-design.md` (approved by Britt, November 6, 2026). Read it before any task; state numbers below are the spec's.

## Global Constraints

- No change to any `SERVICE_FILES` path: `netlify.toml`, `netlify/functions`, `netlify/site`, `bespoke/selection.schema.json`, `bespoke/selection-v2.schema.json`, `bespoke/builder-model.mjs`, `bespoke/background-structures.mjs`, `bespoke/font-slots.mjs`, `bespoke/builder-catalog.json`, `bespoke/catalog.json`, `SPOKES Builder/bespoke-library-catalog.json`.
- No new dependencies. No build step.
- "Saved" appears only when the screen's `currentSelectionKey()` equals the session's `baseSelectionKey` and the service acknowledged that save.
- No save request is sent while two versions compete (state 5) until the team clicks **Keep these changes** and then **Replace it**.
- Copy is plain English, no em dashes, "spokesperson" not "Team Leader". Exact headings and lines are fixed in Task 1's table.
- Times show in the viewer's local time with weekday, month, day and time, for example "Friday, November 6 at 9:10 AM".
- `bespoke/builder-app.mjs` is already 2107 lines. Put new logic in the new modules; keep additions there to wiring.
- Accessibility: card is a labelled `region`; badge and card text changes go through `aria-live="polite"`; state is in text, not only color; focus never moves into the card unasked.
- Every new test file is listed in `scripts/quality.sh` (node unit list for `node --test` files, browser list for Playwright files).

## Review Focus

1. **A save returns after the team switched lessons or left the session.** Expect the late answer to be ignored and the card to describe the lesson on screen. Test added to Task 4.
2. **The team keeps typing while "Saving…" shows.** Expect the badge to read **Changes not saved** when that save returns, never **Saved**. Test added to Task 4.
3. **The recovery copy can't be stored (storage full or blocked) when choosing Use the team's saved design.** Expect the saved design not to load and a message saying so. Test added to Task 5.
4. **The team presses Escape or reloads while the Replace question is open.** Expect no save, draft kept, autosave off, and state 5 shown again after reload. Test added to Task 5.
5. **A v1 save, or a v2 save that conversion changes, opened on a view link.** Expect the "shown with updates to the current design standard" heading, not the plain saved heading. Test added to Task 6.

---

### Task 1: Card and badge state model

**Files:**
- Create: `bespoke/saved-status.mjs`
- Test: `scripts/test-bespoke-saved-status.mjs` (node:test), add to the `node --test` line in `scripts/quality.sh`

**Interfaces:**
- Produces:
  - `formatSavedTime(iso: string, locale?: string) -> string`, for example `"Friday, November 6 at 9:10 AM"`.
  - `savedStatus(facts: SavedFacts) -> { card: Card|null, badge: Badge|null }`
  - `SavedFacts = { access: 'edit'|'view', phase: 'checking'|'failed'|'ready', hasSave: boolean, savedAt: string|null, matchesSave: boolean, saving: boolean, saveFailed: boolean, conflict: {revision: string, savedAt: string}|null, keptChanges: boolean, converted: boolean, untouchedPresets: boolean, aheadSaving: boolean, priorWork: boolean, dismissed: boolean, draftChangedAt: string|null }`
  - `Card = { kind: 'checking'|'failed'|'saved'|'ahead'|'conflict'|'empty'|'converted', heading: string, lines: string[], actions: Array<'retry'|'choices'|'ok'|'useSaved'|'keepChanges'> }`
  - `Badge = { text: 'Checking…'|'Saved'|'Saving…'|'Changes not saved'|'Save failed'|"Couldn't check", tone: 'ok'|'busy'|'warn'|'error' }`
  - `EDIT_LINE = "Choose Make it yours, then select text on a slide to change it."`

The card and badge are independent outputs: `dismissed` hides the card only. Once the team edits (`matchesSave` false, no conflict), the card is `null`.

Fixed copy (the tests assert these exact strings; `<time>` is `formatSavedTime`):

| State | Card kind | Heading | Lines | Actions | Badge |
|---|---|---|---|---|---|
| 1 checking | checking | `Checking your team's saved design…` | none | none | Checking… |
| 2 failed (edit) | failed | `We couldn't check your team's saved design.` | `Your browser work is still here.` | retry | Couldn't check |
| 2 failed (view) | failed | `We couldn't check this team's saved design.` | none | retry | none |
| 3 saved (edit) | saved | `You're looking at your team's saved design` | `Saved <time>`, EDIT_LINE; plus `Work from this browser before you entered the code is in ⋯ > Recover previous draft.` when `priorWork` | choices, ok | Saved |
| 3 saved (view) | saved | `You're looking at this team's saved design` | `Saved <time>` | choices, ok | none |
| 4 after a change | null | | | | Changes not saved / Saving… / Save failed |
| 5 conflict | conflict | `This browser has changes that aren't in the team's saved design.` | `The browser changes are from <draft time>.` (only when `draftChangedAt`), `The team's design was saved again <time of conflict.savedAt>.` | useSaved, keepChanges | Changes not saved |
| 6 ahead | ahead | `Your latest changes are being saved for the team` | none | none | Saving… |
| 6 ahead failed | ahead | `Your latest changes are only in this browser.` | `Choose Save for the team to try again.` | ok | Save failed |
| 7 empty, untouched | empty | `Your team hasn't saved a design yet.` | `You're looking at the starting presets.`, EDIT_LINE | ok | none |
| 7 empty, work | empty | `Your team hasn't saved a design yet.` | `The changes on screen are only in this browser until you choose Save for the team.`, EDIT_LINE | ok | Changes not saved |
| 9 converted (edit) | converted | `Opened your team's saved design with updates.` | `These updates haven't been saved yet.`, `Saved <time>` | choices, ok | Changes not saved |
| 10 converted (view) | saved | `You're looking at this team's saved design, shown with updates to the current design standard` | `Saved <time>` | choices, ok | none |

Precedence, first match wins: `phase` checking → failed → `conflict && !keptChanges` → `aheadSaving` → `converted` → `!hasSave` → `matchesSave` → otherwise card null. The badge for edit access follows: `saving` → Saving…; `saveFailed` → Save failed; `matchesSave && hasSave && !converted` → Saved; otherwise Changes not saved (none for untouched empty). View access never has a badge.

- [ ] **Step 1: Write the failing tests**, one `test()` per table row, named for the state (for example `'state 3: an opened save says saved, with its time and the edit line'`). Each asserts `card.kind`, `card.heading`, `card.lines`, `card.actions` and `badge?.text` exactly as in the table, plus:
  - `'a dismissed card leaves the badge'`: state 3 facts with `dismissed: true` → `card === null`, `badge.text === 'Saved'`.
  - `'an edit while saving is not saved'`: `{phase:'ready', hasSave:true, matchesSave:false, saving:false}` → badge `Changes not saved`.
  - `'formatSavedTime uses weekday and local time'`: `formatSavedTime('2026-11-06T14:10:00Z', 'en-US')` under `TZ=America/New_York` equals `'Friday, November 6 at 9:10 AM'` (set `process.env.TZ` before import).
- [ ] **Step 2: Run** `node --test scripts/test-bespoke-saved-status.mjs`. Expected: FAIL, module not found.
- [ ] **Step 3: Implement** `bespoke/saved-status.mjs` with the exports above. `formatSavedTime` uses `Intl.DateTimeFormat` with `{weekday:'long', month:'long', day:'numeric'}` and `{hour:'numeric', minute:'2-digit'}`, joined by `' at '`.
- [ ] **Step 4: Run** the same command. Expected: all pass.
- [ ] **Step 5: Add** the file to the `node --test` line in `scripts/quality.sh`, then commit: `git commit -m "feat: add BeSpoke saved-design card and badge state model"`.

### Task 2: Readable design summary

**Files:**
- Create: `bespoke/choices-summary.mjs`
- Test: `scripts/test-bespoke-choices-summary.mjs` (node:test), add to `quality.sh`

**Interfaces:**
- Consumes: `CHARACTERISTICS` from `bespoke/similarity.mjs`; `effectiveRoleStyle` from `bespoke/builder-model.mjs` (import only, no edits); `catalog` shape from `builder-catalog.json`.
- Produces:
  - `cardHighlights(catalog, design) -> { look: string, colors: Array<{name: string, hex: string}>, fonts: string }`. `look` is the preset `label` for `design.startingPoint`, or `'Your own design'` when it is `custom` or unknown. `colors` are the roles `titleBackground`, `titleText`, `accent`, in that order, using `catalog.colors` names and hexes. `fonts` is `'<heading label> + <body label>'`.
  - `designSummary(catalog, design) -> Array<{ section: string, rows: Array<{ label: string, value: string, hex?: string }> }>` with sections in this order: `Starting look`, `Colors`, `Fonts`, `Title slide`, `Divider`, `Text boxes`, `Video`, `Activity`. Color rows carry `hex`. Each slide section ends with its sample words: heading, supporting text, label where shown, and for Text boxes the four box texts. Use `CHARACTERISTICS` labels and catalog option `label`s; never output an id.

- [ ] **Step 1: Write failing tests:**
  - `'highlights name the preset look, three colors and the font pair'` on `applyPreset(catalog,'professional')`: `look === 'Editorial'`, `colors.length === 3`, every `hex` matches `/^#[0-9a-f]{6}$/`, `fonts` contains `' + '`.
  - `'a customized design is Your own design'`: set `startingPoint:'custom'` → `look === 'Your own design'`.
  - `'the summary lists sections in order and never shows an id'`: section names equal the list above; no row `value` equals any `catalog.colors[].id`, `catalog.fonts[].id` or decision option id.
  - `'typed words come back in the summary'`: use `setRoleStyle(catalog, design, 'video', 'headingText', 'Watch Dana budget')` → the Video section has a row with value `'Watch Dana budget'`.
- [ ] **Step 2: Run** `node --test scripts/test-bespoke-choices-summary.mjs`. Expected: FAIL, module not found.
- [ ] **Step 3: Implement** both functions.
- [ ] **Step 4: Run** again. Expected: all pass.
- [ ] **Step 5: Add** to `quality.sh`, commit: `git commit -m "feat: add readable summary of a BeSpoke design"`.

### Task 3: Card, badge and choices dialog markup

**Files:**
- Create: `bespoke/saved-card.mjs`
- Modify: `bespoke/index.html` (add `<section id="savedCard" role="region" aria-label="Saved design" aria-live="polite" hidden>` directly above the slide preview, `<span id="saveBadge" class="save-badge" aria-live="polite" hidden>` in the top bar beside Save for the team, and `<dialog id="choicesDialog" aria-labelledby="choicesTitle">`)
- Modify: `bespoke/builder.css` (card, badge tones, dialog list; green border only for `kind === 'saved'`)

**Interfaces:**
- Consumes: `Card`, `Badge` (Task 1); `cardHighlights`, `designSummary` (Task 2).
- Produces:
  - `renderSavedCard(section: HTMLElement, card: Card|null, highlights: ReturnType<cardHighlights>|null, on: { retry, choices, ok, useSaved, keepChanges })`. Hides the section when `card` is null. Draws highlights only for `saved` and `converted` kinds. Buttons have ids `savedRetry`, `savedChoices`, `savedOk`, `savedUseSaved`, `savedKeepChanges` and labels `Try again`, `See all choices`, `OK`, `Use the team's saved design`, `Keep these changes`. Only rewrites text that changed (as `team-view.mjs` `draw` does), so `aria-live` doesn't repeat.
  - `renderBadge(el: HTMLElement, badge: Badge|null, onClick)`: `data-tone` set to `badge.tone`; the badge is a `button` that calls `onClick` (opens choices).
  - `openChoices(dialog: HTMLDialogElement, lists: Array<{ title: 'Choices in the saved design'|'Choices in the saved design, with updates'|"Choices you're editing", summary: ReturnType<designSummary> }>)`: one list per entry, saved first.

- [ ] **Step 1:** Add the markup and CSS, and implement the three functions. These are covered by the browser tests in Tasks 4 to 7; no separate unit test.
- [ ] **Step 2: Run** `node --test scripts/test-bespoke-saved-status.mjs scripts/test-bespoke-choices-summary.mjs` and `node scripts/test-bespoke-code-first.mjs`. Expected: pass (no regressions; markup is hidden until wired).
- [ ] **Step 3: Commit:** `git commit -m "feat: add BeSpoke saved-design card, badge and choices markup"`.

### Task 4: Wire the edit page (states 1, 2, 3, 4, 6, 7, 8, 9)

**Files:**
- Modify: `bespoke/builder-app.mjs`: `fetchSharedDesign` (around line 777), `cloudSave` (around line 850), `updateCloudChrome` (around line 240), startup (around line 2103), the open dialog path that keeps or recovers pre-code work (around line 1161).
- Test: `scripts/test-bespoke-saved-card.mjs` (Playwright, fake service in the style of `scripts/test-bespoke-session-switch.mjs`), add to the browser list in `quality.sh`.

**Interfaces:**
- Consumes: Tasks 1 to 3.
- Produces in `builder-app.mjs`: `ui.openPhase: 'checking'|'failed'|'ready'`, `ui.savedSnapshot: design|null` (the design as rebuilt on open or just saved), `ui.cardDismissed: boolean` (reset on each successful open), `ui.priorWork: boolean`, `ui.saveFailed: boolean`, and `function savedFacts(): SavedFacts` that reads these plus `ui.teamSession`, `hasUnsavedTeamWork()`, `handoffBusy`, `ui.cloudConflict`, `ui.convertedUnsaved`. `updateCloudChrome()` calls `renderSavedCard` and `renderBadge` from `savedStatus(savedFacts())`.

Behavior to wire:
- Set `openPhase='checking'` before the open request; `'failed'` when it returns `ok:false` for a reason other than a rejected code, or throws; `'ready'` after a successful apply. **Try again** calls `fetchSharedDesign({replace: mayReplace})` again.
- State 6: at startup, when the open answer has no newer revision (`result.revision === session.revision`) but `hasUnsavedTeamWork()`, call `cloudSave({auto:true})` immediately instead of `scheduleAutosave(AUTOSAVE.idleMs)`, and set `aheadSaving` until it returns.
- Set `ui.saveFailed` on a failed `cloudSave`, clear it on success. After a successful save, set `ui.savedSnapshot` to the saved design.
- Set `ui.priorWork` when the open dialog path moved pre-code work to the recovery copy.

- [ ] **Step 1: Write failing browser scenarios**, each named for its state:
  - `'state 1: the card says checking until the service answers'`: hold the `open` route; assert `#savedCard` heading is `Checking your team's saved design…` and `#saveBadge` is `Checking…`; release; assert state 3.
  - `'state 2: a failed open says we could not check, and Try again recovers'`: first `open` returns 503; assert heading and badge `Couldn't check`; with `window.__bespokeAutosave = {enabled:true, idleMs:50, stepMs:50}`, wait 200 ms and assert no `save` call; click `#savedRetry`; second `open` succeeds; assert state 3.
  - `'state 3: an opened save shows its time, colors and the edit line'`: `savedAt '2026-11-06T14:10:00Z'`, `TZ` set to `America/New_York` on the context; assert `Saved Friday, November 6 at 9:10 AM`, three swatches, EDIT_LINE, badge `Saved`.
  - `'state 4: an edit closes the card and the badge tracks the save'`: change a color; card hidden; badge `Changes not saved`, then `Saving…` while the held save route is pending, then `Saved`.
  - `'state 4: editing during a save leaves Changes not saved'` (Review Focus 2).
  - `'state 4: a late answer after switching lessons is ignored'` (Review Focus 1): hold `save`, switch team code to another lesson, release; card and badge describe the new lesson.
  - `'state 6: browser work ahead of its own save is saved at once'`: seed a draft differing from the save with the same revision; assert a `save` call within 1 s of the open and heading `Your latest changes are being saved for the team`, then state 3.
  - `'state 7: no save yet says so, two wordings'`: `open` returns `selection:null` with and without seeded browser work.
  - `'state 8: work before the code is in Recover previous draft'`: seed work, enter the code through the dialog, save exists; the card includes the recovery line.
  - `'state 9: a converted save is not called saved'`: serve a v2 save that `convertToStandard` changes (reuse the fixture from `scripts/test-bespoke-draft-conversion.mjs`); heading `Opened your team's saved design with updates.`, badge `Changes not saved`.
- [ ] **Step 2: Run** `node scripts/test-bespoke-saved-card.mjs`. Expected: FAIL on the first scenario (no card). In the agent sandbox Chromium can't start; run in Britt's Terminal or rely on the PR's `quality` check, and say so in the report.
- [ ] **Step 3: Implement** the wiring above.
- [ ] **Step 4: Run** the new file and `node scripts/test-bespoke-session-switch.mjs scripts/test-bespoke-code-first.mjs scripts/test-bespoke-draft-conversion.mjs` (one at a time). Expected: all pass.
- [ ] **Step 5: Add** to `quality.sh`, commit: `git commit -m "feat: show the saved-design card and badge when a team opens BeSpoke"`.

### Task 5: Competing versions and Replace it (state 5)

**Files:**
- Modify: `bespoke/builder-app.mjs` (`fetchSharedDesign` conflict branch, `cloudSave` 409 branch and a new replace path; remove the `btnLoadLatest`/`btnKeepLocal` session-bar links and their handlers at lines 261-262 and 2075, and their markup in `index.html`)
- Create: `bespoke/replace-confirm.mjs`
- Test: add scenarios to `scripts/test-bespoke-saved-card.mjs`

**Interfaces:**
- Produces:
  - `ui.keptChanges: boolean`, cleared on a successful save or open.
  - `askReplace(dialogHost: HTMLElement, savedAtText: string) -> Promise<boolean>` in `replace-confirm.mjs`: a `<dialog>` with text `This will replace the design saved <time>. Replace it?` and buttons **Replace it** (resolves true) and **Cancel** (resolves false); Escape and close resolve false.
  - `cloudSave({ auto = false, replaceRevision = null } = {})`: when `replaceRevision` is set, the request's `expectedRevision` is exactly that value. The plain `cloudSave` with `ui.cloudConflict` set and `ui.keptChanges` true calls `askReplace` with `formatSavedTime(ui.cloudConflict.savedAt)` and, on true, calls `cloudSave({replaceRevision: ui.cloudConflict.revision})`. A 409 on that request updates `ui.cloudConflict` from the response and asks again; it never retries on its own.
- Behavior: conflict on open or on a mid-session 409 sets `ui.cloudConflict` and `ui.cardDismissed=false`, so state 5 shows. **Use the team's saved design** calls `keepRecoveryCopy()`; if it returns false, show `actionNotice("Your browser changes couldn't be kept as a recovery copy, so the saved design was not loaded. Download a backup first.")` and stop; otherwise `fetchSharedDesign({replace:true})`. **Keep these changes** sets `ui.keptChanges=true`. Autosave stays off while `ui.cloudConflict` is set (already true in `canAutosave`).

- [ ] **Step 1: Write failing scenarios:**
  - `'state 5: competing versions wait for a click'`: seed browser work with revision A; `open` returns revision B; with the same 50 ms autosave override, wait 200 ms; assert no `save` call, both buttons, the screen still shows the seeded design.
  - `'state 5: Use the team's saved design keeps a recovery copy'`: click; the recovery key in `localStorage` holds the seeded design; screen shows B; state 3.
  - `'state 5: a full recovery store stops the load'` (Review Focus 3): make `localStorage.setItem` throw for the backup key; click; screen unchanged; the notice text above.
  - `'state 5: a mid-session conflict reopens the choice'`: open normally, edit, `save` returns 409 with revision C; the state 5 card shows.
  - `'Replace it names one version'`: Keep these changes → Save for the team → dialog text names B's time → Cancel → no `save`; press Escape on a second ask → no `save` (Review Focus 4); reload → state 5 shows again; Keep → Save → **Replace it** while the fake service has moved to revision C → request `expectedRevision === B` → 409 → dialog names C's time → **Replace it** → request `expectedRevision === C` → success → badge `Saved`.
- [ ] **Step 2: Run** `node scripts/test-bespoke-saved-card.mjs`. Expected: the new scenarios fail.
- [ ] **Step 3: Implement** the behavior above.
- [ ] **Step 4: Run** the file plus `node scripts/test-bespoke-workflow-qa.mjs`. Expected: pass.
- [ ] **Step 5: Commit:** `git commit -m "feat: make the team choose between competing BeSpoke versions"`.

### Task 6: View links (state 10)

**Files:**
- Modify: `bespoke/team-view.mjs` (after `open` loads, call `renderSavedCard` with `savedStatus({access:'view', ...})`; keep the existing banner), `bespoke/builder-app.mjs` only to pass the converted flag the view's `applySelectionPayload` produces.
- Test: unit cases in `scripts/test-bespoke-team-view.mjs`; one browser scenario in `scripts/test-bespoke-saved-card.mjs`.

**Interfaces:**
- Consumes: Tasks 1 to 3. `converted` for views is true when the stored selection is v1 or `convertToStandard(catalog, stored.design).changes.length > 0`.

- [ ] **Step 1: Write failing tests:**
  - Unit: `'a view open shows the saved card with no badge and no edit line'`, `'a converted view says shown with updates'` (Review Focus 5), `'a failed view open says we could not check this team's design'`.
  - Browser: `'state 10: a view link shows the card and See all choices, no Save'`: `#savedChoices` and `#savedOk` present, `#saveBadge` hidden, no element with text `Save for the team` enabled.
- [ ] **Step 2: Run** `node --test scripts/test-bespoke-team-view.mjs`. Expected: new cases fail.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** the unit file and the browser file. Expected: pass.
- [ ] **Step 5: Commit:** `git commit -m "feat: show the saved-design card on BeSpoke view links"`.

### Task 7: See all choices (state 11)

**Files:**
- Modify: `bespoke/builder-app.mjs` (the `choices` handler and badge click call `openChoices`), `bespoke/team-view.mjs` (same handler for views)
- Test: scenarios in `scripts/test-bespoke-saved-card.mjs`

**Behavior:** lists are built from `ui.savedSnapshot` (title `Choices in the saved design`, or `Choices in the saved design, with updates` when converted) and, only when `hasUnsavedTeamWork()`, from `state.design` (title `Choices you're editing`), saved first.

- [ ] **Step 1: Write failing scenarios:**
  - `'See all choices lists the saved design'`: open, click `#savedChoices`; dialog has one list titled `Choices in the saved design`, includes a typed video heading from the fixture.
  - `'after an edit, See all choices shows both, saved first'`: edit, click `#saveBadge`; two lists in order; the edited value appears only in the second.
- [ ] **Step 2: Run.** Expected: fail.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run.** Expected: pass.
- [ ] **Step 5: Commit:** `git commit -m "feat: list a team's saved and edited BeSpoke choices"`.

### Task 8: Docs and the Definition of done

**Files:**
- Modify: `bespoke/DESIGN.md` (card position, badge, choices dialog), `bespoke/team-guide.html` (one short paragraph: the card, the badge, and "Choose Make it yours, then select text on a slide to change it"), `docs/bespoke/decisions.md` (two rows dated November 6, 2026: "Two versions never merge or replace without a click; Replace it applies only to the version it names" and "Saved means the service acknowledged it and the screen matches")

- [ ] **Step 1:** Write the doc changes through the `unslop` skill. Check: `grep -c $'\xe2\x80\x94' bespoke/DESIGN.md bespoke/team-guide.html docs/bespoke/decisions.md` shows no increase over `origin/main`.
- [ ] **Step 2: Run** the service check: `git diff --stat origin/main -- netlify.toml netlify bespoke/selection.schema.json bespoke/selection-v2.schema.json bespoke/builder-model.mjs bespoke/background-structures.mjs bespoke/font-slots.mjs bespoke/builder-catalog.json bespoke/catalog.json 'SPOKES Builder/bespoke-library-catalog.json'`. Expected: no output.
- [ ] **Step 3: Run** `bash scripts/quality.sh`. Expected: exit 0 for the node suites; report which browser suites could not run in the sandbox.
- [ ] **Step 4: Commit** `git commit -m "docs: describe the BeSpoke saved-design card"`, push the branch, open one PR with the `pr` skill. Britt merges. No Netlify deploy.
