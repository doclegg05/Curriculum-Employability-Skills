---
name: ppt-to-spokes
description: >
  Convert select PowerPoint slides from external group submissions into SPOKES-compliant
  HTML presentation slides. Use when importing PPT/PPTX slides into an existing SPOKES
  HTML lesson, triaging a PowerPoint for impactful slides, converting external group
  presentations into SPOKES format, or when the user mentions "import slides," "PPT to
  HTML," "convert PowerPoint," "external group submission," "add their slides," or
  "PowerPoint slides into the presentation." This skill handles selective extraction --
  not full deck conversion -- picking only the most impactful slides and re-creating them
  as brand-compliant SPOKES HTML sections.
---

# PPT-to-SPOKES Slide Conversion

Convert select slides from external PowerPoint submissions into SPOKES-compliant HTML
`<section>` elements that slot directly into an existing lesson's `index.html`.

## Why Not Direct PPT-to-HTML Export?

PowerPoint's HTML export produces absolute-positioned divs, inline styles with off-brand
colors, base64 image blobs, and no responsive behavior. Cleaning that output takes longer
than re-creating slides from extracted content. This skill uses a **content extraction +
re-creation** approach instead.

## Workflow

```
TRIAGE            EXTRACT           MAP               BUILD             INSERT
.pptx input  -->  Content + images  -->  SPOKES       -->  HTML         -->  Into target
"Top 5 slides"    from selected         component         sections          index.html
                  slides                type per slide     with attribution
```

### Step 1: Triage the PowerPoint

Read the .pptx using python-pptx and produce a **slide inventory table**.

For each slide, assess:
- **Slide number** and title
- **Content type**: quote, comparison, process/steps, framework, data, activity, definition
- **Impact rating** (High / Medium / Low) based on:
  - Visual appeal and design quality of the original
  - Content density and uniqueness (does it add something the HTML lesson lacks?)
  - Classroom engagement potential
- **Recommendation**: Include / Skip

Flag the **top 3-5 most impactful slides** for the user to confirm. Skip slides that are:
- Title-only or transition slides
- Simple bullet lists better expressed as SPOKES components from scratch
- Duplicates of content already in the target HTML lesson

Present the inventory to the user and wait for approval before proceeding.

### Step 2: Extract Content from Selected Slides

For each approved slide, extract:

1. **Text content** -- titles, body text, bullet points, key phrases
2. **Images** -- export slide images to `Source Material/pptx_images/` using the naming
   convention `slide{N}_{seq}.{ext}` (already established in this project)
3. **Speaker notes** -- may contain teaching context useful for activity boxes
4. **Structure** -- note the spatial layout (columns, grid, hierarchy)

Use python-pptx for extraction:

```python
from pptx import Presentation
from pptx.util import Inches, Pt

prs = Presentation('path/to/file.pptx')
for i, slide in enumerate(prs.slides, 1):
    title = slide.shapes.title.text if slide.shapes.title else f"Slide {i}"
    for shape in slide.shapes:
        if shape.has_text_frame:
            for para in shape.text_frame.paragraphs:
                # Extract text and formatting
        if shape.shape_type == 13:  # Picture
            # Export image blob
```

### Step 3: Map to SPOKES Components

Match each extracted slide's structure to the closest SPOKES component:

| PPT Slide Pattern | SPOKES Component | data-chapter note |
|---|---|---|
| Large quote or callout text | `big-statement` | Use for transitions between topics |
| 2-6 boxes, cards, or columns | `cards-grid` | Core content |
| Numbered steps or process | `takeaways` | Core content |
| Acronym breakdown (letter-per-row) | `smart-stack` | Core content |
| 2x2 matrix or quadrant | `matrix-grid` | Core content |
| 4-6 items with hidden details | `dangers-grid` (flip cards) | Core content |
| 3 major categories with bullets | `areas-grid` (3-column) | Core content |
| Definition + image/visual | `split-layout` | Core content |
| Simple arrow-pointed list | `content-list` | Core content |
| Group activity or discussion | `activity-box` (inside another component) | Application |
| Video reference | `slide-video` (placeholder or embed) | Core content |

Consult `../components.md` for the exact HTML patterns for each component type.

### Step 4: Build SPOKES HTML Sections

Generate `<section>` elements following these rules:

1. **Use only the 11 approved brand colors** from `../brand-palette.md`
2. **Match the target lesson's font pairing** -- read the existing `index.html` to find
   the `<style id="theme-override">` fonts
3. **Set `data-chapter` to match** the chapter where the slide will be inserted
4. **Use component HTML from `../components.md`** -- do not invent new patterns
5. **Add attribution** on each imported slide:

```html
<p style="font-size:0.75rem; color:var(--gray); margin-top:1.5rem; font-style:italic;">
  Adapted from [Group Name]'s presentation
</p>
```

6. **Adapt text for SPOKES tone** -- concise, active voice, classroom-appropriate. Use
   `<span class="highlight">`, `<span class="accent">`, `<span class="gold">`, or
   `<span class="mauve">` for emphasis per SPOKES convention.

### Step 5: Insert into Target Lesson

1. Identify the correct insertion point by `data-chapter` in the target `index.html`
2. Add the new `<section>` elements between existing slides in that chapter
3. Verify `data-chapter` attributes remain sequential
4. Confirm the sidebar auto-populates correctly (the JS reads `data-chapter` attributes)
5. Run the standard SPOKES verification checklist from `../build-process.md` Phase 8

## Handling Images from PPT Slides

When a PPT slide's impact depends on its original imagery:

- **Photographs/stock images**: Export to `pptx_images/` and reference with `<img>` inside
  a `split-layout` component
- **Diagrams or charts**: Re-create as HTML using SPOKES components (cards-grid, matrix-grid)
  rather than embedding a raster image -- this keeps the presentation responsive and accessible
- **Decorative images**: Skip -- SPOKES uses CSS gradients and brand colors for visual appeal

## Example: PPT Quote Slide to SPOKES big-statement

**PPT slide content:**
> "Time you enjoy wasting is not wasted time." -- Marthe Troly-Curtin

**SPOKES output:**

```html
<section class="slide slide-big-statement" data-chapter="3">
  <h2>"Time you enjoy wasting is not wasted time."</h2>
  <p class="attribution">-- Marthe Troly-Curtin</p>
  <p style="font-size:0.75rem; color:var(--gray); margin-top:1.5rem; font-style:italic;">
    Adapted from Time Management Team's presentation
  </p>
</section>
```

## Example: PPT Comparison Slide to SPOKES cards-grid

**PPT slide content:** 4 boxes comparing "Urgent vs Important" quadrants

**SPOKES output:** Use `matrix-grid` component from `../components.md` with the four
quadrant labels and descriptions, styled with brand colors only.

## Key References

All in the parent `SPOKES Builder/` directory:

| File | Use for |
|---|---|
| `components.md` | Exact HTML patterns for every slide type |
| `brand-palette.md` | The 11 approved colors (no exceptions) |
| `build-process.md` | WIPPEA chapter mapping and verification checklist |
| `AGENT_THEMING_GUIDELINES.md` | Font pairing rules and video placeholder CSS |
| `template.html` | Base CSS/JS if building a new lesson from scratch |
