# BeSpoke guided walk-through

Status: approved by Britt, 2026-09-30, with the three open questions answered below. It replaces the earlier draft of this file, which described an 8-step wizard. Nothing here is built.

## Problem

BeSpoke's builder (`bespoke/index.html`, `bespoke/builder-app.mjs`) has three stages. Its second stage, Slide designs, shows every decision for a slide type at once as accordion sections, with many color, font and size controls as dropdowns. The 2026-09-24 review chose that shape on purpose so that no slide type looks mandatory. It is also a lot to take in at once for a teacher with no design background, working on a Teams call with one person driving. The request from Britt on 2026-09-30 was a workflow a teacher can follow one small step at a time, building each slide with its features and colors.

The builder already has a complete model: 11 roles, per-slide-type settings, an advisory contrast check, a measured similarity meter, Undo and Redo, presets, and shared Save, Open and Send. This spec adds a guided way through that model. It does not replace the model or the free editor.

## Solution

An optional guided mode called **Guide me**, layered on the existing builder.

1. 'Two ways in' - the Start stage offers **Guide me step by step** and **Edit freely**. Edit freely is today's builder, unchanged. Returning teams see Continue as they do now.
2. 'One question per screen' - the guide asks one question at a time and shows the answers as sample thumbnails drawn from the real slide CSS. It never shows a dropdown for a choice that has a short list of options.
3. 'Slide by slide' - after a short shared-look section, the guide finishes one slide type before starting the next. Within a slide type, layout comes first, then background, then text, then anything else.
4. 'Suggested colors' - a color question shows up to four suggested colors, ranked by how readable they are on the current background, and a **More colors** control reveals all eleven. Every color stays selectable.
5. 'Advisory readability' - a hard-to-read choice shows a plain warning with the ratio, and the design can still be saved. This is the existing policy, kept.
6. 'Point to preview' - pointing at or focusing a sample previews it on the slide without choosing it. Clicking chooses it.
7. 'Recap after each slide type' - a recap shows the finished slide and its choices, with a Change link for each. The recap for Text boxes lets the team edit the sample lines.
8. 'Leave and return anywhere' - every question can be skipped, the team can leave the guide at any point, and Continue guide returns to the same question. Skipping keeps the current value.
9. 'Undo takes you back to the question' - Undo and Redo restore the design and also return the guide to the question where the change was made.
10. 'Plain words' - no screen shows a role name, a color code or a CSS term. Guided screens use everyday names such as "Sidebar" and "Headings".

The saved design does not change. The guide writes the same `bespoke-selection/v2` fields the free editor writes, so there is no schema change, no service change and no redeploy.

## Variables

- `BUILDER_APP`: `bespoke/builder-app.mjs`. The UI, team session, drafts, Save, Open and Send. It is 1,778 lines, over the 800-line limit, so new code goes in new files.
- `BUILDER_MODEL`: `bespoke/builder-model.mjs`. Design schema, structural errors, contrast issues, CSS generation, slide rendering.
- `CATALOG`: `bespoke/builder-catalog.json`. Slide groups, decisions, options, presets, fonts, defaults.
- `SIMILARITY`: `bespoke/similarity.mjs` and `bespoke/lesson-fingerprints.json`.
- `BUILDER_CSS`: `bespoke/builder.css`.
- `REVIEW_DOCS`: `docs/bespoke/workflow-review-2026-09-24.md`, `docs/bespoke/workflow-fixes-2026-09-24.md`, `docs/bespoke/role-customization-2026-09-24.md`.
- `QUALITY`: `scripts/quality.sh`.
- `BASE_BRANCH`: `codex/bespoke-guided-builder`. This work branches from it as `claude/bespoke-guided-workflow`.

## Implementation notes

### Decisions

| Question | Decision, 2026-09-30 |
|---|---|
| Which builder to extend | The existing one on `BASE_BRANCH`. Our earlier Plans 1 and 2 are retired. |
| How to get one step at a time | An optional guided mode over the existing builder. Not an 8-step rewrite. |
| Contrast policy | Advisory, as built. No switched-off options. |

### What changes from the earlier draft

The earlier draft assumed an 11-step wizard as the starting point, a 2-main-plus-3-supporting palette, generated color schemes, switched-off unreadable options and forward-only Next. None of that exists in the builder, and most conflicts with its documented policy. The palette and schemes are dropped. The six presets already play the role of ready-made schemes, and the guide's first question is the starting look.

### The guided sequence

Each entry is one screen. The catalog decides the number of samples, so the old "2 to 4 samples" rule is dropped.

