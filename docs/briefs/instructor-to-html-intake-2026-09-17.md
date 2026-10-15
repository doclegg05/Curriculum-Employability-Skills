# Instructor → AI → HTML slides (Builder intake)

Status: capture / design only for new rules. The intake template already exists. Do not replace it. Do not build Lesson Studio.  
Owner: Britt Legg · instructors own meaning · AI owns format  
Source: WVAEA Fall Conference 2026 capture pack (`MacDev/WVAEA-2026-conference-capture-for-coding-agents.md`) · 2026-09-17  
Related: `SPOKES Builder/content-intake-template.md` · `SPOKES Builder/build-process.md` · `SPOKES Builder/CLAUDE.md` · `SPOKES-STANDARD.md` · `docs/phase-2/money-management-tanf-snap-topics-2026-09-17.md`

This pipeline is the SPOKES HTML curriculum package. It is not a VisionQuest feature. Do not put a studio inside VisionQuest until Britt greenlights a link.

## Rule

Instructors own **meaning**. AI owns **format**.

Intake is `SPOKES Builder/content-intake-template.md` (WIPPEA stages, plain bullets, quotes, activities). Build is `SPOKES-STANDARD.md` plus the theme registry plus the component library. Output is one `index.html` per lesson, about 25–35 slides.

## KEEP VERBATIM

Preserve instructor-authored hooks, stories, quotes, and activity wording as exact strings. Do not paraphrase learning objectives. Do not "improve" a story.

A human skims the built HTML for invented claims before the lesson is taught.

**AI may invent:** component choice, slide splits, accessibility chrome.

**AI may not invent:** new facts, dollar figures, eligibility rules, partner names, or restated objectives.

Cite-or-abstain applies here the same way it applies to Sage: if the intake does not contain it, the slide does not contain it.

## What the existing intake already asks for

`SPOKES Builder/content-intake-template.md` already maps to WIPPEA:

- W Warm-Up: opening activity, key questions
- I Introduction: objective, framing statement, terms
- P1–P3: topic, bullets, quotes, video **topics** (not YouTube URLs), activities
- E and A: evaluation and application (rest of the template)

Do not create a second intake form. If KEEP VERBATIM needs a checkbox, add it to that template in a later unlock. This brief does not edit the template.

## Locked design system

- 11-color palette in `SPOKES-STANDARD.md` CLR-01
- Fonts via the theme registry and `font-pairings.md`
- WIPPEA chapter order
- Custom CSS through the two-layer theme system, not one-off palettes

## Bespoke, formerly "Lesson Studio" (later, not this brief)

Concept and plan: `docs/briefs/instructor-lesson-studio-concept-2026-09-17.md`. Not greenlit.

Bespoke sits **on top of** intake. It does not replace intake.

- **v0:** SPOKES Master deck (Google Slides or PowerPoint) plus this intake. Teams copy statewide.
- **v1:** Web studio. Registry theme pickers and drag components, JSON export for AI.
- **v2:** Studio inside VisionQuest, only after Britt links the packages.

Do not start v1 or v2 in this repo without a separate go.

## Dignity and TANF / SNAP copy

Money Management and any other benefits-aware lesson follow the avoid list in `docs/phase-2/money-management-tanf-snap-topics-2026-09-17.md`. No shame language, no forced disclosure, no invented SNAP or TANF figures.
