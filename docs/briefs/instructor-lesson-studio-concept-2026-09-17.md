# Bespoke: instructor design-choice wizard (concept brief)

Formerly "Lesson Studio" in the conference capture and the intake brief. Same idea, named 2026-09-18.

Status: concept / plan only. Nothing in this brief is greenlit for build. Do not scaffold, do not write code, do not generate images until Britt says go.  
Owner: Britt Legg (build owner for all six Round 2 lessons; member, not lead, of Money Management)  
Idea captured: WVAEA Fall Conference 2026, 2026-09-17. Written up: 2026-09-18.  
Related: `docs/briefs/instructor-to-html-intake-2026-09-17.md` · `docs/phase-2/money-management-tanf-snap-topics-2026-09-17.md` · `SPOKES Builder/content-intake-template.md` · `SPOKES Builder/theme-registry.json` · `SPOKES Builder/theme-library.css` · `SPOKES Builder/AGENT_THEMING_GUIDELINES.md` · `SPOKES Builder/components.md` · `SPOKES-STANDARD.md`

This is the SPOKES HTML curriculum package. It is not a VisionQuest feature. Studio inside VisionQuest is v2 and needs a separate greenlight.

## 1. Problem

Phase 1 instructors built full PowerPoint decks. The agent pipeline (`SPOKES Builder/ppt-to-spokes`) triages a deck to its 3-5 most impactful slides and re-creates them on-brand. Layout, color, and font decisions are discarded by policy. Instructors experienced this as lost work.

Phase 2 instructors now know the target shape, like it, and want a say in how their lesson looks. Brand constraints (11-color palette, WIPPEA order, theme registry, component library) still apply. Britt cannot give 30-48 instructors agent access.

Two things were happening in one PowerPoint deck: meaning and look. Separate them. Meaning goes through the intake (KEEP VERBATIM). Look goes through a tool that only offers legal choices. Nothing gets lost because nothing chosen is off-brand.

## 2. Users and scale

- Six Round 2 lessons: Goal Setting, Money Management (Budget), Professionalism and Diversity, Knowing Your Rights in the Workplace, Communicating Assertively, Workplace Ethics.
- 5-8 instructors per lesson, remote, meeting at least twice a month, one team lead each.
- One submission per lesson, made by the team lead. Revisions allowed.
- Britt reviews every submission and runs the agent build.
- Money Management is the dogfood team.

## 3. Names

| Thing | Name | Why |
|---|---|---|
| The app and the project | **Bespoke** | Real word for made-to-order, with SPOKE inside it. The lesson is tailored by the team and on-brand by construction. |
| Submission pipeline (section 7.3) | **Spoke Signals** | Remote teams sending their choices in from across the state. |
| Team lead role inside the app | **Spokesperson** | The one who speaks for the team and submits. |
| Live master preview panel | **Spokes Model** | The model wearing the team's chosen look. |
| Bold, high-contrast presets | **Outspoken** | Names the loud end of the personality range. |
| "Something we wish existed" box (step 13) | **Unspoken** | What the library does not offer yet. |
| Submit-before-finished warning | **Spoke Too Soon** | Error message. |

Use "Bespoke" in user-facing copy, the repo folder name when built, and the URL (`bespoke.spokesskills.org` if that domain is bought). Do not use "Studio" or "Builder"; `SPOKES Builder` is already the agent-side toolkit.

## 4. What the tool is

A hosted static web wizard, PowerPoint slide-master style: one decision per screen, Next advances, a live master preview builds up on the right. Every step opens with a legal default preselected. Illegal options are visible but greyed out with the reason shown. Output is data the agent pipeline already consumes.

What it is not: a slide builder, a file-transfer service, an intake replacement, an AI product for instructors.

## 5. Decisions

Confirmed by Britt:

- D1. Submissions and large files (PPTX, PDF, video) go to OneDrive, one folder per lesson. The tool links to the folder; it never accepts uploads.
- D2. v1 is a hosted static tool with lightweight persistence. No accounts.
- D3. Look is decided per lesson, not per slide.
- D4. One submission per team, by the lead. Revisions allowed.
- D5. Britt is build owner for all six lessons and a member of Money Management, not its lead.
- D8. Wizard interaction: one decision per step, legal default preselected, greyed illegal options with reasons, live master preview throughout.
- D9. Theme options live in a machine-readable manifest. `theme-library.css` is generated from it. Tool and agents read one source.

Proposed, awaiting Britt:

- D6. Registry Layer 1 `colorLead` (9 fixed leads) is replaced by color role slots plus a generator. The nine current leads become presets in the new schema so Phase 1 lessons do not change. Registry schema 1.1 to 2.0; `SPOKES-STANDARD.md` amendment.
- D7. Library expansion (more card styles, dividers, textures, activity patterns, features) is a prerequisite workstream tracked separately from the tool. Each addition passes the existing CI quality gate (validator, axe ratchet).
- D10. Submission opens a pull request against this repo. PR review is the human gate the intake brief requires. Merge is the greenlight to build.
- D11. The wizard emits a filled `content-intake-template.md`. The template stays canonical; the wizard is a second way to fill it, not a second form.
- D12. Card style is lesson-wide by default, with an opt-in "vary by chapter" strip for Phase 1-style rotation.

