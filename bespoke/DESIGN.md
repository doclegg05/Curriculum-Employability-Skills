---
name: BeSpoke guided builder
description: SPOKES controls around an editable, cumulative lesson design preview.
colors:
  navy: "#00133f"
  blue: "#004071"
  action: "#007baf"
  mist: "#edf3f7"
  muted: "#526273"
  line: "#cad5df"
  paper: "#fff"
  focus: "#a7253f"
  canvas: "#f4f6f8"
  rail: "#f7f9fa"
  selected: "#edf5fa"
  input-line: "#8f9eaf"
  preview-mat: "#dfe7ed"
  notice: "#fff5d7"
  readability: "#fff4f0"
  readability-ink: "#6d2434"
  lesson-green: "#37b550"
  lesson-gold: "#d3b257"
  lesson-deep-gold: "#ad8806"
  lesson-gray: "#60636b"
  lesson-silver: "#d1d3d4"
typography:
  headline:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "1.8rem"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.04em"
  title:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "1.2rem"
    lineHeight: 1.2
  preview-title:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "1.35rem"
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "0.94rem"
    lineHeight: 1.5
  label:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "0.87rem"
    fontWeight: 500
  helper:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "0.8rem"
    lineHeight: 1.5
rounded:
  field: "5px"
  control: "6px"
  feature: "8px"
  dialog: "10px"
spacing:
  tight: "4px"
  compact: "8px"
  control: "10px"
  small: "12px"
  medium: "16px"
  group: "20px"
  section: "24px"
  frame: "28px"
  panel: "30px"
components:
  button-primary:
    backgroundColor: "{colors.blue}"
    textColor: "{colors.paper}"
    rounded: "{rounded.control}"
    padding: "9px 14px"
  button-primary-hover:
    backgroundColor: "{colors.navy}"
    textColor: "{colors.paper}"
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.navy}"
    rounded: "{rounded.control}"
    padding: "9px 14px"
  button-secondary-hover:
    backgroundColor: "{colors.mist}"
  text-link:
    textColor: "{colors.blue}"
    padding: "0"
  field:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.navy}"
    rounded: "{rounded.field}"
    padding: "10px"
  step-current:
    backgroundColor: "{colors.blue}"
    textColor: "{colors.paper}"
    rounded: "{rounded.field}"
    padding: "10px 8px"
  choice-selected:
    backgroundColor: "{colors.selected}"
    textColor: "{colors.navy}"
    rounded: "{rounded.control}"
    padding: "10px 8px"
  paint-chip-selected:
    backgroundColor: "{colors.mist}"
    rounded: "{rounded.field}"
    padding: "4px 2px"
  preset:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.navy}"
    rounded: "{rounded.control}"
    padding: "0 0 12px"
  preview-tab-selected:
    textColor: "{colors.blue}"
    padding: "11px 12px"
---

# Design System: BeSpoke guided builder

## Overview

**Creative North Star: "The guided design workbench"**

This is the code-defined design system for the guided builder at `bespoke/index.html`. Its working surfaces use the existing SPOKES navy, blue, white, bridge logo, and locally hosted Outfit type. Controls are compact, explicit, and steady while the lesson preview carries the user's expressive choices.

The interface and the authored lesson design are separate layers. `builder.css` governs the builder chrome; `builder-catalog.json` supplies the editable choices; `builder-model.mjs` renders the shared lesson model. This document applies to the guided builder only. It does not restyle the dashboard, the original wizard, or any released lesson. Root `PRODUCT.md` describes the dashboard and is not a surface brief for this builder.

**Key Characteristics:**

- Stable SPOKES controls surround a visibly changing lesson artifact.
- Labels and sample previews explain choices before specialist vocabulary is needed.
- Color roles and heading/body fonts remain independently editable.
- State, recovery, readability, and comparison information sit near the task they explain.

## Colors

The chrome uses cool neutral surfaces, dark blue text, blue actions, and a mauve focus outline. Lesson colors are data inside the preview, not a theme for the controls.

