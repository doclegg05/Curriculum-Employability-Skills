# SPOKES Design System Strengthening — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a two-layer theme system that makes every SPOKES lesson visually distinct while maintaining brand coherence.

**Architecture:** Single template with collapsible sidebar (already partially exists). Visual variety via theme-override CSS blocks generated from a theme registry JSON + CSS library file. Layer 1 (lesson identity) stays constant across a lesson; Layer 2 (chapter variation) rotates card styles, dividers, and accents per chapter using data-chapter CSS selectors.

**Tech Stack:** HTML, CSS (custom properties, attribute selectors, backdrop-filter), vanilla JS, JSON registry

**Spec:** `docs/superpowers/specs/2026-04-08-design-system-strengthening.md`

---

## File Map

### Files to Create

| File | Responsibility |
|------|---------------|
| `SPOKES Builder/theme-library.css` | All reusable CSS snippets: 8 card styles x 8 component types, 5 section divider styles, 12 title slide designs, 6 background textures, 9 color lead overrides, dark-theme inversion, sidebar color variants |
| `SPOKES Builder/theme-registry.json` | 18 lesson theme packages with Layer 1 + Layer 2 assignments |

### Files to Modify

| File | What Changes |
|------|-------------|
| `SPOKES Builder/template.html` | Enhance sidebar toggle: ARIA attributes, collapsed icon-rail mode, keyboard support, responsive behavior |
| `SPOKES Builder/AGENT_THEMING_GUIDELINES.md` | Replace with two-layer system reference, option definitions, composition rules |
| `SPOKES Builder/build-process.md` | Replace Phase 3 (design) with theme registry lookup workflow |
| `SPOKES Builder/CLAUDE.md` | Update build process to reference theme registry |
| `SPOKES Builder/components.md` | Add note that card styles are applied via theme-override, not inline |
| `~/.claude/agents/spokes-modules-developer.md` | Rewrite build process to use theme registry lookup + chapter variation |
| `~/.claude/skills/spokes-lesson/SKILL.md` | Update to pass theme package to agent |
| `lesson-registry.json` | Expand schema with theme package fields |
| `SPOKES-Agent-Execution-Spec.md` | Update locked decisions for theme registry and bulk approval |

---

## Phase 1: Template Enhancement

### Task 1: Upgrade Sidebar Toggle with ARIA and Icon-Rail Mode

**Files:**
- Modify: `SPOKES Builder/template.html:56-102` (CSS), `:1693-1723` (HTML), `:2114-2118` (JS)

- [ ] **Step 1: Update sidebar HTML with ARIA attributes**

In `SPOKES Builder/template.html`, replace the sidebar nav (line 1695) through the toggle button (line 1723) with updated HTML that includes:
- `id="sidebar-nav"` and `aria-label="Lesson chapters"` on the nav element
- A new collapse button inside the sidebar bottom with `aria-expanded`, `aria-controls="sidebar-nav"`
- Updated external toggle button with `aria-expanded` and `aria-controls`

- [ ] **Step 2: Add collapsed icon-rail CSS**

After the existing `.sidebar-toggle:active` rule (around line 102), add CSS for:
- `.sidebar-collapse-btn` — 28x28px circle button, rgba background, gold focus-visible outline
- `.sidebar.collapsed` — width 52px, hides title/resources/counter/slide-lists, shows only WIPPEA badges centered
- `.sidebar.collapsed .chapter-header` — centered, no border-left, just badge visible

- [ ] **Step 3: Update the sidebar collapse JS**

Replace the `toggleSidebar` function (lines 2114-2118) with an enhanced version that:
- Toggles `aria-expanded` on both buttons
- Updates button text content (chevron direction)
- Shows/hides the external toggle button based on collapse state
- Wires up the internal collapse button click handler
- Initializes the external toggle as hidden when sidebar is expanded

- [ ] **Step 4: Add mobile-first responsive behavior**

In the media query section (around line 1500), add CSS for max-width 768px:
- Sidebar becomes fixed position, slides in from left
- `.sidebar.mobile-open` class for visible state
- External toggle always visible on mobile

- [ ] **Step 5: Test sidebar toggle manually**

Open `template.html` via `python -m http.server 8085`.
Verify: collapse button shows chevron, collapses to icon rail, badges navigate to chapters, keyboard accessible, mobile viewport starts collapsed.

- [ ] **Step 6: Commit**

```bash
git add "SPOKES Builder/template.html"
git commit -m "feat: upgrade sidebar toggle with ARIA, icon-rail collapse, and responsive behavior"
```

