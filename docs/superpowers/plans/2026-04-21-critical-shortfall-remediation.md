# Critical Shortfall Remediation — Agent Team Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` to execute this plan. Each Wave-1 task is independent and runs in its own subagent. Steps use checkbox (`- [ ]`) syntax for tracking.

**Source review:** Accessibility review + code review run 2026-04-21 against `feat/design-system-strengthening` (merge-base `a4b5a1c`).

**Goal:** Close all 11 CRITICAL findings — 8 lesson accessibility barriers + 3 validator false-negative gaps — so the branch can merge without shipping keyboard-locked lessons or a validator that gives false confidence.

**Architecture:** Per-file ownership, maximum parallelism. Each problematic lesson file gets a dedicated subagent. The Python validator (single file) gets its own subagent. No two agents touch the same file. Pattern source of truth is `SPOKES-STANDARD.md` Section 5; two already-correct lessons (EA, IS) are the cross-reference.

**Required reading for every executor:** `SPOKES-STANDARD.md` (per project `CLAUDE.md` directive).

---

## Lesson Abbreviations

| Short | Full Path | Status |
|---|---|---|
| CWP | `lesson-communicating-with-the-public/index.html` | 4 CRITICALs |
| CA  | `lesson-controlling-anger/index.html` | 6 CRITICALs |
| TM  | `lesson-time-management/index.html` | 3 CRITICALs |
| PSDM | `lesson-problem-solving-and-decision-making/index.html` | 5 CRITICALs |
| EA  | `lesson-employee-accountability/index.html` | reference (correct pattern) |
| IS  | `lesson-interview-skills/index.html` | reference (correct pattern) |
| DASH | `Dashboard.html` | 1 CRITICAL |
| VAL | `scripts/validate-lesson.py` | 3 CRITICAL gaps |

---

## CRITICAL Findings Matrix

| # | Finding | CWP | CA | TM | PSDM | DASH |
|---|---|:-:|:-:|:-:|:-:|:-:|
| A11Y-CR1 | `<span>` prev/next nav (not keyboard-operable) | X | X | X | X | — |
| A11Y-CR2 | `<div>` accordion headers (no `tabindex`/keydown) | X | X | — | — | — |
| A11Y-CR3 | Slide announcer omits title | X | X | — | X | — |
| A11Y-CR4 | Keydown guard misses `[role="tab"]` (Space double-fires) | X | X | X | X | — |
| A11Y-CR5 | Swipe bound to `document`, not `.main` | X | X | X | X | — |
| A11Y-CR6 | No skip link | — | — | — | — | X |
| A11Y-CR7 | `confettiTriggered` guard missing (re-fires on back-nav) | — | X | — | X | — |
| A11Y-CR8 | CC toggle `min-height: 32px` (needs 44px) | — | — | — | X | — |

| # | Validator Finding | File:Line |
|---|---|---|
| VAL-CR1 | A11Y-07 uses total `<track>` count, not per-video | `validate-lesson.py:461` |
| VAL-CR2 | CLR-05/06 regex misses comma-grouped selectors | `validate-lesson.py:251` |
| VAL-CR3 | CLR-02 ignores inline `style=` attributes | `validate-lesson.py:230` |

---

## Team Composition

| Agent | Type | Scope | Runs In |
|---|---|---|---|
| **Scout** | `Explore` | Extract canonical patterns from SPOKES-STANDARD §5 + cross-check EA + IS. Write `docs/superpowers/patterns/2026-04-21-nav-patterns.md`. | Wave 0 (serial prep) |
| **Fixer-VAL** | `python-developer` | Fix 3 validator false negatives + add regression tests | Wave 1 (parallel) |
| **Fixer-CWP** | `general-purpose` | CWP lesson | Wave 1 (parallel) |
| **Fixer-CA** | `general-purpose` | CA lesson | Wave 1 (parallel) |
| **Fixer-TM** | `general-purpose` | TM lesson | Wave 1 (parallel) |
| **Fixer-PSDM** | `general-purpose` | PSDM lesson (heaviest: 5 criticals + CSS fix) | Wave 1 (parallel) |
| **Fixer-DASH** | `general-purpose` | Dashboard skip link | Wave 1 (parallel) |
| **Verifier** | `test-engineer` | Run validator + smoke test keyboard nav in Playwright | Wave 2 (serial) |
| **Reviewer-A11Y** | `accessibility-reviewer` | Re-check all 8 A11Y-CR items resolved | Wave 3 (parallel) |
| **Reviewer-Code** | `code-reviewer` | Re-check validator changes sound | Wave 3 (parallel) |

