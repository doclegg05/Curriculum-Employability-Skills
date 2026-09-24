# BeSpoke decisions

## Current direction — September 24, 2026

Britt authorized implementation of the guided visual-design builder in an
isolated worktree and a separate local Safari preview. The v2 implementation is
prepared for local review. Synthetic checks support its shared-service integration;
this does not claim a hosted v2 release, production deployment, or a completed
root quality gate. The dated verification report records actual verification.

These decisions supersede conflicting choices in the September 23
[slide-builder specification](slide-builder-spec.md), its Plan 1, and the earlier
color-role mockup. Those files remain historical planning evidence.

| Topic | Current decision |
|-------|------------------|
| Purpose | Beginners choose reusable visual slide-role designs with sample copy and a cumulative preview. This is not curriculum authoring, a drag-anywhere full deck editor or automatic lesson construction. |
| Starting path | Offer guided custom design and six editable presets. Both populate the exact same individual controls/model. Selecting a field preserves other choices; applying a new preset can be undone and preserves sample text. The earlier no-preset constraint is superseded. |
| Colors | Select an element, then replace its color with a swatch. Show all eleven existing brand colors, including White. No two-primary/three-secondary palette membership step; no restriction that content backgrounds must be White/Mist or body text only Royal/Navy/Gray. Retain explicit brand text restrictions and modeled readability checks, explain unsafe choices, and never silently reset unrelated fields. |
| Fonts | Preserve all twelve existing self-hosted font families. Choose one title/heading font and one body font independently; use each coherently across roles. Presets may initialize combinations. This supersedes the fixed-pairing restriction for v2; serif headings remain available. |
| Franklin Gothic Book | Optional only. A focused local check found no usable licensed webfont package. Omit it for now; do not purchase, extract Office fonts, relabel a substitute or block the builder. |
| Component steps | Separate title, divider and text-box decisions. Cards have one to four boxes, an optional shared title bar, paragraph/bullet/numbered treatment, style and arrangement. Video and activity retain their own designs. A global card preset must not reset other roles. |
| Cumulative state | Colors, fonts, samples and per-role designs survive navigation, preview switching, reload and save/reopen. Keep undo/redo, browser recovery and downloadable backups. Reducing box count preserves all four draft strings. The preview and serialized design use the same accumulated model. |
| Similarity | Keep a prominent advisory meter against actual measured reference lessons. Count exact supported choices, including fonts/colors/layout/style when comparable. Show matches, differences and unknowns. Never call this a pixel/perceptual percentage, promise uniqueness, or block selections for similarity. |
| Comparison scope | Six existing lessons only: Time Management, Interview Skills, Controlling Anger, Employee Accountability, Communicating with the Public, and Problem Solving & Decision Making. No claims about other teams' private designs or invented reservation service. |
| Migration | Preserve the complete original v1 selection verbatim inside a v2 backup. Explain approximate conversions and retain original chapter-specific styling for recovery. Do not claim the converted appearance is lossless. The original v1 schema/wizard remain available. |
| Save and Send | Preserve private team access, local-versus-confirmed-shared distinctions, version/conflict checks, idempotent retry, history and receipt-confirmed Send. The local preview uses only synthetic storage and blocks Send/status. |
| Artifacts | Validate the full v2 model at service and proposal boundaries. Share model CSS/markup with the preview. Emit full selection, intake, CSS, v2 contract and reusable component samples. Box count/title-bar/list treatment require actual markup, not CSS that merely resembles a structural change. |
| Registry boundary | Existing v1 registries cannot faithfully carry v2. Their apply tool rejects v2 explicitly until a reviewed v2 consumer exists. Choosing/saving/reviewing a visual design is still supported. |
| Build and release | Building a lesson needs separate authorization and complete approved instructor content. Publication, production settings and deployment are not authorized by this local implementation. The six Phase 1 lessons approved by Britt on September 23 are not reopened. |
| Local review | Use a separate origin such as port 8766 and external synthetic runtime storage. Preserve the older port 8765 checkout/server/Safari draft. MacDev has a Git parent; local runtime data belongs outside it, for example under `~/Library/Application Support/Codex/local-previews/`. |

See [the current README](../../bespoke/README.md) for user steps and local startup,
and [builder handoff](builder-handoff.md) for v1/v2 contracts and rollout limits.

## Historical prototype greenlight — September 18, 2026

**Historical status: GREENLIT** (Britt, 2026-09-18). Build the prototype.

September 22 clarification: the teacher workflow is visual design only. Shared Save/Open and private team access were authorized as its implementation; neither Save nor Send builds lessons.

Source of truth at greenlight: project store `docs/bespoke-open-questions.md`. This file mirrors the locked table into the curriculum repo.

### Original locked table

The table below records the original decision vocabulary. Current September 24
overrides above control v2. In particular, D12's per-chapter variation remains a
v1 capability preserved in recovery; v2 configures reusable slide roles rather
than silently converting all chapter-specific styles.

| Item | Decision |
|------|----------|
| D6 | Keep existing colors; present for choice / legal mix-match. |
| D7 / library | Same product as wizard: catalog of colors, cards, layouts the wizard displays. |
| D10 | Send → receipt-confirmed draft PR; Britt is the visual-design review gate. A lesson build needs separate authorization and complete approved content. |
| D11 | Wizard fills `content-intake-template.md`; template canonical. |
| D12 | Opt-in vary card styles by chapter / topic; function = different library pieces for different jobs. |
| Hosting | Same repo; GitHub Pages wizard with a dedicated Netlify Save/Open service. No custom domain required. |
| Wizard | One app; team ≈ lesson + spokesperson; demo-first Spokes Model; submit → Action → lesson-tagged PR. |
| Presets | Six: Professional, Modern, Serious, Light-hearted, Fun, Outspoken. Fully editable after pick. |
| Timeline | Undetermined; prototype. |
| Build shape | Library + wizard together (one product). |

### Original build workstreams

1. Core: catalog + wizard UI + demo preview + dashboard link + Spoke Signals Action — this PR
2. Library: expanded selectable card/layout variations feeding the catalog — parallel workstream

### Original v1 library registration

Wizard loads `SPOKES Builder/bespoke-library-catalog.json` (see companion card-library PR). UI keys are `{family}.{slug}`; registry/intake fields store **slug only**. Color leads remain display/choice only (D6). Docs: `SPOKES Builder/bespoke-library-ids.md`.

### Historical concept brief

`docs/briefs/instructor-lesson-studio-concept-2026-09-17.md` (when merged from the briefs PR). Follow where it does not conflict with this lock file — **decisions win**.
