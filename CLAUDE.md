# SPOKES Curriculum — Agent Instructions

## Required Reading

Before creating or modifying any lesson, you MUST read `SPOKES-STANDARD.md` in full.
Violations of CRITICAL rules will be caught by automated hooks and block your work.

## File Organization Standards

- Never nest files or folders more than 3 levels deep from the project root.
  - OK: `project/category/file.md`
  - OK: `project/category/subcategory/file.md`
  - NOT OK: `project/category/subcategory/deep/file.md`
- When creating new files or directories, check current depth first and flatten the structure if needed.

## Lesson Modification Rules

- Never modify the navigation engine directly — it is defined in SPOKES-STANDARD.md Section 5.
- All interactive components must meet accessibility requirements in SPOKES-STANDARD.md Section 3.
- All videos must have caption tracks (A11Y-07).
- The validator (`scripts/validate-lesson.py`) runs automatically on every Write/Edit to `lesson-*/index.html`.
- Fix all CRITICAL failures before proceeding — the hook will block until they are resolved.

## Build Process

For building new lessons, see `SPOKES Builder/CLAUDE.md` for the step-by-step build workflow.
The design rules referenced there are defined in `SPOKES-STANDARD.md`.

## Conference design briefs (capture only)

Read these before changing Round 2 modules or the Builder intake. Do not ship product from them without Britt go.

- `docs/phase-2/money-management-tanf-snap-topics-2026-09-17.md` — Money Management — Budget topic map (Britt's team)
- `docs/briefs/instructor-to-html-intake-2026-09-17.md` — KEEP VERBATIM intake rules on top of `SPOKES Builder/content-intake-template.md`
- `docs/briefs/instructor-lesson-studio-concept-2026-09-17.md` — historical Bespoke concept. The prototype was subsequently greenlit; current locks are in `docs/bespoke/decisions.md`.

This package is not VisionQuest. Do not merge SPOKES HTML hosting into the VisionQuest deploy path.

## BeSpoke foundation and review

- Read `docs/bespoke/builder-handoff.md` for receiving team files, approval boundaries, generated design contracts and final-output checks.
- Teachers use `bespoke/team-guide.html` and the editable `docs/bespoke/team-lesson-intake.docx`; keep it aligned with the canonical intake template.
- Read `docs/qa-reports/project-review-2026-09-22.md` for current evidence and unresolved lesson release issues.
- The September 22 review authorized foundation fixes, not construction of the six new lessons. March 2027 is a soft phase target.