| Section | Questions |
|---|---|
| Starting look | The six presets, then Lesson and team if not yet filled in |
| Shared look | Font pairing, Background pattern, Sidebar color, Accent color, Button color |
| Title slide | Layout, Logo, Background, Text |
| Chapter divider | Layout, Background, Text, Watermark |
| Text boxes | Count, Look, Layout, Title bar, Treatment, Background, Text, then a recap that also edits the sample lines |
| Video slide | Layout, Frame, Title style, Background, Text |
| Activity | Layout, Label style, Background, Text |
| Review and save | The existing Review and save stage, unchanged except for the fixes below |

The order inside a slide type is layout first, then the catalog's remaining structural decisions, then Background and Text. The section list is the intended sequence. The plan confirms each question against the catalog's decisions and the role-style fields.

Background and Text questions in the guide write `design.roleStyles` for that slide type when the team picks something other than the shared default, exactly as the free editor's Background and Text sections do today.

### Entry, exit and progress

- The guide shows "Question N of M" and the section name. A step list shows each section and lets the team jump back to any section they have reached. It never skips forward past a section the team has not reached.
- Next moves forward. Back moves back. Skip this slide type moves to the next section and leaves that slide type's choices as they are.
- Exit guide returns to the free editor on the matching tab. Continue guide, shown on Start, returns to the question the team left.
- The team's position in the guide is kept in the browser draft only. It is not saved to the shared design and it does not enter the payload.

### Fixes from the 2026-09-24 review that the guide depends on

- F2: Review reports effective values for all five slide types, not the shared value.
- F4: `bespoke/team-guide.html` is rewritten for the current builder and for Guide me.
- F5: A guided screen names the slides a shared change does not affect.
- Copy: the plain-language pass covers every screen the guide adds.

### Constraints

- No change to the saved design, its schema, or the Netlify service. If a task seems to need one, stop and revise this spec.
- The free editor and every existing browser test keep working. The guide is additive.
- New code lives in new modules under `bespoke/`, not in `BUILDER_APP`.
- The preview mirrors the template's real markup, as it does now. Every option in the guide changes the preview.
- Private team links, encryption, revisions and conflict handling do not change.
- BeSpoke stays design only. No lesson is built.

### Not in scope

- The 8-step numbered wizard, the 2-main-plus-3-supporting palette, generated color schemes and switched-off options.
- Deleting `bespoke/legacy.html`, `bespoke/app.js` or `bespoke/brief.js`.
- Any change to the meter beyond keeping it visible in the guide.

### Answers to the open questions

1. **Preset count.** Keep all six presets in the guide's starting look.
2. **Sample-line editing.** Yes. The Text boxes recap edits the sample lines.
3. **Suggested colors.** Rank the four suggestions by readability on the current background.

## Workflow

1. **Approve.** Done, 2026-09-30.
2. **Plan.** Write the implementation plan with `superpowers:writing-plans`, after reading `BUILDER_APP`, `BUILDER_MODEL` and `CATALOG` directly. The plan lists every file to create or change, ordered tasks small enough to check one at a time, and for each Definition of done item the command that proves it.
3. **Build.** Implement the plan on `claude/bespoke-guided-workflow`, task by task, in plan order.
4. **Verify.** Run every check below and quote the output.

## Deliverables

- This spec, approved by Britt.
- The implementation plan in `docs/superpowers/plans/`.
- The guided mode, in new modules and a new stylesheet, with its tests.
- The rewritten `bespoke/team-guide.html`.
- A note in `docs/bespoke/` recording what was verified, in the style of `verification-2026-09-22.md`.

## Definition of done

- The spec carries no em dashes.
  - Check: `grep -c $'\xe2\x80\x94' docs/superpowers/specs/2026-09-30-bespoke-guided-workflow-design.md`
    Expected: `0`.
- The saved design, schema and service are unchanged.
  - Check: `git diff --stat codex/bespoke-guided-builder -- bespoke/selection-v2.schema.json bespoke/builder-model.mjs netlify`
    Expected: no output.
- Every guided question shows samples that change the preview.
  - Check: `node scripts/test-bespoke-guided-browser.mjs`
    Expected: exit code 0, with a scenario that clicks every sample on every guided question and finds none that leave the preview unchanged.
- Undo returns the guide to the question where the change was made.
  - Check: the same script. Expected: a scenario that changes a layout, moves on, undoes, and lands on that question with the earlier value.
- No guided screen shows design jargon or color codes.
  - Check: the same script. Expected: a scenario that reads the text of every guided screen and finds no role name, hex code or CSS term.
- The free editor and the earlier tests still pass.
  - Check: `bash scripts/quality.sh`
    Expected: exit code 0 and `quality.sh: all checks passed`.
- A first-time spokesperson finishes the guide in one meeting.
  - Check: Britt observes the Money Management pilot. Expected: finished without help beyond the on-screen text.
