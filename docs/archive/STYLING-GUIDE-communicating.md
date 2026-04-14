> **ARCHIVED** — This file has been absorbed into `SPOKES-STANDARD.md` (project root).
> It is kept here as a historical reference. Do not use for design decisions.
> Archived: 2026-04-14

# Communicating with the Public — Front-End Design Guide

> Complete visual specification for an agent to reproduce or extend this lesson's design.

---

## 1. Color System

### 1a. Global Palette (11 colors — strict, no others permitted)

| CSS Variable    | Hex       | Role in This Lesson                                      |
|-----------------|-----------|----------------------------------------------------------|
| `--primary`     | `#007baf` | **Color lead.** Headings, buttons, tab borders, links, card top-borders, section dividers, progress bar start |
| `--accent`      | `#37b550` | Section divider gradient end, matrix "schedule" cell bg. **Never used for text on light backgrounds** (fails WCAG) |
| `--dark`        | `#004071` | Sidebar bg, download button bg, body text fallback, flip-card fronts, closing slide gradient end |
| `--light`       | `#ffffff` | Card backgrounds, text on dark surfaces, tab panel bg     |
| `--muted`       | `#edf3f7` | Main content area base bg, inactive tab bg, accordion header bg, smart-content bg, card bg (default) |
| `--gray`        | `#60636b` | Body paragraph text, subtitle text, captions              |
| `--gold`        | `#d3b257` | Divider accents, sidebar title, active slide highlight, activity-box border, flip-card backs, progress bar end, focus outlines. **Never used for text on white** (fails WCAG — use `--muted-gold` instead) |
| `--royal`       | `#00133f` | Not prominently used in this lesson (available for deep navy) |
| `--mauve`       | `#a7253f` | Secondary accent on even chapters (2, 4, 6): alt card borders, alt takeaway-num bg |
| `--offwhite`    | `#d1d3d4` | Card borders (layered style), tab/accordion inactive borders, content slide gradient end |
| `--muted-gold`  | `#ad8806` | Text-safe gold — used for `.gold` text highlight class     |

### 1b. Opacity Variations Used

| Value                              | Where                                   |
|------------------------------------|-----------------------------------------|
| `rgba(0, 123, 175, 0.25)`         | Active sidebar chapter bg               |
| `rgba(0, 123, 175, 0.06)`         | Download-resource container bg, checkpoint bg |
| `rgba(0, 123, 175, 0.08)`         | Tab/accordion hover bg                  |
| `rgba(0, 123, 175, 0.1)`          | Download-resource border                |
| `rgba(0, 64, 113, 0.04)`          | Crosshatch texture lines                |
| `rgba(0, 64, 113, 0.08)`          | Shadow-float card box-shadow            |
| `rgba(0, 64, 113, 0.15)`          | Layered card offset shadow              |
| `rgba(211, 178, 87, 0.1)`         | Activity-box bg                         |
| `rgba(211, 178, 87, 0.3)`         | Active slide-item sidebar highlight     |
| `rgba(211, 178, 87, 0.2)`         | Layered gold-border offset shadow       |
| `rgba(211, 178, 87, 0.05)`        | Scenario card hover warm glow           |
| `rgba(211, 178, 87, 0.5)`         | Flip card hover gold drop-shadow        |
| `rgba(255, 255, 255, 0.1)`        | Sidebar hover, closing-box bg           |
| `rgba(255, 255, 255, 0.04)`       | Section divider watermark letter        |
| `rgba(0, 0, 0, 0.15)`            | Section circle bg overlay, card shadows |
| `rgba(0, 0, 0, 0.3)`             | Title text-shadow, section circle shadow|

### 1c. WCAG Contrast Fixes Applied

