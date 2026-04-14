# SPOKES Curriculum Quality Standard — Design Spec

**Date:** 2026-04-14
**Status:** Draft — pending user review
**Goal:** Consolidate scattered design instructions into a single authoritative spec, enforce compliance via automated validation, and remediate all quality gaps found across 6 lessons.

---

## Problem Statement

Six deep-dive audits across all 6 SPOKES lessons revealed:

1. **Scattered instructions** — Design rules are spread across 8+ documents (brand-palette.md, STYLING-GUIDE.md, GUARDRAILS.md, CLAUDE.md, design-system-strengthening spec, repo-standards.md, and inline CSS comments). No single source of truth.
2. **Two-tier accessibility** — 3 lessons (Employee Accountability, Time Management, Interview Skills) have substantial ARIA, keyboard, and screen reader support. 3 lessons (Communicating, Controlling Anger, Problem Solving) have zero ARIA attributes, zero tabindex, zero role attributes.
3. **18 of 23 videos lack captions** — WCAG 1.2.2 violation.
4. **Flip cards broken on mobile** in 4 of 6 lessons — hover-only CSS, no click/tap handler.
5. **Zero session persistence** — no localStorage or sessionStorage in any lesson. Page refresh restarts from slide 0.
6. **Three incompatible navigation engine generations** across 6 lessons with different function signatures, feature sets, and syntax.
7. **Design system drift** — rogue `#c9a74a` color, inconsistent font variable usage, inconsistent WCAG contrast fixes, divergent confetti implementations.
8. **0-1 checkpoints per lesson** — WIPPEA methodology requires distributed formative checks.
9. **Most videos have no follow-up discussion prompt** — Time Management has 5 videos with zero.
10. **Inconsistent reduced-motion support** — comprehensive in 3 lessons, partial or missing in 3.
11. **Zero dark mode** (5 of 6 lessons) and **zero print stylesheets** (all 6).
12. **Undersized tap targets** — sidebar toggle is 36x36px across all lessons (WCAG minimum is 44x44px).

---

## Architecture: Layered Enforcement

```
CLAUDE.md (project root)           <- Agent entry point (always loaded)
  | references
SPOKES-STANDARD.md                 <- Full authoritative spec (~55 rules)
  | enforced by
scripts/validate-lesson.py         <- Automated checks (Python stdlib)
  | triggered by
.claude/settings.local.json        <- PostToolUse hook on lesson file writes
```

### CLAUDE.md (Project Root)

Becomes the agent entry point. Contains:
- `MUST read SPOKES-STANDARD.md` directive as the first instruction
- File organization rules (existing, preserved)
- Summary of lesson modification constraints
- Note that the validator runs automatically on every file write

### SPOKES-STANDARD.md

The single authoritative spec for all SPOKES lesson requirements. Replaces and absorbs content from 6 scattered documents. Structured as 10 sections, each containing rules in the format:

```
RULE-ID: Testable requirement statement
SEVERITY: CRITICAL | WARN | INFO
RATIONALE: Why this rule exists
```

### scripts/validate-lesson.py

Python script (stdlib only — html.parser + regex) that:
- Parses a lesson HTML file
- Checks every testable rule from SPOKES-STANDARD.md
- Outputs per-rule PASS/FAIL/WARN with line numbers
- Exits 0 on success (WARN is acceptable), exits 1 on any CRITICAL failure

Interface: `python scripts/validate-lesson.py lesson-time-management/index.html`

Output format:
```
[PASS] CLR-01  :root declares 11 canonical CSS variables
[FAIL] CLR-05  .slide .gold uses var(--gold) instead of var(--muted-gold) — line 397
[WARN] TYP-03  Hardcoded font name found — line 412
...
SUMMARY: 38 PASS | 4 WARN | 3 FAIL (CRITICAL)
EXIT CODE: 1
```

Does NOT check: visual rendering, actual contrast ratio computation, content quality, theme registry compliance.

### PostToolUse Hook

Fires after Write or Edit to `lesson-*/index.html`:
- Runs `python scripts/validate-lesson.py` against the written file path
- The exact hook configuration syntax will be determined during implementation based on Claude Code's PostToolUse hook API (file path may be available via environment variable or parsed from hook event data)
- Blocking: true — agent must fix CRITICAL violations before proceeding
- Latency: under 1 second (pure stdlib Python on ~3000-line files)
- Scope: Only lesson HTML files — does not fire on prototypes, docs, or builder assets

---

## SPOKES-STANDARD.md — Full Rule Inventory

### Section 1: Color System

Absorbed from: `SPOKES Builder/brand-palette.md`, `lesson-communicating-with-the-public/STYLING-GUIDE.md`

