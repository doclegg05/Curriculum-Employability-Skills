# BeSpoke guided builder — local verification, September 24, 2026

This report is chronological. The final advisory-color follow-up supersedes earlier
contrast-blocking conclusions; earlier entries describe the policy tested at that time.

## Result and boundary

The v2 reusable visual-design builder is implemented on `codex/bespoke-guided-builder`, based on remote main `04f6f9fd3780a418ad3667d1c42184fe60100560`. A separate managed worktree and port preserve the original checkout, unfinished Claude worktree, and original Safari draft.

The new local preview is `http://127.0.0.1:8766/bespoke/`. A detached Node process serves the isolated worktree and a synthetic persistent draft service. Safari visibly rendered the new builder in a **new tab**; the earlier wizard tab remained present and port 8765 still returned HTTP 200. The new service binds loopback, supplies only its own local handoff URL, and blocks Send/status operations. No hosted acceptance, production deployment, real team code, production draft mutation, merge, lesson build or publication was performed.

This is a reusable visual-design tool with sample text. It is not a full lesson authoring canvas. Franklin Gothic Book remains omitted under the user's authorized fallback; all twelve existing font families remain independently available.

## Executed checks

`bash scripts/quality.sh` exited 0 with `quality.sh: all checks passed`.

- All six released lesson decks and the canonical builder template passed the required critical validator checks. Their existing noncritical warnings were unchanged.
- 47 validator Python tests and 35 BeSpoke Python tests passed.
- V1 and generated v2 schemas are current; positive and deliberately invalid selection fixtures behaved as expected.
- 10 pure model regression groups and seven similarity tests passed. Rendered fingerprint regeneration matched all six actual decks and their source hashes.
- 45 service/provisioning/brief/v2/local-server Node tests passed, including synthetic revision conflicts, mutation retries, preserved v1 recovery, receipt behavior, staged dependencies, and persistence after local-service restart.
- The preserved v1 browser suite passed 27 workflows against `legacy.html`.
- The new v2 browser suite passed seven end-to-end scenarios: full palette and independent fonts, editable presets, cumulative navigation and reload, Undo, hidden box text through all counts/title/treatments, invalid-contrast backup recovery, save/reopen and stale-writer recovery, v1 conversion review pause, keyboard focus, desktop/mobile layout and accessibility.
- Browser checks recorded no missing assets, runtime errors or external requests. All desktop steps and mobile controls/preview passed axe WCAG A/AA. The sole new-suite exclusion is the explicitly decorative, `aria-hidden` duplicate chapter-number watermark; readable chapter labels/headings remain scanned.
- Generated v2 contracts preserve the full model and check real component structure, including all 24 box-count/title-bar/text-treatment combinations. Shared model markup/CSS also received a bounded Chromium sweep of 94 individual option/viewport scenarios without horizontal overflow at 375px and 1100px.
- Existing generated-design checks, all fifteen title layouts, catalog synchronization, and readability baseline passed. Existing title-layout coverage warnings for `offset-left` and `radial-glow` remain report-only.
- Existing lesson accessibility ratchet passed with no additions to its committed baseline. This does **not** claim that the released decks have zero accessibility findings.
- A final legacy-route smoke check found a missing local-server allowlist entry for its public `theme-options.json`. The exact asset was added; all three local-server tests passed again, and the original v1 app rendered its eleven steps without runtime errors. The original `app.js` is reused byte-for-byte rather than duplicated.
- `git diff --check` passed. Original saved checkout remained clean.

The preview and artifacts use the same `builder-model.mjs` renderer, with canonical integration rules disabled only for the surrounding editor chrome. The selected fonts were checked as loaded browser font families, not merely serialized strings.

## Independent finish review

The Impeccable finish review inspected desktop and mobile screenshots and source. Its initial P2 finding was loss of keyboard focus after dynamic controls re-rendered. Stable identities now restore focus for preset, paint and layout buttons; Enter/Tab tests and six desktop/mobile focus traces verify the repair.

| Finding | Verdict |
| --- | --- |
| P2: preserve focus after selecting an option | Resolved |
| Remaining material findings | None |
| Final disposition | **ship** |

