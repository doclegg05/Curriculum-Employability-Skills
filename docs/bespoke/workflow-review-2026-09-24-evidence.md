# BeSpoke workflow review evidence — September 24, 2026

This appendix supports the [recommendation and stable findings F1–F5](workflow-review-2026-09-24.md). No recommendations were implemented. Source pointers describe product baseline `f25d4f8b529287a2a5c05436062222db07b1e1dc`.

## Method and evidence location

Three independent subagents ran new scenario walkthroughs. `/root/workflow_first_time` completed design Assessment A before `/root/workflow_functional` released detector Assessment B; neither received the other's findings. `/root/workflow_scope` independently mapped global/local controls and returning users. The lead reproduced scope and Review-summary behavior separately. No participant recruitment, task timing, completion-rate measurement, or user-preference experiment occurred.

Scripts, browser traces, screenshots, reports, and the quality log are preserved outside Git at:

`/Users/brittlegg/Library/Application Support/Codex/local-previews/bespoke-workflow-review-20260924/`

[Assessment A report](</Users/brittlegg/Library/Application Support/Codex/local-previews/bespoke-workflow-review-20260924/first-time/report.md>) · [Assessment B report](</Users/brittlegg/Library/Application Support/Codex/local-previews/bespoke-workflow-review-20260924/functional/report.md>) · [Scope report](</Users/brittlegg/Library/Application Support/Codex/local-previews/bespoke-workflow-review-20260924/scope/report.md>).

The links below are local evidence links for this Mac; repository readers on another machine need that archive. All browser work used new isolated contexts with ephemeral local synthetic services. No real team or private material is needed to reproduce these scenarios.

## Journey coverage

| Journey / surface | Observed result | Evidence in archive |
|---|---|---|
| First-time custom | How it works → lesson/team → shared colors/type → all five slide editors → Review → Save → Leave → Open. Independent colors/fonts/textures/copy/watermarks retained. | `first-time/journey.json`, screenshots 01–22 |
| Preset quick path | Modern → direct Title editor → one sample-title tweak → Save. Fresh context reopened the exact design. Direct Review/Save from defaults also worked; numbering is not a validation requirement. | `scope/evidence/walkthrough.json`; `first-time/optional-steps.json` |
| Shared vs local | All 11 global roles, both font defaults, and texture compared across all five preview types: 70 before/after comparisons, plus conditional gradient/Band checks. Explicit overrides stayed independent; inheritance restoration followed current defaults. | `scope/evidence/role-map.json`, `conditional.json`, `walkthrough.json`; `root/scope-trace.json` |
| Review | Visible slide and saved choices correct; typography summary describes global fonts without local exceptions. Independently reproduced by A, scope reviewer, and lead. | `root/review-font-summary.png`; `scope/evidence/08-review-local-font.png`; `first-time/18-review.png` |
| Returning / preset replacement | Fresh synthetic shared return lands on starting look; immediate preset change bypasses same-session confirmation. No subsequent shared save was made in that trace; v1 Undo restored the design. | `scope/evidence/walkthrough.json`, `returning.json` |
| Undo/Redo and backup recovery | Undo/Redo restored choices; malformed JSON left the current draft unchanged; new draft retained a recoverable previous draft. | `functional/evidence.json` |
| Stale save / two contexts | Second context attempted an older revision: HTTP 409, local choices preserved. Download backup → load latest → reopen backup → explicit Save succeeded. | `functional/evidence.json`, labels `stale-save` through `recovered-save` |
| History / Leave / reopen | Previous revision opened; restoration required deliberate save. Leave removed remembered session/draft in the isolated browser, while shared design remained. | `functional/evidence.json`; `first-time/journey.json` |
| Older designs | Older v2 without roleStyles preserved exact design; synthetic v1 conversion displayed approximation warnings, preserved original payload and downloaded it exactly. | `scope/evidence/returning.json`, `original-v1-roundtrip.json` |
| Keyboard / focus | Help focused its heading and returned to its trigger. Paint kept focus; step changes focused the panel. Preview arrows/End and Design/Preview arrows selected correct tabs. Preset dialog focused Cancel; Escape returned to preset. | `functional/evidence.json` |
| Responsive / enlarged text | Chromium desktop/narrow/390px, WebKit phone, and root text size 200%. No horizontal overflow in inspected states; desktop preview stayed sticky and phone Design/Preview switch remained reachable. Compact controls remain a usability concern below. | `first-time/responsive-evidence.json`; `functional/evidence.json` |
| Public guide / original wizard | Guide opened and was read; its Open BeSpoke target is current builder. Original wizard opened in an isolated new page and all 11 steps were traversed. Legacy Send was not used. | `scope/evidence/10-team-guide.png`; `functional/evidence.json`, labels `legacy-route`, `legacy-steps`, `team-guide` |

