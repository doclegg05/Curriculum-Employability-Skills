# Bespoke library IDs — wizard registration

Machine catalog: [`bespoke-library-catalog.json`](./bespoke-library-catalog.json)  
CSS source: [`theme-library.css`](./theme-library.css)  
Lesson assignments: [`theme-registry.json`](./theme-registry.json)

## ID format

```
{family}.{slug}
```

| Family | Example ID | Registry / intake field |
|--------|------------|-------------------------|
| `cards` | `cards.top-accent` | `chapterStyles.<ch>.cards` → slug `top-accent` |
| `dividers` | `dividers.gold-rail` | `dividerStyle` / `chapterStyles.<ch>.divider` |
| `titleSlides` | `titleSlides.quiet-center` | `titleSlide` |
| `backgroundTextures` | `backgroundTextures.dot-grid` | `backgroundTexture` |
| `colorLeads` | `colorLeads.blue` | `colorLead` (**locked model — display only**) |
| `sidebarColors` | `sidebarColors.royal` | `sidebarColor` |

- **Catalog `id`**: full `{family}.{slug}` — use in wizard UI keys and analytics.
- **Registry value**: **slug only** (matches today’s `theme-registry.json`).
- **CSS marker**: comment `--- N. {slug} ---` in `theme-library.css`.

## How the core wizard should register options

1. Load `bespoke-library-catalog.json`.
2. For each family the wizard exposes, iterate `families.<name>.options`.
3. Show `label` + `description`; key selections by `id`.
4. On submit / PR payload, map:
   - `cards.<slug>` → `chapterStyles[ch].cards = "<slug>"`
   - `dividers.<slug>` → `dividerStyle` and/or per-chapter `divider`
   - `titleSlides.<slug>` → `titleSlide`
5. When building `style#theme-override`, copy the CSS block whose marker contains the slug; replace `SCOPE` / `DIVIDER_SCOPE` as documented in the catalog `idScheme.applyTokens`.
6. Respect **D6**: present `colorLeads.*` for choice; do not invent leads or rewrite CLR-01 variables.
7. Respect **D12 / THM-04**: if chapter card vary is on, do not assign the same `cards` slug to adjacent chapters.

## New variants in this workstream

### Cards (`legacy: false`)

| ID | Label |
|----|-------|
| `cards.top-accent` | Top Accent |
| `cards.inset-panel` | Inset Panel |
| `cards.dual-rail` | Dual Rail |
| `cards.soft-lift` | Soft Lift |
| `cards.rule-stack` | Rule Stack |
| `cards.stamp-frame` | Stamp Frame |
| `cards.banded-header` | Banded Header |
| `cards.quiet-outline` | Quiet Outline |

### Dividers

| ID | Label |
|----|-------|
| `dividers.gold-rail` | Gold Rail |
| `dividers.stacked-bands` | Stacked Bands |
| `dividers.dark-masthead` | Dark Masthead |

### Title slides

| ID | Label |
|----|-------|
| `titleSlides.quiet-center` | Quiet Center |
| `titleSlides.dual-band` | Dual Band |
| `titleSlides.side-rail` | Side Rail |

## Adding another option later

1. Append a commented CSS block to `theme-library.css` with marker `--- N. {slug} ---`.
2. Add an entry to `bespoke-library-catalog.json` with `id`, `slug`, `label`, `cssMarker`, `legacy: false`.
3. Document the row in this file.
4. Do **not** change existing slugs (wizard + registry break).
5. Keep colors on the CLR-01 palette (rgba opacity of those RGB values is OK).

## Lesson-builder rule (unchanged)

Agents building lessons still **must not invent** theme CSS. They only consume snippets already in `theme-library.css`. Library expansion happens in dedicated PRs (this workstream), not mid-lesson builds.