## 6. Findings that shaped the design

- F1. The choice vocabulary already exists and is small: 9 color leads, 2 sidebars, 6 textures, 12 title slides, 5 dividers, 20 font pairings; per chapter 8 card styles, ~7 lead components, 3-4 secondary accents.
- F2. PPT loss is by design (selective extraction). Fix the channel, not the extractor.
- F3. Claude Design is chat-plus-canvas that invents designs and exports markup. Wrong shape for instructors (needs seats, produces off-registry output, LLM in the content path). Useful for Britt to mock up wizard screens.
- F5. Six independent teams will collide on choices. Show "used by <lesson>" tags. Allowed, but visible.
- F6. Some color and texture combinations fail WCAG AA (CLR-05, CLR-06). Enforce in the tool, not in the validator after the fact.
- F8. Content preview can be deterministic. Numbered bullets render as `takeaways`, myth/reality tables as `dangers-grid`, acronyms as `smart-stack`, quotes as `big-statement`. No LLM in the browser, so KEEP VERBATIM and cite-or-abstain hold by construction.
- F9. Collaboration here is asynchronous. Teams meet twice a month and have a lead. No real-time co-editing.
- F10. Design by committee is the risk. Present a small ballot the lead resolves, not a canvas everyone edits.
- F11. With six submissions, host-native form capture or a small function is enough. No database.
- F12. Personality presets are the entry point. 64,800 raw Layer 1 combinations freeze non-designers.
- F14. Phase 1 inefficiency was an information problem. Showing the target shape before writing changes how instructors write.
- F15. Arbitrary color mixtures require role slots and a generator, not a fixed snippet per lead.
- F16. Not every hue can do every job (see section 8).
- F17. `theme-library.css` is written for an agent to read (commented CSS with prose instructions). A program needs the same options as data.
- F18. Options compose. The library is a sum (about 60-70 blocks), not a product of combinations.
- F19. The preview surface is `SPOKES Builder/template.html`. Same markup and CSS the agent emits, so the preview is the build.

## 7. Architecture

Three pieces, buildable in this order.

### 7.1 Theme manifest and generator (prerequisite, D9)

`theme-options.json` (name open). One entry per option:

```json
{
  "id": "shadow-float",
  "dimension": "cards",
  "label": "Shadow float",
  "thumbnail": "thumbs/cards-shadow-float.png",
  "css": "SCOPE .card { ... }",
  "scopes": ["chapter"],
  "requires": [],
  "conflicts": []
}
```

Color is the one dimension that is generated, not swapped:

```json
"palette": {
  "heading": "mauve",
  "button": "primary",
  "dividerFrom": "mauve", "dividerTo": "gold",
  "sectionFrom": "mauve", "sectionTo": "royal",
  "secondary": "gold"
}
```

A small generator emits the `<style id="theme-override">` block from a manifest selection plus a palette. `theme-library.css` becomes generated output. `AGENT_THEMING_GUIDELINES.md` workflow does not change.

### 7.2 Wizard (the tool)

Static site. Left: stepper rail. Center: decision cards for the current step. Right: pinned master preview rendering four or five slides from `template.html` (title, section divider, card slide, activity slide, closing) with the assembled override block applied.

State persists in the browser so a lead can resume after the next team meeting. A read-only share link lets the other team members see the current draft before the meeting.

### 7.3 Submission pipeline (D10, D11)

1. Lead clicks Submit.
2. A serverless function on the same host validates the JSON against the manifest schema, stores it (audit trail), and opens a PR against this repo adding `docs/phase-2/submissions/<lesson>/<date>.json` and a filled `content-intake-template.md` generated from anything typed in the content step.
3. Confirmation screen links to the lesson's OneDrive folder and repeats the file-naming convention.
4. OneDrive syncs to Britt's Mac. The agent build reads the merged JSON for look and the OneDrive folder for content and media. All of it is untrusted input.
5. Britt reviews the PR. Merge greenlights the build. Revisions are new PRs.

Nothing is copied by hand between the team and the agents.

## 8. Color rules the tool enforces

The 11 canonical colors (CLR-01) split into neutrals that are always present (`light`, `muted`, `offwhite`, `gray`) and six hues (`primary`, `dark`, `royal`, `accent`, `gold`/`muted-gold` as one hue pair, `mauve`). Teams do not pick hues; they assign hues to jobs.

| Job | Legal hues | Illegal, with reason |
|---|---|---|
| Heading text on white | `dark`, `primary`, `royal`, `mauve`, `muted-gold` | `accent` 2.66:1, `gold` 2.04:1 |
| Button background, white label | `dark`, `primary`, `royal`, `mauve` | `accent`, `gold`, `muted-gold` fail AA |
| Gradient stops behind white text | any, if one stop is dark | `gold` or `accent` paired with another light stop |
| Secondary accent (borders, circles) | any hue | none |

