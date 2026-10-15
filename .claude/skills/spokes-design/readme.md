# SPOKES Design System

**SPOKES** — *Strategic Planning in Occupational Knowledge for Employment and
Success — Skills for Life* — is a **West Virginia Adult Basic Education** program.
Its flagship digital product is the **interactive HTML lesson**: a single,
self-contained classroom slideshow built around the **WIPPEA** instructional
framework. This design system captures the brand foundations, reusable
components, slide types, and a working recreation of that lesson experience so
new lessons and supporting materials stay perfectly on-brand.

This is an educational/institutional brand: calm, trustworthy, and professional,
with a navy-and-gold "civic" feel warmed by a bright teal-blue and a friendly
green. It is **not** a consumer-tech brand — avoid startup gradients, neon, and
emoji-as-decoration.

---

## Sources

Everything here was derived from the attached **`SPOKES Builder/`** codebase (the
lesson-builder toolkit), read-only, mounted via the File System Access API:

| File | What it gave us |
| --- | --- |
| `brand-palette.md` | Canonical 11-color palette, contrast table, prohibited colors |
| `template.html` | The production lesson skeleton — all base CSS + the navigation engine |
| `theme-library.css` | The two-layer theme system: 8 card styles, 5 dividers, 12 title slides, 6 textures, 9 color leads |
| `theme-registry.json` | Per-lesson theme package assignments |
| `components.md` | Every slide type and content component, with copy-paste HTML |
| `font-pairings.md` | 20 curated Google-Font heading/body pairings |
| `AGENT_THEMING_GUIDELINES.md`, `build-process.md`, `CLAUDE.md` | Build workflow, WIPPEA mapping, brand-compliance rules |
| `content-intake-template.md` | How content teams deliver lesson material |
| `ppt-to-spokes/SKILL.md` | Converting external PowerPoint slides into SPOKES sections |

