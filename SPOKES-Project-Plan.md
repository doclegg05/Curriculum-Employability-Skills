# SPOKES Employability Skills Curriculum -- Project Plan

**Date:** 2026-02-27 (last updated: 2026-03-09)
**Goal:** Deliver 18 interactive HTML lessons built from the SPOKES Builder system
**Current State:** 3 of 18 lessons complete and release-approved; awaiting source materials for lessons 4-6. Phase 1 target extended to June 15, 2026.

---

## Project Summary

| Metric                                   | Value                                                          |
| ---------------------------------------- | -------------------------------------------------------------- |
| Total lessons required                   | 18                                                             |
| Lessons complete (release-approved)      | 3 (Employee Accountability, Time Management, Interview Skills) |
| Lessons remaining to build               | 15                                                             |
| Phase 1 target                           | 6 lessons by June 15, 2026 (3 more needed)                     |
| Template variants needed                 | 3-4 (documented in registry, CSS not yet formalized)           |
| Content teams delivering source material | 6                                                              |
| Build format                             | Single self-contained index.html per lesson                    |
| Source material format                   | PowerPoint + PDFs from human teams                             |

---

## Phase 1: Foundation

**Duration estimate:** 1-2 weeks
**Status:** ~80% complete (as of 2026-03-09)
**Goal:** Stabilize existing work, lock down the template system, and prepare the intake pipeline for the 6 content teams.

### Task 1.1: Fix Time Management Lesson — COMPLETE

**Completed:** 2026-03-01. Lesson release-approved. All 5 quality gates pass. See `docs/qa-reports/` for evidence.

---

### Task 1.2: Fix Interview Skills Lesson — COMPLETE

**Completed:** 2026-03-01. Migrated to `Project_3_Interview-Skills/`. Lesson release-approved. All 5 quality gates pass.

---

### Task 1.3: Define and Document Template Variants — TODO

**Effort:** 4-6 hours
**Status:** Not started. The lesson registry defines 4 allowed variants (`variant-classic`, `variant-modern`, `variant-bold`, `variant-elegant`) but no CSS documentation exists yet.

**Work items:**

- Analyze the 3 completed lessons' CSS patterns to extract variant foundations
- Document each variant's CSS overrides in `SPOKES Builder/template-variants.md`
- Create a variant assignment plan for visual contrast between adjacent lessons

**Definition of done:** 3-4 template variants documented with copy-paste CSS and rotation plan.

**Note:** The combinatorics system (added 2026-03-09 to `AGENT_THEMING_GUIDELINES.md`) now provides additional differentiation via CSS background textures, accent emphasis, and optional per-lesson effects. Template variants are one dimension of the broader combinatorial design approach.

---

### Task 1.4: Create Content Intake Template — COMPLETE

**Completed:** Delivered as `SPOKES Builder/content-intake-template.md`. Ready for distribution to content teams.

---

### Task 1.5: Create Font Pairing Library — TODO

**Effort:** 3-4 hours
**Status:** Not started. No `font-pairings.md` exists yet. Each lesson currently gets ad-hoc font proposals.

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
- [ ] 3-4 template variants documented with CSS and rotation plan
- [x] Content intake template created and ready for distribution
- [ ] Font pairing library curated with 18+ options
- [x] All files organized in `SPOKES Builder/` directory
- [x] Lesson registry (`lesson-registry.json`) tracking active with combinatorics fields
- [x] Combinatorics design system documented in `AGENT_THEMING_GUIDELINES.md`

---

## Phase 2: Pipeline

**Duration estimate:** 1 week
**Status:** Not started (as of 2026-03-09). Blocked on source material availability for lesson #4.
**Goal:** Establish the repeatable, scalable build process so lessons can be produced efficiently in batches. This phase turns the one-off build process into a production pipeline.

### Task 2.1: Build a Pilot Lesson End-to-End Using the New Pipeline

**Effort:** 4-6 hours
**Dependencies:** All Phase 1 tasks complete. Requires one content team to have delivered materials using the intake template.

**Work items:**

- Select one lesson where source materials are ready
- Walk through the full pipeline: intake template review, WIPPEA mapping, template variant selection, font pairing approval, slide building, verification
- Time each step to establish baseline effort estimates
- Document any friction points, missing instructions, or unclear decisions
- Update `build-process.md` with any improvements discovered

