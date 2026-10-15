# SPOKES Employability Skills Curriculum -- Project Plan

**Date:** 2026-02-27 (last updated: 2026-04-30)
**Goal:** Deliver 18 interactive HTML lessons built from the SPOKES Builder system
**Current State:** 6 of 18 lessons are built and currently tracked as QA in `lesson-registry.json`; 0 lessons are currently tagged Ready in the dashboard. 12 lessons remain to build/add. See `docs/current-roadmap.md` for the active planning snapshot.
> **Current state (September 23, 2026):** the six Phase 1 lessons are out of QA
> and ready for teaching. The program is now in **Phase 2 (Round 2)**: six new
> lessons built with instructor teams, soft target March 2027. See
> `docs/phase-2/` for Round 2 planning and `docs/bespoke/builder-handoff.md` for
> the approved intake/build boundary.
>
> The phase sections below are the original February 2026 build plan and are kept
> for history. Their numbering does not match the program phases: this plan's
> "Phase 2: Pipeline" is not the program's Phase 2 (Round 2).

**Date:** 2026-02-27 (last updated: 2026-09-23)
**Goal:** Deliver 18 interactive HTML lessons built from the SPOKES Builder system
**Current State:** Phase 1 complete: 6 of 18 lessons ready for teaching. Phase 2 (Round 2): 6 lessons in instructor-team planning, soft target March 2027. Lessons 13–18 not yet named.

---

## Project Summary

| Metric                                   | Value                                                          |
| ---------------------------------------- | -------------------------------------------------------------- |
| Total lessons required                   | 18                                                             |
| Lessons currently tagged Ready           | 0                                                              |
| Lessons currently tagged QA              | 6 (Time Management, Interview Skills, Employee Accountability, Communicating with the Public, Controlling Anger, Problem Solving & Decision Making) |
| Lessons remaining to build/add           | 12                                                             |
| Phase 1 target                           | 6 lessons by June 15, 2026 (inventory reached; QA/release decisions still need reconciliation) |
| Template/design variety tracking         | Theme registry active; component tracker still needed          |
| Phase 1 lessons ready for teaching       | 6 (Time Management, Interview Skills, Employee Accountability, Communicating with the Public, Controlling Anger, Problem Solving and Decision Making) |
| Phase 2 (Round 2) lessons in planning    | 6 (Goal Setting, Money Management - Budget, Professionalism and Diversity, Knowing Your Rights in the Workplace, Communicating Assertively, Workplace Ethics) |
| Lessons not yet assigned                 | 6 (lessons 13–18)                                              |
| Phase 2 target                           | Soft target March 2027; no hard deadline                       |
| Template variants needed                 | 3-4 (documented in registry, CSS not yet formalized)           |
| Content teams delivering source material | 6                                                              |
| Build format                             | Single self-contained index.html per lesson                    |
| Source material format                   | PowerPoint + PDFs from human teams                             |

---

## Phase 1: Foundation

**Duration estimate:** 1-2 weeks
**Status:** Foundation substantially complete; current gap is documentation/status reconciliation (as of 2026-04-30)
**Goal:** Stabilize existing work, lock down the template system, and prepare the intake pipeline for the 6 content teams.

### Task 1.1: Fix Time Management Lesson — COMPLETE

**Completed:** 2026-03-01. Lesson release-approved. All 5 quality gates pass. See `docs/qa-reports/` for evidence.

---

### Task 1.2: Fix Interview Skills Lesson — COMPLETE

**Completed:** 2026-03-01. Migrated to `Project_3_Interview-Skills/`. Lesson release-approved. All 5 quality gates pass.

---

### Task 1.3: Define and Document Template Variants — DEPRIORITIZED

**Effort:** 4-6 hours
**Status:** Deprioritized. The lesson registry defines 4 allowed variants (`variant-classic`, `variant-modern`, `variant-bold`, `variant-elegant`), but the project has shifted toward a theme registry plus per-lesson remix approach. A component/visual variety tracker is now more useful than rigid template variant documentation.

**Work items:**

- Analyze the 3 completed lessons' CSS patterns to extract variant foundations
- Document each variant's CSS overrides in `SPOKES Builder/template-variants.md`
- Create a variant assignment plan for visual contrast between adjacent lessons

**Definition of done:** Either document the variants or formally retire this task in favor of `SPOKES Builder/component-tracker.md`.

**Note:** The combinatorics system (added 2026-03-09 to `AGENT_THEMING_GUIDELINES.md`) now provides additional differentiation via CSS background textures, accent emphasis, and optional per-lesson effects. Template variants are one dimension of the broader combinatorial design approach.