**Parallelism:** Wave 1 launches 6 agents simultaneously. No two touch the same file. Expected wall-clock ≈ the longest single agent (PSDM, ~25 min) vs. ~3 hours serial.

---

## Wave Diagram

```
Wave 0 (serial prep, ~10 min)
    └── Scout → patterns doc

Wave 1 (parallel, ~25 min — runtime = longest agent)
    ├── Fixer-VAL   (validate-lesson.py + test_validator.py)
    ├── Fixer-CWP   (CWP only)
    ├── Fixer-CA    (CA only)
    ├── Fixer-TM    (TM only)
    ├── Fixer-PSDM  (PSDM only — heaviest)
    └── Fixer-DASH  (Dashboard.html only)

Wave 2 (serial verification, ~15 min)
    └── Verifier → full validator sweep + Playwright smoke

Wave 3 (parallel review, ~20 min)
    ├── Reviewer-A11Y
    └── Reviewer-Code

Wave 4 (serial, human gate)
    └── Instructor reviews + merges
```

---

## Wave 0 — Pattern Extraction

- [ ] **Scout** reads `SPOKES-STANDARD.md` §5 (Navigation Engine) in full
- [ ] **Scout** extracts from EA + IS the *working* implementations of each fix target:
  - `<button>` prev/next pattern with `aria-label`
  - `<button role>` accordion header with keydown guard
  - Announcer string format: `"Slide X of Y: <title>"`
  - Keydown early-return chain (TEXTAREA, INPUT, `[role="tab"]`, `[contenteditable]`)
  - Swipe scoped to `.main` with `{ passive: true }`
  - Skip link markup + CSS
  - `confettiTriggered` module-scoped boolean + guard
  - `.cc-toggle { min-width: 44px; min-height: 44px; }`
- [ ] **Scout** writes `docs/superpowers/patterns/2026-04-21-nav-patterns.md` — one heading per pattern, a minimal correct snippet under each, plus "where EA/IS does it" line number refs

**Exit:** Pattern doc exists and every Wave-1 executor can copy-paste from it without reading other lesson files.

---

## Wave 1 — Parallel Remediation

### Task A — Fixer-VAL

File: `scripts/validate-lesson.py` + `scripts/test_validator.py`

- [ ] Fix VAL-CR1: replace total-count A11Y-07 with per-video check (regex over raw HTML, match `<video>...</video>` with `<track kind="captions">` child)
- [ ] Fix VAL-CR2: change `\.gold\s*\{` → `\.gold[^{]*\{` for CLR-05; same treatment for CLR-06's `.accent`
- [ ] Fix VAL-CR3: add inline-`style=` attribute scan to CLR-02's hex detector
- [ ] Add test fixtures exercising each gap: `minimal-fail.html` gains one 2-video block with tracks all on video 1; one comma-grouped selector; one inline-style hex
- [ ] Add 3 new test cases to `test_validator.py` — one per fix, asserting FAIL is raised where previously it silently passed
- [ ] Run `pytest scripts/test_validator.py -v` — all tests pass
- [ ] Hand off diff for code review in Wave 3

**Exit:** All 3 new tests pass. Existing tests still pass. No changes outside `scripts/`.

---

### Task B — Fixer-CWP

File: `lesson-communicating-with-the-public/index.html` only.

