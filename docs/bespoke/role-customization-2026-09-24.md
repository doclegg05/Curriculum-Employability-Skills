# Independent slide-role controls and beginner guidance

September 24, 2026. This change extends the existing BeSpoke visual-design builder
on `codex/bespoke-guided-builder`. It does not author curriculum or release lessons.
The implementation checklist is [recorded separately](role-customization-checklist.md).

## Result and control scope

Title, Chapter divider, Text boxes, Video and Activity each have Arrangement,
Background, Texture, Text and Watermark sections. Arrangement and Background start
open. Disclosure state and help state stay in the page's UI memory. A local edit
shows its target preview while retaining every other role's choices.

| Section | Working controls and boundaries |
| --- | --- |
| Background | Inherit the current finish, Solid/one color or two-color gradient; independent primary/secondary colors from all eleven swatches; left-to-right, top-to-bottom or diagonal direction. Hidden secondary settings are retained. |
| Arrangement interactions | Existing layouts remain. A split title puts its second color in the right panel, so direction is omitted; Solid colors both panels uniformly. Divider Band retains the middle 70% panel and shared lesson surface above/below. The UI explains both cases. |
| Texture | Plain/none, dot grid, diagonal, crosshatch or soft gradient; Subtle, Standard or Stronger. Each role inherits the shared texture until given a local choice. |
| Text | Independent heading/body colors and the existing twelve fonts; smaller/default/larger size, separate heading/body alignment, show/hide and sample words. Explicit size/alignment overrides the arrangement; Match arrangement restores inheritance. |
| Labels | Divider chapter label and Activity label have separate sample words and visibility. Their supporting/heading typography applies respectively and remains editable when only the label is visible. |
| Content specifics | One to four boxes, title bar, paragraph/bullet/numbered treatment, box styles and arrangements remain. All four sample strings stay recoverable. Video retains Plain/Accent frames and arrangements; its optional supporting paragraph starts hidden to preserve the old look. Activity layouts and label treatments remain. |
| Watermark | Follow the divider arrangement's chapter number, choose None, or use custom words/number; eleven colors, three sizes, four corners and three strengths. Custom decoration occupies reserved space and retains its settings when hidden. It never edits or replaces the SPOKES logo. |

Shared Paint and Fonts/background steps set lesson defaults. Local selectors show
Use shared theme together with the inherited value. Explicit local values stay
independent. Sidebar, accent and button theme choices retain their existing roles;
the corrected lesson-style sidebar and accessible narrow disclosure are preserved.

The opening step explains the three-stage workflow and the eleven freely mixed
SPOKES colors. Always-reachable How it works explains editable presets, local versus
shared settings, sample design versus finished curriculum, Undo/Redo, shared history,
backup and save/reopen, curated fonts, four-box manageability, the title logo,
advisory contrast and known-lesson comparison. Saving guidance distinguishes the
local test service from shared team saving and design review.

## Model, compatibility and artifacts

The v2 envelope and `design.version` remain unchanged. A closed optional
`design.roleStyles` object holds any of the five role keys; each present role has a
complete validated record. Absence preserves the earlier output. Explicit inherit
values keep shared defaults live rather than copying and disconnecting them.
There is no eager rewrite of stored selections. Older strict consumers reject the
unknown extension instead of silently dropping it.

Title/subtitle and the four box strings retain their existing sample storage.
Other sample heading/body/label overrides are nullable: null means the existing
sample words. Visibility does not erase words. Presets reset visual choices and
preserve all sample words, including label and watermark text. V1 conversion keeps
its original payload and existing review pause; the extension is available afterward.

The shared model supplies the optional schema, effective values, local setters,
used-font inventory, renderer and advisory calculations. Browser, Node service and
Python artifacts use that authority. Generated contracts retain complete local
settings, text, font assets and model digests. Sample copy appears in component
samples; CSS does not replace instructor-authored canonical lesson text.

Local background recipes are shared by preview and generated/canonical styles.
Canonical selectors identify the corresponding title/divider/card/video/activity
structures; explicit overrides take precedence over base template styling. This
does not modify the canonical template or build a finished lesson. Mixed custom
lesson structures still require the separately authorized build-contract workflow.

Contrast remains advisory. New gradient/texture compositions sample the selected
layers; small headings and normal-size card/activity labels use the stricter text
guideline. The band check conservatively includes its outer surface. Decorative
watermarks have separate reserved space. Preview advisories concern the visible
role; Review gathers all modeled issues. Explicit colors are never substituted.
These modeled measurements are not whole-design accessibility certification.

Similarity resolves comparable overridden features and marks mixed, hidden or
unmeasured dimensions unknown. It retains the six real reference lessons and does
not claim visual uniqueness or compare private team designs.

## Review findings and repairs