---

### Task 1.4: Create Content Intake Template — COMPLETE

**Completed:** Delivered as `SPOKES Builder/content-intake-template.md`. Ready for distribution to content teams.

---

### Task 1.5: Create Font Pairing Library — COMPLETE

**Completed:** 2026-04-02. Library created at `SPOKES Builder/font-pairings.md` with 20 curated pairings (18 available for remaining lessons).

**Work items:**

- Curate 18-20 Google Font pairings (heading + body), each visually distinct
- Organize into `SPOKES Builder/font-pairings.md` with import URLs and mood/style tags
- Mark the 3 pairings already used by the completed lessons

**Definition of done:** Library contains 18+ curated pairings ready for user selection during lesson builds.

---

### Phase 1 Risk Register

| Risk                                                                                  | Impact                                        | Likelihood | Mitigation                                                                                       |
| ------------------------------------------------------------------------------------- | --------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------ |
| Time Management or Interview Skills have deep structural issues beyond cosmetic fixes | Adds 1-2 days to Phase 1                      | Medium     | Scope the audit first; if rebuild is faster than repair, rebuild from template                   |
| Template variants are too similar, not providing enough visual contrast               | Lessons look repetitive across the curriculum | Low        | Test variants side-by-side before finalizing; get user sign-off on at least 3 distinct variants  |
| Content teams do not adopt the intake template                                        | Unstructured input continues, slowing builds  | High       | Keep the template simple; provide a filled-out example; get team lead buy-in before distributing |

### Phase 1 Definition of Done

- [x] All 3 existing lessons pass the full verification checklist (release-approved 2026-03-01)
- [ ] Component/visual variety tracker created, or template variants formally documented/retired
- [x] Content intake template created and ready for distribution
- [x] Font pairing library curated with 18+ options (completed 2026-04-02)
- [x] All files organized in `SPOKES Builder/` directory
- [x] Lesson registry (`lesson-registry.json`) tracking active with combinatorics fields
- [x] Combinatorics design system documented in `AGENT_THEMING_GUIDELINES.md`

---

## Phase 2: Pipeline

**Duration estimate:** 1 week
**Status:** Partially complete by current project state. Six lessons exist and are tagged QA; pipeline documentation still needs consolidation.
**Goal:** Establish the repeatable, scalable build process so the remaining 12 lessons can be produced efficiently in batches. This phase turns the one-off build process into a production pipeline.

### Task 2.1: Build a Pilot Lesson End-to-End Using the New Pipeline — SUPERSEDED

**Effort:** 4-6 hours
**Status:** Superseded by current state. Six lessons now exist, so the remaining value is to capture pipeline lessons learned rather than build a legacy pilot lesson.
**Dependencies:** Current six-lesson QA set exists.

**Work items:**

- Select one of the six current lessons as the pipeline baseline
- Walk through the full pipeline retrospectively: intake template review, WIPPEA mapping, visual variety assignment, font pairing approval, slide building, verification
- Time each step to establish baseline effort estimates
- Document any friction points, missing instructions, or unclear decisions
- Update `build-process.md` with any improvements discovered

**Definition of done:** Pipeline notes and actual timing assumptions are documented for future lesson builds.

---

### Task 2.2: Create Component Usage Tracker

**Effort:** 1-2 hours
**Dependencies:** Current six-lesson QA set exists.

**Work items:**

- Create a tracking document: `SPOKES Builder/component-tracker.md`
- For each current lesson, record: dominant layouts, interaction types, visual motifs, font pairing, and accent strategy
- This tracker is consulted before each new build to ensure no two adjacent lessons share the same component sequence
- Include a "next lesson recommendations" section that suggests underused components

**Definition of done:** Tracker covers all completed lessons and provides actionable guidance for the next build.

---

### Task 2.3: Configure Team Swarm for Parallel Builds

**Effort:** 2-3 hours
**Dependencies:** Component tracker and QA gate process.

**Work items:**

- Design a Claude Code team configuration for parallel lesson building
- Define agent roles: Lead (coordinates visual variety/font assignments, reviews output) + Builders (execute the build process)
- Create a CLAUDE.md-level instruction set for builder agents that includes theme assignment, font pairing (pre-approved), component tracker consultation
- Define the handoff protocol: what the lead provides to each builder, what the builder delivers back
- Test with a 2-lesson parallel build to validate the swarm approach
- Document in `SPOKES Builder/swarm-config.md`