### Primary

- **Navy** (`navy`) anchors chrome text and primary-button hover.
- **Blue** (`blue`) identifies primary actions, current navigation, selected outlines, and text links.
- **Action blue** (`action`) identifies choice hover and fine instructional rules.

### Secondary

- **Mauve focus** (`focus`) makes keyboard location visible. The same approved color is available as lesson Mauve; its chrome function remains focus.

### Neutral

- **Paper**, **canvas**, and **rail** distinguish controls, the page, and step navigation.
- **Mist** and **selected** distinguish secondary hover and chosen controls.
- **Muted** carries helper text; **line** divides regions; **input-line** delineates editable fields.
- **Preview mat** separates the editable slide artifact from application chrome.
- **Notice**, **readability**, and **readability ink** support explanatory status and repair messages. The notice edge uses lesson Gold.

### Editable lesson palette

All 11 approved colors stay visible in every role's palette. The catalog's display names and IDs remain authoritative; the mappings below deliberately distinguish lesson names from similarly named chrome variables.

| Catalog ID | Display name | Frontmatter token |
| --- | --- | --- |
| `primary` | Blue | `action` |
| `dark` | Navy | `blue` |
| `royal` | Royal | `navy` |
| `accent` | Green | `lesson-green` |
| `gold` | Gold | `lesson-gold` |
| `muted-gold` | Deep gold | `lesson-deep-gold` |
| `mauve` | Mauve | `focus` |
| `gray` | Gray | `lesson-gray` |
| `offwhite` | Silver | `lesson-silver` |
| `muted` | Mist | `mist` |
| `light` | White | `paper` |

The 11 editable roles are sidebar, title background, title second color, title text, subtitle, content background, heading, body, accent, button, and divider background. Sidebar, accent, and button surfaces receive automatic readable ink. Divider headings use the explicit titleText role; chapter labels and supporting copy use subtitle. The watermark inherits titleText as decoration. Those shared colors never change when the divider background changes. All eleven brand colors, including Green and Gold, are selectable for every role. A choice below the modeled contrast guideline displays advisory guidance; it is still applied, rendered, saved and generated exactly. The team leader decides whether to retain it. Structural validation and access controls remain separate.

**The Two Layers Rule.** Lesson choices change the shared preview model; they never repaint the builder's navigation, fields, or status surfaces.

**The Visible Choice Rule.** Keep every approved color visible. Apply the selected color faithfully. Explain contrast in place, include the measured ratio and guideline, and offer alternatives as suggestions. Never require an override checkbox or disguise a selectable color as disabled.

## Typography

**UI font:** locally hosted Outfit (`system-ui, sans-serif` fallback), with font synthesis disabled. The chrome hierarchy in frontmatter records the current panel heading, section heading, preview label, explanatory body, field label, and helper roles. The brand name is larger than control text (1.6rem desktop, 1.4rem mobile); most control labels stay near 0.8–0.94rem.

**Lesson fonts:** either heading or body can use any of the 12 existing local families: DM Serif Display, Outfit, Playfair Display, Inter, Merriweather, Source Sans 3, Vollkorn, Fira Sans, Crimson Pro, Work Sans, Bitter, or Raleway. There is no required pairing and no serif/sans role restriction. Presets populate the two independent selectors; they do not constrain later choices.

The model gives lesson title text a canvas-relative scale (`clamp(1.5rem, 4.8cqw, 3.7rem)`), a short measure (20ch), and tight line-height (1.12). Title subtitles scale from 1rem to 1.25rem within a 42ch measure. Content headings use `clamp(1.55rem, 3vw, 2.25rem)` and line-height 1.2. Lesson body text uses line-height 1.55; text inside boxes uses 0.92rem. These are authored-slide styles, separate from the UI hierarchy.

**The Independent Type Rule.** Preserve both 12-family selectors. Never reintroduce the original wizard's fixed font-pair restrictions.