**Definition of done:** One new lesson (lesson #4) is built, verified, and delivered. Actual timings recorded for each build phase.

---

### Task 2.2: Create Component Usage Tracker

**Effort:** 1-2 hours
**Dependencies:** All 4 lessons (3 fixed + 1 pilot) must exist.

**Work items:**

- Create a tracking document: `SPOKES Builder/component-tracker.md`
- For each completed lesson, record: which components were used, in what order, which template variant, which font pairing, which accent color emphasis
- This tracker is consulted before each new build to ensure no two adjacent lessons share the same component sequence
- Include a "next lesson recommendations" section that suggests underused components

**Definition of done:** Tracker covers all completed lessons and provides actionable guidance for the next build.

---

### Task 2.3: Configure Team Swarm for Parallel Builds

**Effort:** 2-3 hours
**Dependencies:** Task 2.1 (pilot lesson confirms the pipeline works).

**Work items:**

- Design a Claude Code team configuration for parallel lesson building
- Define agent roles: Lead (coordinates variant/font assignments, reviews output) + Builders (execute the build process)
- Create a CLAUDE.md-level instruction set for builder agents that includes: template variant assignment, font pairing (pre-approved), component tracker consultation
- Define the handoff protocol: what the lead provides to each builder, what the builder delivers back
- Test with a 2-lesson parallel build to validate the swarm approach
- Document in `SPOKES Builder/swarm-config.md`

**Definition of done:** Swarm configuration tested with 2 parallel builds that both pass verification. Protocol documented for production use.

---

### Task 2.4: Establish Quality Gate Process

**Effort:** 1-2 hours
**Dependencies:** Task 2.1 (need a real lesson to define the gate against).

**Work items:**

- Formalize the verification checklist into a structured QA pass/fail document
- Define two review stages:
  1. **Automated checks:** Brand color scan (grep for non-palette hex values), structural validation (sequential data-chapter, required elements present)
  2. **Manual review:** Visual inspection by user, font pairing confirmation, component variety check
- Create a simple bash script or checklist that runs the automated checks against any `index.html`
- Document in `SPOKES Builder/quality-gate.md`

**Definition of done:** Quality gate process documented. Automated check script created and tested against all existing lessons.

---

### Phase 2 Risk Register

| Risk                                                            | Impact                                | Likelihood | Mitigation                                                                    |
| --------------------------------------------------------------- | ------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| Pilot lesson reveals significant gaps in the build process docs | Delays pipeline readiness by 2-3 days | Medium     | Budget extra time in the pilot; treat it as a learning exercise               |
| Swarm builds produce inconsistent quality                       | Rework needed on agent-built lessons  | Medium     | Tight CLAUDE.md instructions; lead agent reviews every output before delivery |
| Content teams deliver materials late or incomplete              | Pipeline idles waiting for input      | High       | Stagger the content requests; always have 2-3 lessons in the intake queue     |

### Phase 2 Definition of Done

- [ ] Pilot lesson #4 built and verified
- [ ] Component usage tracker operational
- [ ] Swarm configuration tested with 2 parallel builds
- [ ] Quality gate process documented with automated checks
- [ ] Build process docs updated with pilot learnings
- [ ] Baseline effort estimate established (hours per lesson)

---

## Phase 3: Production

**Duration estimate:** 4-6 weeks (depends on content team delivery cadence)
**Goal:** Build the remaining 15 lessons in batches, using the pipeline and swarm process established in Phase 2.

### Production Batch Plan

Lessons are built in batches of 3-5, paced by content team delivery. Each batch follows the same workflow.

**Batch structure:**

```
Batch 1: Lessons 5-7    (Week 1-2 of Phase 3)
Batch 2: Lessons 8-10   (Week 2-3 of Phase 3)
Batch 3: Lessons 11-13  (Week 3-4 of Phase 3)
Batch 4: Lessons 14-16  (Week 4-5 of Phase 3)
Batch 5: Lessons 17-18  (Week 5-6 of Phase 3)
```

### Task 3.1: Batch Build Workflow (repeated per batch)

**Effort per lesson:** 3-5 hours (based on Phase 2 baseline)
**Effort per batch of 3:** 9-15 hours total, but parallelizable to 4-6 hours elapsed

**Per-batch workflow:**

1. **Intake review** (30 min per lesson)
   - Verify content intake template is complete for each lesson in the batch
   - Flag any missing fields or unclear content back to the content team
   - Confirm all PDFs/handouts are delivered

2. **Variant and font assignment** (15 min per lesson)
   - Consult component tracker for what has been used recently
   - Assign template variant from the rotation plan
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

**Parallelization:** Within a batch, all 3-5 lessons can be built simultaneously by different agents. The intake review and variant assignment must happen first (serial), but the builds themselves are fully parallel. Quality gate can pipeline -- review lesson 1 while lesson 2 is still building.

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
- Verify template variant distribution is balanced
- Check component variety across the full set
- Run brand color audit across all 18 index.html files
- Compile a curriculum manifest: lesson name, variant, font pairing, slide count, component list

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
- [ ] Template variant distribution is balanced (4-6 lessons per variant)
- [ ] Video placeholder slides are consistent and ready for future replacement

---

## Full Timeline Summary

```
COMPLETED (Feb 27 - Mar 9):
           PHASE 1 (partial)
           - Fixed Time Management + Interview Skills (release-approved Mar 1)
           - Created content intake template
           - Added combinatorics design system
           - Created lesson registry with tracking fields

REMAINING (Mar 9 - Jun 15):
Now:       PHASE 1 (finish infrastructure while awaiting content)
           - Template variants CSS documentation
           - Font pairing library

When content arrives:
           PHASE 2 -- Pipeline
           - Pilot lesson build (#4)
           - Quality gate + component tracking

           LESSONS 5-6
           - Build remaining 2 lessons for Phase 1 target

           BUFFER
           - QA, fixes, final review of all 6 lessons
```

**Estimated remaining effort to reach 6 lessons:**

- Phase 1 finish (variants + fonts): 6-10 hours
- Phase 2 (pilot lesson #4): 4-6 hours
- Lessons 5-6: 8-12 hours
- QA and buffer: 4-6 hours
- **Remaining: ~22-34 hours**

**Original grand total for all 18 lessons: 84-129 hours of build effort**

---

## Dependency Map

```
Phase 1 (all can be parallel):
  [1.1 Fix Time Mgmt]     ----+
  [1.2 Fix Interview]     ----+---> Phase 2 start
  [1.3 Template Variants]  ---+
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
  [Batch 5: 2 lessons in parallel] ---> [QA gate]
  [3.3 Final Curriculum Review]
```

---

---

## Content Intake Template

(Also delivered as a standalone file at `SPOKES Builder/content-intake-template.md`)

See that file for the full template ready for distribution to content teams.
