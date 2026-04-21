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