## Layout

Desktop uses a two-region workspace: a control rail and a larger preview region. The control rail itself has a step-navigation column (172px) and the current panel. The base workspace columns are `minmax(465px, .95fr)` and `minmax(450px, 1.3fr)`. The preview stays at the top of the viewport while the current controls scroll.

Panel padding is 26px 22px 36px; preview padding is 26px 28px. Related fields and choices use small gaps (7–12px), while decision groups and major regions separate by roughly 20–30px. Choices and presets use two columns. Color choices use four columns, growing to six on wide screens.

| Viewport | Implemented composition |
| --- | --- |
| At least 1500px | Control region is 530–640px, preview has at least 650px, step navigation is 190px, and preview padding grows to 30px 40px. |
| 761–1100px | Step navigation becomes a horizontal scrolling strip above the control panel; the preview remains beside it. |
| At most 760px | A sticky Design / Preview switch shows one workspace region at a time. Step navigation scrolls horizontally, the preview loses sticky positioning, and swatches grow from 38px to 44px. |
| At most 600px viewport | Generated slide styles reduce padding and collapse video/activity side layouts. |
| Above 40rem sample canvas | Content samples show the lesson's 280px vertical chapter sidebar beside the main content. |
| At most 40rem sample canvas | A labeled Sidebar sample menu opens a vertical drawer over the full-width content. |
| At most 38rem main content container | Text boxes use at most two columns, retaining the selected count, arrangement and text. |
| At most 30rem main content container | Video and activity samples stack their side-by-side content. |
| At most 22rem main content container | Text boxes reflow to one column so a narrow desktop preview remains readable. |

The preview stage, content samples and their main content region declare inline-size containers. Sidebar disclosure follows the sample canvas width; text-box, video and activity reflow follow the space actually available beside navigation. Rem thresholds also respond to enlarged text. Viewport queries still control surrounding editor layout and canonical slide padding/stacking. Divider watermarks use bounded, canvas-relative type on a single decorative line. Generated canonical slides use safe centering so long content begins at a reachable scroll position.

The sample sidebar follows the six existing lessons: a lesson-name heading, seven WIPPEA badge groups, an indented current slide, resources and a slide footer. Chapter and resource entries are inert and labeled as sample content. Narrow previews use a keyboard-operable native disclosure with a focusable scrolling drawer; its ordinary 280px width scales with text size up to the canvas width, while horizontal padding stays at most 24px. Sidebar paint recolors the visible rail or drawer immediately and keeps an open drawer open. Title and divider remain standalone component samples. The actual lesson template owns its persistent navigation and collapse behavior; this sample shell does not replace it. Source evidence and verification are recorded in [the sidebar preview report](../docs/bespoke/sidebar-preview-2026-09-24.md).

## Elevation & Depth

The chrome is mostly flat, separated by cool surface tones and thin borders. Shadows are structural: the file/recovery menu floats above the workspace, and the slide receives a light lift above its mat. There is no shared entrance animation or transition-duration system in the current builder. Reduced-motion preferences disable animation, transitions, and smooth scrolling.

- **Recovery menu:** `0 10px 24px #00133f20`.
- **Slide artifact:** `0 6px 18px #00133f1f`.
- **Dialog backdrop:** navy at half opacity (`#00133f80`). The dialog uses a border rather than an authored shadow.

## Shapes

Controls have modest corners: fields, swatches' button containers, and step controls use the field radius; buttons, choices, presets, and the preview mat use the control radius. The guided-start action and floating file menu use the feature radius. The access dialog uses the dialog radius. Swatches and small step numbers are circular.

These chrome shapes do not constrain slide content. Lesson boxes support accent rails, outlines, filled treatments, and top bands; activities support boxes, callouts, banners, and side labels. Those catalog-backed variations belong to the artifact model and are preserved even where the chrome uses a quieter form language.

## Components

### Actions and recovery

