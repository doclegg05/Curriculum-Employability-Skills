---
name: spokes-design
description: Use this skill to generate well-branded interfaces and assets for SPOKES (Strategic Planning in Occupational Knowledge for Employment and Success — Skills for Life, a WV Adult Basic Education program), either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping, plus the WIPPEA lesson structure and two-layer theme system.
user-invocable: true
---

Read the `readme.md` file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## Where things live
- `styles.css` — the one stylesheet to link; it `@import`s all tokens + fonts.
- `tokens/` — colors (the canonical 11-color palette + semantic aliases), typography, fonts, spacing, effects.
- `components/` — React UI primitives, grouped: `controls/` (Button, WippeaBadge, ActivityBox, DownloadResource, SpokesLogo, SpokesWordmark), `content-blocks/` (Card, AreaCard, DangerCard, ContentList, VisualCircle), `frameworks/` (Takeaways, SmartStack, Matrix, SplitLayout, BigStatement + Emphasis). Load the compiled bundle and read them off `window.SPOKESDesignSystem_8b5e5e`.
- `slides/` — 1280×720 specimen frames for each SPOKES slide type.
- `ui_kits/lesson/` — the interactive SPOKES lesson viewer (recreation of the real product), composed from the components.
- `guidelines/` — foundation specimen cards (colors, type, spacing, effects, iconography).

## Non-negotiable brand rules
- **Only the 11 palette colors** (`tokens/colors.css`). No reds/oranges/purples or off-palette blues/grays. Opacity variations are fine.
- **Green (`--accent`) and gold (`--gold`) fail WCAG AA as text on white** — use `--accent-text` / `--muted-gold` for green/gold text on light backgrounds.
- **Serif display headings + geometric sans body.** Default DM Serif Display + Outfit; per lesson pick one curated pairing (see readme / font-pairings). Headings are weight 400.
- **WIPPEA structure** for lessons: Warm-Up, Introduction, Presentation ×3, Evaluation, Application. 25–35 slides. Every chapter opens with a section divider (watermark letter + gold-ringed image circle).
- **Icons are unicode glyphs / emoji**, never hand-drawn SVG. The logo is the official SPOKES mark (`SpokesLogo` / `assets/SPOKES-Logo.png`) — full-color on light grounds, on a white plate over navy.
- Copy: second person, warm, concise, Title Case titles / sentence-case body / UPPERCASE eyebrows. Respect `prefers-reduced-motion`.
