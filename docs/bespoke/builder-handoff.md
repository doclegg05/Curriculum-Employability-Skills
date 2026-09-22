# Bespoke builder handoff

Teachers choose **Save**, **Open**, and **Send to Britt**. Save stores the design
for a later Open on any computer. The edit code is the lock. Send starts the Spoke
Signals workflow, which opens a draft pull request for Britt. Teachers do not need
a GitHub account, a terminal, or a folder to pick. The browser still keeps a
convenience copy, and **For builders** can still download a design file. This
instructor workflow concerns the visual look only. No full lesson intake or
content-authoring form is required to submit visual choices for review. The
canonical intake generated below is a separate builder-side artifact for a later
authorized lesson build.

Send to Britt is the lead’s path. It dispatches the Spoke Signals workflow with
the server token. The workflow writes the proposal and opens the draft pull
request. It does not push to main and it does not apply a selection. Use the file
command below when a builder downloads a design file instead.

## Receive a teacher file

From the repository root, run this one command with the downloaded or locally
synced team file. Keep the quotes around a path that contains spaces.

```sh
python3 scripts/bespoke-write-submission.py "/absolute/path/to/team-selection.json"
```

This validates the file before writing and prints the proposal folder:

```text
docs/phase-2/submissions/<lesson-id>/<date>-<selection-digest>/
  selection.json
  content-intake.md
  design.css
  build-contract.json
```

Two submissions on the same day have different folders when their contents differ.
Retrying the exact same file leaves the proposal and any completed intake intact.
The full canonical intake remains present. Preview samples are identified as sample
copy and are not silently assigned to a teaching stage. The command creates a
proposal only. It does not read OneDrive, create a lesson, open a PR, or publish.

Britt or a builder can also paste the file into **Actions → Spoke Signals → Run
workflow**. The optional GitHub issue flow runs the same validator and writer.
The workflow opens a draft proposal PR, requests Britt's review, and never applies
registries or builds a lesson. Approve and run the full quality workflow before merge. PRs created with
GitHub's built-in workflow token require approval for their PR workflow runs.
See [GitHub workflow-trigger documentation](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow).
The workflow requests review; repository protection settings must enforce any
required approval rule. No protection settings are changed by this package.

## After Britt approves the proposal

Confirm the team's complete intake, referenced source files, permissions, and the
approved proposal path. Design approval is not evidence that lesson content is
complete. Build only after this check.

Registry preparation remains an explicit builder step. Preview the change first:

```sh
python3 scripts/bespoke-apply-selection.py --selection "<approved-proposal>/selection.json" --dry-run
```

Use the same command without `--dry-run` to prepare the pending registry entries
in the lesson-build branch. This changes registries only. It refuses to overwrite
an existing built or released lesson. A different pending proposal requires
`--expected-selection-sha256 <current-digest>` after reviewing the current
registry entry, preventing an older proposal from silently replacing a newer one.
During that authorized build, update Dashboard.html's offline FALLBACK_LESSONS
entry to match the registry; `check-registry-sync.py` deliberately fails if the
online and offline catalogs diverge. Do not publish a pending lesson as ready.

## Preserve the selected appearance

`design.css` is assembled automatically from the selected library options,
self-hosted font declarations, and the fixed WIPPEA chapter map. Its companion
`build-contract.json` records the original selection digest, exact CSS digest,
source template/library digests, chosen font assets, and required dark-theme class.
Use the files from the approved proposal; do not regenerate a different look after
approval without review.

1. Keep the canonical template markup and its navigation engine.
2. Insert the complete `design.css` text inside the final
   `<style id="theme-override">` block after all base CSS. Keep this the last
   embedded style block and do not override the chosen appearance elsewhere.
3. Add `<meta name="bespoke-selection-sha256" content="DIGEST">` using
   `selectionSha256` from `build-contract.json`.
4. Match `chapterMap` in each section divider. When the contract requires
   `theme-dark`, add that class to `.main`. Keep font paths valid relative to the
   lesson's `index.html`.
5. Check the finished lesson:

```sh
python3 scripts/bespoke-check-design.py "<approved-proposal>/build-contract.json" "lesson-<id>/index.html"
python3 scripts/validate-lesson.py "lesson-<id>/index.html"
bash scripts/quality.sh
```

The design checker is a **static contract check**, not a screenshot comparison or
accessibility certification. Inspect every final chapter and component in a
browser, including contrast, font loading, overflow, classroom projection and
mobile layouts. Different card components can look different from the preview
sample. Get teacher/Britt acceptance of the final appearance and content before
release. Extra presentation chapters need an explicit approved chapter map; this
first contract covers W, I, P1, P2, P3, E, A.


## Known template and library limits

The base template and design contract include a Warm-Up divider at chapter 1 and
preserve the W, I, P1, P2, P3, E, A mapping. Keep those roles in the built lesson.

`split-panel` dividers and `gradient-fill` cards are blocked until their known
watermark/contrast defects are remediated. The Outspoken preset uses `gold-rail`
and `stamp-frame` instead. Blocking these two defects does not certify every
remaining option combination for contrast or visual fidelity.