Three detector flags were reviewed in context: the thick rail is a miniature layout diagram, the lower border is the active tab indicator, and Inter is one of the user-required existing selectable fonts. They are retained for those explicit functions. No replacement visual-world comp was required for this extension of SPOKES.

## Reproduce and inspect

```sh
node scripts/bespoke-dev-server.mjs --port 8766 \
  --runtime-dir "$HOME/Library/Application Support/Codex/local-previews/bespoke-guided-builder"
bash scripts/quality.sh
```

Do not launch a second server on an occupied port. The running process's PID, log, synthetic encrypted store, full quality log and review screenshots are under that runtime directory, outside Git. The server intentionally rejects runtime directories inside any Git checkout. The dependencies used for this run were existing pinned Playwright/axe packages linked into the isolated checkout; `npm ci` is the reproducible installation path.

The browser suite creates separate ephemeral servers and contexts. Its state never enters the persistent user-facing local preview. Original v1 files remain accepted; converted designs retain the untouched original and explicit approximation notes. At this initial checkpoint, shared-save/design-generation authority rejected unresolved contrast combinations. The advisory-color follow-up below supersedes that policy: explicit palette choices now remain valid for saving and generation, with readability warnings retained.

## Remaining rollout work

Hosted service staging/deployment and hosted acceptance are still required before any v2 team rollout. The submission workflow now declares Node 22 for the shared JS model bridge. Deploy service and static v2 assets together only after authorization and acceptance. The existing legacy registry command deliberately rejects v2 rather than discarding independent choices; a reviewed v2 registry consumer is needed only if a future separately authorized lesson build uses that registry. Current proposal generation produces the complete selection, intake, CSS, contract and reusable sample HTML.

## Follow-up: visible button-color feedback

Britt reported that Buttons could be painted while Text boxes showed no button.
The role value was serialized, but the selected preview could not demonstrate it.
The correction adds a temporary, labeled action sample outside title/divider/text-box
slide markup while Buttons is selected. It keeps the chosen tab, uses the same model
button styles, and provides an inline sample on phones. Video and Activity now use
actual inert sample buttons. No sample has a link, download target or submit action.
Local drafts also retain the selected paint role and preview tab through refresh.

A new desktop/390px behavioral regression verifies Green/Royal and Navy/White
computed button colors and 4.5:1-or-better text contrast; visible feedback without
switching surfaces; keyboard selection/focus; unchanged unrelated choices; Undo;
reload with history; all preview tabs; removal of the contextual sample when leaving
the Buttons role; and inert activation without navigation, downloads or service
requests. The new builder suite now passes eight scenarios with no runtime, asset,
external-request or accessibility failures under the same documented watermark
exception. The full `scripts/quality.sh` gate passed again, including generated
contracts/artifacts and the unchanged legacy/lesson baselines.

Synthetic desktop and mobile screenshots visibly show the Green sample beneath
Text boxes and beside the phone palette. Before refreshing the existing Safari tab,
a recovery download was confirmed. After refresh, the selected Raleway heading,
Source Sans 3 body, Soft wash background, Divider preview and available Undo remained.
The user resumed editing; their subsequent preset confirmation was left untouched.
No saved selections were reseeded or cleared. The old checkout and port 8765 were
untouched. Follow-up logs/screenshots are retained in the external preview runtime
directory as `bespoke-button-*`; no production rollout occurred.

## Follow-up: preserve explicit divider text colors

The earlier renderer selected White or Royal ink from `dividerBackground`, ignoring
saved `titleText` and `subtitle` choices. Divider headings now use `titleText`; chapter
labels and supporting copy use `subtitle`. The decorative watermark also inherits
`titleText`. Content heading/body remain independent. The catalog labels disclose
the shared scope, the divider step exposes all relevant colors directly, and choosing
a shared text role retains the divider preview. No persisted fields were added.

Changing the divider to Green or White keeps White text and shows the actual result.
Warnings name the affected surface and measured ratio; explicit background repair
buttons preserve text and other selections and participate in Undo. Solid and gradient
divider contrast is checked by the shared model (3:1 headings, 4.5:1 supporting copy).
Existing structurally valid v2 local/file/shared/revision data opens unchanged for
repair, while unsafe new shared writes and artifacts remain blocked. All six presets
and defaults still pass. Similarity now independently measures both divider text
characteristics in the actual six source decks, retaining unknowns where necessary.

