# BeSpoke effective color preview fix — September 24, 2026

Selecting Green for Chapter divider background previously changed the shared
default even when the visible divider used a custom Blue background. The swatch
could show Green while the preview stayed Blue. Painting now defaults to the
visible slide's effective color and changes that exact local field.

## Interaction and scope

- **Paint colors → Element to paint → Apply color to** starts with **This slide**.
  Its selected swatch reflects the effective color, including a custom override.
- **Shared default** is a deliberate separate scope. It changes the inherited
  default without replacing custom fields. Scope guidance lists those exceptions.
- Choosing another element returns to This slide. A compatible current preview
  stays selected; preview tabs follow the equivalent background or text field.
- The same behavior covers primary and secondary background colors, heading color
  and supporting/body color across all five roles. Second gradient color is named
  for its availability on all five roles.
- Sidebar, Accent and Buttons remain shared-only. Shared fonts and texture retain
  their existing scope. The local role editor still offers Use shared theme to
  reset an individual field's inheritance.
- A color edit preserves other gradient stops, direction, finish, texture,
  typography, visibility, words, watermark and other roles. Unused second colors
  and hidden text colors stay saved; the helper explains when they appear.
- Scope is browser UI state only. It is absent from selection, shared records and
  backup selection payloads. Existing schemas and generation authority are unchanged.

The three stages, optional Shared theme, eleven free color choices, independent
role editors, advisory contrast, cumulative preview and recovery flows remain.
The team guide, handoff and design reference describe the new control.

## Verification

The independent regression is `scripts/test-bespoke-effective-paint.mjs`, included
in `scripts/quality.sh`. It uses synthetic designs, fresh Chromium/WebKit contexts
and an ephemeral in-memory loopback service. No user's design is a fixture.

- Reproduce an already-Green shared default with a custom Blue-to-Mist divider,
  diagonal gradient/texture, Deep gold heading and independent fonts/watermark.
  Paint Green and compare actual computed
  backgrounds, text color, screenshots and the complete design object.
- Check twenty local color targets across five roles, every analogous shared
  default, and the three shared-only colors. Assert exact intended differences,
  selected swatches and preview-target agreement.
- Preserve the design exactly through Undo/Redo, reload, synthetic Save/Open,
  a fresh browser context, backup download and reimport.
- Check older v2 inheritance, phone scope controls, keyboard and editor
  accessibility. Intentionally low-contrast sample artwork remains advisory.

The independent reviewer passed all four groups in both Chromium and WebKit,
including twenty visible local targets, eight shared-default targets and three
shared-only targets per engine. Exact fixture comparison changes only
`roleStyles.divider.primary` from Blue to Green. Computed rendering changes to
`rgb(55, 181, 80)` with the Mist stop retained, and the preview image changes across
about 95% of its pixels. The baseline module from commit `99d7182` reproduces the
unchanged Blue preview while the Green swatch is selected. No additional actionable
code or visual finding remained after independent review.

Both phone runs pass editor axe checks, preserve a scope control taller than 44px,
avoid horizontal overflow, and support keyboard paint with focus retained.
Sample artwork is excluded from the editor axe scan because chosen low contrast
is intentionally advisory. The older v2 design stays unchanged while navigating;
only an actual paint action creates its selected role record.

The existing builder browser suite passes 13 scenarios and streamlined workflow
suite passes six. `bash scripts/quality.sh` completed with exit 0: all checks passed.
This includes the new regression, service/recovery/contract checks, preview and
generated-render matrices, 481 role-editor edits, geometry, keyboard and
accessibility checks. Existing lesson/template validator warnings and the committed
lesson accessibility baseline remain; passing the gate does not claim those older
lesson findings were repaired by this UI fix.

## Local preview and boundaries

The existing preview remains at `http://127.0.0.1:8766/bespoke/`. Static asset GETs
confirmed the revised module and guide match this worktree and use `no-store`.
The 8766 process remains PID 50756; the 8765 listener remains PID 22768.

No user browser was opened, refreshed or operated. No API request was made to
the persistent preview and no runtime write, restore, reset or server restart was
performed. Its file hash changed during the live session, so this report does not
claim byte-identical user state. The evolving file was left in place.

The supplied screenshot path was unavailable on this host. Verification uses the
reported state recreated synthetically, not the user's actual draft. This is a
local implementation check; it does not establish hosted acceptance. No service,
schema, catalog, lesson, template or runtime-data changes, real Send/status calls,
merge, deployment or pull-request creation are part of this fix.

Evidence is archived outside the repository at:
`/Users/brittlegg/Library/Application Support/Codex/local-previews/bespoke-color-preview-fix-20260924/`.