Numbers come from `SPOKES-STANDARD.md` CLR-05 and CLR-06. The tool shows the ratio when it greys an option.

## 9. Wizard steps

| Step | Decision | Screen | Preview updates |
|---|---|---|---|
| 0 | Lesson and lead | Pick one of six; name; email; lead confirmation | Empty master with SPOKES logo |
| 1 | Personality preset | 6-8 illustrated presets; sets defaults downstream | Full master appears |
| 2 | Heading color | Legal hues only | Headings |
| 3 | Section divider colors | Two gradient stops; second constrained by first | Chapter divider |
| 4 | Button and secondary accent | Legal button hues; accent hue | Buttons, numbered circles |
| 5 | Background texture | Gallery | Content slide background |
| 6 | Title slide layout | 12 thumbnails | Title slide |
| 7 | Section divider layout | Gallery | Chapter divider |
| 8 | Card style | Gallery; lesson-wide; "vary by chapter" toggle (D12) | Cards |
| 9 | Font pairing | Specimens in their own heading and body text | All text |
| 10 | Features | Checkboxes with thumbnails: flip cards, counters, reveals, glass | Demo slide per feature |
| 11 | Activities | Which activity patterns the lesson uses | Activity slide |
| 12 | Try your content | Paste one bullet set and one myth/reality table | Rendered in the finished master |
| 13 | Review and submit | Summary; Unspoken box (what we wish existed); Submit, guarded by Spoke Too Soon | PR opened; OneDrive link; PDF look sheet |

Back is always available. Options taken by another Round 2 lesson carry a "used by <lesson>" tag.

Presets (step 1) are the step most leads will never go past. Names and defaults matter more than any dial. The set is not decided; see open questions.

## 10. v1 feature list

Build:

1. Live master preview on every step.
2. Illustrated personality presets.
3. Legal-by-construction color slots with reasons shown.
4. "Used by <lesson>" tags.
5. Paste-your-content preview.
6. Resume later (browser state).
7. Read-only team share link.
8. PDF look sheet on submit.
9. PR-based submission with schema validation.

Cut from v1: accounts, comments, voting, real-time co-editing, per-slide layout, in-tool file upload, any AI in the instructor path.

## 11. Library expansion (D7 prerequisite)

| Dimension | Now | Target | Notes |
|---|---|---|---|
| Card styles | 8 | 12-14 | CSS snippet plus axe pass each |
| Section dividers | 5 | 8-10 | Same |
| Background textures | 6 | 9-10 | Same |
| Title slides | 12 | 12 | Enough |
| Font pairings | 20 | 20 | Fonts are self-hosted; more fonts grow the offline pack |
| Activity patterns | 1 (`activity-box`) | 5-6 | Discussion, pair, poll, scenario, reflection, exit ticket |
| Interaction features | ~6 | ~10 | Flip, reveal, counter, glass, drag-order, tabbed compare |

The tool renders whatever the manifest contains, so expansion can continue after v1 ships.

## 12. Visual direction

The tool looks like a SPOKES product: 11-color palette, royal chrome with gold accents, an approved font pairing. Flat, warm illustrations of adult learners in West Virginia settings. No stock-photo faces, no shame cues. One illustration per step and one hero per preset, about 25 images. Generated with the ElevenLabs image tool from an approved prompt list during build, not before. Images ship in the tool only; lesson section-circle images stay on the existing per-lesson process, and the offline pack does not grow.

## 13. Order of work (when greenlit)

1. Manifest and generator (7.1). Useful to the agent pipeline on its own.
2. Library expansion (section 11). Can run in parallel with 1 once the manifest format is fixed.
3. Preset definitions and names.
4. Wizard (7.2) against the manifest.
5. Submission function and PR flow (7.3). Hosting decision needed first.
6. Illustrations.
7. Dogfood with Money Management. Fix. Release to the other five leads.

## 14. Risks

- R1. Deterministic content preview will sometimes pick the wrong component; the agent corrects it at build. Leads must hear this up front so a changed layout is not read as lost work.
- R2. Timing. Teams are writing content now toward a soft March 2027 target. If the tool arrives after content is written, step 12 loses most of its value.
- R3. D6 changes the registry schema. Phase 1 lessons must re-validate against the generated CSS before the change lands.
- R4. Hosting. D10 needs a serverless function. Plain GitHub Pages cannot do it.

## 15. Open questions

1. Confirm or change D6, D7, D10, D11, D12.
2. Hosting: Netlify, Vercel, or a GitHub Action triggered by a form service. Ties to the `spokesskills.org` domain question in the conference notes.
3. The preset set: which 6-8 personalities, and what each one sets.
4. Date the tool must be in leads' hands (R2).
5. Who owns library expansion work and its review.