Executed verification:

- The full `bash scripts/quality.sh` gate passed: 47 validator and 35 BeSpoke Python
  tests, 11 model groups, eight similarity tests, 46 service/contract/server tests,
  27 legacy browser workflows and ten builder browser scenarios. Existing lesson
  accessibility baselines and report-only title-layout warnings stayed unchanged.
- Desktop and 390px regressions explicitly select White/White, then Green and White
  divider backgrounds. Computed heading/chapter/supporting text stays White; only
  the selected background changes. Navigation, local reload/history, Undo/Redo,
  backup opening, shared save/reopen, and earlier v2 shared recovery are covered.
- Safe states pass axe WCAG A/AA and horizontal-overflow checks. Intentionally unsafe
  White-on-Green states are verified for faithful rendering plus warnings, not
  described as accessible. The existing decorative watermark exclusion is unchanged.
- The production artifact assembler and checker were used in temporary directories.
  Both generated reusable samples and canonical template CSS compute the selected
  Silver heading and White supporting colors on Navy and Mauve divider backgrounds.
  Invalid divider contrast is rejected before artifact files can be written.
- Synthetic desktop/mobile screenshots were inspected; repair actions were separated
  into 44px targets. A final focused browser rerun verifies keyboard activation of
  the background repair and focus returning to the selected preview tab when the
  resolved warning disappears. The existing button-feedback regression remains green.

Safari was inspected without changing the page: it had a saved browser draft with
unsaved shared changes, so no refresh, navigation, color edit, prompt dismissal or new
tab was performed. The user withdrew the interim new-tab-per-update request. Refresh
is left to the user; actual Safari rendering of this correction is not claimed.

The loopback service was gracefully restarted on the same port and runtime directory
so its save authority uses the updated validation. Its runtime was backed up outside
Git and remained byte-identical across restart; the existing synthetic revision opens.
The current module is served with `Cache-Control: no-store`. No cache/config changes
were needed. The original checkout remained clean and production/released lessons
were untouched. Logs, screenshots and runtime backups remain outside the repository.


## Follow-up: visible patterns on the current preview

Root cause: the texture rule targeted only text-box/video/activity previews and the
canonical `.main` element. Title and divider background rules therefore had no
texture. The old content pattern also used a fixed accent at 4–9% opacity, often
indistinguishable from its base. Changing the saved choice could leave the visible
chapter divider unchanged.

Patterns now layer above the selected base across all five slide roles and canonical
slide styling, including gradients, split titles and band dividers. White/Royal
pattern ink responds to the base and preserves already-readable title/divider text
where either tone can do so. Readability validation samples the composite opacity
range, including crossing grid lines. It never changes selected text or background
roles; existing unsafe combinations remain recoverable with warnings. Content text
has opaque reading surfaces. Miniatures demonstrate all five patterns in the existing
controls and follow the currently selected preview. No schema or saved-field change
was required; defaults and all six presets remain valid.

Verification uses synthetic local state and real screenshot pixels:

- A bounded matrix renders all five choices on White, Mist, Green, Blue, Navy, Royal
  and Mauve at 720px desktop and 342px phone slide widths (70 divider combinations).
  All 140 pairwise comparisons exceed 1.8% changed pixels at a 12-level RGB threshold
  and a mean channel delta of 0.5. The observed minima are 4.04% and 0.57, respectively.
  Returning to Plain reproduces its initial pixels exactly. This is a regression
  guard for visible differentiation, not a universal perceptual/accessibility score.
- The same matrix plus all five slide roles has 80 exact rendered-pixel parity checks
  against output from the production model bridge. Role checks include a split title
  and a gradient band divider. The Python artifact assembler/checker additionally
  verifies both grid directions on reusable samples and canonical template dividers.
- The actual editor regression operates all five choices while Divider remains
  selected, including keyboard activation, Raleway/Source Sans 3, unchanged color and
  layout values, Undo/Redo, navigation, reload/history, shared save/reopen and Plain.
  Desktop and 390px controls pass axe and overflow checks. Prior button and explicit
  divider text-color regressions continue to pass.
