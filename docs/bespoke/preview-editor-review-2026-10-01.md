# BeSpoke preview editor review — October 1, 2026

Baseline: main 77514d0, whose builder matches the deployed b4eb377 release.
Plan: [preview-editor-plan-2026-10-01.md](preview-editor-plan-2026-10-01.md).

## Implemented behavior

- Live thumbnails navigate the five reusable slide designs; desktop Up/Down and
  phone Left/Right match their orientation, with Home/End retained.
- Clicking or keyboard-selecting visible text, a box or the background exposes
  native contextual dropdowns and a visible selection ring. The element picker
  provides the same selection path without precise pointing.
- Text offers independent heading/body font, size and color choices on the
  selected slide role. Boxes offer the existing filled/outline/rail/band styles
  and arrangements. Backgrounds expose finish and color choices.
- The scope line explicitly names all matching headings, all box text, or all
  boxes when the supported model groups their formatting. No per-box styling
  claim is made. Independent sample words stay intact.
- More options retains the full detailed editor, shared-default scope controls,
  sample text, textures, watermarks and all arrangement choices. Its browser
  disclosure preference restores on reload. Guide me, presets and Start/Review
  remain available. Undo/Redo uses existing history; selection remains through
  redraws, and unavailable targets fall back to background.
- View-only snapshots expose disabled formatting controls and cannot overwrite
  browser drafts. Native text editing, preset cancellation, held-key protection,
  conflicts, backups and confirmed save/reopen retain their existing contracts.

## Verification

- `bash scripts/quality.sh`: passed, including model/schema/service tests, all
  existing browser journeys, generated/canonical output checks and the lesson
  accessibility ratchet. Existing lesson allowlist entries remain unchanged.
- Chromium preview-editor checks: desktop 1440, tablet 768, phones 390 and 320;
  direct/keyboard selection, honest scopes, typography, box treatment/layout,
  history, reload, synthetic shared saving/reopening, overflow and selection
  semantics. A separate read-only snapshot check passed.
- WebKit preview-editor checks: the same responsive editing/history/persistence
  paths, native-select target sizes and thumbnail keyboard navigation passed.
- Detailed role acceptance: 481 edits, 40 paint checks, 100 type checks, 20 pixel
  checks, 50 geometry checks and 31 accessibility scans passed, including long
  copy, 320px and 200% text, recovery and generated output parity.
- Broader visual QA: 48 editor accessibility scans, 112 viewport checks and 208
  slide checks (42 canonical), with zero findings. Guide me: 25 scenarios passed.
- Actual Safari on Britt's iMac: visible local page, direct heading selection,
  native font dropdown/model edit, history feedback and saved-font reload were
  verified. The final preview remains open in a separate tab.
- Impeccable detector reviewed: incumbent catalog typography and scale/radius
  advisories retained; selection colors use existing SPOKES brand tokens.

## Preview and limits

`http://127.0.0.1:8767/bespoke/` is loopback-only on Britt's iMac. The supported
server persists synthetic Save/Open/History data in a separate Application
Support runtime. Sending is disabled. Real hosted Save/Open/Send was not tested;
this branch has not been merged or deployed. The previous port 8766 preview and
original checkout's unrelated three edited files remain preserved.

The current model formats matching text and box styles by reusable slide type.
Per-box independent fill/border/font styling would require a separate model,
schema and canonical-output extension; this implementation states the existing
scope instead of implying narrower edits.
