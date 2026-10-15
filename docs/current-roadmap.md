# SPOKES Current Roadmap

**Status date:** 2026-04-30
**Purpose:** Current planning snapshot for the curriculum build. This file supersedes stale status counts in older planning documents while preserving those documents as historical records.

---

## Source of Truth

Use this order when documents conflict:

1. `SPOKES-Agent-Execution-Spec.md`
2. `docs/final-product-definition.md`
3. `SPOKES-STANDARD.md`
4. `lesson-registry.json`
5. `SPOKES-Master-Action-Plan.md` and `SPOKES-Project-Plan.md`

The root project plans remain useful, but their older lesson counts should be read through this current roadmap.

---

## Current Project State

| Metric | Current value |
| --- | --- |
| Lessons planned | 18 |
| Lessons currently listed in registry | 6 |
| Lessons currently tagged Ready | 0 |
| Lessons currently tagged QA | 6 |
| Lessons remaining to build/add | 12 |
| Current active lesson status model | Registry-driven via `lesson-registry.json` |

Current QA lessons:

1. Time Management
2. Interview Skills
3. Employee Accountability
4. Communicating with the Public
5. Controlling Anger
6. Problem Solving & Decision Making

Historical note: earlier QA records marked the first three lessons as release-approved. The dashboard and registry now treat all six current lessons as QA, so current planning should use the 0 Ready / 6 QA state until release decisions are refreshed.

---

## Active Priorities

### Priority 1: QA Evidence Reconciliation

**Goal:** Make lesson status, registry quality gates, validation evidence, and dashboard status agree.

**Work items:**

- Run the validator against all six current lessons.
- Confirm browser/device QA evidence for required viewports.
- Update any stale `qualityGates` entries in `lesson-registry.json`.
- Produce or refresh a concise QA status report for the six-lesson set.

**Done criteria:** Registry, dashboard filters, and QA report all show the same lesson status and release decision.

### Priority 2: Component and Visual Variety Tracker

**Goal:** Prevent repeated slide structures and component patterns as the curriculum grows.

**Work items:**

- Create `SPOKES Builder/component-tracker.md`.
- Track each lesson's dominant layouts, interaction types, visual motifs, font pairing, and accent strategy.
- Add recommendations for the next build so adjacent lessons do not feel repetitive.

**Done criteria:** The tracker covers all six current lessons and gives actionable guidance for lesson seven.

### Priority 3: Final Product Definition Audit

**Goal:** Check the current six lessons against requirements that are not fully enforced by the validator.

**Focus areas:**

- Instructor prompt panels on every interaction card.
- Interaction count and instructional value.
- One-screen visibility at required viewports.
- Resource links and teacher guide alignment.

**Done criteria:** Any gaps are listed with severity and assigned to a cleanup pass.

### Priority 4: Build Remaining Lessons

**Goal:** Complete the full 18-lesson curriculum.

**Current scope:** 12 lessons remain after the current six QA lessons.

**Recommended batch model:**

- Batch size: 2-3 lessons.
- Each batch starts with content intake and visual variety assignment.
- Each lesson must pass validator and manual visual QA before moving out of QA.

---

## Completed or Superseded Plans

The following plans are no longer active implementation roadmaps. Keep them for history and process lessons:

- `docs/superpowers/plans/2026-04-14-curriculum-quality-infrastructure.md`
- `docs/superpowers/plans/2026-04-14-lesson-remediation.md`
- `docs/superpowers/plans/2026-04-21-critical-shortfall-remediation.md`

The archived prototype plans under `docs/archive/prototypes/` are not production plans. They may still be used as design inspiration.

---

## Open Planning Gaps

These planned artifacts are still useful but currently missing:

- `SPOKES Builder/component-tracker.md`
- `SPOKES Builder/quality-gate.md`
- `SPOKES Builder/swarm-config.md`

`SPOKES Builder/template-variants.md` is lower priority than the component tracker because the project now relies more heavily on the theme registry, per-lesson remixes, and visual variety tracking.

