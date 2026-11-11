# Project Memory Archive

Older rows moved out of `.claude/MEMORY.md` to keep it under its size cap.

## Key Decisions Log (2026-10-23 and earlier)
| Date | Decision | Rationale |
|------|----------|-----------|
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