---

## Phase 2: CSS Theme Library

### Task 2: Create Theme Library with Background Textures and Dark-Theme Inversion

**Files:**
- Create: `SPOKES Builder/theme-library.css`

- [ ] **Step 1: Create theme-library.css**

Create the file with:
- Header comment explaining the two-layer system and SCOPE replacement mechanism
- 6 background texture CSS blocks (plain, dot-grid, diagonal, crosshatch, soft-gradient, dark-royal) as commented snippets agents uncomment
- `.theme-dark` inversion class: overrides text colors to `var(--light)`, card backgrounds to `rgba(237,243,247,0.08)`, activity-box to gold-tinted, targeting all component text selectors (h2, h3, p, card h4, card p, smart-content, area-card li, takeaway-item p, matrix-label, matrix-desc, content-list li)

- [ ] **Step 2: Commit**

```bash
git add "SPOKES Builder/theme-library.css"
git commit -m "feat: create theme library with background textures and dark-theme inversion"
```

### Task 3: Add Color Lead and Sidebar Color Snippets

**Files:**
- Modify: `SPOKES Builder/theme-library.css`

- [ ] **Step 1: Append color lead CSS blocks**

Add 9 color lead blocks (blue, mauve, gold, green, royal, dual-mauve-blue, dual-gold-green, dual-mauve-gold, dual-blue-green) as commented snippets. Each overrides: `.slide h2` color, `.download-btn` background, `.chapter-item.active` background, `.divider` gradient, `.slide-section` gradient. Dual-tones split h2/h3 between the two lead colors.

- [ ] **Step 2: Append sidebar color blocks**

Add 2 sidebar color snippets: dark (default, no override needed) and royal (`.sidebar { background: var(--royal); }`).

- [ ] **Step 3: Commit**

```bash
git add "SPOKES Builder/theme-library.css"
git commit -m "feat: add color lead and sidebar color snippets to theme library"
```

### Task 4: Add Card Style Snippets

**Files:**
- Modify: `SPOKES Builder/theme-library.css`

- [ ] **Step 1: Append 8 card style CSS blocks**

Each card style (left-border, shadow-float, sharp-border, glass, outlined, gradient-fill, pill, layered) is a commented block using `SCOPE` prefix. Each block overrides all 8 component types from the mapping table: `.card`, `.card.gold-border`, `.takeaway-num`, `.takeaway-num.alt`, `.smart-letter`, `.smart-content`, `.matrix-cell`, `.danger-card-front`, `.danger-card-back`, `.area-card`, `.area-card.gold-card`, `.activity-box`, `.download-btn`.

Add a comment explaining: "When building theme-override, replace SCOPE with `[data-chapter="N"]` for the assigned chapter."

- [ ] **Step 2: Commit**

```bash
git add "SPOKES Builder/theme-library.css"
git commit -m "feat: add 8 card style snippets to theme library with component mappings"
```

### Task 5: Add Section Divider Snippets

**Files:**
- Modify: `SPOKES Builder/theme-library.css`

- [ ] **Step 1: Append 5 section divider CSS blocks**

Each divider style (gradient-sweep, framed-gold, bold-full-bleed, split-panel, centered-badge) uses `DIVIDER_SCOPE` prefix. Each overrides the section slide background, h2 color, chapter-label color, divider bar, and section-circle positioning.

Add a comment: "Replace DIVIDER_SCOPE with `.slide-section[data-chapter="N"]` for the assigned chapter."

- [ ] **Step 2: Commit**

```bash
git add "SPOKES Builder/theme-library.css"
git commit -m "feat: add 5 section divider style snippets to theme library"
```

### Task 6: Add Title Slide Design Snippets

**Files:**
- Modify: `SPOKES Builder/theme-library.css`

- [ ] **Step 1: Append 12 title slide CSS blocks**

Each title slide design (centered-gradient, split-hero, full-bleed, bottom-anchored, offset-left, diagonal-split, framed-center, top-banner, radial-glow, vertical-strip, corner-accent, horizon-line) as commented blocks targeting `.slide-title` and its children. Each changes layout, background, pseudo-elements, and text positioning.

- [ ] **Step 2: Commit**

```bash
git add "SPOKES Builder/theme-library.css"
git commit -m "feat: add 12 title slide design snippets to theme library"
```

---

## Phase 3: Theme Registry

### Task 7: Create Theme Registry with 5 Existing Lesson Packages

**Files:**
- Create: `SPOKES Builder/theme-registry.json`

- [ ] **Step 1: Create the registry JSON**