- Normal-size desktop/phone screenshots were visually inspected for Green patterns,
  light/dark surfaces and the miniature controls. The five choices are recognizable;
  the wash is a broad tint, while the other choices have distinct repeating geometry.

Coverage is representative, not every possible palette/layout/text combination.
Synthetic Chromium verification does not claim actual Safari acceptance or classroom
projector testing. Existing lesson accessibility baselines remain separate from the
builder's modeled contrast rules. The user's active Safari page and draft are left
untouched; their existing page-update flow loads the corrected assets from port 8766.
Logs, pixel measurements and screenshots are under the external local-preview runtime
(`pattern-quality.log` and `pattern-review/`), outside Git.

The full `scripts/quality.sh` gate passed: 47 validator and 35 BeSpoke Python tests,
12 model groups, eight similarity tests, 46 Node service/contract/server tests,
27 legacy workflows, eleven builder workflows, the new pixel matrix, schema/export
checks and existing lesson baselines. The loopback service was gracefully restarted
with the updated contrast model; its external persisted runtime remained byte-identical
and the existing synthetic revision reopened. The original saved checkout stayed
clean. No Safari actions, production configuration, private codes, Send, deployment,
merge or lesson publication were involved.

## Follow-up: preset confirmation for the current session

The preset-only `window.confirm` is replaced by a labeled HTML dialog with an
initially unchecked **Don't ask again during this session** checkbox and explicit
**Cancel** / **Apply preset** actions. The existing confirmation trigger is retained:
the first preset in a draft without design history applies directly. Later preset
choices ask unless the user has checked the box and applied one. Cancel and Escape
change neither the design/history nor the preference. Applying a preset retains
the existing single Undo transaction and preserves all sample text.

The opt-out is a standalone `sessionStorage` flag, with an in-memory fallback if
tab storage is unavailable. It survives step navigation and normal reload in the
same tab. Leave session, installing a different team/lesson, and Start a new browser
draft explicitly clear it. A fresh tab after closing the old one starts unchecked,
including when durable team/draft data is retained. The fallback asks again after
reload. No preference is added to localStorage, the design model, draft history,
backups, shared selections, requests or server/account records.

Executed synthetic Chromium checks cover unchecked Apply asking again, checked
Apply suppressing later requests, checked Cancel/Escape leaving state unchanged,
sample preservation, Undo, step navigation, reload, team/lesson switch, new draft,
Leave, a new browser context with the same durable draft, a fresh tab after close,
and unavailable sessionStorage. Backup/shared data and all captured request bodies
are checked for preference leakage. While opted out, unreadable designs still show
warnings and refuse Save; new-draft and Leave native confirmations still appear.
Existing conflict, retry and recovery regressions remain in the full gate.

The dialog receives an accessible name and description. Cancel has initial focus;
Tab/Shift+Tab wrap between its controls, Space operates the native checkbox, Escape
cancels, and both dismissal paths return focus to the initiating preset. Desktop
and 390px phone checks pass axe WCAG A/AA and viewport bounds checks. Screenshots
were inspected as one desktop/phone batch: copy is readable, the checkbox is
clearly unchecked, focus is visible, and both 44px actions fit. A scoped Tab wrap
fixes the browser's default end-of-dialog focus escape to its chrome.

The live preview at `http://127.0.0.1:8766/bespoke/` serves all three changed assets
with HTTP 200 and `Cache-Control: no-store`; served HTML, JavaScript and CSS match
disk byte-for-byte. This UI-only follow-up required no service restart or runtime
data migration. The user's Safari page, existing native prompt and active draft
were never operated or refreshed. Safari acceptance is left to the user's existing
page-update flow; the automated evidence is Chromium, not a live Safari claim.
Screenshots and the full check log remain outside Git in the existing preview
runtime (`preset-review/` and `preset-quality.log`).

The full `bash scripts/quality.sh` gate passed: 47 validator and 35 BeSpoke Python
tests, 12 model groups, eight similarity tests, 46 Node service/contract/server
tests, 27 legacy browser workflows, all 13 builder workflows, the existing pattern
pixel matrix and generated-artifact checks. Existing report-only title-layout
warnings and lesson accessibility baselines were unchanged. The original checkout
remained clean. No production deployment, merge, Send, private codes, schema change
or released-lesson edit was involved.