- [ ] Apply A11Y-CR1: `<span class="key-icon" onclick=...>` prev/next → `<button type="button" class="key-icon" aria-label="...">` (copy from EA)
- [ ] Apply A11Y-CR2: accordion `<div>` headers → `<button class="accordion-header" type="button">` (copy from EA)
- [ ] Apply A11Y-CR3: update `announcer.textContent` to include current slide heading text
- [ ] Apply A11Y-CR4: add `if (e.target.closest('[role="tablist"]')) return;` to keydown early-return
- [ ] Apply A11Y-CR5: `document.addEventListener("touchstart"...)` → `document.querySelector('.main').addEventListener(..., { passive: true })`
- [ ] Run `python scripts/validate-lesson.py lesson-communicating-with-the-public/index.html --caption-grace` — 0 FAIL
- [ ] Hand off

**Exit:** Validator returns 0 FAIL. Manual smoke (Tab through slides using keyboard only) reaches every interactive element.

---

### Task C — Fixer-CA

File: `lesson-controlling-anger/index.html` only.

- [ ] Apply A11Y-CR1 (same fix as CWP)
- [ ] Apply A11Y-CR2 (same)
- [ ] Apply A11Y-CR3 (same)
- [ ] Apply A11Y-CR4 (same)
- [ ] Apply A11Y-CR5 (same)
- [ ] Apply A11Y-CR7: declare `let confettiTriggered = false;` at script module scope; guard `triggerConfetti()` call in `showSlide()` so it only fires once
- [ ] Run validator — 0 FAIL
- [ ] Hand off

**Exit:** Validator 0 FAIL. Navigate back through closing slide — confetti fires exactly once, never again.

---

### Task D — Fixer-TM

File: `lesson-time-management/index.html` only.

- [ ] Apply A11Y-CR1
- [ ] Apply A11Y-CR4
- [ ] Apply A11Y-CR5
- [ ] Run validator — 0 FAIL
- [ ] Hand off

**Exit:** Validator 0 FAIL. Keyboard-only nav completes lesson end-to-end.

---

### Task E — Fixer-PSDM

File: `lesson-problem-solving-and-decision-making/index.html` only. **Largest scope — 5 criticals + CSS fix.**

- [ ] Apply A11Y-CR1
- [ ] Apply A11Y-CR3
- [ ] Apply A11Y-CR4
- [ ] Apply A11Y-CR5
- [ ] Apply A11Y-CR7 (same as CA)
- [ ] Apply A11Y-CR8: `.cc-toggle` block at ~line 1140 → `min-height: 44px` (was 32px); adjust padding if needed to preserve visual weight
- [ ] Renumber slide comments 10+ (separately flagged MEDIUM in review — opportunistic cleanup in same file)
- [ ] Run validator — 0 FAIL
- [ ] Hand off

**Exit:** Validator 0 FAIL. CC toggle inspected in DevTools — computed height ≥ 44px at all viewport widths.

---

### Task F — Fixer-DASH

File: `Dashboard.html` only.

