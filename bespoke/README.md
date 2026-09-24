# BeSpoke

BeSpoke helps instructor teams choose a presentation's visual design through small
choices and a cumulative preview. It configures reusable title, chapter-divider,
text-box, video and activity designs with sample copy. It does not write curriculum,
build a complete deck, or publish lessons.

**September 24, 2026 status:** the v2 guided builder is implemented for local
review. Shared-service integration has synthetic local tests; this revision has
not been deployed or accepted on the hosted service. The
[September 22 hosted acceptance](../docs/bespoke/verification-2026-09-22.md) records
the earlier v1 flow and does not establish hosted v2 readiness.

## Choose a design

Start with **Guide me through** or one of six editable presets: Professional,
Modern, Serious, Light-hearted, Fun and Outspoken. Both paths use the same model
and controls. A preset fills those controls; changing an individual choice keeps
the other choices. Applying another preset replaces the visual choices, preserves
sample text, and can be undone.

The guided steps are:

1. Your starting point
2. Lesson & team
3. Paint your elements
4. Fonts & background
5. Title slide
6. Chapter divider
7. Text boxes
8. Video slide
9. Activity
10. Review & save

**Colors:** select an element, then a brand swatch to replace its color immediately.
All eleven swatches stay visible, including White. Colors are assigned directly to
sidebar, title background and its second color, title text, subtitle, content
background, headings, body, accent, buttons and divider background. There is no
preselected two-primary/three-secondary palette. Unsafe text/background combinations
show an explanation; readability rules do not silently reset unrelated choices.
Existing brand restrictions on Gold and Green text remain in the model. Decorative
accents and text are separate roles. Selecting Buttons keeps the current preview
and shows a temporary action-button sample when that slide has no button. On phones,
the same sample also appears beside the palette. Video and Activity use their own
sample buttons. Every sample uses the selected button color with automatically chosen
legible text; sample activation does not navigate, download or submit.

**Fonts:** choose heading/title and body fonts independently from all twelve existing
self-hosted families. The six former pairings remain available through their font
families; presets can initialize combinations, but do not lock a pairing. Franklin
Gothic Book is omitted because no existing licensed webfont package was found. Its
absence does not block the builder, and no substitute is labeled as that font.

**Components:** title and divider designs have separate guided arrangement and
appearance choices. Text boxes support one to four boxes, one optional shared
title bar, paragraph/bullet/numbered treatment, box style and arrangement. Video
and activity have their own controls. Reducing the box count keeps all four draft
strings so increasing it restores the hidden text. The live preview uses the same
accumulated design used by backups, shared saves and generated artifacts.

**Comparison:** the advisory meter counts exact matching measured choices against
six actual presentations: Time Management, Interview Skills, Controlling Anger,
Employee Accountability, Communicating with the Public, and Problem Solving &
Decision Making. It includes comparable font, color, background, layout and component
characteristics. Details show matches, differences and unknown features. Unknown or
mixed measurements do not count as matches. The count is not a pixel or perceptual
similarity percentage, does not block a choice, and knows nothing about other teams'
private designs. Preset cards show their closest measured reference; another preset
or individual edits can provide a more distinct starting point without a uniqueness
guarantee.

## Drafts, recovery and shared work

Forward/back navigation and switching preview roles keep the design. Undo/redo
tracks recent design changes in the browser draft. Refresh restores that draft;
downloaded backups preserve the selection and its hidden sample strings. A browser
copy or downloaded backup is not a confirmed shared save.

The connected workflow retains private team access, shared Save/Open, revision
checks, history, retry protection and receipt-confirmed Send. Choose one spokesperson
to operate the design during a team call. Shared autosave runs on step changes and
after 30 seconds without a change; immediate Save is available. A failed, stale or
pending save remains visible. Restored backups and earlier versions require explicit
Save before shared autosave resumes. A stale revision is rejected rather than
replacing another computer's newer design. Keep a backup, open the latest shared
version, and recover the choices the team agrees to keep.

A v1 backup opens as an **explained conversion**, not a promise of identical
appearance. The exact source selection remains in `legacySelection` in every v2
backup and can be downloaded separately on Review. Older title/divider/card options
may have no exact equivalent; chapter-specific styling remains in that original
backup. Review conversion and readability notes before saving the new design. The
original wizard remains at `bespoke/legacy.html`; its storage keys are separate.