## Follow-up: the team leader retains color decisions

Explicit user direction supersedes the earlier blocking contrast and Gold/Green-text
rules for the v2 builder. All eleven existing brand colors are now selectable for
every paint role. Low contrast no longer disables or crosses out a swatch and never
silently changes the selected text or background. The selected check mark, keyboard
focus, cumulative preview, presets and Undo behavior remain intact.

`validateDesign` now returns structural errors only. `contrastIssues` independently
provides measured, nonblocking guidance. This separation reaches the browser's save
validation, shared-save service, Python validator/model bridge, proposal assembler
and generated component contract. The closed schema, palette/font/layout membership,
sample bounds, escaping, access controls, conflict checks and receipts remain enforced.
There is no new role, authorization bypass, approval checkbox or persisted override.
The saved-design shape is unchanged. The obsolete `notText` restriction is removed
from the v2 catalog; the generated schema description explains the new policy.

The advisory explains that contrast is the difference between text and its background
and that low contrast can make text harder to read. Each pair shows its actual modeled
ratio and the existing 3:1 heading or 4.5:1 supporting/body-text guideline. It suggests
alternatives while explicitly saying the team leader can keep and save the choice.
The palette help, preview and Review step expose the guidance; the live region
announces it. Optional background alternatives still change only the named background
with Undo. The separate preset-confirmation opt-out never suppresses advisories.

Gradient and pattern measurement is unchanged: 33 gradient samples and nine pattern
opacity samples, including crossing grid ink. Adaptive decorative ink and automatic
button/sidebar ink remain intact; explicit saved text/background colors remain exact.
The model checks all 121 role/color selections. White on a plain Mauve-to-Green title
gradient reports 2.66:1 against the 3:1 heading guideline while remaining valid.

Executed targeted checks verify desktop/390px phone selection and exact computed
colors, explanatory warnings, all swatches enabled, selected/focus indicators, no
strike-through, Undo/Redo, navigation, Review, reload/history, shared save/reopen and
backup recovery. Cases include that Mauve-to-Green title, White-on-Green dividers,
White supporting text, Green headings and Gold body text. An unknown color still
fails import without replacing the draft; stale service writes still fail. Preset
opt-out tests retain visible contrast advisories while permitting the chosen save.

Python intake accepts these designs with warnings and writes exact selection values,
CSS, contracts and reusable HTML. Contracts carry `contrastAdvisories`; sample HTML
displays them with readable UI styling. The artifact checker still verifies actual
component structure and CSS identity. Generated samples and canonical template CSS
were browser-checked for exact title/divider/supporting/heading/body colors, including
the gradient and Crosshatch pattern. No lesson file was authored or changed.

Desktop and phone screenshots were inspected together. The controls and advisory
copy pass axe and overflow checks. Intentionally low-contrast sample content is
excluded from the advisory-scenario axe scan; this is not a claim that the chosen
design meets accessibility guidance. Other safe-state checks retain their coverage.
Screenshots and logs are outside Git in the existing preview runtime under
`contrast-review/`, `contrast-browser.log` and `contrast-quality.log`.

The full `bash scripts/quality.sh` gate passed: 47 validator and 36 BeSpoke Python
tests, 13 model groups, eight similarity tests, 46 Node service/contract/server
tests, 27 legacy workflows, all 13 builder workflows, 70 pattern renders with 140
distinct-pixel and 80 artifact-parity comparisons, generated-output checks, schema
checks and existing lesson baselines. Existing report-only layout warnings and
committed lesson accessibility exceptions are unchanged.

The port 8766 service was gracefully restarted with the updated model authority;
its encrypted synthetic runtime was backed up outside Git and remained byte-identical
through restart. The saved synthetic design still opens. All current static assets
match disk over HTTP with `Cache-Control: no-store`. The original checkout is clean
and port 8765 still responds. The user's Safari page, prompt, storage and active
draft were never operated or refreshed; their existing page-update flow loads the
new policy. Actual Safari acceptance is not claimed. No production configuration,
private team access, real Send, deployment, merge, new PR or released lesson changed.

