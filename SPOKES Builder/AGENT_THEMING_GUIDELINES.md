# SPOKES Lesson Builder — Agent Theming Guidelines

**CRITICAL:** Theme packages are pre-defined and pre-approved. Do not invent themes or propose design choices.

## Two-Layer Theme System

Each lesson's visual identity is defined in `theme-registry.json`. The agent reads the assigned package and applies it.

### Layer 1 — Lesson Identity (constant across lesson)

| Property | Source | Description |
|----------|--------|-------------|
| colorLead | theme-registry.json | Which brand color dominates (blue, mauve, gold, green, royal, or dual-tone) |
| sidebarColor | theme-registry.json | Sidebar background: "dark" (#004071) or "royal" (#00133f) |
| backgroundTexture | theme-registry.json | Content area pattern: plain, dot-grid, diagonal, crosshatch, soft-gradient, or dark-royal |
| titleSlide | theme-registry.json | Opening slide layout (15 options) |
| fontPairing | theme-registry.json + font-pairings.md | Heading + body font pair |

### Layer 2 — Chapter Variation (rotates per chapter)

| Property | Source | Description |
|----------|--------|-------------|
| cards | theme-registry.json per chapter | Card/component styling (16 options — see bespoke-library-catalog.json) |
| divider | theme-registry.json per chapter | Section divider layout (8 options) |
| leadComponent | theme-registry.json per chapter | First component type after section divider |
| secondaryAccent | theme-registry.json per chapter | Alternating accent color for borders/highlights |

### How to Build the Theme-Override Block

1. Read the theme package from `theme-registry.json`
2. Open `theme-library.css` and find the relevant CSS snippets
3. For Layer 1 properties: uncomment the matching snippet and add to the override block
4. For Layer 2 card styles: find the card style snippet, replace `SCOPE` with `[data-chapter="N"]`
5. For Layer 2 dividers: find the divider snippet, replace `DIVIDER_SCOPE` with `.slide-section[data-chapter="N"]`
6. For dark-royal texture: include the `.theme-dark` CSS and add `class="theme-dark"` to `.main`
7. Place the complete `<style id="theme-override">` block AFTER the main SPOKES `<style>` block

### Rules

- **Never invent a theme.** Only use what's in theme-registry.json (or Bespoke wizard selections that resolve to catalog slugs).
- **Never write custom CSS in a lesson build.** Only use snippets from theme-library.css.
- **Do not ad-hoc edit theme-library.css during lesson builds.** Library expansion is a separate Bespoke workstream: add snippets + register IDs in `bespoke-library-catalog.json` / `bespoke-library-ids.md`, then open a dedicated PR.
- **All 11 brand colors remain available** — the colorLead just determines which dominates. Do not rewrite the colorLead/registry color model (D6).
- **WCAG AA contrast** must be maintained in all text/background combinations.
- **Wizard catalog:** selectable option IDs are `{family}.{slug}` — see `bespoke-library-ids.md`.