| Rule ID | Rule | Severity |
|---------|------|----------|
| CLR-01 | `:root` must declare exactly 11 CSS variables with canonical hex values: `--primary: #007baf`, `--accent: #37b550`, `--dark: #004071`, `--light: #ffffff`, `--muted: #edf3f7`, `--gray: #60636b`, `--gold: #d3b257`, `--royal: #00133f`, `--mauve: #a7253f`, `--offwhite: #d1d3d4`, `--muted-gold: #ad8806` | CRITICAL |
| CLR-02 | No hex color outside `:root` unless it matches one of the 11 canonical values | CRITICAL |
| CLR-03 | `#c9a74a` and any other undocumented color is prohibited | CRITICAL |
| CLR-04 | Opacity variations of canonical colors via `rgba()` are permitted | INFO |
| CLR-05 | `.slide .gold` must resolve to `var(--muted-gold)`, never `var(--gold)` | CRITICAL |
| CLR-06 | `.slide .accent` must resolve to `var(--dark)`, never `var(--accent)` for text on light backgrounds | CRITICAL |
| CLR-07 | Confetti color arrays must read from CSS variables via `getComputedStyle`, not hardcode hex | WARN |
| CLR-08 | Prohibited colors from brand-palette.md (bright reds, oranges, purples, off-palette grays/blues) must not appear anywhere in the file | CRITICAL |

### Section 2: Typography

Absorbed from: STYLING-GUIDE.md type scale, CLAUDE.md font rules

| Rule ID | Rule | Severity |
|---------|------|----------|
| TYP-01 | `:root` must declare `--font-heading: "DM Serif Display", serif` and `--font-body: "Outfit", sans-serif` | CRITICAL |
| TYP-02 | Lesson-specific font overrides go in `<style id="theme-override">`, never in `:root` | CRITICAL |
| TYP-03 | All heading selectors (`.slide h2`, `.card h4`, etc.) must use `var(--font-heading)`, not hardcoded font names | WARN |
| TYP-04 | All body selectors must use `var(--font-body)`, not hardcoded font names | WARN |
| TYP-05 | Google Fonts links must include `display=swap` | WARN |

### Section 3: Accessibility

New section — not in any existing document. Derived from audit findings across all 6 lessons. Reference implementations: Employee Accountability (ARIA), Time Management (captions), Interview Skills (skip link, flip cards).

| Rule ID | Rule | Severity |
|---------|------|----------|
| A11Y-01 | Tabs must use `role="tablist"`, `role="tab"`, `role="tabpanel"`, `aria-selected`, `aria-controls` | CRITICAL |
| A11Y-02 | Accordions must use `aria-expanded`, `aria-controls`, and respond to Enter/Space key | CRITICAL |
| A11Y-03 | Flip cards must have click handler, keydown handler (Enter/Space), `tabindex="0"`, and `aria-expanded` | CRITICAL |
| A11Y-04 | A skip navigation link must be the first focusable element in `<body>` | CRITICAL |
| A11Y-05 | An `aria-live="polite"` announcer region must exist and announce slide changes as "Slide X of Y: [title]" | CRITICAL |
| A11Y-06 | All `<video>` elements must have an `aria-label` describing the content | WARN |
| A11Y-07 | All `<video>` elements must have a `<track kind="captions">` with a VTT file | CRITICAL |
| A11Y-08 | `<nav>` elements must have `aria-label` | WARN |
| A11Y-09 | Navigation prev/next controls must be `<button>` elements, not `<span>` | CRITICAL |
| A11Y-10 | Progress bar must have `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax` | WARN |
| A11Y-11 | All `<img>` must have `alt`. Decorative images must use `alt="" aria-hidden="true"` | WARN |
| A11Y-12 | `:focus-visible` styles must exist on all interactive elements | CRITICAL |

### Section 4: Components

Absorbed from: STYLING-GUIDE.md component catalog, CLAUDE.md component selection guide

| Rule ID | Rule | Severity |
|---------|------|----------|
| CMP-01 | Tab buttons must use class `tab-btn` (not `qa-tab-btn` or variants) | WARN |
| CMP-02 | Accordion items must use class `accordion-*` (not `qa-accordion-*` or variants) | WARN |
| CMP-03 | Lesson-specific components (Jeopardy, spin wheel, etc.) are permitted but must be documented in this spec before use in new lessons | INFO |

### Section 5: Navigation Engine (Generation D — Canonical)

New section — replaces three incompatible implementations. Generation D merges the best features:
- ES6 syntax (from Gen B/C)
- View Transitions API with graceful fallback (from Gen A)
- Video pause on departing slide (from Gen B)
- `activeElement.blur()` after transition (from Gen C)
- Screen reader announcer (from Gen B/C)
- `confettiTriggered` boolean guard (from Gen C)
- `sessionStorage` persistence (new)
- Touch swipe scoped to `.main` with `{ passive: true }` (from Gen B)