> No logo, font, or video binaries were in the original source; the SPOKES
> **logo was later supplied by the user** and now lives at
> `assets/SPOKES-Logo.png` (and embedded in the `SpokesLogo` component).
> Webfonts load from **Google Fonts** (the program's own approach).

---

## The product: how a SPOKES lesson works

- **WIPPEA structure** — every lesson is 7+ chapters: **W**arm-Up, **I**ntroduction,
  **P**resentation 1/2/3, **E**valuation, **A**pplication. Target 25–35 slides.
- **Auto-building sidebar** — the nav reads each slide's `data-chapter` and builds
  the chapter/slide tree itself, with a colored WIPPEA badge per stage.
- **Two-layer theme system** — *Layer 1* (lesson identity: color lead, sidebar
  color, background texture, title-slide design, font pairing) stays constant
  across a lesson; *Layer 2* (card style, divider style, lead component, accent)
  rotates per chapter for visual freshness. Packages are pre-approved in
  `theme-registry.json` — the builder applies, never invents.
- **Signature slide elements** — a giant faded watermark letter on every section
  divider, and a gold-ringed image circle relating to the chapter topic.
- **Delight** — staggered entry animations, a gradient progress bar, and a
  confetti + 3-note chord on the closing slide. All motion respects
  `prefers-reduced-motion`.

---

## CONTENT FUNDAMENTALS

How SPOKES writes copy — for adult learners, warm but never childish.

- **Voice & person** — second person, direct: *"Where does your time go?"*,
  *"Make the most of every hour."* Instructions address the learner ("List
  everything you did…"). Framing statements are declarative and values-based.
- **Tone** — encouraging, plain-spoken, motivating. Professional but human.
  Congratulatory at the close: *"Congratulations, you have completed this lesson!"*
- **Casing** — Title Case for slide/lesson titles and card headings; sentence
  case for body copy and instructions; UPPERCASE (with wide letter-spacing) only
  for small eyebrows/labels ("PRESENTATION", "GROUP ACTIVITY", "RESOURCES").
- **Length** — short. Big-statement slides are 1–2 sentences. Card bodies are one
  idea. Matrix labels 3–4 words, action words 1–2 words. Bullets are phrases.
- **Emphasis** — a few colored words per statement via `.highlight` (blue key
  terms), `.accent` (green positive), `.gold` (transitions), `.mauve` (caution).
  Never more than one or two per line.
- **Structure words** — "Watch:" prefixes every video title; "Exit Ticket" for
  evaluation; activity labels like "Discussion", "Reflection", "Partner Work".
- **Emoji** — used as **content icons** inside components (flip-card fronts, area
  cards, split visuals) and confetti, drawn from a small practical set (🕐 ⏳ 📱 ✅
  🎯 ⚠️). Not used decoratively in running text or headings.
- **Quotes** — lessons end on an inspirational, topical quote (attributed when
  known). Keep them classroom-appropriate.

---

## VISUAL FOUNDATIONS

- **Color** — an 11-color palette (see `tokens/colors.css`). Core: teal-blue
  `--primary #007baf`, green `--accent #37b550`, navy `--dark #004071`, gold
  `--gold #d3b257`, plus white/muted/gray. Extended: deep navy `--royal`, warm
  `--mauve`, `--offwhite`, and `--muted-gold`. **No color outside this set** is
  ever permitted; opacity variations are fine. Green and full gold **fail AA on
  white for text** — use `--muted-gold` and the added `--accent-text #1e7a2e` for
  green/gold *text* on light grounds.
- **Type** — serif **display** for all headings + geometric **sans** for
  everything else. Default pairing **DM Serif Display + Outfit**; each lesson
  picks one of 20 curated pairings (`font-pairings.md`) — the two family
  variables swap, the scale stays. Headings are `font-weight: 400` (the serif has
  one weight). Large scale: title h1 5rem, section 4rem, slide h2 3.5rem.
- **Backgrounds** — content areas use soft diagonal light gradients
  (`--grad-slide-bg`) or one of six subtle textures (dot-grid, diagonal,
  crosshatch, soft-gradient, dark-royal, plain). Title/section/closing slides use
  navy→teal or navy→royal **gradients**. Statements sit on a soft radial. No
  photographic full-bleeds by default (except the section image circle).
- **Corners** — generous: default cards 12px, matrix/area 16px, closing box 20px,
  pills 24px, circles 50%. The `sharp-border` chapter style drops to 0 for
  contrast.
- **Cards** — the theme system rotates **8 treatments**: left-border (default,
  6px green/gold accent on muted), shadow-float, sharp-border, glass, pill,
  outlined, gradient-fill, and layered (hard offset shadow). See the "Card
  Styles" specimen and `tokens/effects.css`.
- **Shadows** — soft and **navy-tinted** (`rgba(0,64,113,…)`), not neutral gray.
  Elevation ladder sm→lg; hover lifts a card 5px with `--shadow-hover`; matrix
  cells pop 8px + brighten. The `layered` style uses a hard `4px 4px 0` offset.
- **Motion** — entrances are gentle fades/slide-ups (`fadeUp`, `slideIn`) with
  0.1–0.6s staggers; numbers pop in on a spring (`--ease-spring`); dividers
  expand in width; section circles scale in. Nothing loops. View Transitions
  cross-fade between slides where supported. Everything is disabled under
  reduced-motion.
- **Hover / press** — links & chapters lighten (white text, translucent white
  fill). Buttons **lift 2px + gain a colored glow** on hover and **settle +
  shrink to 0.97** on press. Cards lift; flip cards rotate 180° to a gold back.
- **Borders & dividers** — hairline `--offwhite` for structure; **gold** for
  brand dividers and the title/section rule; the sidebar uses translucent white
  hairlines on navy.
- **Transparency & blur** — translucent white on dark surfaces (sidebar states,
  closing box `rgba(255,255,255,0.1)`); the `glass` card style uses
  `backdrop-filter: blur(16px) saturate(1.8)`.
- **Layout** — fixed 280px navy sidebar (collapsible to a 52px rail) + fluid
  light stage. Slides pad 4rem × 5rem and center their content vertically. A
  fixed progress bar sits at the top of the stage; a corner brand mark and a
  center nav hint float at the bottom.

---

## ICONOGRAPHY

SPOKES has **no icon font or SVG icon set**. Icons are **HTML entity glyphs and
emoji**, used deliberately as content, never as hand-drawn decoration:

- **UI marks (unicode entities)** — `→` `&#8594;` (list arrows), `↓` `&#8593;`
  (download), `▶` `&#9654;` (video/play), `⚠` `&#9888;` (danger list), `«` `»`
  (sidebar collapse), `☰` (menu), `▶`/rotated (chapter expand arrow).
- **Content icons (emoji)** — flip-card fronts, area-card circles, and split
  visuals take a topical emoji (🕐 ⏳ 📱 🔄 🙋 ⚙ ⚖ 🎯 💡 💪 ✅ 🚀). `components.md`
  lists the common entity codes.
- **Chapter image circles** — the one place SPOKES uses **photography**: each
  section divider holds a round, gold-ringed topical photo (placed by the content
  team). Here we use emoji placeholders; swap in real images per lesson.
- **The logo** — the official SPOKES mark: the **New River Gorge bridge** arcing
  over green West Virginia mountains, above the blue "SPOKES" wordmark and the
  green italic "Skills for Life" tagline. Full-color on transparent ground — use
  as-is on light grounds, on a **white rounded plate** over navy/royal. Component
  `SpokesLogo` (raw file `assets/SPOKES-Logo.png`); `SpokesWordmark` remains as a
  CSS-only fallback.

See the **Brand › Iconography** specimen card. No new SVG icons were drawn; when
icons are needed, use these glyphs or a topical photo.

---

## Foundations & tokens

Consumers link one file: **`styles.css`** (an `@import` manifest). It pulls in:

- `tokens/fonts.css` — Google-Font imports (default + curated pairings)
- `tokens/colors.css` — the 11 palette colors, `--accent-text`, semantic aliases
- `tokens/typography.css` — font families, type scale, weights, line heights
- `tokens/spacing.css` — spacing scale + slide-layout metrics
- `tokens/effects.css` — radii, navy-tinted shadows, signature gradients, glass, motion

---

## Index / Manifest

**Root**
- `styles.css` — global entry point (link this)
- `readme.md` — this guide
- `SKILL.md` — Agent-Skill front matter for reuse in Claude Code
- `tokens/` — colors, typography, fonts, spacing, effects
- `assets/` — `SPOKES-Logo.png` (official logo)

**Components** (`window.SPOKESDesignSystem_8b5e5e.*`, React)
- `components/controls/` — `Button` (primary/download/video), `WippeaBadge`,
  `ActivityBox`, `DownloadResource`, `SpokesLogo`, `SpokesWordmark`
- `components/content-blocks/` — `Card`, `AreaCard`, `DangerCard` (flip),
  `ContentList`, `VisualCircle`
- `components/frameworks/` — `Takeaways`, `SmartStack`, `Matrix` (2×2),
  `SplitLayout`, `BigStatement` + `Emphasis`

**Slides** (`slides/` — 1280×720 specimen frames)
- Title · Section Divider · Cards · Matrix · Big Statement · Closing

**Premium** (editorial-executive elevation)
- `tokens/premium.css` — refined surface extension, hairlines, scrims, glass, grain, editorial type
- `premium/` — 10 premium slide specimens (title, section, glass, statement, split, agenda, matrix, metrics, video, closing)
- `ui_kits/premium-lesson/` — interactive premium deck with live Tweaks (type · cover tone · motion)

**Documents** (`documents/` — print-ready Letter)
- `worksheet.card.html` — branded lesson worksheet/handout
- `certificate.card.html` — certificate of completion (landscape)

**UI Kit** (`ui_kits/lesson/`)
- `index.html` — the interactive SPOKES lesson viewer (Time Management sample)
- `slides.jsx`, `LessonViewer.jsx`, `README.md`
- `content-slide.starting.html` — a blank content slide starting point

**Specimen cards** (`guidelines/`) — Colors, Type, Spacing, Effects, Brand

---

## Caveats / to make it perfect

- **Fonts load from Google Fonts CDN**, not self-hosted binaries (matches the
  program's setup). Upload `.woff2` files if you need offline/self-hosted fonts.
- **Section-circle images** are emoji placeholders — the real lessons use topical
  photos. Provide the imagery library if you want real specimens.
- The full production **theme system** (8 card styles × per-chapter rotation, 12
  title-slide designs, 6 textures) is documented in `tokens/effects.css` and
  `SPOKES Builder/theme-library.css`; the React components and UI kit render the
  **default blue-led** treatment.