| Finding | Repair and evidence |
| --- | --- |
| F-R1: local divider background erased the horizontal band | Retain the centered 70% panel, its solid/gradient recipe and the surrounding lesson surface; computed and pixel checks cover the arrangement. |
| F-R2: canonical base selectors overrode local content backgrounds | Explicit role styling now wins against the actual template selectors; independent five-role computed parity review verifies the repair. |
| F-R3: canonical watermark overlapped text because the template forced zero flex space | Custom decoration reserves its actual font height. Pixel-difference checks compare painted watermark bounds with meaningful content. |
| F-R4: absolute chapter imagery could overlap the new reserved watermark | Custom-watermark-only canonical styling gives existing chapter imagery normal-flow space. Original assets and untouched designs remain unchanged. |
| F-R5: canonical side activities did not reflow inside a narrow lesson canvas | Container-based stacking and minimum-width/word-wrap rules keep the content reachable at narrow widths and enlarged text. |
| F-R6: hiding main copy also hid typography controls for a remaining label | Activity and Chapter label-only states retain all four relevant typography controls with accurate labels. Hidden main-copy fields stay hidden and retain their words. Contrast edit links open the requested section and scroll the focused field into view. |
| F-R7: local import/save notices used shared-team instructions | Local notices now name Save test design and the local test service; shared-mode wording remains available for shared saving. |
| F-R8: enlarged canonical video copy overlapped its frame | A fresh isolated reproduction measured 35.69px frame/supporting-paragraph overlap at 200% text. Content-sized grid rows restore a 48px gap and normal vertical scrolling; the regression now compares frame and body bounds directly. The first integrated gate was stopped for this repair. |

The existing builder tests were updated to reach the moved local controls and
nested sample-word disclosure. Their save/recovery, exact-color and keyboard
assertions remain. The nine earlier QA repairs and sidebar checks remain in the gate.
The title pixel test now scrolls the full slide below the real sticky mobile
switcher and asserts its sampled pixels are unobscured. Its original color-boundary
threshold remains unchanged; both engines pass the corrected test at all three widths.

## Verification

The final uninterrupted `bash scripts/quality.sh` run completed with exit 0 and
all browser checks enabled in Chromium. The new suites are part of that gate.
All tests use ephemeral synthetic services and fresh contexts. No active Safari
or user browser state was used. The gate retains the existing library warnings
and lesson accessibility baseline; it reports no violations beyond that baseline.

The 16-check role model suite and eight-test contract suite verify exact earlier
CSS and markup hashes for the default and all six presets; twelve color/font rotations; 28 malformed records;
Node/Python digest, rendering, font and advisory parity; immutable artifact content;
synthetic shared save/retry/stale/history/auth behavior; and staged service authority.
Independent inherited/font-only background comparisons cover 70 cases across the
seven old looks and five roles.

Both Chromium and isolated WebKit passed the existing 13-scenario builder suite.
The new independent browser suite passed 456 control edits per engine with exact
unrelated-state preservation, 40 computed paint checks, 100 typography checks,
20 texture pixel comparisons, 50 geometry checks and 31 editor/help axe scans.
It exercises hidden-value recovery, focus, cumulative previews, shared defaults
with local overrides, Undo/Redo, backup import/export, Save, reload, new-context
Open and previous-version restoration. Representative layouts include 320px and
390px phones and 200% text. Intentional sample color choices remain advisory;
editor axe results do not certify every freely chosen sample combination. Final
focused regressions add 25 edits per engine for label-only formatting, contrast
focus/scroll and local import/save wording.
The integrated run includes both sets: 481 edits, 40 paint checks, 100 typography
checks, 20 texture comparisons, 50 geometry checks and 31 axe scans. Existing
visual QA also passed 48 editor axe scans, 120 viewport checks and 208 slide checks;
sidebar QA passed 78 geometry checks, 22 exact-color checks, 15 accessibility scans
and six generated-output comparisons.

The bounded manual review included desktop opening guidance, mobile help, label-only
controls and generated/canonical slides with enlarged text. These are isolated
browser-engine checks, not live Safari or hosted deployment acceptance.

The generated/canonical suite passed 50 computed renders, 40 actual watermark
paint/overlap checks, 32 label visibility combinations and two band pixel checks
per engine. It covers all three watermark sizes/strengths and verifies the final
canonical text remains reachable through normal scrolling. Earlier Chromium
video screenshot differences included two isolated frame-edge pixels in the
watermark bounds. The differential now masks native-video pixels and excludes
isolated components smaller than three pixels while retaining connected watermark
paint. Frame geometry remains in direct overlap checks. Reviewing this evidence
also exposed F-R8, which received a separate layout repair and regression.

## Local preview and evidence

The [local preview](http://127.0.0.1:8766/bespoke/) runs from the owning worktree.
At 16:01 UTC, the verified process on port 8766 was gracefully replaced after a
permission-restricted external backup. Its state SHA-256 was identical before
shutdown, after flushing and after restart:
`f4c6ced81bbc95a5d82c8ce667109e0d6d76aa54c34c146e879cbed30caef11e`.
This also matches the task-start hash. No browser draft or user tab was operated.
The new process is 50756. Seven served assets match the files on disk exactly.
The six reference lessons and canonical template retain their starting hashes.

Synthetic logs, measured geometry, screenshots, the restart manifest and the
protected backup are outside Git under:
`/Users/brittlegg/Library/Application Support/Codex/local-previews/bespoke-guided-builder/role-customization-20260924/`.
The implementation stays on `codex/bespoke-guided-builder`; this is local review,
not hosted deployment or lesson-release acceptance.