**Definition of done:** Swarm configuration tested with 2 parallel builds that both pass verification. Protocol documented for production use.

---

### Task 2.4: Establish Quality Gate Process

**Effort:** 1-2 hours
**Dependencies:** Current six-lesson QA set exists.

**Work items:**

- Formalize the verification checklist into a structured QA pass/fail document
- Define two review stages:
  1. **Automated checks:** Brand color scan (grep for non-palette hex values), structural validation (sequential data-chapter, required elements present)
  2. **Manual review:** Visual inspection by user, font pairing confirmation, component variety check
- Create a simple bash script or checklist that runs the automated checks against any `index.html`
- Document in `docs/release-checklist.md`

**Definition of done:** Quality gate process documented. Automated check script created and tested against all existing lessons.

---

### Phase 2 Risk Register

| Risk                                                            | Impact                                | Likelihood | Mitigation                                                                    |
| --------------------------------------------------------------- | ------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| Pilot lesson reveals significant gaps in the build process docs | Delays pipeline readiness by 2-3 days | Medium     | Budget extra time in the pilot; treat it as a learning exercise               |
| Swarm builds produce inconsistent quality                       | Rework needed on agent-built lessons  | Medium     | Tight CLAUDE.md instructions; lead agent reviews every output before delivery |
| Content teams deliver materials late or incomplete              | Pipeline idles waiting for input      | High       | Stagger the content requests; always have 2-3 lessons in the intake queue     |

### Phase 2 Definition of Done

- [ ] Six-lesson QA evidence reconciled
- [ ] Component usage tracker operational
- [ ] Swarm configuration tested with 2 parallel builds
- [ ] Quality gate process documented with automated checks
- [ ] Build process docs updated with pilot learnings
- [ ] Baseline effort estimate established (hours per lesson)

---

## Phase 3: Production

**Duration estimate:** 4-6 weeks (depends on content team delivery cadence)
**Goal:** Build the remaining 12 lessons in batches, using the pipeline and QA process established in Phase 2.

### Production Batch Plan

Lessons are built in batches of 2-3, paced by content team delivery. Each batch follows the same workflow.

**Batch structure:**

```
Batch 1: Lessons 7-9     (Week 1-2 of Phase 3)
Batch 2: Lessons 10-12   (Week 2-3 of Phase 3)
Batch 3: Lessons 13-15   (Week 3-4 of Phase 3)
Batch 4: Lessons 16-18   (Week 4-5 of Phase 3)
```

### Task 3.1: Batch Build Workflow (repeated per batch)

**Effort per lesson:** 3-5 hours (based on Phase 2 baseline)
**Effort per batch of 3:** 9-15 hours total, but parallelizable to 4-6 hours elapsed

**Per-batch workflow:**

1. **Intake review** (30 min per lesson)
   - Verify content intake template is complete for each lesson in the batch
   - Flag any missing fields or unclear content back to the content team
   - Confirm all PDFs/handouts are delivered

2. **Visual variety and font assignment** (15 min per lesson)
   - Consult component tracker for what has been used recently
   - Assign theme package, dominant layout pattern, and interaction mix
   - Select font pairing from the library; get user approval for all lessons in the batch at once

3. **Parallel build** (2-4 hours per lesson, 2-3 in parallel)
   - Each builder agent receives: intake template content, assigned variant, approved font pairing, component recommendations from tracker
   - Builder follows the 10-step process from CLAUDE.md
   - Builder runs the automated quality checks before submitting

4. **Quality gate** (30-60 min per lesson)
   - Lead runs automated brand color scan and structural checks
   - Lead reviews for component variety against tracker
   - User does visual review and sign-off

5. **Delivery and tracking** (15 min per lesson)
   - Update component tracker with new lesson's data
   - Move lesson folder to the curriculum root
   - Update any curriculum-wide index or catalog

**Parallelization:** Within a batch, all 2-3 lessons can be built simultaneously by different agents. The intake review and visual variety assignment must happen first (serial), but the builds themselves are fully parallel. Quality gate can pipeline -- review lesson 1 while lesson 2 is still building.

---

### Task 3.2: Video Integration Pass (deferred)

**Effort:** 1-2 hours per lesson once video files are available
**Dependencies:** Curriculum designer provides MP4 video files for each lesson's video topics.

**Work items:**

- For each lesson, download the video to the `videos/` folder.
- Replace `.video-placeholder` divs with standard HTML5 `<video>` tags pointing to the local files.
- Verify videos load and display correctly
- This is a separate pass that can happen after all 18 lessons are structurally complete

