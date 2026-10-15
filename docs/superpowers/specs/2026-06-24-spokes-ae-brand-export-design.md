# SPOKES / Adult-Education Brand Guardrail Export — Design

**Date:** 2026-06-24
**Status:** Approved (design); pending spec review
**Author:** Claude Code (brainstorming session with Britt Legg)

## Problem

The SPOKES branding guardrails (logo, locked color palette, font pairings, two-layer
theme system) currently live **only** inside the `Employability Skills Curriculum`
project. Any future Adult-Education or SPOKES project has no stable, shared way to
reuse them.

Two related defects were discovered while inventorying the guardrails:

1. **Stale tooling paths.** The global `spokes-modules-developer` agent hardcodes
   **6** paths and the global `spokes-lesson` skill hardcodes **1** path, all pointing
   to `C:/Users/Instructor/Dev/Employability Skills Curriculum/SPOKES Builder/...`.
   The project actually lives at `C:/Users/Instructor/Dev/curriculum/Employability
   Skills Curriculum/...` (a `curriculum/` segment was added). Every one of those
   references is therefore broken.
2. **Dead file reference.** The agent references `brand-palette.md`, which has been
   archived — its content was absorbed into `SPOKES-STANDARD.md`.

## Goal

Export the SPOKES brand/design guardrails to a **global, stable, canonical location**
that is **scoped to Adult-Education and SPOKES work only** (not applied to unrelated
projects), and repoint the existing global tooling at it — fixing the broken paths in
the same move.

Non-goals: redesigning the brand; changing any lesson; resolving long-term sync between
the project copy and the canonical kit (explicitly deferred).

## Decisions (locked with user)

| Decision | Choice |
|---|---|
| Scope/structure | **AE umbrella, SPOKES inside** — `adult-education/spokes/`; future programs (VisionQuest, VUB) become siblings |
| Canonical location | **`~/.agents/brand-kits/`** (sibling to `~/.agents/skills/`), git-initialized for provenance |
| Copy vs move | **Copy** — project files stay in place, nothing deleted/archived there |
| Master going forward | The kit is the canonical source **for future AE/SPOKES projects**. The curriculum project keeps using its own in-repo copies; reconciling the two is deferred |
| Drift/sync direction | **Deferred** — kit and project copy are independent for now; flagged as a managed risk |

## Architecture

Three parts: a canonical kit (the data), a scoped skill (the access + scoping
mechanism), and repointed tooling (the fix).

### Part A — Canonical brand root

```
~/.agents/brand-kits/                     (new, git-initialized)
  README.md                               (purpose; scoping policy; how to add a kit)
  adult-education/
    spokes/                               (flat — stays <=3 levels deep)
      SPOKES-STANDARD.md                  (rulebook: 11-color palette, prohibited list, WCAG, theme system)
      SPOKES-Logo.png                     (logo)
      theme-registry.json                 (two-layer theme assignments)
      theme-library.css                   (reusable CSS snippets)
      font-pairings.md                    (20-pairing font library + assignment tracker)
      AGENT_THEMING_GUIDELINES.md         (how to apply the two-layer system)
      components.md                       (component HTML patterns)
      template.html                       (baseline lesson shell)
      MANIFEST.md                         (provenance per file: source path, sha256, byte count, copy date)
```

`adult-education/spokes/<file>` is 3 levels under `brand-kits/`, satisfying the
"never nest more than 3 levels deep" rule. The `spokes/` folder is intentionally
flat (no `brand/` + `design-system/` subfolders) to avoid a 4th level; brand vs
design-system grouping is documented in `MANIFEST.md` instead.

**Source files to copy (8):**

| # | Source (relative to project root) | Dest (in `spokes/`) |
|---|---|---|
| 1 | `SPOKES-STANDARD.md` | `SPOKES-STANDARD.md` |
| 2 | `SPOKES-Logo.png` | `SPOKES-Logo.png` |
| 3 | `SPOKES Builder/theme-registry.json` | `theme-registry.json` |
| 4 | `SPOKES Builder/theme-library.css` | `theme-library.css` |
| 5 | `SPOKES Builder/font-pairings.md` | `font-pairings.md` |
| 6 | `SPOKES Builder/AGENT_THEMING_GUIDELINES.md` | `AGENT_THEMING_GUIDELINES.md` |
| 7 | `SPOKES Builder/components.md` | `components.md` |
| 8 | `SPOKES Builder/template.html` | `template.html` |

Copies must be **byte-identical** to source (verified by sha256).

### Part B — Scoped skill `spokes-ae-branding`

