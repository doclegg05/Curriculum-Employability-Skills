Method: dual-agent critique (A: `/root/workflow_first_time`; B: `/root/workflow_functional`), plus independent scope reviewer `/root/workflow_scope` and lead corroboration. Assessment A finished before detector findings reached synthesis. This is an expert/agent walkthrough, not a participant usability study.

# BeSpoke workflow review — September 24, 2026

Reviewed product baseline: `f25d4f8b529287a2a5c05436062222db07b1e1dc`, branch `codex/bespoke-guided-builder`. Review only: recommendations below are not implemented.

## Recommendation

**Keep what Steps 3 and 4 do; remove them as separate numbered stages.** Merge “Paint your elements” and “Fonts & background” into one optional **Shared theme** panel, reachable from the starting look and every slide editor.

The repetition is real in the navigation, but the controls are not interchangeable. Shared settings establish defaults; Steps 5–9 can make exceptions for individual slide types. A preset already supplies usable values. Nothing requires a user to select colors twice, and the current sidebar already permits skipping steps. The ten-step sequence and “Guide me through” route nevertheless imply that everyone should make those choices before editing the slides.

Do not delete these shared capabilities:

- **Sidebar, Accent, and Button colors:** the local slide editors cannot replace them.
- **Shared typography:** local fonts can replace slide text, but navigation and button fonts still use the shared body font.
- **Shared colors and texture:** one edit coordinates all inheriting slide types. Shared content background also controls the Band divider's outer surface and the generated lesson canvas.

Retain all eleven brand colors and twelve independent font choices. Keep contrast advice advisory.

## Proposed flow

1. **Start:** confirm Lesson & team, then choose a preset or “Build my own.” Private-link context can be prefilled. Offer **Shared theme · optional** here.
2. **Slide designs:** Title, Chapter divider, Text boxes, Video, and Activity as five direct tabs. Say that editing each type is optional. Keep a “Next slide type” aid without presenting five completion requirements.
3. **Review & save:** show all five effective designs, identify local exceptions, review advice/notes, then Save. Preserve the separate, receipt-confirmed review-request action and the boundary that visual approval does not authorize lesson construction.

**Preset quick path:** Start → preset → Review & save, with an optional visit to one slide tab. **Custom path:** Start → optional Shared theme → chosen slide tabs → Review & save. **Returning team:** resume the saved design with Continue editing/Review; make Change starting look a deliberate secondary action.

The three-stage structure is the preferred information architecture; it consolidates existing work rather than eliminating controls. A lower-change alternative is eight numbered steps with the five slide editors retained and Shared theme unnumbered. That reduces disruption, but still implies every slide type needs work. Keeping ten steps and only changing copy gives the least relief. Removing shared settings entirely loses functionality.

## Priority findings

| ID | Priority / type | Reproducible finding | Recommended change |
|---|---|---|---|
| **F1** | P2 · workflow ambiguity | A preset can go directly to Review/Save, but the primary sequence still routes through shared colors, shared fonts/texture, then five editors offering those same categories. | Use the proposed optional Shared theme and shorter flow. Explicitly distinguish defaults from exceptions. |
| **F2** | P2 · incorrect summary | Set Title heading to Bitter and Text boxes heading to Playfair Display. Review still reports the shared heading font as “headings.” Three independent traces reproduced this with different fonts; the saved design and preview remain correct. | Label defaults accurately and summarize effective choices/exceptions for all five slide types. |
| **F3** | P2 · returning-user interaction inconsistency | Save a customized design, open it in a fresh context, then click a different preset on the landing screen. The preset replaces visual choices without the confirmation shown after same-session edits. | Base replacement confirmation on the existing design, not only current-tab Undo history. Undo and the prior shared revision remained available; irreversible saved loss was not demonstrated. |
| **F4** | P2 · obsolete instructions | The public team guide asks for four brief questions, generated variants, hover previews, “Fits your brief,” and seven comparison choices. The current builder follows a different workflow. | Rewrite this guide to match the current product and proposed flow; retain its useful save/recovery/receipt boundaries. |
| **F5** | P3 · scope ambiguity | Give Title or Divider explicit local colors/fonts, then change shared defaults: the local slide correctly stays unchanged, but feedback does not identify which fields/slides are exempt. Sidebar → “Customize text boxes only” also opens a background field that cannot edit Sidebar. | Show per-field Shared/Custom state and affected slide types; route shortcuts to the matching field and omit them for shared-only settings. |

Evidence, exact actions, additional responsive/recovery findings, source pointers, control mapping, and coverage are in the [review appendix](workflow-review-2026-09-24-evidence.md). These priorities reflect impact in the observed journeys; there was no demonstrated critical data-loss issue.

## What works

The SPOKES branding, real lesson navigation, sample content, and persistent preview make the editor specific to the teaching task. All five slide types retained independent choices. Preset plus one tweak, custom editing, Save/Open, older-design recovery, and stale-save recovery worked in fresh synthetic contexts. Inline help clearly explains sample-only design, the palette/font choices, and the review/build boundary.

The main opportunity is to make this capability easier to understand, not to replace the visual design. The independent design assessment scored **29/40** across Nielsen's ten heuristics, with the weakest areas being recognition of scope and the amount of visible decision structure. This is a qualitative expert rating, not a measured success rate.

## Coverage and limits

Fresh isolated Chromium and WebKit journeys covered first use, presets, all five editors, global/local inheritance, Save/Open, returning users, Undo/Redo, backups, older versions, conflicts, help, phone layout, and enlarged text. Detailed outcomes and exclusions are recorded in the appendix. No active Safari/IAB tabs, private links, production services, real Send, or user draft storage were operated. The existing preview services were left running. This review does not establish hosted acceptance, a complete accessibility certification, or lesson readiness.

Validation: `bash scripts/quality.sh` passed on the reviewed product baseline, including the repository accessibility ratchet. This does not erase the separate usability findings or existing allowed baseline warnings. Only the two review documents were added; product code and the persistent local test state were unchanged.
