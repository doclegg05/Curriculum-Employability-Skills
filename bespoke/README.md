# Bespoke

Bespoke helps instructor teams choose the look of the six planned Round 2 lessons.
The wizard stays on GitHub Pages. Save, Open, and Send call a small handoff
service that holds Britt’s token. It does not build lessons, and it does not
connect to Teams or OneDrive. March 2027 is the soft phase target, subject to review.

## For instructor teams

Open the hosted curriculum hub and choose **Open Bespoke**. Use the website in a
browser; opening its HTML file directly from OneDrive or `file://` does not load
the catalogs. The existing lesson decks have a separate offline contract.

1. The spokesperson opens Bespoke, chooses **Open**, and enters the lesson plus the edit code. On the first meeting they set an edit code of at least 4 characters and write it down.
2. The team chooses a starter theme and adjusts the available options while the spokesperson shares the window in a Teams call.
3. **Save** stores that design so **Open** can load it later on any computer. The browser also keeps a convenience copy.
4. **Send to Britt** asks the Spoke Signals workflow to open a draft pull request. The lead does not sign in or pick a folder. Merge remains Britt’s greenlight. This does not build a lesson.
5. **For builders** still downloads a design file. That download is not the lead’s main step.

Teachers choose the UI's visual style, compare the previews together, and save or
reopen their agreed choices. No completed lesson, separate form, GitHub account,
command-line tools or agent access is needed to use BeSpoke or request a design
review. Optional sample text is only for previewing appearance and fit.
Read or print the [team meeting guide](team-guide.html).

Browser saving is a convenience copy, not the team record. Opening a design asks
before replacing the working draft and keeps one previous browser draft for
recovery. A change from another tab pauses automatic saving to avoid silently
replacing work. The builder download still works when browser storage fails.

Optional view links are snapshots, not live collaboration. Copy a new link after
changes. They contain readable sample text/contact details. Their optional edit
code is a convenience lock, not authentication or confidentiality.

## For Britt and builders

Follow [the builder handoff](../docs/bespoke/builder-handoff.md). A single command
validates an incoming file and writes an immutable proposal containing the full
canonical intake, selected CSS and a final-output design contract. Identical
retries preserve the proposal; differing revisions have separate folders.

The lead’s **Send to Britt** button starts the same Spoke Signals workflow with
Britt’s server token. **For builders** can still download a design file or prepare
a GitHub issue. Britt's reviewed merge is the approval to begin a separate build.
The workflow does not build, publish, or apply registries automatically. A review
request alone does not enforce repository branch protection. One-time connection
steps are in [auto handoff setup](../docs/bespoke/auto-handoff-setup.md).

After an authorized build, the design checker verifies selection identity, CSS,
fonts, chapter mapping and required dark-theme class. This is a static check;
final browser inspection, content review and teacher acceptance are still required.

## Catalog sources and guardrails

| File | Role |
|------|------|
| `SPOKES Builder/bespoke-library-catalog.json` | Authoritative options, including blocked choices and reasons |
| `SPOKES Builder/theme-options.json` | CSS source shared by preview and generated design artifacts |
| `bespoke/catalog.json` | Six upcoming lessons, presets, font pairings and preview cues |
| `SPOKES Builder/theme-library.css` | Generated agent-facing library |
| `bespoke/selection.schema.json` | Generated payload schema; six lesson IDs and allowed theme values |
| `SPOKES Builder/content-intake-template.md` | Canonical content intake and instructor ownership |

No arbitrary palette, font or CSS entry is exposed to instructors. Imported files
and builder writes validate choices. Known defective `gradient-fill` cards and
`split-panel` dividers are blocked pending remediation. Other combinations still
need computed contrast and visual review in the finished lesson.

Card variation is optional (D12); when enabled, adjacent WIPPEA chapters must have
different card styles. UI option keys use `family.slug`; payloads persist slugs.
The preview is a sample. Full lesson content, source documents, chapter imagery
and final component placement remain part of the approved build.

## Checks

```sh
python3 -m unittest discover -s scripts -p 'test_bespoke*.py' -v
node --test scripts/test-bespoke-handoff.mjs
node scripts/test-bespoke-browser.mjs
bash scripts/quality.sh
```

The browser tests use synthetic files and isolated browser contexts. They do not
send messages, upload to OneDrive, create GitHub issues or publish anything.

Locked decisions: [docs/bespoke/decisions.md](../docs/bespoke/decisions.md).
Current review: [project readiness review](../docs/qa-reports/project-review-2026-09-22.md).
