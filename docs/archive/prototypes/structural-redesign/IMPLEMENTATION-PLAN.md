# Structural Redesign Prototype — Implementation Plan

> Full 33-slide rebuild of "Communicating with the Public" using distinct structural archetypes.
> Output: `prototype-structural-redesign-full/index.html`

---

## Scope Rules

- **Prototype only.** Never modify anything inside `lesson-communicating-with-the-public/`.
- **Concept pilot preserved.** The existing `prototype-structural-redesign/index.html` is untouched — this plan outputs to a sibling folder `prototype-structural-redesign-full/`.
- **Content parity.** Every slide in the live lesson has a 1:1 counterpart. No slides added, removed, or reordered.

---

## Amendment 1 — Chapter Names (Source of Truth: HTML Section Dividers)

The STYLING-GUIDE.md section names are stale. The implementation uses the names from the live lesson's `chapterNames` object and `<h2>` divider headings:

| Chapter | data-chapter | Badge | Name (from HTML) |
|---------|-------------|-------|-------------------|
| 1 | 1 | W | Warm-Up |
| 2 | 2 | I | Why Communication Matters |
| 3 | 3 | P1 | Elements of Communication |
| 4 | 4 | P2 | Communication Styles |
| 5 | 5 | P3 | Self-Advocacy |
| 6 | 6 | E | Reflect & Assess |
| 7 | 7 | A | Apply Your Skills |

The `chapterNames` JS object in the prototype must match these exactly.

---

## Amendment 2 — Asset Path Strategy (No File Duplication)

All media references use relative paths back to the live lesson folder. No videos, images, handouts, or fonts are copied into the prototype.

### Video Paths

| Slide | File | Prototype Path |
|-------|------|----------------|
| 6 | importance_of_effective_communication.mp4 | `../lesson-communicating-with-the-public/videos/importance_of_effective_communication.mp4` |
| 11 | communication_cycle.mp4 | `../lesson-communicating-with-the-public/videos/communication_cycle.mp4` |
| 14 | effective_communication_workplace.mp4 | `../lesson-communicating-with-the-public/videos/effective_communication_workplace.mp4` |
| 19a | poor_customer_service_satire.mp4 | `../lesson-communicating-with-the-public/videos/poor_customer_service_satire.mp4` |
| 19b | poor_customer_service_scenario.mp4 | `../lesson-communicating-with-the-public/videos/poor_customer_service_scenario.mp4` |
| 19c | bad_customer_service.mp4 | `../lesson-communicating-with-the-public/videos/bad_customer_service.mp4` |
| 19d | bad_customer_service_rep.mp4 | `../lesson-communicating-with-the-public/videos/bad_customer_service_rep.mp4` |
| 28 | self_advocacy_state_of_mind_tedx.mp4 | `../lesson-communicating-with-the-public/videos/self_advocacy_state_of_mind_tedx.mp4` |

### Handout Paths

All handout `href` values prefix with `../lesson-communicating-with-the-public/`:

```
../lesson-communicating-with-the-public/Handouts/Communicating with the Public 2026 Handouts.pdf
```

Page anchors (`#page=3`, `#page=7`, etc.) are preserved as-is.

### Logo / Images

```
../lesson-communicating-with-the-public/SPOKES-Logo.png
```

---

## Amendment 3 — Navigation Engine (Verbatim Port)

