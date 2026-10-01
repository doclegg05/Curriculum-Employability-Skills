---
name: BeSpoke direct editor
description: A SPOKES document editor with slide thumbnails, contextual controls, and a cumulative lesson canvas.
colors:
  navy: "#00133f"
  blue: "#004071"
  action: "#007baf"
  mist: "#edf3f7"
  muted: "#526273"
  line: "#cad5df"
  paper: "#fff"
  focus: "#a7253f"
  canvas: "#f2f4f6"
  rail: "#fafbfc"
  selected: "#edf5fa"
  input-line: "#8f9eaf"
  preview-mat: "#e1e6ec"
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
    fontSize: "1.2rem"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.04em"
  title:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "1.2rem"
    lineHeight: 1.2
  preview-title:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "1.05rem"
    letterSpacing: "0"
  body:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "0.85rem"
    lineHeight: 1.5
  label:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "0.87rem"
    fontWeight: 500
  helper:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "0.875rem"
    lineHeight: 1.5
  toolbar-label:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "0.74rem"
  toolbar-value:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "0.88rem"
  editor-meta:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "0.8rem"
  mobile-meta:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "0.75rem"
rounded:
  mat: "2px"
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
    padding: "8px 12px"
  button-primary-hover:
    backgroundColor: "{colors.navy}"
    textColor: "{colors.paper}"
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.navy}"
    rounded: "{rounded.control}"
    padding: "8px 12px"
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
  field-select:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.navy}"
    rounded: "{rounded.field}"
    padding: "11px 34px 11px 10px"
  step-current:
    backgroundColor: "{colors.blue}"
    textColor: "{colors.paper}"
    rounded: "{rounded.field}"
    padding: "8px 12px"
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
    backgroundColor: "{colors.selected}"
    textColor: "{colors.navy}"
    rounded: "{rounded.field}"
    padding: "5px"
  contextual-select:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.navy}"
    rounded: "{rounded.field}"
    padding: "7px 24px 7px 9px"
    height: "40px"
  editor-tab-selected:
    backgroundColor: "{colors.mist}"
    textColor: "{colors.blue}"
    rounded: "{rounded.field}"
    padding: "11px 12px"
---

# Design System: BeSpoke direct editor

## Overview

**Creative North Star: "The SPOKES document editor"**

This is the code-defined design system for the editor at `bespoke/index.html`. The explicit form is **Operate**: choose a slide thumbnail, select a visible element, adjust its native contextual controls, and save the complete design. The prescribed document-editor geometry uses the existing SPOKES navy, blue, white, bridge logo, and locally hosted Outfit type. Compact application chrome leaves the cumulative lesson canvas central; More options opens the detailed inspector.

The interface and the authored lesson design are separate layers. `builder.css` and `guide.css` provide the inherited controls; `direct-editor.css` supplies the current workspace overrides; `direct-editor.mjs` owns transient element selection and contextual controls. `builder-catalog.json` supplies editable choices and `builder-model.mjs` renders the shared lesson model. This document applies to BeSpoke only. It does not restyle the dashboard, original wizard, or released lessons. Root `PRODUCT.md` describes the dashboard and supplies durable SPOKES brand commitments, not this editor's composition. The requested interface was precise; no alternative composition or quality-bar tournament was required.

**Key Characteristics:**

- Stable SPOKES controls surround a visibly changing, cumulative lesson artifact.
- A slide thumbnail rail and selectable canvas make the current design tangible.
- Native contextual controls state the affected element and linked editing scope.
- More options exposes existing detailed controls, shared defaults, and review.
- Mobile retains the canvas with horizontal thumbnail and toolbar scrolling.
- State, recovery, readability, and advisory comparison remain near the task they explain.

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

The 11 shared theme roles are sidebar, title background, title second color, title text, subtitle, content background, heading, body, accent, button, and divider background. Sidebar, accent, and button surfaces receive automatic readable ink. Title, divider, text-box, video and activity editors also provide independent local background and text colors. A local value marked Use shared theme inherits the corresponding theme role; an explicit local value stays independent. Older designs without local settings keep their existing appearance, including the shared title/divider second color, heading, supporting text and decorative watermark. All eleven brand colors, including Green and Gold, are selectable for every applicable field. A choice below the modeled contrast guideline displays advisory guidance; it is still applied, rendered, saved and generated exactly. The team leader decides whether to retain it. Structural validation and access controls remain separate.

