# SPOKES Design System Strengthening — Spec

**Date:** 2026-04-08
**Status:** Approved (details may be refined)
**Goal:** Make every SPOKES lesson visually distinct while maintaining brand coherence. Replace the current identical-looking lessons with a two-layer theme system that provides lesson-level identity and chapter-level variation.

---

## Problem Statement

All 6 existing SPOKES lessons look nearly identical despite having different fonts and content. They share the same dark-blue sidebar, white content area, blue gradient title slides, card styling, and section dividers. The existing design instructions describe an ambitious combinatorial design system, but none of it is actually implemented — no theme-override CSS blocks, no background textures, no template variants, no visual effects.

With 18 total lessons at ~30 slides each (540 slides), the curriculum needs enough visual variety that lessons feel like distinct experiences — like different issues of the same magazine — while staying within the locked 11-color brand palette.

---

## Architecture: Two-Layer Theme System

### Layer 1 — Lesson Identity (constant across entire lesson)

These properties stay the same from the first slide to the last. They establish "which lesson am I in?"

| Property | Description |
|----------|-------------|
| **Color Lead** | Which brand color dominates headings, card accents, buttons, dividers |
| **Sidebar Color** | Background color of the sidebar (--dark or --royal) |
| **Font Pairing** | Heading + body fonts from the font pairing library |
| **Title Slide Design** | Layout of the opening slide |
| **Background Texture** | Subtle CSS pattern on the content area |

### Layer 2 — Chapter Variation (rotates between chapters)

These properties change at chapter boundaries, providing visual refresh within each lesson.

| Property | Description |
|----------|-------------|
| **Card Style** | How cards, lists, and components are styled (2-3 per lesson, rotating) |
| **Section Divider Style** | How chapter transition slides look (3-4 per lesson, rotating) |
| **Component Mix** | Which component types are used per chapter (rule: no adjacent repeats) |
| **Accent Shift** | Secondary color emphasis can subtly shift between chapters |

### Key Rule: Coherent But Not Monotonous

Layer 1 holds constant — you always know which lesson you're in. Layer 2 rotates — each chapter transition brings visual refresh. The combination means 540 slides across 18 lessons never feel repetitive.

---

## Structural Changes

### Single Template with Collapsible Sidebar

One template file (template.html) with a left sidebar. New feature: a collapse/expand toggle button.

- **Desktop:** Sidebar expanded by default, toggle button collapses to icon rail showing chapter letter badges only (W, I, P1, P2, P3, E, A)
- **Tablet:** Sidebar expanded by default, collapsible
- **Mobile:** Sidebar collapsed by default, toggle expands as overlay
- **Transition:** Smooth CSS transition (~300ms)
- **Toggle location:** Bottom of sidebar
- **Toggle button:** Chevron icon (`«` when expanded, `»` when collapsed), 28x28px circle, `background: rgba(255,255,255,0.15)`, `border: 1px solid rgba(255,255,255,0.3)`
- **Keyboard:** Toggle activates on `Enter` and `Space`. Button is a `<button>` element in the tab order.
- **ARIA:** Sidebar `<nav>` gets `aria-label="Lesson chapters"`. Toggle button gets `aria-expanded="true|false"` and `aria-controls="sidebar-nav"`. Collapsed state: chapter badges get `aria-label` with full chapter name (e.g., `aria-label="Presentation 1"`).
- **Collapsed badge interaction:** Clicking a chapter badge in the collapsed rail navigates to that chapter (same as clicking the full chapter name when expanded). Hovering a badge shows a tooltip with the full chapter name.

All visual variety comes from the `<style id="theme-override">` CSS block layered on top of the base template. No structural HTML changes per lesson.

### Theme-Override Block Structure

Each lesson's `index.html` contains a single `<style id="theme-override">` block placed **after** the main SPOKES `<style>` block. This block is generated at build time by concatenating CSS snippets from the CSS library based on the lesson's theme package. Structure:

```html
<style id="theme-override">
  /* === LESSON IDENTITY === */

  /* 1. Font override */
  body { font-family: 'Fira Sans', sans-serif; }
  .slide-title h1, .slide h2, .slide h3, .card h4,
  .smart-content h4, .matrix-action, .slide-section h2 {
    font-family: 'Vollkorn', serif;
  }

  /* 2. Background texture */
  .main {
    background-color: var(--royal);
    background-image: repeating-linear-gradient(45deg,
      rgba(211,178,87,0.03), rgba(211,178,87,0.03) 1px,
      transparent 1px, transparent 20px);
  }

  /* 3. Color lead overrides (heading color, button bg, active states) */
  .slide h2 { color: var(--mauve); }
  .download-btn { background: var(--mauve); }
  /* ... additional lead-color selectors ... */

  /* 4. Dark theme inversion (only if backgroundTexture is dark-royal) */
  .theme-dark .slide p, .theme-dark .card p { color: var(--light); }
  /* ... */

  /* 5. Title slide design */
  .slide-title { /* layout-specific CSS for split-hero */ }

  /* === CHAPTER VARIATION === */

  /* 6. Card style classes (applied via data-chapter attribute) */
  [data-chapter="1"] .card, [data-chapter="2"] .card { /* glass style */ }
  [data-chapter="3"] .card { /* glass style */ }
  [data-chapter="4"] .card { /* gradient-fill style */ }
  [data-chapter="5"] .card { /* outlined style */ }
  /* ... same pattern for takeaways, smart-stack, etc. */

  /* 7. Section divider overrides per chapter */
  .slide-section[data-chapter="1"] { /* framed-gold style */ }
  .slide-section[data-chapter="2"] { /* bold-full-bleed style */ }
  /* ... */

  /* 8. Secondary accent per chapter */
  [data-chapter="1"] .card.gold-border { border-left-color: var(--gold); }
  [data-chapter="2"] .card.gold-border { border-left-color: var(--primary); }
  /* ... */

  /* 9. Video placeholder CSS */
  .video-placeholder { /* standard placeholder styles */ }
</style>
```

**Key mechanism:** Chapter-level variation is achieved by scoping CSS to `[data-chapter="N"]` selectors. Since every slide already has a `data-chapter` attribute, no HTML changes are needed. The agent builds this block by looking up the theme package, finding the CSS snippet for each chapter's assigned card style / divider style, and scoping it to the correct `data-chapter` value.

The CSS library file (`SPOKES Builder/theme-library.css`) contains all reusable snippets. The agent copies the relevant snippets into the theme-override block, scoped per chapter.

---

## Theme Matrix — Option Inventory

### Color Leads (6 options — Lesson layer)

| ID | Name | Description | Sidebar | Mood |
|----|------|-------------|---------|------|
| `blue` | Blue-Led | --primary dominates | --dark | Professional, trustworthy |
| `mauve` | Mauve-Led | --mauve dominates | --royal | Warm, personal, emotional |
| `gold` | Gold-Led | --gold/--muted-gold dominates | --dark | Achievement, growth, aspiration |
| `green` | Green-Led | --accent dominates | --dark | Action-oriented, positive |
| `royal` | Royal-Led | --royal dominates, --muted content bg | --royal | Premium, formal, authoritative |
| `dual-mauve-blue` | Dual: Mauve+Blue | --mauve and --primary share the lead | --royal | Dynamic, tension/resolution |
| `dual-gold-green` | Dual: Gold+Green | --gold and --accent share the lead | --dark | Growth with aspiration |
| `dual-mauve-gold` | Dual: Mauve+Gold | --mauve and --gold share the lead | --royal | Warm aspiration |
| `dual-blue-green` | Dual: Blue+Green | --primary and --accent share the lead | --dark | Action with structure |

**How it works:** The lead color shifts heading colors, card border accents, button backgrounds, section divider gradients, active sidebar highlights, and download buttons. All 11 brand colors remain available — the lead determines which one dominates.

### Background Textures (6 options — Lesson layer)

| ID | Name | CSS Technique | Mood |
|----|------|--------------|------|
| `plain` | Plain White | `background: var(--light)` | Clean, minimal |
| `dot-grid` | Dot Grid | `radial-gradient` dots | Technical, structured |
| `diagonal` | Diagonal Lines | `repeating-linear-gradient` at 45deg | Refined, pinstripe |
| `crosshatch` | Crosshatch Grid | Two perpendicular `linear-gradient` lines | Blueprint, analytical |
| `soft-gradient` | Soft Gradient | `linear-gradient` white to --muted | Warm, approachable |
| `dark-royal` | Dark Royal | --royal background with subtle gold lines | Premium, dramatic |