The SPOKES Navigation Engine from `lesson-communicating-with-the-public/index.html` (lines 2508–2787) is copied verbatim into the prototype. The **only** change is the `chapterNames` object (updated to match Amendment 1 — which is already identical to the live lesson's values).

The engine includes:
- Slide counter + progress bar
- Sidebar chapter tree with expand/collapse
- Keyboard navigation (arrow keys, spacebar)
- Touch/swipe support
- View Transitions API with reduced-motion respect
- Content reveal observer (`.reveal-item` animation)
- Closing slide confetti + sound
- Interactive component handlers (`switchTab`, `toggleAccordion`)
- Responsive sidebar collapse on mobile

**Do not modify the engine.** If structural archetypes need custom interactions (e.g., a flip-card), add them as standalone functions below the engine block.

---

## Amendment 4 — CSS/Styling Strategy (Hybrid Approach)

### Keep from the live lesson:
- Full SPOKES color system (all 11 CSS variables + opacity variations)
- Typography stack: Crimson Pro (display), Work Sans (body), IBM Plex Mono (mono)
- WIPPEA badge colors and sidebar styling
- Section divider gradient + watermark pattern
- Dark theme media query structure

### Create new for the prototype:
- **Archetype-specific layout classes** — each structural archetype gets its own CSS class rather than reusing the live lesson's generic `.split-layout`, `.cards-grid`, etc.
- New layout CSS is additive: it does not override or delete any inherited SPOKES class. If a SPOKES class works as-is for an archetype, use it.

### Archetype CSS class naming convention:
```
.arch-{name}          /* container */
.arch-{name}__element /* child */
```

Examples: `.arch-video`, `.arch-comparison`, `.arch-statement`, `.arch-activity`, `.arch-checkpoint`

---

## Amendment 5 — Handout Inventory (8 Links, 5 Slides)

Every download link in the live lesson is tracked here. All must appear in the prototype on the same slide.

| Slide | Link Text | PDF Page | Appears In Chapter |
|-------|-----------|----------|--------------------|
| 2 | Personal Listening Assessment | `#page=3` | Ch 1 — Warm-Up |
| 20 | Role-Play Scenarios | `#page=7` | Ch 4 — Communication Styles |
| 20 | Evaluation Form | `#page=10` | Ch 4 — Communication Styles |
| 27 | Self-Advocacy Organizer | `#page=30` | Ch 5 — Self-Advocacy |
| 27 | Self-Advocacy for Adults | `#page=32` | Ch 5 — Self-Advocacy |
| 30 | Personal Listening Assessment | `#page=3` | Ch 6 — Evaluation |
| 32 | All Handouts (PDF) | *(full file)* | Ch 7 — Application |
| 32 | Back-to-Back Drawing | `#page=12` | Ch 7 — Application |

### Sidebar resource tray (lines 1763–1769)

The sidebar resource panel also lists 7 links. These must be ported to the prototype sidebar:
1. All Handouts (PDF)
2. Personal Listening Assessment (`#page=3`)
3. Role-Play Scenarios (`#page=7`)
4. Role-Play Evaluation Form (`#page=10`)
5. Back-to-Back Drawing (`#page=12`)
6. Self-Advocacy Organizer (`#page=30`)
7. Self-Advocacy for Adults (`#page=32`)

---

## Amendment 6 — Output Folder

All build output goes to:
```
prototype-structural-redesign-full/
├── index.html          ← single-file prototype (inline CSS + JS)
└── README.md           ← brief description linking back to this plan
```

The existing concept pilot at `prototype-structural-redesign/index.html` is preserved as a reference.

---

## Complete Slide Inventory & Archetype Map

Each slide maps to a **structural archetype** — a layout pattern optimized for one dominant teaching job.

| # | Chapter | HTML Comment Title | Archetype | Notes |
|---|---------|-------------------|-----------|-------|
| 1 | 1 – Warm-Up | Title | `title` | Logo, title, subtitle, copyright |
| 2 | 1 – Warm-Up | Personal Listening Assessment (Pre) | `activity` | Handout: Personal Listening Assessment |
| 3 | 2 – Why Comm Matters | *Section Divider* | `divider` | Emoji circle, chapter label, heading |
| 4 | 2 – Why Comm Matters | What is Communication? | `concept-split` | Definition + visual split layout |
| 5 | 2 – Why Comm Matters | Workplace Communication Stats | `stat-wall` | Statistical cards grid |
| 6 | 2 – Why Comm Matters | Video: Importance of Effective Comm | `video` | Single video, full-stage (GUARDRAILS default) |
| 7 | 2 – Why Comm Matters | Big Statement | `statement` | Quote/emphasis slide |
| 8 | 3 – Elements of Comm | *Section Divider* | `divider` | |
| 9 | 3 – Elements of Comm | Encoding & Decoding | `concept-pair` | Two-card comparison (Sender / Receiver) |
| 10 | 3 – Elements of Comm | The Communication Cycle | `diagram` | Cycle visualization with step cards |
| 11 | 3 – Elements of Comm | Video: Communication Cycle | `video` | Single video |
| 12 | 3 – Elements of Comm | Hearing vs. Listening | `concept-pair` | Two-column compare |
| 13 | 3 – Elements of Comm | Listening Skills | `list-deep` | Cards with reveal animation |
| 14 | 3 – Elements of Comm | Video: Effective Comm in Workplace | `video` | Single video |
| 15 | 3 – Elements of Comm | Checkpoint | `checkpoint` | Comprehension check |
| 16 | 4 – Comm Styles | *Section Divider* | `divider` | |
| 17 | 4 – Comm Styles | Three Communication Styles | `tabbed` | Tabs: Verbal / Body / Voice |
| 18 | 4 – Comm Styles | Congruent Messages | `concept-split` | Split layout explanation |
| 19 | 4 – Comm Styles | Bad Communication Examples | `comparison` | 2×2 video grid (GUARDRAILS exception) |
| 20 | 4 – Comm Styles | Role-Play Scenarios | `activity` | Handouts: Role-Play Scenarios + Evaluation Form |
| 21 | 5 – Self-Advocacy | *Section Divider* | `divider` | |
| 22 | 5 – Self-Advocacy | What is Self-Advocacy? | `concept-split` | Definition + visual |
| 23 | 5 – Self-Advocacy | Self-Advocacy in Action | `example-gallery` | Scenario cards |
| 24 | 5 – Self-Advocacy | Why Self-Advocacy Matters | `stat-wall` | Impact cards |
| 25 | 5 – Self-Advocacy | Building Self-Advocacy Skills | `accordion` | Expandable skill sections |
| 26 | 5 – Self-Advocacy | Tips for Effective Self-Advocacy | `tip-list` | Numbered tips |
| 27 | 5 – Self-Advocacy | Self-Advocacy Resources | `resource-hub` | Links + Handouts: SA Organizer + SA for Adults |
| 28 | 5 – Self-Advocacy | Video: Self-Advocacy TEDx | `video` | Single video |
| 29 | 6 – Evaluation | *Section Divider* | `divider` | |
| 30 | 6 – Evaluation | Post-Assessment | `activity` | Handout: Personal Listening Assessment (Post) |
| 31 | 7 – Application | *Section Divider* | `divider` | |
| 32 | 7 – Application | Self-Advocacy Binder Project | `activity` | Handouts: All Handouts + Back-to-Back Drawing |
| 33 | 7 – Application | Closing | `closing` | Summary, confetti, sound |

---

## Structural Archetypes Reference

| Archetype | Teaching Job | Key Layout Feature |
|-----------|-------------|-------------------|
| `title` | Brand entry point | Centered logo, heading, subtitle |
| `divider` | Chapter transition | Gradient bar, emoji circle, WIPPEA label |
| `video` | Focused watching | Title + intro above, full-stage video below |
| `comparison` | Multi-example contrast | 2×2 video grid with captions |
| `statement` | Emphasis/quote | Large centered text, minimal decoration |
| `concept-split` | Definition + visual | Two-column: text left, visual/diagram right |
| `concept-pair` | Side-by-side contrast | Two equal cards for compare/contrast |
| `stat-wall` | Data impact | Grid of metric cards |
| `diagram` | Process visualization | Central visual with labeled steps |
| `list-deep` | Detailed enumeration | Cards with depth, reveal animation |
| `tabbed` | Multi-category content | Tab navigation between panes |
| `accordion` | Progressive disclosure | Collapsible sections |
| `checkpoint` | Comprehension check | Pause prompt with review questions |
| `activity` | Hands-on practice | Instructions + handout download |
| `tip-list` | Quick reference | Numbered items, scannable |
| `example-gallery` | Scenario showcase | Cards with real-world examples |
| `resource-hub` | Reference collection | Links, downloads, external resources |
| `closing` | Wrap-up celebration | Summary + confetti animation |

---

## Build Phases

### Phase 1 — Scaffold (single HTML file)
1. Create `prototype-structural-redesign-full/index.html`
2. Port the SPOKES color system, typography, and base CSS
3. Port the navigation engine verbatim (lines 2508–2787)
4. Port the sidebar HTML structure + resource tray
5. Create all 33 `<section class="slide">` elements with correct `data-chapter` attributes and placeholder headings
6. Verify: navigation works, all 33 slides reachable, sidebar chapters correct

### Phase 2 — Archetype CSS
1. Define each archetype's layout CSS using `.arch-{name}` naming
2. Keep styles additive — build on inherited SPOKES classes
3. Test each archetype with placeholder content

### Phase 3 — Content Population
1. Populate slides 1–7 (Chapters 1–2): title, activity, divider, concept-split, stat-wall, video, statement
2. Populate slides 8–15 (Chapter 3): divider, concept-pair, diagram, video, concept-pair, list-deep, video, checkpoint
3. Populate slides 16–20 (Chapter 4): divider, tabbed, concept-split, comparison, activity
4. Populate slides 21–28 (Chapter 5): divider, concept-split, example-gallery, stat-wall, accordion, tip-list, resource-hub, video
5. Populate slides 29–33 (Chapters 6–7): divider, activity, divider, activity, closing

### Phase 4 — Verification
1. All 33 slides render with correct content
2. All 8 video sources load via relative paths
3. All 8 handout downloads work via relative paths
4. Sidebar resource tray lists all 7 handout links
5. Navigation engine operates identically to live lesson
6. Section divider gradients and WIPPEA badges display correctly
7. Dark theme / reduced-motion media queries function
8. No files duplicated from `lesson-communicating-with-the-public/`