New skill at `~/.claude/skills/spokes-ae-branding/SKILL.md` (same placement as the
existing `spokes-lesson` skill). Its `description` is written so it activates for
SPOKES / Adult-Education branding, theming, and review work and stays silent on
unrelated projects — this is the "global but not for every project" mechanism.

Draft frontmatter description:

> "Canonical brand and design guardrails for SPOKES and West Virginia Adult Basic
> Education (Adult Education) lessons and materials — the locked 11-color palette,
> prohibited-color blocklist, logo usage, font pairings, two-layer theme system, and
> WCAG contrast overrides. Use when building, theming, reviewing, or branding SPOKES
> lessons or other Adult-Education curriculum/materials. Not for unrelated projects."

SKILL.md body **inlines the must-not-break rules** so they travel with activation even
before any kit file is read:

- The 11 canonical hex values (`--primary #007baf`, `--accent #37b550`, `--dark
  #004071`, `--light #ffffff`, `--muted #edf3f7`, `--gray #60636b`, `--gold #d3b257`,
  `--royal #00133f`, `--mauve #a7253f`, `--offwhite #d1d3d4`, `--muted-gold #ad8806`).
- The prohibited-color blocklist (CLR-08) and the rule that no hex outside `:root` may
  appear unless it matches a canonical value.
- WCAG overrides: gold text must use `--muted-gold`; accent/green text must use
  `--dark`.
- Logo: `SPOKES-Logo.png` belongs in each lesson's project root.
- Default fonts (`DM Serif Display` + `Outfit`) and the "never invent a theme; apply
  the registry package" rule.
- Pointers to the full files in the kit for complete detail.

### Part C — Repoint existing tooling (the fix)

Surgical string edits only; no behavioral rewrites.

**`~/.claude/agents/spokes-modules-developer.md`** — repoint the path block (lines
~30-35) and the Step 1 read path (line ~61) from
`C:/Users/Instructor/Dev/Employability Skills Curriculum/SPOKES Builder/<file>`
to `C:/Users/Instructor/.agents/brand-kits/adult-education/spokes/<file>`:

| Reference | New target |
|---|---|
| Template location | `.../spokes/template.html` |
| Components reference | `.../spokes/components.md` |
| Theme registry | `.../spokes/theme-registry.json` |
| Theme library | `.../spokes/theme-library.css` |
| Font pairings | `.../spokes/font-pairings.md` |
| Brand palette → **rulebook** | `.../spokes/SPOKES-STANDARD.md` |

Also fix the verify-checklist line (~212) "check all CSS values against the 11-color
palette in `brand-palette.md`" → `SPOKES-STANDARD.md`.

**`~/.claude/skills/spokes-lesson/SKILL.md`** — repoint its one `theme-registry.json`
read path (line ~32) to `C:/Users/Instructor/.agents/brand-kits/adult-education/spokes/theme-registry.json`.

## Out of scope / left untouched

- The curriculum project's files and git repo — not moved, edited, or deleted.
- Long-term sync between project copy and kit master — deferred decision.
- Lesson content, theme assignments, validator hooks.
- Global settings / allowlists — no changes.

## Risks

| Risk | Mitigation |
|---|---|
| Project copy and kit master drift over time | Documented in kit `README.md` + `MANIFEST.md`; sync direction deferred to an explicit later decision; not silently mirrored |
| Editing global agent/skill files could regress them | Surgical path-string edits only; diff shown before commit; original behavior otherwise unchanged |
| Copy corruption / partial copy | sha256 byte-identity check + file-count parity vs MANIFEST after copy |

## Execution gating (user's standard workflow)

1. **Dry-run first:** produce the copy MANIFEST (source → dest, sha256, byte count) and
   STOP for approval before copying anything.
2. After copy: verify byte-identity (sha256 match) and parity (files == manifest rows).
3. Show diffs of the two edited tooling files before committing.
4. **Secret-value scan** before any commit; abort on a hit.
5. Commit boundaries (one per logical layer): (a) kit creation + files, (b) new skill,
   (c) tooling repoint, (d) this spec doc into the curriculum repo. Report commit
   hash + counts + repo status after each.

## Verification (definition of done)

- `~/.agents/brand-kits/adult-education/spokes/` contains all 8 files, each sha256-equal
  to its source.
- `MANIFEST.md` and `README.md` present and accurate.
- `spokes-ae-branding` skill exists and lists in the skill registry; description scopes
  to AE/SPOKES.
- `spokes-modules-developer.md` and `spokes-lesson/SKILL.md` contain zero references to
  the old `Dev/Employability Skills Curriculum/...` path and zero references to
  `brand-palette.md`; all new paths resolve to existing files in the kit.
- Curriculum project repo unchanged except the added spec doc.