| Rule ID | Rule | Severity |
|---------|------|----------|
| NAV-01 | `showSlide()` must use ES6 syntax (`const`/`let`, arrow functions) | WARN |
| NAV-02 | `showSlide()` must pause all videos on the departing slide | CRITICAL |
| NAV-03 | `showSlide()` must call `document.activeElement?.blur()` after transition | WARN |
| NAV-04 | `showSlide()` must update the `aria-live` announcer with slide number and title | CRITICAL |
| NAV-05 | `showSlide()` must use View Transitions API with fallback: `if (document.startViewTransition) { ... } else { doTransition(); }` | WARN |
| NAV-06 | `showSlide()` must save `currentIndex` to `sessionStorage` keyed by `document.title` | WARN |
| NAV-07 | Page load must restore `currentIndex` from `sessionStorage`, falling back to 0 | WARN |
| NAV-08 | Confetti must use a `confettiTriggered` boolean guard to prevent re-fire | WARN |
| NAV-09 | Keyboard handler must guard against `textarea`, `input`, `[role="tablist"]` focus before consuming Space/Arrow keys | CRITICAL |
| NAV-10 | Touch swipe must be scoped to `.main` element (not `document`) with `{ passive: true }` | WARN |
| NAV-11 | Tab function signature: `switchTab(btn, panelId)` | WARN |
| NAV-12 | Accordion function signature: `toggleAccordion(btn)` | WARN |

### Section 6: Theme System

Absorbed from: `docs/superpowers/specs/2026-04-08-design-system-strengthening.md`, STYLING-GUIDE.md

| Rule ID | Rule | Severity |
|---------|------|----------|
| THM-01 | Theme overrides must live in `<style id="theme-override">` placed after the main `<style>` block | CRITICAL |
| THM-02 | Layer 1 (lesson identity) properties — color lead, sidebar color, font pairing, background texture, title slide — must be constant across all slides in a lesson | WARN |
| THM-03 | Layer 2 (chapter variation) must be scoped via `[data-chapter="N"]` selectors | WARN |
| THM-04 | No two adjacent chapters may share the same card style | WARN |
| THM-05 | Dark theme lessons must add `class="theme-dark"` to `.main` and provide full text/component color inversion | CRITICAL |

### Section 7: Mobile / Touch

New section — derived from audit findings. Reference implementation: Interview Skills flip cards (click + keyboard + `:focus-visible`).

| Rule ID | Rule | Severity |
|---------|------|----------|
| MOB-01 | All interactive elements must have click/tap handlers — no hover-only interactions for content access | CRITICAL |
| MOB-02 | Sidebar toggle must be at least 44x44px | WARN |
| MOB-03 | Navigation prev/next buttons must be at least 44x44px | WARN |
| MOB-04 | Hover-triggered visual effects should have `:active` or `.tapped` CSS equivalents for touch feedback | WARN |

### Section 8: Performance

New section — derived from audit findings. Reference: Time Management (video poster attributes, CSS-variable confetti colors).

| Rule ID | Rule | Severity |
|---------|------|----------|
| PRF-01 | All `<video>` elements must have `preload="none"` | WARN |
| PRF-02 | Active slide video loading via `data-src` to `src` swap in `showSlide()` is recommended | INFO |
| PRF-03 | Google Fonts must use `preconnect` hints in `<head>` | WARN |

### Section 9: Engagement

New section — codifies pedagogical minimums based on WIPPEA methodology and audit findings.

| Rule ID | Rule | Severity |
|---------|------|----------|
| ENG-01 | Each lesson must have at least 2 checkpoint/quiz components (1+ in Practice chapters, 1+ in Evaluation) | WARN |
| ENG-02 | Every video slide must be immediately followed by a slide containing a discussion prompt, reflection question, or activity-box | WARN |
| ENG-03 | Each lesson must have at least 3 activity-box instances (1 in Warm-Up, 1+ in Practice, 1 in Application) | WARN |
| ENG-04 | At least 40% of content slides (excluding title/closing/dividers) must contain interactive components | INFO |

### Section 10: Reduced Motion

New section — codifies the comprehensive pattern found in Communicating/Controlling Anger/Problem Solving and missing from the other 3.