**Dark Royal note:** This option requires all text and component colors to flip to light values. Can pair with ANY color lead (e.g., dark royal background with mauve headings, or with green accents). Limit to 4-5 lessons maximum due to the extra CSS complexity. User preference for this style noted.

**Dark Royal inversion strategy:** The CSS library defines a `.theme-dark` class that is added to `.main` when `backgroundTexture` is `dark-royal`. This class overrides all text colors to `var(--light)`, card backgrounds to `rgba(237,243,247,0.08)`, and component-specific colors (see Component-to-Card-Style Mapping section). The theme-override block for a dark-royal lesson applies `.theme-dark` and only needs to set the lead-color-specific accents on top.

### Title Slide Designs (12 options — Lesson layer)

| # | ID | Name | Description |
|---|-----|------|-------------|
| 1 | `centered-gradient` | Centered Gradient | Everything centered on a diagonal gradient (current default) |
| 2 | `split-hero` | Split Hero | Left panel with text, right panel with gradient + watermark |
| 3 | `full-bleed` | Full-Bleed Color | Lead color fills everything with subtle geometric circles |
| 4 | `bottom-anchored` | Bottom-Anchored | Light content area, dark footer band |
| 5 | `offset-left` | Offset Left | Left-aligned text, decorative concentric circles right |
| 6 | `diagonal-split` | Diagonal Split | Two-tone with angled clip-path divider |
| 7 | `framed-center` | Framed Center | Royal background, gold border frame around title |
| 8 | `top-banner` | Top Banner | SPOKES banner bar, white body, rainbow bottom edge |
| 9 | `radial-glow` | Radial Glow | Dark royal with centered color glow behind title |
| 10 | `vertical-strip` | Vertical Strip | White background, rainbow accent bar on left edge |
| 11 | `corner-accent` | Corner Accent | Dark background with geometric triangle accents in corners |
| 12 | `horizon-line` | Horizon Line | Title above a gold horizon line, subtitle below |

All title slide designs compose with the color lead — the layout is the structure, the color lead provides the palette. **Title slide designs may be reused across lessons** — when combined with different color leads and font pairings, the same layout feels distinct (e.g., "Split Hero" in mauve-led with Vollkorn looks different from "Split Hero" in green-led with Lora). Aim for no more than 2 lessons sharing the same title slide design.

### Font Pairings (20 options — Lesson layer)

Existing font pairing library in `SPOKES Builder/font-pairings.md`. 5 assigned, 15 available. No changes needed to the library — just enforce that every lesson gets a unique pairing. **Font pairings are pre-approved as part of the bulk theme package approval.** The existing per-lesson font approval gate is replaced by approving the complete theme registry. No separate font approval step at build time.

### Sidebar Colors (2 options — Lesson layer)

| ID | Hex | Usage |
|----|-----|-------|
| `dark` | #004071 (--dark) | Default, pairs with most color leads |
| `royal` | #00133f (--royal) | Deeper navy, pairs with mauve-led, royal-led, dark-royal texture |

### Card Styles (8 options — Chapter layer)

| # | ID | Name | Key Visual Feature |
|---|-----|------|--------------------|
| 1 | `left-border` | Left Border | Muted background, colored left border, round badges |
| 2 | `shadow-float` | Shadow Float | White cards on muted bg, soft shadows, top border accent |
| 3 | `sharp-border` | Sharp Border | Zero border-radius, full outlines, square badges |
| 4 | `glass` | Glass | Frosted translucent cards on colored bg |
| 5 | `outlined` | Outlined | Light border with bold bottom accent, outlined badges |
| 6 | `gradient-fill` | Gradient Fill | Cards filled with lead-color gradients, white text |
| 7 | `pill` | Pill | High border-radius, soft, modern app feel |
| 8 | `layered` | Layered | Colored shadow offset behind cards, tactile depth |

