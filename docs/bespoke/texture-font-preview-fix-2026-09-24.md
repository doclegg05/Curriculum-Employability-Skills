# BeSpoke effective texture and font preview fix — September 24, 2026

Background pattern buttons and the heading/body font selectors previously changed
only shared defaults. A divider with a local Diagonal texture or custom font kept
its appearance, despite the shared control showing another choice. This fix
extends the preceding color-paint correction to the other inheritable visual fields.

## Interaction

**Fonts & texture** now has one **Apply fonts & texture to** selector, starting with
**This slide**. Its fonts and selected pattern resolve from the current preview's
effective settings. A choice changes exactly that local font or pattern field.
**Shared default** remains available deliberately and preserves local exceptions.
The fonts/texture scope and color scope are independent browser UI preferences;
neither enters shared records or selection/backup payloads.

Local pattern thumbnails use the same model background recipe as the preview,
including primary/secondary colors, gradient direction, split/Band composition
and texture strength. Shared-default thumbnails are explicitly described as shared
colors at Standard strength. Preview tabs update effective controls and thumbnails
without changing the design.

Plain removes texture while retaining the gradient and saved strength. Returning
to a pattern restores its visibility at that strength. The existing strengths are
Subtle, Standard and Stronger; all are nonzero. No new strength or visibility state
is introduced. Fonts for hidden text remain saved without showing that text; a
nearby helper explains this behavior.

All seven inheritable Shared theme fields now have an explicit effective-slide
path: primary/secondary background, heading/body color, heading/body font and
pattern. Sidebar, Accent and Buttons retain their shared-only behavior and samples.
The earlier color fix, three stages, eleven free colors, twelve existing font
families, advisory contrast and local role editors remain.

## Implementation and verification

The app reuses `setRoleStyle` for local writes and the existing global fields for
explicit shared writes. The only model change exports the existing, unchanged
`roleBackgroundCss` recipe so thumbnails can use it. No schema, rendering-recipe,
service or migration change is introduced. Active guide/design/handoff text explains
the scope controls; historical evidence reports remain unchanged.

The independent regression is `scripts/test-bespoke-effective-theme.mjs`. It
checks the reported divider, Plain and four visible patterns on all five roles,
font overrides, exact field isolation, thumbnail/computed-preview agreement,
scope/tab alignment, saved texture strength, split/Band layouts, hidden text,
old-v2 navigation, keyboard/phone accessibility, and Undo/Redo/reload/Save/Open/backup.

All four focused groups pass in both Chromium and WebKit, with no runtime errors,
external requests or remaining actionable product finding. Per engine, the matrix
checks 25 local texture choices and ten font changes against actual computed
styles, visible pixel changes, selected controls and exact design differences.
Selected pattern thumbnails match the preview's computed background properties;
split and Band arrangements have additional checks. Subtle, Standard and Stronger
saved strengths are represented and retained.

The pinned `21cb56c` app/model reproduces the original Plain-selected/Diagonal-visible
state and font controls that leave local fonts unchanged. The revised app removes
only the requested divider texture, keeping its Blue-to-Mist gradient, Deep gold
heading, fonts, watermark and other choices. Phone controls remain at least 44px,
keyboard activation retains focus, and both editor axe scans pass including region
checks. Configurable sample artwork is excluded from these editor accessibility
scans because chosen low contrast remains advisory.

Existing model checks pass (13 builder and 16 role groups), along with 13 builder
browser scenarios and six streamlined workflow scenarios. `bash scripts/quality.sh`
completed with exit 0 and all checks passed, including both new effective-scope
regressions, service/recovery/contract checks, 481 role-editor edits, generated
layouts, textures, video frames and accessibility matrices. Existing lesson/template
validator warnings and the committed lesson accessibility baseline remain; this
bounded UI fix does not claim to repair those older lesson findings.

## Preview and evidence boundaries

The existing local preview is `http://127.0.0.1:8766/bespoke/`. Static GETs confirm
the updated app, model and guide match the worktree and are served with `no-store`.
The listeners remain PID 50756 on 8766 and PID 22768 on 8765. All browser tests use
fresh synthetic contexts and ephemeral in-memory loopback services. The user's
tabs, storage and persistent preview API are not operated. No runtime write, reset,
restore, server restart or operation on port 8765 is performed. Runtime state may
evolve during user activity; this task makes no byte-identical preservation claim.

The supplied screenshot path was unavailable, so its described state is recreated
synthetically. This is local regression evidence, not hosted acceptance or physical
device/screen-reader testing. No lessons, templates, production services, real
Send/status calls, merge, deployment or new pull request are part of this work.

Evidence is archived outside Git at:
`/Users/brittlegg/Library/Application Support/Codex/local-previews/bespoke-texture-font-preview-fix-20260924/`.