**Note:** This task is explicitly deferred. All lessons ship with placeholder videos initially.

---

### Task 3.3: Final Curriculum Review

**Effort:** 4-6 hours
**Dependencies:** All 18 lessons built and individually verified.

**Work items:**

- Open all 18 lessons side by side (or in sequence)
- Verify visual variety: no two adjacent lessons look the same
- Confirm each lesson has a unique font pairing
- Verify theme packages, dominant layouts, and interaction patterns are balanced
- Check component variety across the full set
- Run brand color audit across all 18 index.html files
- Compile a curriculum manifest: lesson name, theme package, font pairing, slide count, component list, dominant layout pattern

**Definition of done:** All 18 lessons verified as a cohesive but visually diverse curriculum. Manifest document created.

---

### Phase 3 Risk Register

| Risk                                                                                         | Impact                                          | Likelihood | Mitigation                                                                                |
| -------------------------------------------------------------------------------------------- | ----------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------- |
| Content teams deliver materials unevenly -- some batches have 5 lessons ready, others have 0 | Pipeline alternates between idle and overloaded | High       | Work with content teams to stagger delivery; maintain a backlog of at least 1 batch ahead |
| Font pairing approval becomes a bottleneck (user must approve each one)                      | Builds wait on approval                         | Medium     | Batch the approvals: present 3-5 font pairings at once for a whole batch                  |
| Component variety degrades as more lessons are built                                         | Later lessons feel repetitive                   | Medium     | Consult component tracker before every build; deliberately assign underused components    |
| A late-stage lesson requires a structural change to the template                             | Ripples back to already-completed lessons       | Low        | Freeze the template after Phase 2; any changes require explicit impact assessment         |
| Agent-built lessons have subtle quality issues that pass automated checks                    | Inconsistent student experience                 | Medium     | User visual review on every lesson; spot-check 3 random slides per lesson at minimum      |

### Phase 3 Definition of Done

- [ ] All 18 lessons built, individually verified, and delivered
- [ ] Component tracker complete for all 18 lessons
- [ ] Curriculum manifest compiled
- [ ] No brand color violations across any lesson
- [ ] Each lesson has a unique, approved font pairing
- [ ] Theme packages and dominant layouts are visibly varied across adjacent lessons
- [ ] Video placeholder slides are consistent and ready for future replacement

---

## Full Timeline Summary

```
COMPLETED / HISTORICAL (Feb 27 - Apr 30):
           PHASE 1 foundation
           - Fixed early Time Management + Interview Skills issues
           - Created content intake template
           - Added combinatorics design system
           - Created lesson registry with tracking fields
           - Reached 6-lesson QA inventory

CURRENT (Apr 30 onward):
           STATUS RECONCILIATION
           - Align registry quality gates, dashboard status, and QA evidence
           - Create component/visual variety tracker

When content arrives:
           PHASE 3 -- Production
           - Build remaining 12 lessons in batches of 2-3
           - Run validator and manual visual QA for each batch

           BUFFER
           - QA, fixes, final review of all 18 lessons
```

**Estimated remaining effort from current state:**

- QA evidence reconciliation: 4-8 hours
- Component/visual variety tracker: 2-4 hours
- Remaining 12 lessons: 36-60 hours
- Final curriculum review and buffer: 6-10 hours
- **Remaining: ~48-82 hours**

**Original grand total for all 18 lessons: 84-129 hours of build effort**

---

## Dependency Map

```
Phase 1 (all can be parallel):
  [1.1 Fix Time Mgmt]     ----+
  [1.2 Fix Interview]     ----+---> Phase 2 start
  [1.3 Visual Variety]     ---+
  [1.4 Content Intake]    ---------> Distribute to 6 teams immediately
  [1.5 Font Library]      ---------> Available for all future builds

Phase 2 (mostly serial):
  [2.1 Pilot Build] ---> [2.2 Component Tracker] ---> [2.3 Swarm Config]
                    \---> [2.4 Quality Gate]

Phase 3 (batched parallel):
  [Batch 1: 3 lessons in parallel] ---> [QA gate]
  [Batch 2: 3 lessons in parallel] ---> [QA gate]
  [Batch 3: 3 lessons in parallel] ---> [QA gate]
  [Batch 4: 3 lessons in parallel] ---> [QA gate]
  [3.3 Final Curriculum Review]
```

---

---

## Content Intake Template

(Also delivered as a standalone file at `SPOKES Builder/content-intake-template.md`)

See that file for the full template ready for distribution to content teams.