Structure with `version`, `description`, and `lessons` object. Define complete theme packages for all 5 existing lessons:

| Lesson | Color Lead | Sidebar | Texture | Title Slide | Fonts |
|--------|-----------|---------|---------|-------------|-------|
| time-management | blue | dark | dot-grid | centered-gradient | DM Serif Display + Outfit |
| interview-skills | royal | royal | diagonal | split-hero | Playfair Display + Inter |
| employee-accountability | green | dark | soft-gradient | bottom-anchored | Merriweather + Source Sans 3 |
| communicating-with-the-public | dual-blue-green | dark | crosshatch | top-banner | Crimson Pro + Work Sans |
| controlling-anger | mauve | royal | dark-royal | framed-center | Vollkorn + Fira Sans |

Each lesson includes full `chapterStyles` object with `divider`, `cards`, `leadComponent`, and `secondaryAccent` per chapter (W, I, P1, P2, P3, E, A), validated against the no-adjacent-repeat rules.

- [ ] **Step 2: Validate no adjacent repeats**

For each lesson, verify: no adjacent chapters share cards, divider, or leadComponent values. No secondaryAccent matches the colorLead.

- [ ] **Step 3: Commit**

```bash
git add "SPOKES Builder/theme-registry.json"
git commit -m "feat: create theme registry with 5 existing lesson packages"
```

---

## Phase 4: Agent and Skill Instruction Updates

### Task 8: Rewrite spokes-modules-developer Agent

**Files:**
- Modify: `~/.claude/agents/spokes-modules-developer.md`

- [ ] **Step 1: Replace the build process**

Rewrite the agent to:
1. Read theme package from `SPOKES Builder/theme-registry.json`
2. Copy `template.html` as base
3. Add lesson-specific Google Font link tags based on fontPairing
4. Generate theme-override block by: looking up Layer 1 properties, scoping Layer 2 card styles to `[data-chapter="N"]`, scoping divider styles to `.slide-section[data-chapter="N"]`
5. Add `class="theme-dark"` to `.main` if dark-royal texture
6. Build slides using `leadComponent` as first component per chapter
7. Use `secondaryAccent` for alternating borders
8. Remove all design proposal/approval steps — agent applies pre-approved package

- [ ] **Step 2: Commit**

```bash
git add ~/.claude/agents/spokes-modules-developer.md
git commit -m "feat: rewrite spokes-modules-developer agent for two-layer theme system"
```

### Task 9: Update spokes-lesson Skill

**Files:**
- Modify: `~/.claude/skills/spokes-lesson/SKILL.md`

- [ ] **Step 1: Update workflow**

Add step to read theme package from registry and include in agent prompt. Remove font/color approval step.

- [ ] **Step 2: Commit**

```bash
git add ~/.claude/skills/spokes-lesson/SKILL.md
git commit -m "feat: update spokes-lesson skill to pass theme package to agent"
```

### Task 10: Update Builder Documentation

**Files:**
- Modify: `SPOKES Builder/CLAUDE.md`, `SPOKES Builder/build-process.md`, `SPOKES Builder/AGENT_THEMING_GUIDELINES.md`, `SPOKES Builder/components.md`, `SPOKES-Agent-Execution-Spec.md`, `lesson-registry.json`

- [ ] **Step 1: Update CLAUDE.md** — Replace Design Philosophy and Build Process sections to reference two-layer system, theme registry, and theme library.

- [ ] **Step 2: Update build-process.md Phase 3** — Replace design proposal phase with theme registry lookup workflow (7 sub-steps from spec).

- [ ] **Step 3: Update AGENT_THEMING_GUIDELINES.md** — Replace 6-principle guide with two-layer system reference, option inventory, registry format, SCOPE replacement mechanism, dark-royal usage.

- [ ] **Step 4: Update components.md** — Add note at top that card styling is via theme-override, not inline classes.

- [ ] **Step 5: Update SPOKES-Agent-Execution-Spec.md** — Update locked decisions 5, 15, add 16 for theme registry bulk approval.

- [ ] **Step 6: Update lesson-registry.json** — Add `themePackage` reference field to each lesson entry.

- [ ] **Step 7: Commit**

```bash
git add "SPOKES Builder/CLAUDE.md" "SPOKES Builder/build-process.md" "SPOKES Builder/AGENT_THEMING_GUIDELINES.md" "SPOKES Builder/components.md" "SPOKES-Agent-Execution-Spec.md" "lesson-registry.json"
git commit -m "docs: update all builder documentation for two-layer theme system"
```