## Follow-up: title arrangements move the title and subtitle

The saved arrangement value and control event were already correct. The old title
preview was a content-sized flex column: its text and in-flow logo consumed the
available height, leaving no free space for Bottom left to use. Split panels only
changed the gradient recipe and never established a separate text column. At a
1920px viewport, Left aligned, Bottom left and Split panels all placed the title at
the same `(56, 160)` canvas-relative coordinates. Browser-width typography also
made the title scale independently of the actual preview width.

The shared title CSS now uses a grid canvas with a 16:9 baseline, 420px minimum
height and natural growth for long copy. Centered and Left aligned have distinct
horizontal alignment; Bottom left puts the available space above the text group.
Split panels creates a hard boundary at 38% and places the title and subtitle in
the right column while retaining the chosen gradient and overlaid pattern. Type
scales with canvas width. Corner logos have a reserved top area; above-title logos
occupy their own row with the text. Generated samples and canonical title CSS use
the same geometry, including replacement of the canonical flex spacer elements.
The liked editor shell, local color controls and saved model shape are unchanged.

The new `scripts/test-bespoke-title-layouts.mjs`, included in the quality gate,
executes 24 editor arrangement/logo combinations at 1920px, 1100px and 390px.
It measures actual title/subtitle glyph positions, logo/rule containment and
overlap, viewport overflow, computed colors/fonts, both Crosshatch axes and a
rendered-pixel split boundary. It verifies exact preservation of all unrelated
choices plus Undo/Redo, navigation, shared save, reload and a fresh-context reopen.
An additional 96 generated sample/canonical checks cover every arrangement and
both logo positions at those widths with normal copy and the allowed 200-character
title / 500-character subtitle limits. Long copy grows the canvas without clipping.

Representative final measurements with a corner logo and the same synthetic
Raleway/Source Sans 3 sample are below. Coordinates are relative to the canvas;
the centered text's actual line boxes are checked separately from its outer box.

| Viewport | Canvas | Left title x/y | Bottom title x/y | Split title x/y |
| --- | --- | --- | --- | --- |
| 1920px | 1176 × 661.5px | 70.5 / 283.2 | 70.5 / 454.3 | 505.2 / 283.2 |
| 1100px | 551.1 × 420px | 33.1 / 193.1 | 33.1 / 274.2 | 236.8 / 193.1 |
| 390px | 342 × 420px | 20.5 / 193.1 | 20.5 / 274.2 | 146.9 / 181.1 |

Both title and subtitle move down about 171px on desktop and 81px on the narrower
canvases when choosing Bottom left. A bounded desktop/laptop/phone screenshot
batch confirms visibly distinct arrangements, readable wrapping, separate logos
and retained colors/patterns. The Gold-to-Green/White example intentionally keeps
the user's color choice; contrast remains advisory and is not claimed compliant.
Evidence stays outside Git in the preview runtime under `title-review/`,
`title-layouts.log` and `title-quality.log`. This is isolated synthetic Chromium
coverage, not actual Safari/WebKit acceptance or exhaustive palette/font coverage.

The full `bash scripts/quality.sh` gate passed: 47 validator and 36 BeSpoke Python
tests, 13 model groups, eight similarity tests, 46 Node service/contract/server
tests, 27 legacy and 13 builder workflows, the new title geometry matrix, the
70-render/140-distinct-pixel/80-parity pattern matrix, generated-output checks,
schema checks and existing lesson baselines. Existing report-only template layout
warnings and committed lesson accessibility exceptions remain unchanged.

The preview at `http://127.0.0.1:8766/bespoke/` serves the current builder assets
with HTTP 200 and `Cache-Control: no-store`, byte-identical to disk. This rendering
change needs no service restart or migration; the encrypted synthetic runtime
remains byte-identical. The original checkout stays clean and port 8765 responds.
The user's Safari page, dialogs, storage and draft were never operated or refreshed.
Their existing page-update flow can load the fix. No new user-facing browser tab, production
deployment, merge, real Send, private access, new PR or lesson edit was involved.