Card styles affect ALL components in a lesson chapter: cards-grid, takeaway numbers, smart-stack letters, matrix cells, areas-grid, and flip cards.

#### Component-to-Card-Style Mapping

Each card style must define CSS overrides for every component type. The CSS library will contain a class per card style (e.g., `.card-style-glass`, `.card-style-pill`) that overrides these selectors:

| Component | Selectors Affected | What Changes |
|-----------|-------------------|--------------|
| cards-grid | `.card`, `.card.gold-border` | background, border, border-radius, box-shadow |
| takeaways | `.takeaway-num`, `.takeaway-num.alt` | background, border-radius, border, color |
| smart-stack | `.smart-letter`, `.smart-letter.alt`, `.smart-content` | background, border-radius, border, box-shadow |
| matrix-grid | `.matrix-cell` (all 4 variants) | background, border, border-radius, box-shadow |
| dangers-grid | `.danger-card-front`, `.danger-card-back` | background, border, border-radius, box-shadow |
| areas-grid | `.area-card`, `.area-card.gold-card` | background, border, border-radius, box-shadow |
| activity-box | `.activity-box` | border, border-radius, background |
| download-resource | `.download-btn` | border-radius, box-shadow |

The CSS library file (`SPOKES Builder/theme-library.css`) will contain the complete CSS for each card style applied to each component. This is created during implementation — too large for the spec — but the mapping above defines the contract.

### Section Divider Styles (5 options — Chapter layer)

| # | ID | Name | Description |
|---|-----|------|-------------|
| 1 | `gradient-sweep` | Gradient Sweep | Dark-to-primary diagonal gradient with watermark |
| 2 | `framed-gold` | Framed Gold | Royal background, gold border frame around content |
| 3 | `bold-full-bleed` | Bold Full-Bleed | Lead color fills entire slide |
| 4 | `split-panel` | Split Panel | Two-tone split, stage label left, chapter title right |
| 5 | `centered-badge` | Centered Badge | Icon circle prominent above title, soft gradient bg |

Dividers compose with the color lead independently.

---

## Chapter Variation Rules

1. **Card styles:** Each lesson assigns 2-3 card styles from the 8 options. Styles rotate by chapter. **No two adjacent chapters use the same card style.**
2. **Section dividers:** Each lesson assigns 3-4 divider styles from the 5 options. **No two adjacent chapters use the same divider style.**
3. **Component mix:** Each chapter specifies a `leadComponent` — the primary component type used on the first content slide after the section divider. **No two adjacent chapters may share the same `leadComponent`.** Valid values: `cards-grid`, `takeaways`, `smart-stack`, `matrix-grid`, `dangers-grid`, `areas-grid`, `split-layout`, `content-list`. Other component types may appear later in the chapter without restriction.
4. **Accent shifts:** Each chapter specifies a `secondaryAccent` — the brand color used for alternating card borders, secondary highlights, and activity-box borders within that chapter. The lesson's `colorLead` still dominates headings, buttons, and primary accents. The `secondaryAccent` provides variety. Valid values: any of the 11 brand color variable names (`primary`, `accent`, `dark`, `gold`, `royal`, `mauve`, `muted-gold`, `offwhite`, `gray`). **Must differ from the lesson's `colorLead`.** Adjacent chapters should use different `secondaryAccent` values where possible.

---

## Theme Package Format

Each lesson's theme is fully defined in a theme registry. The agent looks up the assigned package and applies it — no guessing, no approval loop at build time.

```json
{
  "lesson-controlling-anger": {
    "colorLead": "mauve",
    "sidebarColor": "royal",
    "backgroundTexture": "dark-royal",
    "titleSlide": "split-hero",
    "fontPairing": "vollkorn-fira-sans",
    "chapterStyles": {
      "W":  { "divider": "framed-gold",     "cards": "glass",          "leadComponent": "split-layout",  "secondaryAccent": "gold" },
      "I":  { "divider": "bold-full-bleed", "cards": "outlined",       "leadComponent": "cards-grid",    "secondaryAccent": "primary" },
      "P1": { "divider": "centered-badge",  "cards": "glass",          "leadComponent": "dangers-grid",  "secondaryAccent": "gold" },
      "P2": { "divider": "gradient-sweep",  "cards": "gradient-fill",  "leadComponent": "smart-stack",   "secondaryAccent": "accent" },
      "P3": { "divider": "split-panel",     "cards": "outlined",       "leadComponent": "areas-grid",    "secondaryAccent": "gold" },
      "E":  { "divider": "framed-gold",     "cards": "glass",          "leadComponent": "takeaways",     "secondaryAccent": "primary" },
      "A":  { "divider": "centered-badge",  "cards": "gradient-fill",  "leadComponent": "content-list",  "secondaryAccent": "accent" }
    }
  }
}
```