**The Two Layers Rule.** Lesson choices change the shared preview model; they never repaint the builder's navigation, fields, or status surfaces.

**The Visible Choice Rule.** Keep every approved color visible. Apply the selected color faithfully. Explain contrast in place, include the measured ratio and guideline, and offer alternatives as suggestions. Never require an override checkbox or disguise a selectable color as disabled.

## Typography

**UI font:** locally hosted Outfit (`system-ui, sans-serif` fallback), with font synthesis disabled. The current hierarchy is deliberately compact: inspector heading and section headings use the frontmatter title sizes, while the preview heading remains subordinate to the lesson itself. The brand is 1.45rem on desktop and 1.1rem on phones; the rail heading is 0.95rem. Contextual labels use the toolbar-label token, values use toolbar-value, and contextual actions use 0.85rem. Scope, canvas hints and desktop thumbnail labels use editor-meta. Inspector helper and caption text retain the inherited helper token.

At widths up to 760px, header actions, save/session status, scope, and Undo/Redo use mobile-meta; stage actions use 0.78rem, contextual select values use 0.82rem, and thumbnail captions use 0.7rem. The comparison count is 1.45rem with a 0.9rem denominator. These sizes describe the existing compact editor, not a general scale for lesson text or future reading surfaces. Contextual labels and thumbnail captions need to stay short; enlarged-text checks and actual target dimensions remain necessary. Advisory type-scale notices do not establish an accessibility pass.

**Lesson fonts:** either heading or body can use any of the 12 existing local families: DM Serif Display, Outfit, Playfair Display, Inter, Merriweather, Source Sans 3, Vollkorn, Fira Sans, Crimson Pro, Work Sans, Bitter, or Raleway. There is no required pairing and no serif/sans role restriction. Presets populate the two independent selectors; they do not constrain later choices.

The model gives lesson title text a canvas-relative scale (`clamp(1.5rem, 4.8cqw, 3.7rem)`), a short measure (20ch), and tight line-height (1.12). Title subtitles scale from 1rem to 1.25rem within a 42ch measure. Content headings use `clamp(1.55rem, 3vw, 2.25rem)` and line-height 1.2. Lesson body text uses line-height 1.55; text inside boxes uses 0.92rem. These are authored-slide styles, separate from the UI hierarchy.

**The Independent Type Rule.** Preserve both 12-family selectors. Never reintroduce the original wizard's fixed font-pair restrictions.

## Layout

Desktop places a slide-thumbnail rail (180px) to the left of the cumulative canvas (`minmax(0, 1fr)`). More options adds an inspector on the right (`minmax(320px, 380px)`), with a canvas minimum of 320px while open. The workspace grows with its content, uses a minimum height of `calc(100dvh - 200px)`, and has no bounded internal scroll viewport. The inspector is sticky at the top with a 100dvh maximum height and its own overflow; the canvas is in normal flow. The contextual toolbar is sticky at the top (z-index 6).

Desktop canvas padding is 0 24px 24px; its mat has 22px padding and a maximum width of 1080px centered in the region. The inspector uses 18px padding. The toolbar wraps with 10px gaps and an 88px minimum height; labeled controls have a 5px gap. Thumbnail windows have a 16:10 proportion and render the same design model at a 960px source width, scaled to fit. Stage controls, Edit slide, and history sit in the command strip above the workspace.

| Viewport | Implemented composition |
| --- | --- |
| At least 1600px | Canvas inline padding becomes 40px; the direct canvas slide minimum height becomes 560px. |
| Above 1150px | Rail and canvas remain side by side; opening More options adds the right inspector. The direct canvas slide minimum height is 460px. |
| At most 1150px, above 760px | Rail narrows to 145px; inspector moves below the canvas in column two with static positioning. Canvas inline padding is 18px and mat padding is 16px. Recent choices is hidden; Undo/Redo remains available. |
| At most 760px | Workspace becomes an unbounded vertical flex layout. The top thumbnail strip scrolls horizontally with 90px-wide items, followed by the always-visible canvas. The static contextual toolbar is a single horizontal scrolling row with 110px fields, 8px gaps, 10px vertical padding, and no minimum row height; expanded sample words occupy 300px. The inspector opens below the canvas at `calc(100% - 24px)` width. Header padding is 8px 12px, logo dimensions are 28px, and brand/header actions have 44px minimum heights. Canvas padding is 0 12px 18px, mat padding is 12px, and the direct canvas slide minimum height is 340px. Contextual selects and buttons have 44px minimum heights. The old Design / Preview switch is hidden. |
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