- [ ] Apply A11Y-CR6: add `<a href="#dashboardGrid" class="skip-link">Skip to lessons</a>` as first child of `<body>`
- [ ] Add `.skip-link` CSS (copy pattern from EA/IS via Scout's doc):
  ```css
  .skip-link { position: absolute; top: -40px; left: 0; background: var(--dark); color: var(--light); padding: 8px 16px; z-index: 10000; }
  .skip-link:focus { top: 0; }
  ```
- [ ] Verify the module grid has `id="dashboardGrid"` (add if missing)
- [ ] Declare `--font-heading` + `--font-body` in Dashboard `:root`; replace hardcoded `'DM Serif Display'` with `var(--font-heading)` in `.module-name` (MEDIUM finding bundled — single-file scope)
- [ ] Hand off

**Exit:** Tab from page load → first Tab focuses "Skip to lessons" link → Enter jumps focus past header to module grid.

---

## Wave 2 — Verification

- [ ] **Verifier** runs `python scripts/validate-lesson.py <lesson>/index.html --caption-grace` across all 6 lessons; records 0 FAIL per lesson
- [ ] **Verifier** runs `pytest scripts/test_validator.py -v`; records all pass including 3 new tests
- [ ] **Verifier** launches Playwright against each lesson index.html served locally; tests:
  - Tab order: reaches skip link → nav buttons → tabs → accordion headers → textareas
  - Enter on prev/next nav buttons navigates slides
  - Enter/Space on accordion headers toggles open/closed
  - Space key while focused on a tab button does NOT also advance slide
  - Closing slide confetti fires once, never re-fires on navigation back-and-forth
- [ ] **Verifier** writes `docs/verification-2026-04-21.md` — one checkbox per CRITICAL finding, ✔ or ✗

**Exit:** All 11 CRITICAL findings check ✔ in the verification doc. Any ✗ loops back to the owning Wave-1 agent.

---

## Wave 3 — Parallel Review

- [ ] **Reviewer-A11Y** re-runs accessibility review scoped to the 8 A11Y-CR items; confirms each is resolved or flags remaining issues
- [ ] **Reviewer-Code** re-reviews `validate-lesson.py` diff; confirms the 3 fixes are correct and the new tests genuinely exercise them (not tautological)
- [ ] Both reviewers post findings to `docs/review-2026-04-21.md`

**Exit:** No new CRITICAL or HIGH findings introduced. Any MEDIUM findings go to a follow-up ticket, not this branch.

---

## Wave 4 — Human Gate

- [ ] Instructor reads `verification-2026-04-21.md` + `review-2026-04-21.md`
- [ ] Decision: squash-merge to main, rebase-merge, or request revisions
- [ ] If merging: branch deletes, next milestone starts on main

---

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Two agents edit overlapping CSS in shared stylesheet | No shared stylesheet — every lesson is self-contained HTML. Confirmed via grep. |
| Pattern doc drifts from EA/IS reality during Wave 1 | Scout cites line numbers. Executors verify snippet matches source before copying. |
| Validator fixes break existing tests | Fixer-VAL runs full pytest suite before handoff. |
| Playwright smoke flaky on Windows | Verifier runs each test 3 times; any flake triggers manual verification in browser. |
| Hook (`PostToolUse` validator) blocks Wave-1 edits mid-flight | Each fix converges monotonically to 0 FAIL — hook only blocks on regression, which is the desired behavior. |
| Navigation engine "do not modify directly" rule in project CLAUDE.md | Fixes are per-lesson instantiations of the pattern, not edits to the abstract engine. Scout's doc is derived from SPOKES-STANDARD §5 (authoritative). |

---

## Out of Scope

- All HIGH findings (sidebar `aria-expanded`, progress bar ARIA, hover instruction text, gold contrast on labels, API timeout, two-lesson-lists dead code, etc.) → separate follow-up plan
- All MEDIUM findings except the two bundled opportunistically (PSDM slide renumber, DASH font var) → separate follow-up plan
- Splitting `validate-lesson.py` to meet 800-line limit → separate refactor
- Replacing subprocess-based tests with in-process for `pytest --cov` → separate refactor
- New lesson remediation (this is existing-lesson repair, not new content)

---

## Success Criteria (exit checklist)

- [ ] All 11 CRITICAL findings verified ✔ in `docs/verification-2026-04-21.md`
- [ ] Validator returns 0 FAIL across all 6 lessons
- [ ] `pytest scripts/test_validator.py -v` — all tests pass
- [ ] Playwright smoke covers keyboard-only navigation through one full lesson
- [ ] Wave-3 reviewers found no new CRITICAL or HIGH issues
- [ ] Branch diff contains only the changes described in this plan (no scope creep)

---

## Execution Command (when ready)

```
/gsd-execute-phase --plan docs/superpowers/plans/2026-04-21-critical-shortfall-remediation.md
```

Or manual dispatch via the `Agent` tool, one call per Wave-1 task, all in a single message for true parallelism.
