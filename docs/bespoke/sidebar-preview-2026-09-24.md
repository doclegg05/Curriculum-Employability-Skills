# Sidebar preview correction — September 24, 2026

The Sidebar color role previously painted a horizontal strip above sample content.
Content samples now show a vertical chapter sidebar beside the slide, following
the navigation structure in the six existing lessons. This is a focused visual
preview correction on `codex/bespoke-guided-builder`; it does not build lessons or
change the canonical lesson shell.

## Source evidence

All six lesson files and the canonical template were inspected read-only. The
independent reviewer recorded their SHA-256 hashes before testing.

| Source | Sidebar CSS / navigation markup / chapter data, line starts |
| --- | --- |
| `lesson-communicating-with-the-public/index.html` | 64 / 2476 / 3404 |
| `lesson-controlling-anger/index.html` | 64 / 3023 / 3936 |
| `lesson-employee-accountability/index.html` | 62 / 3104 / 4106 |
| `lesson-interview-skills/index.html` | 62 / 3194 / 4193 |
| `lesson-problem-solving-and-decision-making/index.html` | 62 / 3112 / 3951 |
| `lesson-time-management/index.html` | 52 / 2625 / 3506 |
| `SPOKES Builder/template.html` | 76 / 1859 / 2393 |

The shared pattern is a 280px left column with a lesson-name heading, seven
W/I/P/P/P/E/A badge groups, indented slide names, resources and a slide-count footer.
The lesson logo is separate from navigation; the old preview's SPOKES header was
not a faithful sidebar heading. Existing lessons can hide the column with a
negative margin and automatically collapse it at narrow viewport widths. The
canonical template adds a 52px collapsed desktop rail and a mobile off-canvas
panel (`template.html` lines 91 and 1608).

The actual navigation sits outside the slide and persists across title/divider
slides. The builder intentionally retains standalone title and divider component
samples, as requested. The new shell is limited to text-box, video and activity
samples. Sample chapters and resources remain inert; no curriculum navigation,
resource download, external media or real lesson content is introduced.

## Behavior

At more than 40rem of available sample-canvas width, the 280px sidebar sits to the
left of the main content. At 40rem or less, a labeled native Sidebar disclosure
opens a vertical drawer over the content, leaving the main area its full width.
This threshold uses the actual preview pane rather than the browser window.
The drawer is ordinarily 280px wide; its 17.5rem width grows with enlarged text,
bounded by the canvas. Horizontal padding is capped at 24px. The drawer can receive
keyboard focus and scroll to every entry and the footer.

Painting Sidebar changes the rail, drawer and disclosure surface immediately
using the exact selected color and the existing adaptive ink. An open disclosure
stays open across paint redraws. No new design option, persistence field or model
reset was added. Other colors, fonts, arrangements and sample text remain intact.
Text boxes reflow according to the available main-content width; video and activity
side arrangements stack when that region is at most 30rem wide.

Editor and generated component samples use the same renderer and CSS. The
canonical template retains its own navigation geometry and receives the existing
Sidebar color mapping. This is representative shell fidelity, not a claim of
pixel-identical full lessons at every viewport.

## Verification

The independently authored regression uses an ephemeral synthetic service and
fresh browser contexts. Root added a 1440px laptop case to the reviewed matrix.
Chromium and WebKit each passed 78 geometry checks, 22 exact Sidebar
paint checks (all 11 colors on desktop and phone), 15 accessibility scans and six
generated-sample parity cases. Coverage includes 1920, 1440, 1100, 768, 390 and 320px
viewports, plus 390px with 200% text. It checks full-width narrow content, contained
drawers, keyboard open/close and scrolling, inert entries, no media or external
requests, unrelated-model equality, Undo/Redo, reload and shared save/reopen.

Review found and repaired two issues before completion: the scrollable drawer
needed keyboard focus, and fixed-width navigation cramped enlarged labels. The
final 200% Chromium and WebKit samples render Warm-Up and Introduction on one line
each; the automated check permits at most two lines. At that scale the 390px
viewport has a 342px canvas and drawer. At ordinary 320px viewport width the main
content and open drawer both fit the 272px canvas. A 1920px desktop viewport shows
a 280px rail beside an 896px main region; at 1440px the rail stays 280px beside a
472px main region.

Existing model tests now distinguish body lists from the added navigation list.
Visual geometry checks ignore unpainted contents of closed native disclosures.
Canonical text-box parity compares equal available main-content widths rather
than comparing a standalone slide with a sample that also contains navigation.
The assertions still enforce containment and equal column counts.

The new `scripts/test-bespoke-sidebar.mjs` is included in the required quality
gate. The final `bash scripts/quality.sh` run exited 0 with all checks passed,
including the Chromium browser suites, both generated schemas, service contracts,
all six lesson fingerprints, library synchronization and the existing lesson
accessibility ratchet. The broader visual suite passed 48 accessibility scans,
120 viewport checks and 208 geometry checks, including 42 canonical cases. The
prior nine repairs and their acceptance contracts remain covered by the existing
[comprehensive QA suite](qa-2026-09-24.md). WebKit was checked separately with the
focused sidebar suite; the entire repository gate was not repeated in WebKit.

The loopback preview's app, model and catalog responses byte-match the worktree.
Server PID 60676 was retained. The persistent state file's SHA-256 remained
`970949b1c3e90723f4794234a0286b42765fd4c153aa7b1c3e3468d4408194b6`,
identical to this sidebar task's starting hash. Every inspected lesson and the
canonical template still matches its pre-change hash.

## Evidence and limits

Evidence is retained outside Git under the local preview runtime's
`sidebar-preview-20260924/` directory: source hashes, browser measurements,
representative screenshots and the integrated gate log. The Impeccable layout
detector reported no findings before or after the change. Root visual inspection
covered desktop, narrow desktop, closed phone and the enlarged open drawer.

No Safari session, user tab or persistent preview draft was used for testing.
No lesson, canonical template, fingerprint, schema contract or production service
was edited. Chromium/WebKit automation is not certification of the user's active
Safari session or a hosted deployment. This change remains a local-review result.