Controls have modest corners: fields, swatches' button containers, stage controls, and editor tabs use the field radius; buttons, choices, and presets use the control radius. The canvas mat uses the mat radius. Build my own and the floating file menu use the feature radius. The access dialog uses the dialog radius. Swatches are circular; the inherited small stage numbers are hidden in the command strip.

These chrome shapes do not constrain slide content. Lesson boxes support accent rails, outlines, filled treatments, and top bands; activities support boxes, callouts, banners, and side labels. Those catalog-backed variations belong to the artifact model and are preserved even where the chrome uses a quieter form language.

## Components

### Actions and recovery

Primary buttons use Blue with white text and become Navy on hover. Secondary buttons use Paper with a thin Line border and Mist hover. Desktop header buttons, stage navigation and contextual buttons use a 40px minimum height; contextual selects are 40px tall. Inherited general buttons, Undo/Redo, choices, thumbnail tabs, fields and text links retain a 44px minimum. On phones, header buttons, stage navigation, contextual buttons and selects also have a 44px minimum. Selectable canvas button targets have a 24px minimum width and height; group selections keep their content geometry. Disabled buttons use half opacity. Text links remain underlined with a 3px underline offset. Chrome controls use the Mauve outline (3px, 3px offset); selected canvas elements use Action blue (3px, 4px offset), hover uses a dashed Action blue outline (2px, 3px offset), and canvas keyboard focus uses Mauve (3px, 4px offset). The video frame instead uses a dashed pseudo-element inset 12px to preserve its authored frame; the programmatically focused panel suppresses its own outline.

The header keeps How it works, save, open, and connected review actions visible; the local test preview hides Send and labels Save/Open as test actions. Help opens inline and returns focus to its button when closed. Start explains choosing a look, optional slide editing and saving; a disclosure explains the palette, fonts, boxes, logo, contrast, recovery and similarity guardrails. Saving guidance distinguishes the local test service from team saving and design review. Files & recovery uses native disclosure for backup, restore, and original-wizard access. The menu closes after a file action, on outside pointer interaction, or with Escape; Escape returns focus to its trigger. On phones the menu fits between 16px viewport insets. The team-opening dialog is a focused access task, with labeled lesson and private-code fields and explicit Open / Cancel actions. Saving a reusable visual design and authorizing a lesson build are distinct tasks.

### Fields and decisions

Detailed inspector field labels sit above full-width inputs, selects, and text areas with a 7px gap. Contextual toolbar fields use the compact dimensions recorded under Layout. Inputs and text areas use a 1px Input line and the field padding; inspector fields have a 44px minimum height. Selects retain native selection behavior with the field-select padding, a 1.5 line-height, an authored arrow, and platform appearance disabled so WebKit does not force a shallow control. Text areas resize vertically. Decision groups are semantic fieldsets with visible legends; chosen buttons carry `aria-pressed`, a stronger border, a selected surface, and a check mark.

The color-role selector and Apply color to selector precede the 11-color palette. Choosing an element starts in This slide scope: the selected swatch reflects its effective local color, and painting writes only that field on the visible slide. Shared default is an explicit separate scope; it writes the global default and retains local exceptions. Sidebar, Accent and Buttons have only shared scope. Preview tabs retain the equivalent element on the new slide, and selecting an element retains a compatible current preview. Scope persists only in the browser UI draft. A selected circular swatch has both a visible mark and an accessible selected label. All colors are enabled, without strike-throughs. Accessible labels identify a contrast advisory as selectable, calculated for the selected scope. The warning explains the text/background difference and why low contrast can be harder to read; it includes the actual ratio, the applicable guideline, and the team leader’s option to keep and save the design. The persistent live region announces advisories after updates.

Each slide-type editor groups its existing Arrangement controls with Background, Texture, Text and Watermark disclosures. Arrangement and Background start open; disclosure choices stay in UI memory, never in a design payload. Stable native controls retain focus after redraw. Local edits show the affected preview while preserving every other role's choices. Shared theme groups shared colors, fonts and texture in one optional disclosure, available in every stage; its open state persists through stage changes.