Primary buttons use Blue with white text and become Navy on hover. Secondary buttons use Paper with a thin Line border and Mist hover. Base buttons have a 40px minimum height; mobile header actions currently use 38px. Disabled buttons use half opacity. Text links remain underlined with a 3px underline offset. All focusable controls use the Mauve outline (3px, 3px offset); the programmatically focused panel suppresses its own outline.

The header keeps save, open, and review actions visible. Files & recovery uses native disclosure for backup, restore, and original-wizard access. The team-opening dialog is a focused access task, with labeled lesson and private-code fields and explicit Open / Cancel actions. Saving a reusable visual design and authorizing a lesson build are distinct tasks.

### Fields and decisions

Field labels sit above full-width inputs, selects, and text areas with a 7px gap. Fields use a 1px Input line, 10px padding, and a 43px minimum height. Text areas resize vertically. Decision groups are semantic fieldsets with visible legends; chosen buttons carry `aria-pressed`, a stronger border, a selected surface, and a check mark.

The color-role selector precedes the 11-color palette. A selected circular swatch has both a visible mark and an accessible selected label. All colors are enabled, without strike-throughs. Accessible labels identify a contrast advisory as selectable. The chosen role’s warning explains the text/background difference and why low contrast can be harder to read; it includes the actual ratio, the applicable guideline, and the team leader’s option to keep and save the design. The persistent live region announces advisories after updates.

### Navigation and continuity

Ten named steps run from starting point through team, colors, fonts/background, title, divider, text boxes, video, activity, and review. Current navigation uses `aria-current="step"`; Back and Next controls name the next step. Undo, Redo, and Recent choices remain adjacent to navigation.

Five preview tabs expose Title, Divider, Text boxes, Video, and Activity. The selected tab has a blue underline and text; tablists support arrows, Home, End, Enter, and Space. Mobile Design / Preview tabs switch the visible region. Step changes move focus to the current panel. Dynamic choices, palettes, fonts, and preset controls have stable IDs so the rendering pass can restore focus after a same-step change; open inline disclosures remain open.

### Editable presets

Professional, Modern, Serious, Light-hearted, Fun, and Outspoken are starting looks in the same model as the guided path. Each preset button includes a small palette/type sample, name, short description, and a reference comparison. The selected preset has a blue outline. Choosing a preset is not a lock: every following color, font, arrangement, and sample remains editable.

Replacing visual choices uses a native HTML dialog styled like the existing access dialog. Its heading names the chosen preset, and its copy explains sample preservation and Undo. Cancel receives initial focus; Tab and Shift+Tab wrap through the three controls, Escape cancels, and dismissal returns focus to the initiating preset. The checkbox label is a 44px target and the actions wrap on narrow screens. The initially unchecked session opt-out is committed only by Apply preset and never suppresses other warnings. It is transient tab state, separate from design and team persistence; Leave session, changing team/lesson, and starting a new draft clear it.

### Cumulative preview and comparison

Title arrangements use a shared grid canvas with a 16:9 minimum proportion and a
420px minimum height. A nonvisual grid sizing item reserves space while real text
rows can grow beyond it; fixed-height cropping is avoided. Centered and Left aligned
share vertical centering with distinct horizontal alignment. Bottom left allocates
remaining space above the text. Split panels places the title/subtitle in the right
column, after a hard 38% background boundary; the right panel retains the chosen
gradient when enabled. Pattern layers remain above both panels. Narrow canvases keep
these placement differences with smaller type and natural vertical growth.

The corner logo occupies a reserved top area independently of title alignment.
Above-title logos occupy a separate grid row in the text column. All title copy,
rules and logos stay inside the canvas. Generated sample and canonical title styles
share this geometry; canonical flex spacer pseudo-elements are replaced by the same
grid sizing rule. The editor shell and localized title controls are unchanged.