## Follow-up: visible Plain and Accent video frames

The frame choice was reaching the renderer immediately. Its old Accent treatment
was a 4px border in the selected accent color, touching the same-colored sample
surface without a separator. A reproduction of Blue accent/Blue video on Gold
showed only 0.00047% changed pixels between Plain and Accent: the option worked
in state and computed CSS but was visually indistinguishable. Neither a lost
selection nor preview clipping caused the reported problem.

Plain now removes border, padding, outline and shadow. Accent retains the exact
chosen accent in a 6px border, with 2px inner and outer White/Royal separating
lines. The decorative separator uses the existing contrast-based ink choice;
it never changes a saved color or enforces a contrast restriction. The frame fits
inside the existing responsive 16:9 box, so switching does not resize the canvas.
The editor shell, video heading/arrangement controls and inert sample stay intact.

The shared CSS also fits direct native video and iframe children into the remaining
content box. The canonical iframe's absolute positioning and video's inline corner
and shadow treatment no longer bypass or obscure the chosen frame. Media controls
remain inside the frame, without an overlay intercepting input. The canonical side
arrangement now uses the same phone stacking behavior as the sample. No template,
lesson content, media source, autoplay behavior or saved design schema was changed.

The targeted `scripts/test-bespoke-video-frames.mjs` regression is part of the
quality gate. It passes 60 actual-editor cases: both frame choices, all three
arrangements, 1920px desktop and 390px phone viewports, and five color cases
(Blue-on-Blue/Gold, all Blue, all White, all Royal and Gold accent/background).
The checks operate the real controls, assert exact unrelated design preservation,
computed borders/insets and chosen colors, responsive geometry, containment and
no horizontal overflow. Thirty screenshot pairs show 2.07%–22.17% changed pixels;
the reported Blue-on-Blue banner changes 2.07% on desktop and 7.14% on phone.
Measured outer frame sizes stay 1064 × 598.5px and 302 × 169.875px respectively.

An additional 180 generated sample/canonical cases use production bridge output
with the actual template's wrapper, inline sizing and base CSS, for both native
video and iframe children. The native video has its test sources/poster removed;
the iframe is sandboxed and empty. These verify an 8px reserved media inset for
Accent and zero for Plain, contained 16:9 wrappers and phone stacking. There are
120 exact frame-band pixel comparisons with the live preview (native Plain media
pixels are deliberately excluded because the browser owns the empty player).
The editor contains no media element; all test contexts record zero media loads,
external requests and runtime errors. Undo/Redo, step navigation, shared save,
reload and fresh-context reopen also pass at both widths.

A bounded desktop/phone visual batch confirms clearly different frames, including
matching light/dark colors, while retaining layout, type and background patterns.
The layout detector has no findings. This is synthetic Chromium verification;
actual Safari/WebKit and playback of real or externally hosted media are untested.
Coverage is representative, not every palette/font combination. Existing contrast
advisories remain separate from frame visibility and continue to allow user choices.
Logs, screenshots and pixel/geometry evidence remain outside Git in the existing
preview runtime under `video-review/`, `video-frames.log` and `video-quality.log`.

The existing port 8766 preview serves the current builder index/app/model/CSS with
HTTP 200 and `Cache-Control: no-store`, byte-identical to disk. This rendering-only
change needs no service restart or runtime migration. The encrypted synthetic
runtime remains byte-identical; the original checkout is clean and port 8765 still
responds. Safari, user-facing tabs/dialogs, browser storage and the active draft
were never operated or refreshed. The user's existing page-update flow can load
the fix. No production deployment, merge, real Send, private access, new PR or
released lesson edit was involved.

The full `bash scripts/quality.sh` gate passed: 47 validator and 36 BeSpoke Python
tests, 13 model groups, eight similarity tests, 46 Node service/contract/server
tests, 27 legacy and 13 builder workflows, all title geometry regressions, the
new video-frame matrix, the existing 70-render/140-distinct-pixel/80-parity pattern
matrix, generated-artifact checks, schema checks and existing lesson baselines.
Earlier title, color, divider, pattern, button and preset-session fixes remain
covered. Report-only template warnings and committed lesson accessibility
exceptions are unchanged.