| Rule ID | Rule | Severity |
|---------|------|----------|
| RDM-01 | CSS must include `@media (prefers-reduced-motion: reduce)` that sets all `animation` and `transition` to `0.01ms` | CRITICAL |
| RDM-02 | JS must define `const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches` | CRITICAL |
| RDM-03 | `triggerConfetti()` must check `prefersReduced` before firing | CRITICAL |
| RDM-04 | Sound functions (`playClickSound`, `playSuccessSound`) must check `prefersReduced` before playing | CRITICAL |
| RDM-05 | Reduced-motion CSS must include `.confetti, .confetti-container { display: none }` | WARN |

---

## File Disposition

### Absorbed into SPOKES-STANDARD.md (archive originals)

| File | Action |
|------|--------|
| `SPOKES Builder/brand-palette.md` | Archive to `docs/archive/brand-palette.md` |
| `lesson-communicating-with-the-public/STYLING-GUIDE.md` | Archive to `docs/archive/STYLING-GUIDE-communicating.md` |

### Modified to reference SPOKES-STANDARD.md

| File | Change |
|------|--------|
| `CLAUDE.md` (root) | Add required-reading directive, lesson modification rules |
| `SPOKES Builder/CLAUDE.md` | Remove design rules, keep build process, add reference to SPOKES-STANDARD.md |
| `docs/repo-standards.md` | Remove quality enforcement section (moved to validator) |

### Kept as-is

| File | Reason |
|------|--------|
| `prototype-structural-redesign/GUARDRAILS.md` | Prototype-specific constraints, no overlap |
| `docs/superpowers/specs/2026-04-08-design-system-strengthening.md` | Historical design decision record |

### New files

| File | Purpose |
|------|---------|
| `SPOKES-STANDARD.md` | Authoritative spec |
| `scripts/validate-lesson.py` | Automated validator |
| `docs/archive/` | Directory for archived originals |

---

## Remediation Scope

Implementing this spec requires remediating all 6 existing lessons. The work breaks into categories:

### All 6 lessons need:
- Session persistence (sessionStorage hooks in showSlide + page load)
- Video `preload="none"` on all `<video>` tags
- Tap target increase (sidebar toggle + nav buttons to 44x44px)
- Reduced-motion CSS and JS completeness check

### 3 Tier-2 lessons need (Communicating, Controlling Anger, Problem Solving):
- Full ARIA scaffolding (tabs, accordions, flip cards, progress bar, nav, skip link, announcer)
- Keyboard handlers for all interactive components
- `:focus-visible` styles
- `<button>` elements replacing `<span>` for nav controls
- Nav engine upgrade to Generation D

### 3 Tier-1 lessons need (Time Management, Employee Accountability, Interview Skills):
- Nav engine alignment to Generation D (standardize function signatures, add missing features)
- Minor ARIA/keyboard gaps filled (skip link in TM/EA, video aria-labels)

### 4 lessons need (Communicating, Controlling Anger, Time Management — partial, Problem Solving):
- Flip card click/tap handlers (Interview Skills pattern as template)

### 5 lessons need:
- Video caption tracks (VTT files) — all except Time Management

### Engagement additions (all 6):
- Additional checkpoints in Practice chapters
- Post-video discussion/reflection slides
- Activity-box additions where below minimum

### Design system drift fixes:
- CLR: Remove `#c9a74a`, fix `.gold` text color in CA/EA/PSDM
- TYP: Add `--font-heading`/`--font-body` to `:root` in TM/EA/IS; move CA's font override out of `:root`
- TYP: Replace hardcoded font names with `var()` in TM/EA/IS
- CMP: Rename `qa-tab-btn`/`qa-accordion-*` to standard class names in IS
- NAV: Standardize tab/accordion function signatures across all 6
- NAV: Add video pause to CWP/CA/PSDM
- RDM: Add JS guards to EA (confetti, sounds), fill CSS gaps in TM/IS
- THM: Fix TM `.wippea-badge.e` color from mauve to gold
- CLR: Convert confetti hex arrays to `getComputedStyle` pattern in 5 lessons

---

## Future Considerations (Not in Scope)

- **Dark mode** — Controlling Anger has a `.theme-dark` reference implementation. Expanding to all lessons requires migrating 60-94 hardcoded CSS colors per file to `var()` references first. Recommended as a separate initiative after drift fixes are complete.
- **Print stylesheet** — Zero print CSS exists. Recommended after the core quality standard is in place.
- **Video content for Employee Accountability** — The only lesson with zero videos. Adding video content is a curriculum decision, not a technical one.

---

## Constraints

- 11-color brand palette is locked. No new colors.
- WCAG AA contrast requirements apply to all text/background combinations.
- Single self-contained `index.html` per lesson remains the delivery format.
- The navigation engine is defined in this spec — agents must not modify it ad hoc.
- The validator runs automatically; agents cannot bypass it.
- File nesting must not exceed 3 levels from project root.