The archived scripts document synthetic setup and actions. The lead used direct disclosure opening to arrange its focused font probe; this is corroborating behavior evidence, not a claim that a human navigated that disclosure. Subagents separately exercised the actual controls. The lead's trace labels were corrected from Blue to Navy for catalog ID `dark`; the selected ID and screenshots were unchanged.

## Reproduction and source pointers

### F1 — repeated-looking sequence (P2, UX)

Choose a preset, then follow Next through Lesson & team, Paint your elements, Fonts & background, and Title. The local editor again offers Background, Texture, and Text. Alternatively, use the sidebar to jump directly to Review and save the supplied design. This demonstrates an implied workflow burden, not a forced dependency. See [steps and navigation](../../bespoke/builder-app.mjs#L21), [starting guidance](../../bespoke/builder-app.mjs#L1330), and [step buttons](../../bespoke/builder-app.mjs#L1552).

The concrete recommendation is three stages plus optional Shared theme. Its tradeoff is more navigation change than an eight-step version. Neither requires changing the persisted design model. If implemented later, map saved step IDs and update numeric step assumptions in the Guide and color-jump handlers. Keep durable designs, Undo, revision checks, backups, legacy recovery, and review receipt behavior intact.

### F2 — Review names defaults as effective typography (P2, display bug)

Set Title heading font to Inter and body to Bitter; set shared body to Raleway; open Review. The visible title uses Inter/Bitter while the summary says “DM Serif Display headings · Raleway body.” A separately reproduced Title=Bitter, Cards=Playfair Display case also retains the shared-font summary. Save/reopen preserves the correct local values.

[Lead screenshot](</Users/brittlegg/Library/Application Support/Codex/local-previews/bespoke-workflow-review-20260924/root/review-font-summary.png>) · [scope screenshot](</Users/brittlegg/Library/Application Support/Codex/local-previews/bespoke-workflow-review-20260924/scope/evidence/08-review-local-font.png>) · [summary source](../../bespoke/builder-app.mjs#L1544).

### F3 — fresh return bypasses preset confirmation (P2, interaction inconsistency)

Apply Modern, change sample title, Save. Open the same synthetic service in a fresh context. Click Fun: visual choices change immediately and the confirmation dialog stays closed. Make a same-session edit and select another preset: the dialog appears. `requestPreset` tests Undo-history length, which is cleared on load. Prior shared revision and sample text remained; no irreversible loss is demonstrated.

[Return screenshot](</Users/brittlegg/Library/Application Support/Codex/local-previews/bespoke-workflow-review-20260924/scope/evidence/04-return-preset-no-confirm.png>) · [confirmation condition](../../bespoke/builder-app.mjs#L1311).

### F4 — public instructions describe an older product (P2, content defect)

Read “Try the design choices” in team-guide.html, then open its BeSpoke link. The four-question brief, generated alternatives, Fits your brief, hover behavior, and seven-choice comparison do not describe the linked current builder. Inline How it works correctly describes the current role editors. This is especially relevant to a spokesperson preparing a team meeting.

[Guide screenshot](</Users/brittlegg/Library/Application Support/Codex/local-previews/bespoke-workflow-review-20260924/scope/evidence/10-team-guide.png>) · [obsolete guide paragraph](../../bespoke/team-guide.html#L27) · [current inline guidance](../../bespoke/builder-app.mjs#L1330).

### F5 — local exceptions and shared-only controls need specific feedback (P3, UX)

Set Divider background to Gold, then select shared Divider background → Navy. The preview stays Gold, correctly. The generic local-settings note does not identify that background as the exempt field. A local Bitter body font similarly stays Bitter when shared body becomes Raleway, while sidebar/buttons change. Returning the field to Use shared theme makes it follow current defaults.

Separately, choose Sidebar in Step 3 and click Customize text boxes only: this focuses the text-box primary background, which cannot paint Sidebar. Scope-specific feedback and context-appropriate links would prevent this detour. Retain unrestricted shared editing; do not silently remove overrides.

[Divider screenshot](</Users/brittlegg/Library/Application Support/Codex/local-previews/bespoke-workflow-review-20260924/root/shared-divider-override.png>) · [font screenshot](</Users/brittlegg/Library/Application Support/Codex/local-previews/bespoke-workflow-review-20260924/root/shared-font-with-local-cards.png>) · [shortcut source](../../bespoke/builder-app.mjs#L1378) · [inheritance resolver](../../bespoke/builder-model.mjs#L101).

## Additional findings

### F6 — compact text and touch targets (P2, usability)

In isolated WebKit at 390 × 844, Title font and other role dropdowns rendered as shallow 24px controls; the measured title selector was 350 × 24px. The Chromium phone trace measured Previous versions and Leave session at 16px high and Recent choices near 17px. The step counter measured 10.88px and preset comparison captions 10.4px. These are frequently consulted decisions or recovery controls.

Increase supporting-text readability and verify comfortable touch padding/minimum heights, including native WebKit selects. A 44px touch target is the proposed ergonomic target; this review did not establish a WCAG failure from dimensions alone or exhaustively evaluate spacing exceptions.

[Phone selector screenshot](</Users/brittlegg/Library/Application Support/Codex/local-previews/bespoke-workflow-review-20260924/first-time/24-phone-edit-viewport.png>) · `first-time/responsive-evidence.json` · `functional/evidence.json` label `phone-targets` · [control styles](../../bespoke/builder.css#L106).

### F7 — recovery menu covers the next recovery action (P2, interaction bug)

At desktop 1440 × 1000, open Files & recovery and Download backup. The menu remains open; Escape and clicking the current step outside it do not dismiss it. Trying Previous versions is intercepted by the overlying Recover previous draft menu item. Manually closing the disclosure makes the history action work. The problem is the menu's behavior and placement, not a broken history service.

Close the menu after a file action and support Escape/outside dismissal with appropriate focus return, or use an inline layout that does not cover the next recovery action.

[Menu screenshot](</Users/brittlegg/Library/Application Support/Codex/local-previews/bespoke-workflow-review-20260924/functional/recovery-menu-confirmation.png>) · `functional/evidence.json` label `recovery-menu-dismiss` · [menu markup](../../bespoke/index.html#L23).

### F8 — useful status/navigation lacks landmark containment (P3, accessibility structure)

Unrestricted axe scans of all ten Chromium steps flagged `.status-strip` outside a landmark; phone scans also flagged `#surfaceSwitcher`. Place them in appropriate named regions without duplicating announcements. This is an axe best-practice finding; it alone does not establish WCAG nonconformance. The intentionally configurable sample preview was excluded from these editor scans.

`functional/evidence.json` labels `chromium-step-*`, `phone-title`, `200-percent`, `webkit-edit` · [status markup](../../bespoke/index.html#L27).

## Shared-control matrix

| Current shared setting | Effective scope | Local replacement / remaining global need |
|---|---|---|
| Sidebar | Content navigation and video placeholder fill | No local equivalent; retain shared control. |
| Title background | Title primary surface | Local Title primary overrides this slide only. |
| Title & divider second color | Shared secondary gradient/split color; fallback secondary for other local gradients | Local secondary per slide; unused values remain stored. |
| Title & divider headings | Title/divider heading; inherited decorative mark color | Local heading/custom watermark can override. |
| Subtitle & divider supporting text | Title subtitle, divider label/support; canonical copyright | Local support color does not replace whole lesson binding. |
| Content background | Content canvas/reading surfaces, Band exterior, canonical main canvas | Local Cards/Video/Activity primary covers their composition; Band exterior still shared. |
| Heading | Content headings, card headings, activity label | Local heading overrides by slide type. |
| Body | Content paragraphs/lists/support | Local body overrides reading text. |
| Accent | Title rule, active navigation marker, card rails/borders, video frame, activity border | No local color equivalent. Layouts choose where it is used. |
| Buttons | Sample/lesson action fill with automatic ink | No local color equivalent. |
| Divider background | Divider primary panel/gradient | Local Divider primary; separate from Band exterior. |
| Shared heading font | Inherited headings and relevant labels | Local heading font overrides per slide. |
| Shared body font | Inherited reading text, navigation, buttons | Local body font does not replace navigation/button typography. |
| Shared texture | Inherited pattern on all five slide types | Local pattern and strength are independent exceptions. |

The scope reviewer measured exact before/after styles for all 14 rows across five preview tabs. Canonical copyright/main-canvas bindings were source-confirmed, not inferred from sample screenshots. See [effective local values](../../bespoke/builder-model.mjs#L101), [navigation and buttons](../../bespoke/builder-model.mjs#L395), [Band and canonical canvas](../../bespoke/builder-model.mjs#L452). The complete measurement report is [archived here](</Users/brittlegg/Library/Application Support/Codex/local-previews/bespoke-workflow-review-20260924/scope/report.md>).

## Independent design assessment

The composition is specific to SPOKES: authored branding, actual lesson navigation and role samples, useful preview scale, explicit sample-only wording. Preserve the existing visual direction. The largest opportunity is a simpler editing structure and a complete final agreement surface.

| Nielsen heuristic | Score / 4 | Assessment A observation |
|---|---:|---|
| System status | 3 | Save/advisory feedback useful; final summary incomplete. |
| Match with real world | 3 | Clear slide vocabulary; shared/local scope needs explanation. |
| Control and freedom | 4 | Direct navigation, Undo, editable presets, and recovery. |
| Consistency | 3 | Repeated categories across global/local scopes. |
| Error prevention | 3 | Advisories and recovery boundaries; reading conditions remain user-controlled. |
| Recognition over recall | 2 | Team must remember exceptions across five slide types. |
| Flexibility and efficiency | 3 | Direct jumps work, but quick route is not explicit. |
| Aesthetic/minimalist design | 2 | Ten stages and repeated decision structure add perceived work. |
| Error recovery | 3 | Saved/reopened exact choices; multiple recovery options. |
| Help/documentation | 3 | Inline help useful; optional shared steps and final-summary scope need explanation. |
| **Total** | **29/40** | Qualitative design judgment; all ten apply. |

Assessment A identified three cognitive-load checklist failures: chunking, choice hierarchy, and working memory at Review. Decision points include 11 color swatches, six presets, five textures, and 12 font choices inside selects. The answer is progressive disclosure and scope clarity, not restricting the user's approved palette or fonts.

The emotional high point is seeing independent slide choices accumulate in a recognizably SPOKES preview. The valley is uncertainty about whether a shared edit changed a local design. The ending needs all-five effective summaries so the spokesperson can confidently say what the team agreed.

Persona risks: a first-time spokesperson can treat every numbered stage as required; a returning team can accidentally replace a saved look from the preset landing screen; a phone user encounters compact controls and must switch between Design and Preview. These are expert personas, not observed participants.

## Detector interpretation

Assessment B ran the CLI detector once against `bespoke/index.html`: **0 static findings**. Much of the UI is rendered dynamically, so that is narrow evidence. Browser injection succeeded in a fresh headless Chromium page across four states, reporting **27/18/18/18 flagged elements** and **28/19/19/19 rule records**. These counts are not unique product defects.

Useful additional signal: the step counter measured 10.88px and preset comparison captions 10.4px. Deliberately chosen 1:1 preview colors demonstrate the requested advisory policy, not a forbidden-choice defect. Catalog accent rails and hidden-disclosure warnings were not promoted to bugs. Gradient-text/marquee warnings lacked supporting product source and were treated as injection artifacts. No user-visible overlay was created, and no active user browser was used. Raw location export did not reliably preserve DOM selectors (`ref: <Node>` serialization plus an incorrect follow-up property); unsupported line-length/location records were not attributed to product defects. The promoted typography finding has independent computed-size and source evidence.

## Decisions to preserve and follow-up questions

Preserve independent slide styles, cumulative preview, all palette/font choices, sample-only wording, visible Save state, Undo/recovery, and the separate design-review/build boundary. A future implementation should first address F2–F4 and F7, then restructure navigation and guidance together. Do not make a guide-only claim that the proposed flow already exists.

The remaining design choices are whether to adopt the preferred three-stage structure or the lower-change eight-step alternative, and whether Review should show five thumbnails or a compact effective-style list with direct previews. These do not block this review, and no further permission was needed to complete the authorized report.

## Unexercised boundaries

The fresh walkthroughs did not perform real hosted Save/Open/Send, private access provisioning, delivered proposal receipts, screen-reader use, physical-device testing, a controlled performance study, exhaustive every-control combinations, or full legacy editing/save journeys. Original-wizard coverage was navigation and initial inspection. Dashboard links were source-reviewed; the dashboard and full curriculum were not independently walked as part of this BeSpoke review.

Offline/timeout retries, duplicate/lost responses, delayed-save races, quota/private-storage failures, and persistent-runtime restart were not independently recreated by the subagents. Some have existing automated coverage in the repository quality gate; a passing regression suite is not new participant or deployed-service evidence. No new lessons, generated final products, or production acceptance are authorized by this report.

## Regression validation and preservation

`bash scripts/quality.sh` completed with exit 0 and “all checks passed.” Its model/schema, workflow, generated-contract, rendering, and accessibility checks supplement the fresh walkthroughs. The gate retains existing report-only and allowed accessibility baseline warnings; it is not a claim of zero accessibility defects. [Full quality log](</Users/brittlegg/Library/Application Support/Codex/local-previews/bespoke-workflow-review-20260924/root/quality.log>).

The persistent local preview state had identical SHA-256 before and after this review: `e1f2a49afbeec5dfa6c322dd42c058d3a6f4ca40a7ac3905791b550404c02ef9`. Its contents were not read into the report. The review did not restart or operate ports 8765/8766, touch active user tabs, or write product files. All review-created browser contexts and ephemeral services were closed. Evidence is kept separately from the persistent preview runtime.