**Validation rules visible in this example:**
- No adjacent chapters share the same `cards` value (glass → outlined → glass → gradient-fill → outlined → glass → gradient-fill)
- No adjacent chapters share the same `divider` value (framed-gold → bold-full-bleed → centered-badge → gradient-sweep → split-panel → framed-gold → centered-badge)
- No adjacent chapters share the same `leadComponent` value
- `secondaryAccent` values differ from the lesson's `colorLead` (mauve) and vary between adjacent chapters

The 18 theme packages will be defined as part of implementation planning and require user approval before build.

---

## Implementation Scope

### Files to Create

- **Theme registry JSON** — All 18 lesson theme packages with lesson-level and chapter-level assignments
- **CSS library file** — Reusable CSS blocks for all card styles, section dividers, title slides, and background textures (referenced by theme-override blocks)

### Files to Modify

- **template.html** — Add sidebar collapse toggle (JS + CSS)
- **spokes-modules-developer.md** (agent) — Rewrite to reference two-layer theme system, theme registry lookup, chapter-level variation rules
- **SPOKES Builder/CLAUDE.md** — Update build process to reflect theme registry workflow
- **SPOKES Builder/build-process.md** — Replace current Phase 3 (design) with theme registry lookup; add chapter variation application steps
- **SPOKES Builder/AGENT_THEMING_GUIDELINES.md** — Replace current theming guidance with concrete option definitions and composition rules
- **SPOKES Builder/components.md** — Add CSS variants for each card style across all component types
- **lesson-registry.json** — Expand schema to track chapter-level style assignments
- **SPOKES-Agent-Execution-Spec.md** — Update locked decisions to reference theme registry and two-layer system

### Lessons to Retrofit

All 5 existing lessons receive theme packages and are retrofitted with the new design system. **Retrofit means:**

1. Assign a theme package from the registry to the lesson
2. Add the lesson-specific Google Font `<link>` tags (if the font pairing changes)
3. Generate and insert the `<style id="theme-override">` block based on the theme package
4. Add `class="theme-dark"` to `.main` if the lesson uses `dark-royal` texture
5. Verify all slides still render correctly with the new styling
6. Update `lesson-registry.json` with the new theme metadata

**Retrofit does NOT mean** regenerating lesson content, rewriting slide text, changing the WIPPEA structure, or replacing components. The HTML content stays intact — only the styling layer changes.

Lessons to retrofit:

1. lesson-time-management (complete)
2. lesson-interview-skills (complete)
3. lesson-employee-accountability (complete)
4. lesson-communicating-with-the-public (qa)
5. lesson-controlling-anger (qa)

### Lessons to Build Fresh

13 remaining lessons will be built with theme packages from the start.

---

## Constraints

- **11-color brand palette is locked.** No new colors. Opacity variations of brand colors are permitted.
- **WCAG AA contrast requirements** apply to all text/background combinations per brand-palette.md.
- **Anti-clash guardrails** from brand-palette.md remain enforced (no accent-on-accent pairings, no red-vs-green opposing).
- **Single self-contained index.html** output per lesson remains the delivery format.
- **Theme packages are pre-approved in bulk.** Font pairings, color leads, and all other design choices are approved when the user signs off on the complete theme registry. No per-lesson font or color approval gates at build time.

---

## What This Spec Does NOT Cover

- The actual 18 theme package assignments (which lesson gets which combination) — defined during implementation planning
- New interactive component types — existing component library is sufficient
- Changes to the WIPPEA framework or chapter structure
- Dashboard.html changes
- Teacher guide or presenter note generation
