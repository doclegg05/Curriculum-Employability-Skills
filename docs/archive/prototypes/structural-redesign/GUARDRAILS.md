# Structural Redesign Prototype Guardrails

This file captures the current rules being tested in `prototype-structural-redesign/index.html` so the prototype and the design guidance stay aligned.

## Video Screen Default

- The default video pattern follows the first reference image.
- A video slide should contain only a title and short introduction above the player.
- The video should be the only primary element on the screen once the introduction ends.
- The player should be very large, occupy most of the stage, and fully display the video frame.
- Do not pair the default video screen with side cards, prompts, worksheets, tickets, ribbons, or secondary media.
- If instructional framing is needed, keep it inside the short introduction above the video rather than around the player.

## Comparison Video Exception

- The multi-view pattern follows the second reference image and is a limited-use exception.
- Use it only when one topic needs to be compared across multiple scenarios or examples.
- Keep the structure simple: title and short introduction above, then a clean comparison grid of videos.
- A 2x2 comparison wall is the preferred format unless the lesson clearly requires a different comparison count.
- Do not add side panels, role-play tickets, worksheets, or unrelated support content to the same comparison slide.
- This pattern should not become the default treatment for lesson videos.

## Structural Intent

- Distinct slide archetypes should reduce repeated card stacking across the lesson.
- Structural variety should still feel like part of the same curriculum through shared branding, typography, and navigation behavior.
- When a slide has one dominant teaching job, the layout should make that job unmistakable.

## Asset Path Rules

- Never duplicate videos, handouts, images, or logos into the prototype folder.
- All media references use relative paths back to the live lesson: `../lesson-communicating-with-the-public/`.
- Video sources: `../lesson-communicating-with-the-public/videos/{filename}.mp4`
- Handout downloads: `../lesson-communicating-with-the-public/Handouts/Communicating with the Public 2026 Handouts.pdf` (with `#page=N` anchors preserved).
- Logo: `../lesson-communicating-with-the-public/SPOKES-Logo.png`
- If a new image is created specifically for an archetype prototype (e.g., a diagram), it may live in the prototype folder — but existing assets are never copied.

## Navigation Engine Rules

- The SPOKES Navigation Engine (from `lesson-communicating-with-the-public/index.html` lines 2508–2787) is ported verbatim.
- The only permitted change is the `chapterNames` object, which must match the live lesson's chapter names exactly.
- Do not modify the engine to add archetype-specific behavior. Custom interactions (flip-cards, drag-and-drop, etc.) go in standalone functions below the engine block.
- The engine includes: sidebar chapter tree, slide counter, progress bar, keyboard/touch navigation, view transitions, content reveal observer, confetti/sound on closing, and interactive component handlers (switchTab, toggleAccordion).

## Prototype Isolation

- Never modify anything inside `lesson-communicating-with-the-public/`.
- The concept pilot at `prototype-structural-redesign/index.html` is preserved — full prototype output goes to `prototype-structural-redesign-full/`.
- See `IMPLEMENTATION-PLAN.md` for the complete slide inventory, archetype map, and build phases.