| Problem                                | Fix                                    |
|----------------------------------------|----------------------------------------|
| `.accent` text (#37b550 on white = 2.66:1) | Overridden to `--dark` (#004071, 10.65:1) |
| `.gold` text (#d3b257 on white = 2.04:1) | Overridden to `--muted-gold` (#ad8806, 3.33:1) |
| `.activity-label` gold on white        | Overridden to `--dark`                 |
| `.wippea-badge.p` white on accent      | Badge bg changed to `--primary`        |
| `.matrix-cell.schedule` white on accent | Text changed to `--dark`              |
| Alt takeaway-num (mauve chapters)      | Text set to `--light` on `--mauve` bg  |
| Download button (white on accent)      | Bg changed to `--dark`                 |

---

## 2. Typography

### 2a. Font Pairing

| Role     | Font Family     | Weight(s) Loaded   | CSS Variable        |
|----------|-----------------|--------------------|---------------------|
| Headings | **Crimson Pro** | 400, 600, 700      | `--font-heading` (overridden from default DM Serif Display) |
| Body     | **Work Sans**   | 400, 500, 600      | `--font-body` (overridden from default Outfit) |

Google Fonts import:
```html
<link href="https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;600;700&family=Work+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
```

The default system fonts (DM Serif Display + Outfit) are also loaded but overridden by the theme layer.

### 2b. Type Scale

| Element                     | Font          | Size     | Weight | Color            |
|-----------------------------|---------------|----------|--------|------------------|
| Title slide `h1`            | Crimson Pro   | 5rem     | 400    | `--light`        |
| Title slide subtitle        | Work Sans     | 1.8rem   | —      | `--light`        |
| Section divider `h2`        | Crimson Pro   | 4rem     | 400    | `--light`        |
| Section divider label       | Work Sans     | 1.1rem   | 600    | `--light` (override) |
| Big statement `h2`          | Crimson Pro   | 4.5rem   | 400    | `--primary`      |
| Content slide `h2`          | Crimson Pro   | 3.5rem   | 400    | `--primary`      |
| Content slide `h3`          | Crimson Pro   | 2.5rem   | 400    | `--primary`      |
| Body paragraph `p`          | Work Sans     | 2rem     | —      | `--gray`         |
| Card `h4`                   | Crimson Pro   | 1.75rem  | 400    | `--primary`      |
| Card `p`                    | Work Sans     | 1.5rem   | —      | `--gray`         |
| Tab panel `h4`              | Crimson Pro   | 1.5rem   | —      | `--primary`      |
| Tab panel `p`               | Work Sans     | 1.2rem   | —      | `--gray`         |
| Tab button                  | Work Sans     | 1.1rem   | 600    | `--gray` / `--primary` active |
| Accordion header            | Crimson Pro   | 1.35rem  | 600    | `--dark` / `--light` open |
| Accordion body `p`          | Work Sans     | 1.15rem  | —      | `--gray`         |
| Takeaway item `p`           | Work Sans     | 1.35rem  | —      | —                |
| Smart stack `h4`            | Crimson Pro   | 1.15rem  | 400    | `--primary`      |
| Smart stack `p`             | Work Sans     | 0.95rem  | —      | —                |
| Content list `li`           | Work Sans     | 1.5rem   | —      | `--gray`         |
| Activity box `p`            | Work Sans     | 1.25rem  | —      | `--dark`         |
| Activity label              | Work Sans     | 0.8rem   | 700    | `--dark` (override) |
| Checkpoint label            | Work Sans     | 0.8rem   | 700    | `--primary`      |
| Checkpoint `p`              | Work Sans     | 1.3rem   | —      | `--dark`         |
| Sidebar title               | Work Sans     | 0.875rem | —      | `--gold`         |
| Sidebar chapter             | Work Sans     | 0.95rem  | —      | white @ 70% opacity |
| WIPPEA badge                | Work Sans     | 0.6rem   | 700    | varies           |
| Closing box `p`             | Work Sans     | 1.75rem  | —      | white @ 90%      |
| Closing box `h2`            | Crimson Pro   | 3.5rem   | 400    | `--gold` (override) |

### 2c. Text Highlight Classes

```html
<span class="highlight">blue emphasis</span>   <!-- color: --primary, font-weight: 700 -->
<span class="accent">dark emphasis</span>       <!-- color: --dark (overridden from --accent for WCAG) -->
<span class="gold">gold emphasis</span>         <!-- color: --muted-gold (overridden from --gold for WCAG) -->
<span class="mauve">mauve emphasis</span>       <!-- color: --mauve, font-weight: 700 -->
```

---

## 3. Layout Architecture

### 3a. Page Structure

```
┌─────────────────────────────────────────────────┐
│ .container (flex, 100vh, overflow: hidden)       │
│ ┌──────────┐ ┌────────────────────────────────┐ │
│ │ .sidebar  │ │ .main                          │ │
│ │ 280px     │ │ flex: 1                        │ │
│ │ fixed     │ │ ┌────────────────────────────┐ │ │
│ │           │ │ │ .progress-bar (absolute)   │ │ │
│ │ chapter   │ │ ├────────────────────────────┤ │ │
│ │ list      │ │ │ .slide (one visible)       │ │ │
│ │           │ │ │ padding: 4rem 5rem         │ │ │
│ │ resources │ │ │ centered flex column       │ │ │
│ │           │ │ ├────────────────────────────┤ │ │
│ │ counter   │ │ │ .branding-logo (absolute)  │ │ │
│ └──────────┘ │ └────────────────────────────┘ │ │
│              └────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

### 3b. Sidebar

- **Width:** 280px, collapsible (slides to `-280px` margin-left)
- **Background:** `--dark` (#004071)
- **Toggle button:** 36x36px, top-left absolute, `--dark` bg, `--light` text, 8px border-radius
- **Title:** `--gold`, uppercase, 2px letter-spacing, 2px gold bottom border at 10% opacity
- **Chapter items:** 8px border-radius, 3px transparent left border; active state gets `rgba(0,123,175,0.25)` bg + `--gold` left border
- **WIPPEA badges:** Tiny colored pills (0.6rem, 700 weight) — W=gold bg, I=primary bg, P=primary bg (override), E=gold bg, A=dark bg with gold border
- **Resources section:** Gold title, arrow-prefixed download links at 0.8rem
- **Slide counter:** Bottom, 0.875rem, 50% white opacity

### 3c. Main Content Area

- **Background (Layer 1 override):** `--muted` base with **crosshatch texture** — 24x24px grid of 1px lines at `rgba(0,64,113,0.04)`
- **Content slides:** Overlaid gradient `linear-gradient(170deg, var(--muted) 0%, var(--light) 50%, var(--offwhite) 100%)`
- **Progress bar:** 10px tall, gradient `--primary` to `--gold`, with blue glow shadow

---

## 4. Slide Types

### 4a. Title Slide (`.slide-title`)

- **Background:** `linear-gradient(90deg, var(--gold) 0%, var(--primary) 25%, var(--dark) 100%)` — geometric gold-to-blue sweep
- **Logo:** SPOKES-Logo.png, max-width 280px, white bg pad, 8px radius
- **H1:** 5rem Crimson Pro, white, `text-shadow: 0 4px 10px rgba(0,0,0,0.3)`
- **Divider:** 120px x 5px, gold → primary gradient
- **Subtitle:** 1.8rem, white, text-shadow
- **Copyright:** 0.85rem, white at 60% opacity
- **Animations:** Logo drops in (0.8s), h1 zooms in (0.8s, 0.3s delay), divider expands (0.6s, 0.7s delay), subtitle fades up (0.8s, 1s delay)

### 4b. Section Divider (`.slide-section`)

- **Background:** `linear-gradient(90deg, var(--gold) 0%, var(--primary) 25%, var(--dark) 100%)` — **bold-full-bleed** style, matches title slide gradient
- **Chapter label:** 1.1rem Work Sans, white, uppercase, 3px letter-spacing, text-shadow
- **H2:** 4rem Crimson Pro, white, text-shadow
- **Divider bar:** 100px x 5px, white, with drop shadow
- **Watermark:** `::after` pseudo-element shows `data-chapter-num` attribute (W, I, P1, P2, P3, E, A) at 28rem, white at 4% opacity, right-aligned
- **Section circle:** 280px diameter, positioned left 8%, white border, `rgba(0,0,0,0.15)` bg, heavy shadow. Contains emoji or image.
- **Animations:** Slide fades from dark→primary (0.6s), label fades down (0.5s), h2 scales in (0.6s), divider expands (0.5s), circle reveals with scale (0.7s)

### 4c. Content Slide (default `.slide`)

- **Background:** `linear-gradient(170deg, var(--muted) 0%, var(--light) 50%, var(--offwhite) 100%)`
- **Padding:** 4rem 5rem
- **Layout:** Flex column, vertically centered, overflow-y auto
- **Entry animation:** `slideIn` — fades in from 30px right (0.5s)

### 4d. Big Statement (`.big-statement`)

- **Background:** `radial-gradient(ellipse at 50% 40%, var(--muted) 0%, #ffffff 60%)`
- **Centered text, h2 at 4.5rem**, max-width 1200px
- **Body max-width:** 700px

### 4e. Video Slide (`.slide-video`)

- **Background:** Same 170deg gradient as content slides
- **H2:** 2rem, centered
- **Video container:** max-width 1200px, 16:9 aspect ratio, 12px border-radius, heavy shadow

### 4f. Closing Slide (`.slide-closing`)

- **Background:** `linear-gradient(135deg, var(--primary) 0%, var(--dark) 100%)`
- **Closing box:** `rgba(255,255,255,0.1)` bg, 20px radius, 4rem/5rem padding
- **H2:** 3.5rem, `--gold` with text-shadow (override)
- **Body:** 1.75rem italic, white at 90%
- **Confetti:** JS-generated 10px squares, fall animation over 4s
- **Animation:** `celebrateIn` — scales from 0.5 with slight rotation (0.8s)

---

## 5. Component Catalog

### 5a. Cards Grid (`.cards-grid`)

- **Layout:** CSS Grid, `repeat(2, 1fr)`, 2rem gap
- **Default card:** `--muted` bg, 12px radius, 6px solid `--accent` left border, 2rem/2.5rem padding
- **Gold variant:** `.card.gold-border` — left border is `--gold`
- **Hover:** Lifts 5px, shadow deepens; non-gold cards swap border to `--gold`, gold cards swap to `--accent`

### 5b. Takeaways (`.takeaways`)

- **Layout:** Flex column, 0.75rem gap
- **Each row:** Flex row with numbered circle + text
- **Number circle:** 40x40px, `--primary` bg, white text, 50% radius
- **Alt number:** `.takeaway-num.alt` — gold bg with dark text
- **Animation:** Numbers pop in with bouncy cubic-bezier, staggered 0.2s per item

### 5c. Smart Stack (`.smart-stack`)

- **Layout:** Flex column, 0.4rem gap
- **Letter badge:** 44x44px, `--primary` bg, 8px radius, 1.5rem bold white text
- **Alt letter:** `.smart-letter.alt` — gold bg, dark text
- **Content bar:** `--muted` bg, 8px radius, 0.5rem/1.25rem padding
- **Hover:** Row shifts 8px right; content bg → white with drop shadow

### 5d. Matrix Grid (`.matrix-grid`)

- **Layout:** CSS Grid, 2x2, 1.5rem gap
- **Cell padding:** 1.5rem, 16px radius, centered flex column
- **Cell variants:**
  - `.do-first` — `--primary` bg, white text
  - `.schedule` — `--accent` bg, `--dark` text (WCAG fix)
  - `.delegate` — `--gold` bg, `--dark` text
  - `.eliminate` — `--muted` bg, `--gray` text, 2px `--offwhite` border
- **Label:** 0.8rem uppercase, 2px letter-spacing
- **Action text:** 2rem Crimson Pro heading font

### 5e. Flip Cards (`.dangers-grid`)

- **Layout:** Flex row, 1.5rem gap, equal-width children
- **Card height:** 200px, perspective 1000px
- **Front:** `--dark` bg, white text, emoji icon at 2.5rem
- **Back:** `--gold` bg, dark text, revealed on hover via `rotateY(180deg)`
- **Hover effect:** Lifts 4px + gold glowing drop-shadow pulse

### 5f. Area Cards (`.areas-grid`)

- **Layout:** Flex row, 2rem gap, equal-width
- **Default card:** `--primary` bg, white text, 16px radius, 2rem padding
- **Gold variant:** `.area-card.gold-card` — `--gold` bg, dark text
- **Icon circle:** 60px, `--accent` bg (or `--dark` bg on gold cards), centered
- **List bullets:** Gold arrows (or dark on gold cards)
- **Hover:** Scales to 1.03 with bouncy easing + deeper shadow

### 5g. Tabs (`.tabs-container`)

- **Nav:** Flex row, 0.5rem gap
- **Button:** 2px `--offwhite` border (no bottom), 10px top radius, `--muted` bg
- **Active button:** White bg, `--primary` border, overlaps panel border by -2px
- **Panel:** 2px `--primary` border, 0/12/12/12 radius, white bg, 2rem padding
- **List items:** Arrow prefix (`→`) in `--gold`

### 5h. Accordion (`.accordion`)

- **Item:** 2px `--offwhite` border, 10px radius
- **Open item:** Border changes to `--primary`
- **Header:** `--muted` bg, Crimson Pro 1.35rem; opens to `--primary` bg + white text
- **Arrow:** Rotates 180deg on open
- **Body:** Max-height 0 → 500px transition, 1.25rem/1.5rem padding when open
- **List items:** Arrow prefix (`→`) in `--gold`

### 5i. Checkpoint (`.checkpoint-box`)

- **Background:** `rgba(0,123,175,0.06)`
- **Border:** 2px solid `--primary`, 12px radius
- **Label:** 0.8rem uppercase, `--primary`, 2px letter-spacing
- **Body:** 1.3rem, `--dark`

### 5j. Activity Box (`.activity-box`)

- **Background:** `rgba(211,178,87,0.1)`
- **Border:** 2px solid `--gold`, 12px radius
- **Label:** 0.8rem uppercase, `--dark` (override from gold for WCAG), 2px letter-spacing
- **Body:** 1.25rem, `--dark`

### 5k. Split Layout (`.split-layout`)

- **Layout:** Flex row, 4rem gap, centered
- **Text side:** flex: 1
- **Visual side:** flex: 0 0 300px
- **Visual circle:** 250px diameter, gradient `--primary` → `--dark`, centered emoji at 5rem

### 5l. Video Grid (`.video-grid`)

- **Layout:** CSS Grid, 2 columns, 1.5rem gap, max-width 1000px centered
- **Videos:** 100% width, 10px radius, shadow
- **Captions:** 0.95rem, `--gray`

### 5m. Download Resource (`.download-resource`)

- **Layout:** Flex row with wrap, 1rem gap
- **Background:** `rgba(0,123,175,0.06)`, 1px border at 10% primary, 12px radius
- **Prompt text:** 0.9rem italic, `--gray`
- **Download button:** `--dark` bg (override), white text, 8px radius

### 5n. Content List (`.content-list`)

- **List items:** 1.5rem, `--gray`, 2rem left padding
- **Arrow prefix:** `→` in `--accent`
- **Danger variant:** `.content-list.danger` — `⚠` prefix in `--gold`

---

## 6. Two-Layer Theme System

### Layer 1 — Lesson Identity (constant across all slides)

| Property           | Value                                                        |
|--------------------|--------------------------------------------------------------|
| Color Lead         | **dual-blue-green** — `--primary` for headings, `--accent` in gradients |
| Font Pairing       | **Crimson Pro** (headings) + **Work Sans** (body)            |
| Background Texture | **Crosshatch** — 24px grid, `rgba(0,64,113,0.04)` lines on `--muted` |
| Title Slide        | **Top-banner** — horizontal gold→primary→dark gradient       |
| Divider Style      | **Bold-full-bleed** — same gradient as title, white text + divider |
| Sidebar Color      | `--dark` (#004071) — default                                 |

### Layer 2 — Chapter Variation (rotates per chapter)

| Chapters  | Card Style         | Description                                             |
|-----------|--------------------|---------------------------------------------------------|
| 1, 3, 7   | **shadow-float**   | White bg, no left border, 3px `--primary` top border, soft drop shadow (0 4px 15px), rounded 10px |
| 2, 5      | **left-border**    | Default base style — `--muted` bg, 6px colored left border |
| 4, 6      | **layered**        | White bg, 1px `--offwhite` border, offset drop shadow (4px 4px 0) in primary-tinted rgba |

| Chapters  | Secondary Accent   | Effect                                                   |
|-----------|--------------------|---------------------------------------------------------|
| 1, 3, 5, 7 | **primary (default)** | Gold borders stay gold, alt nums are gold bg           |
| 2, 4, 6   | **mauve**          | `.gold-border` cards use `--mauve` instead; `.takeaway-num.alt` uses `--mauve` bg with white text |

---

## 7. Animations

### 7a. Entry Animations

| Animation       | Keyframes                     | Duration | Easing    | Applied To              |
|-----------------|-------------------------------|----------|-----------|-------------------------|
| `slideIn`       | Fade from right (30px)        | 0.5s     | ease-out  | All slides on activate  |
| `fadeUp`        | Fade from below (20px)        | 0.5s     | ease-out  | Cards, items, h2        |
| `dropIn`        | Drop from top (-100px) + scale| 0.8s     | ease-out  | Title logo              |
| `zoomIn`        | Scale from 0.5                | 0.8s     | ease-out  | Title h1                |
| `expandWidth`   | Width 0 → 120px              | 0.6s     | ease-out  | Divider bars            |
| `sectionSlideIn`| Bg dark→primary               | 0.6s     | ease-out  | Section dividers        |
| `fadeDown`       | Fade from above (-30px)       | 0.5s     | ease-out  | Chapter labels          |
| `scaleIn`       | Scale from 0.8               | 0.6s     | ease-out  | Section h2              |
| `circleReveal`  | Scale from 0.7               | 0.7s     | ease-out  | Section circles         |
| `celebrateIn`   | Scale 0.5 + rotate(-5deg)    | 0.8s     | ease-out  | Closing box             |
| `confettiFall`  | TranslateY(100vh) + 720deg   | 4s       | ease-in-out | Confetti pieces       |

### 7b. Staggered Delays

Cards, takeaway items, smart rows, danger cards, matrix cells, and area cards all use staggered `animation-delay`:
- 1st child: 0.1s
- 2nd child: 0.2s
- 3rd child: 0.3s
- 4th child: 0.4s
- 5th child: 0.5s
- 6th child: 0.6s (takeaways only)

Takeaway number circles use separate staggered `transition-delay` (0.2s increments) with a bouncy cubic-bezier `(0.68, -0.55, 0.265, 1.55)`.

### 7c. Hover Effects

| Component       | Effect Name        | Behavior                                                  |
|-----------------|--------------------|-----------------------------------------------------------|
| Cards           | Edge Glow Lift     | -5px Y, deeper shadow, border color swaps (primary↔gold)  |
| Area Cards      | Push-in Scale      | scale(1.03), deeper shadow, z-index bump                  |
| Flip Cards      | Magnetic Pulse     | -4px Y + gold glowing drop-shadow                         |
| Scenario Cards  | Side-Breeze        | +6px X, warm gold tint bg, offset shadow                  |
| Smart Rows      | Shift Edge         | +8px X, content bg → white with drop shadow               |
| Matrix Cells    | Enhanced Lift      | -8px Y, scale(1.02), brightness(1.12), heavier shadow     |
| Download Btn    | Depress            | -2px Y + colored glow shadow; active: scale(0.97)         |
| Tab Button      | Tint               | `rgba(0,123,175,0.08)` bg + primary text color            |
| Accordion Header| Tint               | Same rgba tint as tabs                                    |

---

## 8. Responsive Breakpoints

| Breakpoint     | Changes                                                          |
|----------------|------------------------------------------------------------------|
| ≤ 1024px       | Cards grid → 1 column; matrix → 1 column; dangers-grid wraps; section circle → 180px, left 5%; areas-grid stacks vertical |
| ≤ 768px        | Slide padding → 2rem; title h1 → 3rem; h2 → 2rem; tab nav wraps; video grid → 1 column |
| ≤ 480px        | Title h1 → 2.2rem; dangers-grid stacks vertical; big-statement h2 → 2rem |

---

## 9. Accessibility Features

- **Focus outlines:** 3px solid `--gold` with 2px offset on all interactive elements (tabs, accordions, buttons, sidebar toggle)
- **Resource links:** 2px gold outline on focus-visible
- **Keyboard navigation:** Left/right arrow keys navigate slides; sidebar items are clickable
- **WCAG AA compliance:** All text/background pairs verified ≥ 4.5:1 for normal text, ≥ 3:1 for large text
- **Semantic HTML:** `<nav>` for sidebar, `<main>` for content, `<section>` for slides
- **Screen reader:** Logo alt text includes full SPOKES acronym expansion

---

## 10. Slide Inventory

**33 slides across 7 WIPPEA chapters:**

| Ch | WIPPEA | Name                               | Slides | Slide Types Used                    |
|----|--------|------------------------------------|--------|-------------------------------------|
| 1  | W      | Warm-Up                            | 2      | title, content (split-layout + activity-box + download) |
| 2  | I      | Introduction                       | 5      | section-divider, content (cards-grid), content (cards-grid), video, big-statement |
| 3  | P1     | Active Listening                   | 7      | section-divider, content (tabs), content (smart-stack), video, content (flip-cards), content (tabs), video |
| 4  | P2     | Communication Styles               | 5      | section-divider, content (tabs), content (cards-grid), content (accordion), content (matrix-grid + flip-cards) |
| 5  | P3     | Self-Advocacy & Congruent Messaging| 7      | section-divider, content (cards-grid), content (smart-stack), content (accordion), content (takeaways + activity-box), content (video-grid), video |
| 6  | E      | Evaluation                         | 2      | section-divider, content (checkpoint + activity-box + download) |
| 7  | A      | Application                        | 5      | section-divider, content (areas-grid), closing |

**Interactive components used (8 total):** Tabs (3x), Accordion (2x), Flip Cards (2x), Matrix Grid (1x), Smart Stack (2x), Video Grid (1x), Checkpoint (1x), Prompt/Activity Toggles (throughout)

---

## 11. Key Design Principles Summary

1. **Dual-blue-green identity** — `--primary` and `--accent` drive the visual personality; gold is the accent sparkle
2. **Crosshatch texture** — Subtle 24px grid gives the content area a refined, textured feel distinct from other lessons
3. **Bold-full-bleed dividers** — Section transitions use the same dramatic gold→blue→dark gradient as the title slide, creating strong visual continuity
4. **Chapter variation through card styles** — Shadow-float (odd chapters) vs layered (even chapters) keeps visual freshness without changing the color system
5. **Mauve as secondary accent** — Even-numbered chapters get `--mauve` touches on alternating elements, adding warmth without clashing with the blue-green lead
6. **WCAG-first overrides** — Multiple accessibility fixes are baked into the theme layer, not patched after the fact
7. **Rich hover vocabulary** — Each component type has its own named hover effect (Edge Glow, Magnetic Pulse, Side-Breeze, etc.) for tactile interactivity