---

## Phase 5: Retrofit Existing Lessons

### Task 11: Retrofit lesson-time-management

**Files:** `lesson-time-management/index.html`

- [ ] **Step 1:** Read theme package (blue, dark, dot-grid, centered-gradient, DM Serif Display + Outfit)
- [ ] **Step 2:** Insert `<style id="theme-override">` block after main style block with dot-grid texture, blue-led overrides, chapter-scoped card styles and divider styles per registry
- [ ] **Step 3:** Verify in browser: dot-grid visible, cards change between chapters, dividers vary, sidebar collapses, no console errors, mobile works
- [ ] **Step 4:** Commit

```bash
git add "lesson-time-management/index.html"
git commit -m "feat: retrofit lesson-time-management with two-layer theme system"
```

### Task 12: Retrofit lesson-interview-skills

**Files:** `lesson-interview-skills/index.html`

- [ ] **Step 1:** Read theme package (royal, royal sidebar, diagonal, split-hero, Playfair Display + Inter)
- [ ] **Step 2:** Insert theme-override block with diagonal texture, royal-led overrides, royal sidebar, split-hero title, chapter-scoped styles
- [ ] **Step 3:** Verify rendering including split-hero title layout
- [ ] **Step 4:** Commit

```bash
git add "lesson-interview-skills/index.html"
git commit -m "feat: retrofit lesson-interview-skills with two-layer theme system"
```

### Task 13: Retrofit lesson-employee-accountability

**Files:** `lesson-employee-accountability/index.html`

- [ ] **Step 1:** Read theme package (green, dark, soft-gradient, bottom-anchored, Merriweather + Source Sans 3)
- [ ] **Step 2:** Add Merriweather + Source Sans 3 font link tags. Insert theme-override with soft-gradient, green-led overrides, bottom-anchored title, chapter-scoped styles
- [ ] **Step 3:** Verify new fonts render, bottom-anchored title works
- [ ] **Step 4:** Commit

```bash
git add "lesson-employee-accountability/index.html"
git commit -m "feat: retrofit lesson-employee-accountability with two-layer theme system"
```

### Task 14: Retrofit lesson-communicating-with-the-public

**Files:** `lesson-communicating-with-the-public/index.html`

- [ ] **Step 1:** Read theme package (dual-blue-green, dark, crosshatch, top-banner, Crimson Pro + Work Sans)
- [ ] **Step 2:** Insert theme-override with crosshatch texture, dual-blue-green overrides, top-banner title, chapter-scoped styles
- [ ] **Step 3:** Verify dual-tone color shifts, crosshatch pattern, top-banner layout
- [ ] **Step 4:** Commit

```bash
git add "lesson-communicating-with-the-public/index.html"
git commit -m "feat: retrofit lesson-communicating-with-the-public with two-layer theme system"
```

### Task 15: Retrofit lesson-controlling-anger (dark-royal)

**Files:** `lesson-controlling-anger/index.html`

- [ ] **Step 1:** Read theme package (mauve, royal sidebar, dark-royal, framed-center, Vollkorn + Fira Sans)
- [ ] **Step 2:** Add `class="theme-dark"` to `.main` element. Insert theme-override with dark-royal texture, theme-dark inversion, mauve-led overrides, royal sidebar, framed-center title, chapter-scoped styles (glass, outlined, gradient-fill)
- [ ] **Step 3:** Verify dark background, light text, glass cards with backdrop-filter, framed-center title, WCAG contrast
- [ ] **Step 4:** Commit

```bash
git add "lesson-controlling-anger/index.html"
git commit -m "feat: retrofit lesson-controlling-anger with two-layer theme system (dark-royal)"
```

---

## Phase 6: Final Verification

### Task 16: Cross-Lesson Visual Comparison

- [ ] **Step 1:** Open all 5 retrofitted lessons in browser tabs. Verify each has a visually distinct first impression (different title slide, colors, texture). Sidebar position is consistent but color varies.
- [ ] **Step 2:** Within each lesson, navigate through chapters. Verify card styles visibly change between chapters and section dividers vary.
- [ ] **Step 3:** Search each theme-override block for hex colors not in the 11-color palette. Opacity variations (rgba) of brand colors are acceptable.
- [ ] **Step 4:** Spot-check WCAG contrast in dark-royal lesson (lesson-controlling-anger). All text must meet 4.5:1 normal, 3:1 large.
- [ ] **Step 5:** Commit any fixes.

```bash
git add -A
git commit -m "fix: resolve any visual or contrast issues from cross-lesson review"
```
