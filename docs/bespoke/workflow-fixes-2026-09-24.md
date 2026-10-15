# BeSpoke workflow fixes — September 24, 2026

The approved three-stage workflow replaces the ten-step sequence reviewed in
[the workflow assessment](workflow-review-2026-09-24.md) and its
[evidence appendix](workflow-review-2026-09-24-evidence.md). All eight findings are
addressed. This is the current local-review builder; it is not a hosted release
or authorization to construct lessons.

## Implemented workflow

1. **Start** combines Lesson & team with an editable preset or **Build my own**.
   A preset can go directly to Review & save or through one editor for a tweak.
   Returning teams continue the current design, with **Change starting look** as
   a deliberate secondary action.
2. **Slide designs** contains five direct, optional editors: Title slide,
   Chapter divider, Text boxes, Video slide and Activity. **Next slide type**
   helps users move between them without making every editor mandatory.
3. **Review & save** summarizes each role's effective appearance and fonts,
   Shared/Custom state, arrangements, hidden text, texture and watermark settings.
   Preview and Edit links open the corresponding sample or editor.

**Shared theme · optional** remains available in every stage. It groups shared
colors, heading/body fonts and texture. Numbered stages, role editor tabs and
preview-only tabs have distinct labels and behavior. Previewing a slide does not
change the selected editor or the saved design.

## Findings and verification

| Finding | Implemented change | Evidence |
|---|---|---|
| F1 — repetitive sequence | Three stages, optional shared settings and direct optional role editors; preset quick path and returning-design path. | Independent custom and preset journeys; six additional desktop/phone novice walkthroughs. Preset-to-review visits no role editors. |
| F2 — incorrect Review fonts | Effective per-role colors, fonts and texture marked Shared/Custom; shared defaults separately labeled. | Distinct role fonts asserted against the model and fresh-context saved design; direct Review preview links checked. |
| F3 — fresh-load preset confirmation | Replacement uses meaningful existing design state, including imports, shared loads and explicit saves, rather than Undo history alone. | Fresh-context replacement, Cancel/Escape and focus preservation, Undo, first-choice behavior, opt-out isolation/reset and unavailable session storage checked. |
| F4 — obsolete guidance | Public team guide, inline help, README files, handoff/setup guidance, decisions and active DESIGN record describe the current flow. | Source consistency and local links checked; guide rendered at phone width and printed to PDF. Historical reviews and the original wizard remain historical. |
| F5 — unclear shared/local scope | Affected and exempt roles are listed; per-field Shared/Custom descriptions and field-only reset controls; shortcuts focus matching fields. Sidebar, Accent and Buttons explain their shared-only scope. | Exact model equality after reset except the selected field; Undo/Redo, retained sample words/hidden settings, computed type/color and visible pixel changes checked. |
| F6 — small chrome and phone targets | Supporting editor text enlarged; controls and swatches use comfortable targets; native select styling preserves usable height in WebKit. Authored artwork remains independent. | Both engines at 1440, 1280, 390 and 320px; 200% root text; no document horizontal overflow in tested states. WebKit phone select measured 46.31px, 68.63px at 200%, versus the archived 24px. |
| F7 — recovery menu obstructs work | Menu dismisses after actions, outside interaction and Escape; focus returns to its trigger after a file action or Escape. | Download, outside stage action, Escape, focus and unobstructed Previous versions checked. |
| F8 — uncontained chrome | Named Design status region and mobile Workspace views navigation; duplicate contrast announcement removed. | Independent unrestricted editor axe scans explicitly include the `region` best-practice rule. Configurable sample artwork is excluded. |

