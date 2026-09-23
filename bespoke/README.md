# BeSpoke

BeSpoke helps instructor teams choose the visual design of six planned Round 2
lessons. Teams compare approved looks during a Teams call, save their choices,
and ask Britt to review the agreed design. No lesson writing, Word form, GitHub
account, or command-line work is required from teachers. March 2027 remains a
soft phase target.

The wizard stays on GitHub Pages. A Netlify function handles authenticated shared
Save, Open, version history, and review requests. It does not connect directly to
Teams or OneDrive. Teams holds the meeting and private team link; OneDrive can
hold optional downloaded backups. BeSpoke does not build or publish lessons.

## For instructor teams

Read or print the [team meeting guide](team-guide.html).

1. Open the private lesson link Britt supplied and pinned in the team's private
   Teams channel. It identifies the team and opens the latest shared design when
   there is no unsaved browser draft to protect.
2. Choose one spokesperson to share the browser window and operate the design
   during the call. Answer the four **Describe the feel** questions, then start
   from the design BeSpoke makes from those answers or from an existing lesson’s
   look. Fine-tune colors, fonts, titles, dividers, and cards; pointing at an
   option previews it before anyone chooses it.
3. BeSpoke saves the shared design automatically on each step change and after
   30 seconds without a change. **Save shared design** saves immediately. Closing
   the page with unshared changes asks for confirmation. Opened backups and
   restored versions wait for **Save shared design** before autosave resumes.
   Return through the same original team link on this or another computer;
   **Open team design** also loads the shared record.
4. Add the spokesperson’s name, save the agreed look, then choose **Send to Britt**. Processing means the
   request is still underway. **Britt received the review request.** and its review receipt confirm delivery.
5. Use **Download backup** if a save fails or you want a local copy. Use **Open
   backup** in BeSpoke to recover its choices. The file need not be edited by hand.

Open the hosted website. Opening the wizard's HTML directly from OneDrive or
`file://` does not load its catalogs; existing lesson decks have a separate offline
contract. Preview text is optional sample material, not lesson content to submit.

Private team links grant real access. Keep them within the intended team. BeSpoke
removes the access credential from the address bar and remembers it locally when
possible; use the original pinned link when returning on a new computer. On shared
computers, save and then use **Leave team session on this browser** before closing
all BeSpoke tabs. That removes remembered access and local drafts, not shared work.

A browser copy is a convenience, not a confirmed shared save. Failed, offline, or
pending saves need attention. A stale save is rejected if another computer has
saved a newer revision; download a backup, load the latest shared design, and
reapply only the changes the team agrees to keep. **Previous versions** lists
recent shared saves for recovery. Restoring an earlier look must be saved as a
new revision; later history is not silently discarded.

Optional view links are read-only snapshots, not live collaboration or team
access. They can contain readable sample text and contact details. To edit and
save, return through the administrator-provisioned private team link.

## For Britt and administrators

Follow [shared service setup](../docs/bespoke/auto-handoff-setup.md) for private
team provisioning, independent encryption keys, restricted GitHub access, rotation,
and the hosted acceptance checklist. Server credentials never belong in the
browser bundle or repository. There is no public first-use claiming of a lesson.

The service writes encrypted revisions to `bespoke-drafts`, checks the revision
before every save, and uses the canonical saved selection for submission.
Spoke Signals opens a draft proposal. A workflow dispatch alone is not a receipt;
BeSpoke reports **Britt received the review request.** only after the matching proposal is confirmed.
Identical retries must resolve to the same proposal.

**Hosted status:** the deployed Save/Open/Send flow passed
[live acceptance](../docs/bespoke/verification-2026-09-22.md), including a real
review proposal. Passing local tests alone does not establish that teachers can save online. The service
must show a visible failure and keep backups available whenever the endpoint or
its configuration is unavailable. **Check review status** resumes a pending
receipt check after a connection problem.

The review proposal is stored in a public repository. Use work contact details
and non-sensitive sample text. Private team access protects shared draft editing;
it does not make submitted proposal text private.

## For builders

Follow [the builder handoff](../docs/bespoke/builder-handoff.md). The proposal writer
validates a selection and produces its chosen CSS and a final-output design
contract. It also preserves the canonical content intake for the later builder
stage. Teachers do not complete that form to choose or submit a visual design.

A design review does not authorize lesson construction. Begin a later build only
with separate authorization and complete instructor-owned source material. The
handoff does not apply registries, build a lesson, merge a proposal, or publish.
Repository protection must enforce any required review; a review request alone
does not do that.

After an authorized build, the design checker verifies selection identity, CSS,
fonts, chapter mapping, and required dark-theme class. This is a static check;
final browser inspection, content review, and teacher acceptance remain required.

## Catalog sources and guardrails

| File | Role |
|------|------|
| `SPOKES Builder/bespoke-library-catalog.json` | Authoritative options, including blocked choices and reasons |
| `SPOKES Builder/theme-options.json` | CSS source shared by preview and generated design artifacts |
| `bespoke/catalog.json` | Six upcoming lessons, presets, font pairings, and preview cues |
| `SPOKES Builder/theme-library.css` | Generated agent-facing library |
| `bespoke/selection.schema.json` | Generated payload schema with the six allowed lesson IDs and theme values |
| `bespoke/brief.js` | Design brief: turns the four answers into a starting design drawn only from the library, and measures overlap with the six existing looks |
| `SPOKES Builder/content-intake-template.md` | Canonical content intake and instructor ownership for a later authorized build |

The shared selection carries the brief answers in an optional `brief` object
(allowed ids in `bespoke/catalog.json` `briefAnswers`), the resulting library
choices, and in `presetId` the existing look the design is closest to. The
Netlify service bundles the schema: after a schema change, redeploy the service
before the wizard change reaches Pages. No arbitrary palette, font, or CSS entry is exposed to instructors. Imported
backups and service writes validate choices. Known defective `gradient-fill` cards
and `split-panel` dividers remain blocked pending remediation. Other combinations
still require computed contrast and visual review in the finished lesson.

Card variation is optional (D12); when enabled, adjacent WIPPEA chapters must have
different card styles. UI option keys use `family.slug`; selections persist slugs.
The preview is a sample. Full content, source documents, chapter imagery, and final
component placement belong to the separately authorized lesson build.

## Local checks

```sh
python3 -m unittest discover -s scripts -p 'test_bespoke*.py' -v
node --test scripts/test-bespoke-brief.mjs
node --test scripts/test-bespoke-handoff.mjs
node scripts/test-bespoke-browser.mjs
bash scripts/quality.sh
```

The browser checks use synthetic designs and isolated browser contexts. They do
not prove a real Teams call, OneDrive transfer, deployed save, or delivered review
request. Separate [hosted launch evidence](../docs/bespoke/verification-2026-09-22.md)
records the real Pages, Netlify, and GitHub checks. Repeat the setup guide's relevant
acceptance checks after operational changes.

Locked decisions: [docs/bespoke/decisions.md](../docs/bespoke/decisions.md).
Current review: [project readiness review](../docs/qa-reports/project-review-2026-09-22.md).