Shared theme's summary has a 48px minimum height. Paint colors names the selected slide and field; Shared default scope names affected Shared slide types and Custom exceptions, with links to the relevant local field. Fonts & texture has a separate Apply fonts & texture to selector, defaulting to This slide. It reads effective fonts and texture and changes only the selected local field. Its explicit Shared default option keeps global edits and custom exceptions separate. Both scope preferences persist only in the browser UI draft. Sidebar, Accent and Buttons have no misleading local-color shortcut: those colors remain shared. Navigation and button typography always use the shared body font; the canvas and Band divider exterior retain shared Content background. The seven inheritable local fields (primary/secondary background, heading/body color, heading/body font and texture) show Shared or Custom beside the control. Use shared theme in a field or its named reset button restores only that field on that slide, retaining other choices.

Background supports an inherited finish, Solid or a two-color gradient, local primary/secondary colors and three gradient directions. The second color stays saved when hidden. Split title panels use the second color in the right panel and omit the inapplicable direction control; Solid colors both panels uniformly. Divider Band retains its colored middle panel and the shared lesson surface above and below it. Texture offers the existing five recipes and three strengths, independently per role. Plain hides the strength control without clearing it.

Text offers local heading/body colors, the twelve curated fonts, size, alignment, visibility and editable sample words. Match arrangement keeps inherited sizing/alignment; explicit choices override them. Chapter and activity labels can be edited and hidden independently. Text boxes retain their four sample strings and existing treatment/count/title-bar controls. The video supporting paragraph starts hidden to preserve the old look. Hiding text retains its words and style. Watermarks offer None or custom text/number, eleven colors, three sizes, four corners and three strengths. Decorative custom marks occupy reserved space apart from reading text and never modify the required title logo. Presets reset visual settings but preserve all sample words.

### Navigation and continuity

Edit slide closes the inspector and restores attention to the canvas. Three stage commands remain available: **Start**, **Slide designs**, and **Review & save**. Their current-stage semantics remain, but the step numbers and visible stage counter are hidden. When the inspector is closed, stage styling becomes neutral and Edit slide is highlighted. Undo and Redo remain beside stage commands; Recent choices is available only above 1150px. Opening a stage exposes its existing controls in the inspector. Back to slide closes it and focuses Edit slide.

Five thumbnail tabs expose **Title slide**, **Chapter divider**, **Text boxes**, **Video slide**, and **Activity**. The selected thumbnail uses an Action blue border, Selected fill, and Navy text. Each inert miniature renders the shared model in an isolated shadow tree; it adds no duplicate interactive canvas targets. Tabs support arrows, Home, End, Enter, and Space. Changing slides resets direct selection to Background. The workspace remains the named keyboard-focusable main landmark; the canvas remains visible at every breakpoint. Detailed role tabs and stage navigation stay available inside the inspector.

Clicking a canvas target selects it. Tab reaches targets, Enter or Space moves to its contextual selection control, and Escape returns selection to Background. The Selected native menu provides the equivalent non-pointer path. Scope text appears immediately below the toolbar and is announced after selection. Typography edits are role-level: box headings and title bar are linked; all box body text is linked; divider chapter label and supporting text are linked; activity heading and activity label are linked. The toolbar names these relationships explicitly. Sample words remain independently editable where supported, including each box's own body copy; fixed box headings do not offer sample editing.

Selecting a box exposes its saved local Fill, Border color and Box style, each with Use slide default. Optional `boxStyles` stores exactly four fill/border/look records, including hidden boxes; absent records preserve older designs. Layout and count apply to all boxes and the scope line says so. Role typography continues to use `roleStyles`, not per-element font records. The selected target, open sample editor, selection outlines and inspector visibility are UI state only and do not enter saved designs. Edits continue through the existing history, validation, draft and shared-save pipeline. Text edits preserve native caret/selection and group a typing session into the existing undo checkpoint.

Review retains the five effective designs, Shared/Custom fields, direct Preview/Edit actions, readability advice, notes, saving and recovery. Preview selects the cumulative canvas; Edit opens the appropriate detailed inspector. Definition lists stack below 1200px and use paired columns above it. Stable control IDs retain focus after redraw, and disclosures retain their existing UI state.

### Editable presets

Professional, Modern, Serious, Light-hearted, Fun, and Outspoken are starting looks in the same model as Build my own. Each preset button includes a small palette/type sample, name, short description, and a reference comparison. The selected preset has a blue outline. Choosing a preset is not a lock: every color, font, arrangement, and sample remains editable.