The 44px target is the chosen ergonomic contract. WCAG 2.2 AA's
[Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
uses 24px with exceptions; the original small controls were not all classified as
AA failures. Responsive checks were informed by
[Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html) and
[Resize Text](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html).
F8 remains a best-practice finding, not a retroactive WCAG failure claim.

## Preserved contracts

- All eleven brand colors and twelve independently selectable font families;
  advisory contrast with no silent recoloring or additional save restriction.
- Optional closed five-role `roleStyles`; old v2 designs do not acquire overrides
  merely by opening or navigating. Original v1 selections remain recoverable
  exactly. All ten previous step IDs and a numeric-only step restore safely.
- Cumulative sample copy, hidden second colors/text/watermarks, one to four text
  boxes, list styles, title geometry/logo, video frames, real sidebar and drawer.
- Save/Open, browser recovery, backups, revision conflicts, retained dirty edits,
  lost-response retry, history and explicit recovery Save. UI navigation fields
  remain in the browser draft, outside the selection payload.
- Model, schemas, service, generators, released lessons and template are unchanged.
  Existing rendering and security assertions remain in the quality gate; their
  navigation helpers now use the actual stage/editor/theme controls.

## Implementation and review

Work was split among an app implementer, a guidance/finish reviewer, an independent
journey verifier and the integrating lead. The guidance reviewer walked preset,
custom and returning-user paths at desktop and phone sizes and found no remaining
actionable issue. The lead inspected representative desktop, phone and 200% text
screenshots and reviewed source/test changes.

Integration repairs addressed defects introduced during the work:
an editor heading binding that shadowed its helper; a native disclosure `toggle`
race that could collapse Shared theme during an edit; helper text being added
to local select accessible names; and a sticky mobile surface bar covering part
of controls at both 320×568 and 390×844. The mobile workspace now scrolls below
the Design/Preview bar instead of underneath it. Its height follows the measured
bar and dynamic viewport, including enlarged text; each view retains its own
scroll position. Both failing sequences passed 30 focused axe scans across the
two engines before the integrated confirmation.
The workspace is the single named, keyboard-focusable main landmark, containing
separate editor and preview sections. This preserves the main landmark in both
mobile views and avoids nesting main inside another landmark.
Shared theme also skips redundant same-state native toggle events, avoiding an
unnecessary preview replacement after a completed render.
Captions now provide the accessible name and
Shared/Custom text provides the description. Exact-name role regressions pass in
Chromium and WebKit. Help retains explicit editable-preset guidance. Test-only
corrections accounted for deliberate starting-look
disclosure, menu auto-dismissal and choosing a different color for pixel checks;
the persistence, geometry, pixel and accessible-name assertions were retained.

Independent verification passed six scenario groups in both Chromium and WebKit
across an initial batch and targeted confirmations, with 34 unrestricted editor
axe scans and no recorded runtime errors or external requests. This is not
described as a single uninterrupted all-pass run. The additional novice reviewer
completed six journeys with no runtime errors, external requests or overflow.
After the short-screen repair, the full visual matrix passed in both Chromium and
WebKit: 48 editor axe scans, 112 viewport checks and 208 slide checks per engine,
including 42 canonical checks, with zero findings. Final current-document checks
resolved all 26 local Markdown links.

The independent verifier then confirmed the final phone scroll behavior in six
Chromium/WebKit cases at 390×844, 320×568 and 320×568 with 200% root text. Thirty
deep role-editor/preview round trips retained exact per-view scroll positions.
Keyboard targets stayed unobscured, ordinary scrolling reached notes, native Tab
reached Review Save, and Space saved the exact design to the synthetic service.
All six unrestricted axe scans passed on the single-main document structure.

The new `scripts/test-bespoke-streamlined-workflow.mjs` runs in the repository
quality gate. Reproduction:

```sh
bash scripts/quality.sh
BESPOKE_BROWSER=webkit node scripts/test-bespoke-streamlined-workflow.mjs
```

**Integrated quality result: PASS.** The final complete `bash scripts/quality.sh`
run exited 0 on this implementation, including the legacy wizard, all 13 builder
scenarios, seven save-race scenarios, six new workflow groups, security/contracts,
responsive/editor checks, 481 role edits, generated/canonical rendering, title and
video geometry, textures, schema/library checks and the lesson accessibility
ratchet. Earlier interrupted runs and their repairs are retained in the evidence.
Existing lesson/template validator warnings and the committed lesson accessibility
baseline remain; a passing gate does not erase those known limits.

## Evidence and preserved preview

Evidence is archived outside Git at
`~/Library/Application Support/Codex/local-previews/bespoke-workflow-fixes-20260924/`.
It includes the independent `verification/report.md` and `summary.json`, initial
failures and targeted confirmations, app checks, guide/novice screenshots and PDF,
the root quality log and final preservation checks.

All browser verification used fresh isolated contexts and ephemeral services with
synthetic state. No active Safari/IAB tab, private team link or persistent user
draft was used as a fixture. No real Send/status, deployment, merge or lesson build
was performed. Contract tests exercise synthetic receipt behavior only.

Read-only preservation checks confirmed the original runtime SHA-256 unchanged
and preview PID 50756 still serving port 8766. Index, app, CSS and guide returned
HTTP 200 with `no-store` and byte-identical content to this worktree. No restart
was needed. Port 8765 remained on its original Python listener. Exact hashes and
listener evidence are in `root/preservation.json` in the external archive.

The evidence establishes the tested local behavior. Physical-device and
screen-reader usability, participant research, hosted v2 acceptance, full
accessibility certification and lesson readiness remain outside this work.