Video frames keep the same outer 16:9 dimensions when switched. Plain removes the
border, padding, outline and shadow. Accent frame reserves an 8px inset for a 6px
chosen-accent border and 2px inner separator; a 2px inward outline separates the
outer edge. Decorative separator ink uses White or Royal according to the accent,
without modifying saved colors. The sample and canonical video/iframe children
fill the remaining content box, so media cannot paint over the frame. Canonical
inline corner/shadow styles are reset within this wrapper. All three arrangements
share the treatment; the canonical side arrangement also stacks below 600px.

The preview is a rendered reusable slide design with explicitly labeled sample content. It takes colors, fonts, arrangements, text, and backgrounds from the same model used by the reusable artifact and template override. It supports the five slide types, including one to four text boxes with paragraph, bullet, or numbered treatment. Hidden box samples remain in the draft.

Readability notes name the problematic text/background pair and provide a path back to colors. The model checks title/heading pairs at 3:1 and subtitle/body pairs at 4.5:1, including sampled gradient surfaces and composited pattern ink; this is a modeled check, not a claim of whole-page accessibility certification.

Comparison is advisory: it shows exact matching comparable choices against six released references, with matches, differences, and unknowns disclosed. It is not a perceptual percentage, a passing score, or a reservation of private team designs. Save/recovery and preview updates use status/live regions, including an explicit local-test label when that mode is active.

## Do's and Don'ts

### Do:

- Do preserve the SPOKES logo, Outfit chrome, and existing navy-blue-white identity.
- Do render previews from the shared model so guided controls, editable presets, and saved designs describe the same artifact.
- Do keep all 11 palette choices visible and all 12 font families available independently for headings and body.
- Do retain focus, open disclosures, undo history, and recoverable sample text when a choice changes.
- Do label sample content, local-test states, contrast repairs, and advisory comparison honestly.

### Don't:

- Don't apply the selected lesson palette or fonts to application chrome.
- Don't treat presets as locked themes or restore fixed font-pair restrictions.
- Don't disable or cross out low-contrast choices, silently recolor them, or turn contrast advice into a save/build approval requirement.
- Don't describe the comparison as a perceptual score or a requirement to pass.
- Don't treat a saved design or review request as authorization to build or publish a lesson.
- Don't extend this document's authority to the dashboard, original wizard, or released lessons.

### Button-color feedback

While the Buttons color role is active, show a clearly labeled temporary sample
below a buttonless slide, without changing the selected preview tab or adding a
permanent button to that slide's structure. At phone widths, also show the sample
inside the controls so its paint change is visible without switching surfaces.
Video and Activity retain their own inert sample actions. All examples reuse the
model's button background, automatic ink, body font and 44px minimum target height.


### Divider color ownership

Title & divider headings and Subtitle & divider supporting text name their shared
scope directly. The divider step exposes background, both text roles, and the shared
second gradient color. Selecting these roles retains the divider preview. Content
heading/body choices remain independent. Unsafe backgrounds preserve the chosen text
and show the actual result plus ratio warnings. Repair buttons change only the named
background, with Undo. These alternatives are optional; shared saving and artifact
generation preserve low-contrast choices, and both current and older v2 designs open
unchanged. Structural errors continue to block invalid records.
Reference comparison measures actual chapter heading and supporting-text colors
separately from title text; mixed or translucent reference colors stay unknown.


### Background-pattern feedback

The pattern choice applies across all five slide roles. Texture layers sit above the
chosen color, split panel, band or gradient; Plain removes only the texture. Dot grid
uses 5px dots on 24px spacing, Diagonal uses 2px lines on 22px spacing, Crosshatch uses
1.5px lines on a 32px grid, and Soft wash is a broad diagonal tint. Decorative ink is
White or Royal, chosen for visible separation from the base, with the opposite tone
used when needed to retain already-readable title/divider text. Stored base/text
colors never change. Contrast sampling includes the actual opacity range and grid
intersections; unresolved failures remain explicit warnings. Content reading surfaces
remain opaque. Palette miniatures use the same pattern recipe and current preview
surface; changing the preview tab refreshes them without changing the design.