For the deployed workflow, original private team links grant real access and must
stay within the intended team. **Leave team session on this browser** removes
remembered access and local drafts, not shared work. View links are read-only
snapshots, not live collaboration or team access. They can contain readable sample
text and contact details. Review proposals are public repository artifacts; use
work contact details and non-sensitive sample copy.

**Send to Britt** uses the confirmed saved selection. Processing is not delivery;
only the matching proposal receipt establishes that Britt received the review
request. Local preview disables Send and receipt-status requests completely.

## Local review

Use HTTP so catalogs and fonts load. A `file://` preview cannot load the wizard's
catalogs. From this isolated worktree:

```sh
node scripts/bespoke-dev-server.mjs --port 8766 \
  --runtime-dir "/Users/brittlegg/Library/Application Support/Codex/local-previews/bespoke-guided-builder"
```

Open [the local builder](http://127.0.0.1:8766/bespoke/). The server binds only to
loopback and overrides the handoff configuration with its own synthetic draft
service. **Save test design**, Open and history use only local test data, with the
same revision and retry handler. No real team code or hosted-service connection is
needed. The external runtime directory keeps these drafts across server restarts;
omitting `--runtime-dir` keeps them only in memory. Do not place runtime data in
MacDev or another Git checkout. Stop the foreground server with Ctrl-C.

Port 8766 is a different browser origin from the older saved-checkout preview at
port 8765. Keep the older server and its Safari draft intact while reviewing v2.
Local testing does not establish online multi-device or hosted delivery acceptance.

## Sources and integration

| File | Responsibility |
|------|----------------|
| `bespoke/builder-catalog.json` | Eleven brand colors, twelve font families, editable presets, role choices and sample limits |
| `bespoke/builder-model.mjs` | Model validation, readability, v1 conversion, shared CSS and escaped component markup |
| `bespoke/builder-app.mjs` | Guided controls, cumulative draft, preview, undo and connected-save UI |
| `bespoke/selection-v2.schema.json` | Closed generated schema for the complete v2 selection |
| `bespoke/lesson-fingerprints.json` | Measurements and evidence from six actual reference lessons |
| `bespoke/similarity.mjs` | Advisory exact-choice comparison with explicit unknowns |
| `netlify/functions/_shared/selection.mjs` | v1/v2 service authority; the existing handler retains access/revision/receipt protection |
| `scripts/bespoke-model-bridge.mjs` | Node bridge sharing that authority and model with Python proposal tools |
| `bespoke/selection.schema.json`, `bespoke/legacy.html` | Preserved v1 schema and original wizard |

Node.js 22+ is required for v2 validation/artifact generation. The proposal writer
produces the full selection, canonical content intake, CSS, v2 build contract and
reusable component samples. Its checker verifies actual box count, title-bar
presence and paragraph/list markup; matching CSS alone cannot implement structural
choices. See [builder handoff](../docs/bespoke/builder-handoff.md).

V2 cannot be flattened into the legacy v1 theme registry. Registry application
fails explicitly until there is a reviewed v2 consumer. That limitation does not
prevent choosing, saving or reviewing a v2 visual design. A lesson build and
publication still require separate authorization and approved instructor content.
The six previously approved Phase 1 releases are not reopened by this work.

Before a hosted rollout, deploy the compatible service authority/schema/model and
verify hosted acceptance before exposing v2 writes to teams. Follow
[shared service setup](../docs/bespoke/auto-handoff-setup.md); never put credentials
in browser assets or repository files. This local implementation did not perform
a deployment or change production configuration.

## Checks and historical references

```sh
node scripts/generate-selection-v2-schema.mjs --check
python3 -m unittest discover -s scripts -p 'test_bespoke*.py' -v
node --test scripts/test-bespoke-handoff.mjs scripts/test-bespoke-v2-contracts.mjs scripts/test-bespoke-dev-server.mjs
bash scripts/quality.sh
```

These are verification commands, not a claim that every gate has passed. The
current implementation's evidence belongs in its dated verification report.
Read [decisions](../docs/bespoke/decisions.md) for the September 24 overrides. The
September 23 slide-builder specification and color mockup remain historical design
records; their restricted palette, fixed pairing and no-preset constraints are
superseded. The earlier [team meeting guide](team-guide.html) describes v1 controls.