Replacing an existing look uses a native HTML dialog styled like the existing access dialog, including after a saved design opens in a fresh context. Its heading names the chosen preset, and its copy explains sample preservation and Undo. Cancel receives initial focus; Tab and Shift+Tab wrap through the three controls, Escape cancels, and dismissal returns focus to the initiating preset. The checkbox label is a 44px target and the actions wrap on narrow screens. The initially unchecked session opt-out is committed only by Apply preset and never suppresses other warnings. It is transient tab state, separate from design and team persistence; Leave session, changing team/lesson, and starting a new draft clear it.

### Cumulative preview and comparison

The generated model gives title arrangements a shared grid canvas with a 16:9 minimum proportion and a
420px base minimum height; the direct editor overrides the slide minimums as recorded in Layout. A nonvisual grid sizing item reserves space while real text
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
grid sizing rule. The editor shell retains its identity; the role sections expose
local title controls using the same cumulative design.

Video frames keep the same outer 16:9 dimensions when switched. Plain removes the
border, padding, outline and shadow. Accent frame reserves an 8px inset for a 6px
chosen-accent border and 2px inner separator; a 2px inward outline separates the
outer edge. Decorative separator ink uses White or Royal according to the accent,
without modifying saved colors. The sample and canonical video/iframe children
fill the remaining content box, so media cannot paint over the frame. Canonical
inline corner/shadow styles are reset within this wrapper. All three arrangements
share the treatment; the canonical side arrangement also stacks below 600px.

The preview is a rendered reusable slide design with explicitly labeled sample content. It takes colors, fonts, arrangements, text, and backgrounds from the same model used by the reusable artifact and template override. It supports the five slide types, including one to four text boxes with paragraph, bullet, or numbered treatment. Hidden box samples remain in the draft.

Readability notes name the problematic text/background pair and provide a path back to colors. The model uses a 3:1 guideline for non-small title, divider and video headings, and 4.5:1 for the other modeled text roles, including sampled gradient surfaces, composited pattern ink and local box fills; this is a modeled check, not a claim of whole-page accessibility certification.

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

While Shared theme is open and the Buttons color role is active, show a clearly labeled temporary sample
below a buttonless slide, without changing the selected preview tab or adding a
permanent button to that slide's structure. At phone widths, also show the sample
inside the inspector so its paint change remains near the shared controls.
Video and Activity retain their own inert sample actions. All examples reuse the
model's button background, automatic ink, body font and 44px minimum target height.


### Divider color ownership

Title & divider headings and Subtitle & divider supporting text name their element
families. Paint colors exposes background, both text roles, and Second gradient
color. This slide paints the current effective local field immediately; Shared
default changes only its separate inherited default. The Chapter divider editor
can also edit or reset its local fields; shared-scope links open the matching field.
Selecting text/second-color elements retains an already selected divider preview.
Painting one gradient stop preserves the second stop, direction, texture and all
other choices. A hidden text color or unused second stop stays saved; the helper
explains when it appears without changing visibility or background finish.
Content heading/body choices remain
independent. Low-contrast backgrounds preserve the chosen text
and show the actual result plus ratio warnings. Repair buttons change only the named
background, with Undo. These alternatives are optional; shared saving and artifact
generation preserve low-contrast choices, and both current and older v2 designs open
unchanged. Structural errors continue to block invalid records.
Reference comparison measures actual chapter heading and supporting-text colors
separately from title text; mixed or translucent reference colors stay unknown.


### Background-pattern feedback

In This slide scope, the selected pattern is the effective texture of the previewed
role. A choice changes its local pattern only, including an existing override.
Shared default changes the global pattern followed by inheriting fields; explicit
local textures remain independent. Texture layers sit above the
chosen color, split panel, band or gradient; Plain removes only the texture. Dot grid
uses 5px dots on 24px spacing, Diagonal uses 2px lines on 22px spacing, Crosshatch uses
1.5px lines on a 32px grid, and Soft wash is a broad diagonal tint. Decorative ink is
White or Royal, chosen for visible separation from the base, with the opposite tone
used when needed to retain already-readable title/divider text. Stored base/text
colors never change. Contrast sampling includes the actual opacity range and grid
intersections; unresolved failures remain explicit warnings. Local pattern thumbnails
reuse the exact model background recipe, including the current primary/secondary
colors, gradient direction, split/Band arrangement and texture strength. Shared-default
thumbnails are identified as shared colors at Standard strength. Changing preview
tabs refreshes effective selections and thumbnails without editing the design.
Plain keeps the saved Subtle, Standard or Stronger strength for a later pattern;
there is no zero-strength setting. Font selections likewise read the effective local
font in This slide scope; a hidden text field keeps its font without being revealed,
with that state explained beside the selector.
