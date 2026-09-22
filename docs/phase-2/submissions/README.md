# Phase 2 Bespoke submissions

Instructor teams work in Teams. Their spokesperson uses Save, Open, and Send to Britt.
Teachers do not need GitHub. Send opens a draft proposal; it does not build a lesson.

Britt or a builder receives the file using the procedure in
[builder handoff](../../bespoke/builder-handoff.md). The writer and optional Spoke
Signals workflow validate it and create a separate immutable proposal:

```text
<lesson-id>/<YYYY-MM-DD>-<selection-digest>/
  selection.json
  content-intake.md
  design.css
  build-contract.json
```

An identical retry leaves the package and any completed intake intact. Differing
revisions use different folders. The intake preserves the canonical template;
sample preview text is separate from the complete teacher-authored lesson.

Britt confirms the current revision and full content, then merges the proposal
PR to greenlight the separate build. No new lesson is created by saving a file,
generating a proposal, or running the Spoke Signals workflow. After a build, the
contract checker and browser/content review verify that approved choices survive.
