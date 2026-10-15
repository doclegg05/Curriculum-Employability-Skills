# SPOKES / Adult-Education Brand Guardrail Export — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Export the SPOKES brand/design guardrails to a global, AE/SPOKES-scoped canonical kit and repoint the existing global tooling at it (fixing the broken paths).

**Architecture:** Three parts — (A) a git-versioned canonical kit at `~/.agents/brand-kits/adult-education/spokes/` holding byte-identical copies of the 8 source-of-truth files; (B) a new `spokes-ae-branding` skill whose description scopes it to AE/SPOKES work and which inlines the must-not-break rules + points to the kit; (C) surgical path repoints of the `spokes-modules-developer` agent and `spokes-lesson` skill.

**Tech Stack:** Filesystem + Git Bash (sha256sum, sed, grep), Markdown, Claude Code skill/agent definition files. No build tools, no code.

**Spec:** `docs/superpowers/specs/2026-06-24-spokes-ae-brand-export-design.md`

## Global Constraints

- **Brand contract — 11 canonical hex values (verbatim):** `--primary: #007baf`, `--accent: #37b550`, `--dark: #004071`, `--light: #ffffff`, `--muted: #edf3f7`, `--gray: #60636b`, `--gold: #d3b257`, `--royal: #00133f`, `--mauve: #a7253f`, `--offwhite: #d1d3d4`, `--muted-gold: #ad8806`. These are reproduced in the skill; they must match the source exactly.
- **Copy must be byte-identical** to source, verified by sha256.
- **Copy, not move.** Never delete, move, or edit any file inside `C:/Users/Instructor/Dev/curriculum/Employability Skills Curriculum/`.
- **Nesting ≤ 3 levels** below `brand-kits/` — the `spokes/` folder stays flat (no subfolders).
- **Dry-run first.** Produce the copy MANIFEST and STOP for explicit user approval before any copy (Task 1 → Task 2 gate).
- **Secret-value scan before any commit;** abort on a hit.
- **One commit per logical layer;** report commit hash + counts + repo status after each.
- **No `Co-Authored-By` attribution** (disabled globally in the user's settings).

## Source → Destination map (8 files)

| # | Source (under project root `C:/Users/Instructor/Dev/curriculum/Employability Skills Curriculum/`) | Dest (under `~/.agents/brand-kits/adult-education/spokes/`) |
|---|---|---|
| 1 | `SPOKES-STANDARD.md` | `SPOKES-STANDARD.md` |
| 2 | `SPOKES-Logo.png` | `SPOKES-Logo.png` |
| 3 | `SPOKES Builder/theme-registry.json` | `theme-registry.json` |
| 4 | `SPOKES Builder/theme-library.css` | `theme-library.css` |
| 5 | `SPOKES Builder/font-pairings.md` | `font-pairings.md` |
| 6 | `SPOKES Builder/AGENT_THEMING_GUIDELINES.md` | `AGENT_THEMING_GUIDELINES.md` |
| 7 | `SPOKES Builder/components.md` | `components.md` |
| 8 | `SPOKES Builder/template.html` | `template.html` |

> **Path note:** shell commands below use Git Bash paths (`/c/Users/Instructor/...`). File-content path strings written *into* skill/agent files use Windows style (`C:/Users/Instructor/...`) to match those files' existing convention.

---

### Task 1: Dry-run copy MANIFEST + approval gate

**Files:**
- Create (scratchpad, not the kit): `C:/Users/INSTRU~1/AppData/Local/Temp/claude/C--Users-Instructor/<session>/scratchpad/brand-export-manifest.txt`

**Interfaces:**
- Produces: the source sha256 + byte counts later tasks verify against.

- [ ] **Step 1: Compute sha256 + byte size for all 8 source files**

```bash
SRC="/c/Users/Instructor/Dev/curriculum/Employability Skills Curriculum"
cd "$SRC"
for f in \
  "SPOKES-STANDARD.md" \
  "SPOKES-Logo.png" \
  "SPOKES Builder/theme-registry.json" \
  "SPOKES Builder/theme-library.css" \
  "SPOKES Builder/font-pairings.md" \
  "SPOKES Builder/AGENT_THEMING_GUIDELINES.md" \
  "SPOKES Builder/components.md" \
  "SPOKES Builder/template.html" ; do
  printf '%s | %s bytes | %s\n' "$(sha256sum "$f" | cut -d' ' -f1)" "$(stat -c%s "$f")" "$f"
done
```
Expected: 8 lines, each with a 64-char sha256, a byte count, and the source path. No "No such file" errors.

- [ ] **Step 2: Present the manifest and STOP**

Print the 8-line manifest with the destination each maps to (use the Source→Destination table above). Tell the user: *"Dry-run manifest ready — 8 files, byte-identical copy planned. Approve to proceed to Task 2 (create kit + copy)."*

**Do NOT proceed to Task 2 without explicit user approval.** This is the mandated dry-run gate.

---

### Task 2: Create kit structure and copy the 8 files

**Files:**
- Create: `~/.agents/brand-kits/adult-education/spokes/` (8 copied files)

**Interfaces:**
- Consumes: Task 1's source list.
- Produces: the populated `spokes/` directory verified in Task 3.

- [ ] **Step 1: Verify destination does not already exist (no clobber)**

```bash
test -e ~/.agents/brand-kits && echo "EXISTS — STOP, investigate" || echo "clear to create"
```
Expected: `clear to create`. If `EXISTS`, stop and report — do not overwrite.

- [ ] **Step 2: Create the directory tree**

```bash
mkdir -p ~/.agents/brand-kits/adult-education/spokes
ls -d ~/.agents/brand-kits/adult-education/spokes
```
Expected: the path prints (directory created).

- [ ] **Step 3: Copy the 8 files (preserving names; flat into `spokes/`)**

```bash
SRC="/c/Users/Instructor/Dev/curriculum/Employability Skills Curriculum"
DST=~/.agents/brand-kits/adult-education/spokes
cp -p "$SRC/SPOKES-STANDARD.md"                       "$DST/SPOKES-STANDARD.md"
cp -p "$SRC/SPOKES-Logo.png"                          "$DST/SPOKES-Logo.png"
cp -p "$SRC/SPOKES Builder/theme-registry.json"       "$DST/theme-registry.json"
cp -p "$SRC/SPOKES Builder/theme-library.css"         "$DST/theme-library.css"
cp -p "$SRC/SPOKES Builder/font-pairings.md"          "$DST/font-pairings.md"
cp -p "$SRC/SPOKES Builder/AGENT_THEMING_GUIDELINES.md" "$DST/AGENT_THEMING_GUIDELINES.md"
cp -p "$SRC/SPOKES Builder/components.md"             "$DST/components.md"
cp -p "$SRC/SPOKES Builder/template.html"             "$DST/template.html"
ls -1 "$DST"
```
Expected: `ls` lists exactly the 8 file names.

---

### Task 3: Verify byte-identity and parity

**Files:**
- Read-only: source files + `~/.agents/brand-kits/adult-education/spokes/*`

**Interfaces:**
- Consumes: copied files from Task 2.
- Produces: confirmed-identical kit (gate for MANIFEST + commit).

- [ ] **Step 1: Compare sha256 of each dest file to its source**

```bash
SRC="/c/Users/Instructor/Dev/curriculum/Employability Skills Curriculum"
DST=~/.agents/brand-kits/adult-education/spokes
declare -A MAP=(
  ["SPOKES-STANDARD.md"]="SPOKES-STANDARD.md"
  ["SPOKES-Logo.png"]="SPOKES-Logo.png"
  ["SPOKES Builder/theme-registry.json"]="theme-registry.json"
  ["SPOKES Builder/theme-library.css"]="theme-library.css"
  ["SPOKES Builder/font-pairings.md"]="font-pairings.md"
  ["SPOKES Builder/AGENT_THEMING_GUIDELINES.md"]="AGENT_THEMING_GUIDELINES.md"
  ["SPOKES Builder/components.md"]="components.md"
  ["SPOKES Builder/template.html"]="template.html"
)
fail=0
for s in "${!MAP[@]}"; do
  a=$(sha256sum "$SRC/$s" | cut -d' ' -f1)
  b=$(sha256sum "$DST/${MAP[$s]}" | cut -d' ' -f1)
  if [ "$a" = "$b" ]; then echo "OK  ${MAP[$s]}"; else echo "MISMATCH  ${MAP[$s]}"; fail=1; fi
done
echo "fail=$fail"
```
Expected: 8 `OK` lines and `fail=0`. Any `MISMATCH` → STOP, re-copy that file.

- [ ] **Step 2: Parity — exactly 8 files in the kit (before MANIFEST/README)**

```bash
ls -1 ~/.agents/brand-kits/adult-education/spokes | wc -l
```
Expected: `8`.

---

### Task 4: Write provenance — MANIFEST.md and README.md

**Files:**
- Create: `~/.agents/brand-kits/adult-education/spokes/MANIFEST.md`
- Create: `~/.agents/brand-kits/README.md`

**Interfaces:**
- Consumes: verified sha256 values from Task 3.

- [ ] **Step 1: Generate MANIFEST.md with live provenance rows**

```bash
SRC="/c/Users/Instructor/Dev/curriculum/Employability Skills Curriculum"
DST=~/.agents/brand-kits/adult-education/spokes
{
  echo "# SPOKES Brand Kit — Provenance Manifest"
  echo
  echo "Copied 2026-06-24 from: \`C:/Users/Instructor/Dev/curriculum/Employability Skills Curriculum/\`"
  echo "Copy is byte-identical to source at copy time (sha256-verified)."
  echo
  echo "## Brand core"
  echo "- SPOKES-STANDARD.md — canonical rulebook (11-color palette, prohibited list, WCAG, theme system)"
  echo "- SPOKES-Logo.png — logo"
  echo "## Theme / typography schema"
  echo "- theme-registry.json — two-layer theme assignments"
  echo "- theme-library.css — reusable CSS snippets"
  echo "- font-pairings.md — font library + assignment tracker"
  echo "- AGENT_THEMING_GUIDELINES.md — how to apply the two-layer system"
  echo "## Design-system support"
  echo "- components.md — component HTML patterns"
  echo "- template.html — baseline lesson shell"
  echo
  echo "## sha256 (at copy time)"
  echo '```'
  ( cd "$DST" && sha256sum SPOKES-STANDARD.md SPOKES-Logo.png theme-registry.json theme-library.css font-pairings.md AGENT_THEMING_GUIDELINES.md components.md template.html )
  echo '```'
} > "$DST/MANIFEST.md"
cat "$DST/MANIFEST.md"
```
Expected: file prints with 8 sha256 lines in the code block.

- [ ] **Step 2: Write README.md at the brand-kits root**

Create `~/.agents/brand-kits/README.md` with this content:

```markdown
# Brand Kits

Canonical, versioned brand/design guardrails for Adult-Education programs.

## Scope

These kits apply ONLY to Adult-Education and SPOKES work — not to unrelated projects.
Scoping is enforced by the `spokes-ae-branding` skill (description-gated), not by
applying to every project.

## Layout

    adult-education/
      spokes/    — SPOKES brand kit (canonical master for FUTURE AE/SPOKES projects)

Future programs (e.g. VisionQuest, VUB) are added as siblings under `adult-education/`.

## Source of truth

`adult-education/spokes/` is the canonical master for new AE/SPOKES projects. The
original `Employability Skills Curriculum` project keeps its own in-repo copies;
reconciling the two is a deferred decision — these are independent until then.

## Consumers

- Skill: `spokes-ae-branding` (summarizes rules + points here)
- Agent: `spokes-modules-developer` (reads template/components/theme files here)
- Skill: `spokes-lesson` (reads theme-registry.json here)
```

- [ ] **Step 3: Verify both files exist**

```bash
ls -1 ~/.agents/brand-kits/README.md ~/.agents/brand-kits/adult-education/spokes/MANIFEST.md
```
Expected: both paths print.

---

### Task 5: Initialize git repo for the kit and commit (layer A)

**Files:**
- Create: `~/.agents/brand-kits/.git/`, `~/.agents/brand-kits/.gitignore`

**Interfaces:**
- Consumes: complete kit from Tasks 2–4.

- [ ] **Step 1: Confirm no ancestor git repo (avoid nesting)**

```bash
git -C ~/.agents/brand-kits rev-parse --show-toplevel 2>/dev/null && echo "ALREADY IN A REPO — STOP" || echo "no ancestor repo — safe to init"
```
Expected: `no ancestor repo — safe to init`. If already in a repo, STOP and report (do not create a nested repo).

- [ ] **Step 2: Init repo + add a minimal .gitignore**

```bash
cd ~/.agents/brand-kits
git init --quiet
printf '%s\n' '~$*' '*.tmp' '*.bak' 'Thumbs.db' '.DS_Store' 'desktop.ini' > .gitignore
git add -A
git status -s
```
Expected: staged list shows `.gitignore`, `README.md`, and all `adult-education/spokes/*` files; nothing else.

- [ ] **Step 3: Secret scan the staged set**

```bash
cd ~/.agents/brand-kits
git diff --cached -- . | grep -nEi 'AKIA[0-9A-Z]{16}|sk-[A-Za-z0-9]{20,}|ghp_[A-Za-z0-9]{36}|xox[baprs]-|-----BEGIN [A-Z ]*PRIVATE KEY-----|(api[_-]?key|secret|password|token)["'"'"' :=]+[A-Za-z0-9/+]{16,}' && echo ">>> HITS — ABORT" || echo "0 hits — clean"
```
Expected: `0 hits — clean`. Any hit → abort and report.

- [ ] **Step 4: Commit**

```bash
cd ~/.agents/brand-kits
git commit -m "feat: seed Adult-Education brand kits with SPOKES guardrails" --quiet
git log -1 --oneline
git status -s
```
Expected: one commit printed; `git status -s` empty (clean tree). Report the commit hash + file count.

---

### Task 6: Create the `spokes-ae-branding` skill

**Files:**
- Create: `~/.claude/skills/spokes-ae-branding/SKILL.md`

**Interfaces:**
- Produces: a description-gated skill that surfaces for AE/SPOKES branding work and points to the kit.

- [ ] **Step 1: Create the skill directory**

```bash
mkdir -p ~/.claude/skills/spokes-ae-branding
```

- [ ] **Step 2: Write SKILL.md (complete content below)**

Write `~/.claude/skills/spokes-ae-branding/SKILL.md` with exactly this content:

```markdown
---
name: spokes-ae-branding
description: Canonical brand and design guardrails for SPOKES and West Virginia Adult Basic Education (Adult Education) lessons and materials — the locked 11-color palette, prohibited-color blocklist, logo usage, font pairings, two-layer theme system, and WCAG contrast overrides. Use when building, theming, reviewing, or branding SPOKES lessons or other Adult-Education curriculum and materials. Not for unrelated projects.
---

# SPOKES / Adult-Education Brand Guardrails

Apply these when building, theming, reviewing, or branding any SPOKES or Adult-Education
material. The full source of truth lives in the brand kit:

`C:/Users/Instructor/.agents/brand-kits/adult-education/spokes/`

| File | Use for |
|------|---------|
| `SPOKES-STANDARD.md` | The rulebook — colors, typography, accessibility, components, theme system |
| `SPOKES-Logo.png` | The logo (place in each lesson's project root) |
| `theme-registry.json` | Per-lesson two-layer theme assignments |
| `theme-library.css` | Reusable CSS snippets |
| `font-pairings.md` | Font library + assignment tracker |
| `AGENT_THEMING_GUIDELINES.md` | How to apply the two-layer theme system |
| `components.md`, `template.html` | Component patterns + baseline lesson shell |

## Must-not-break rules (read before any styling)

### Locked 11-color palette (exact hex — no others)

    --primary:    #007baf
    --accent:     #37b550
    --dark:       #004071
    --light:      #ffffff
    --muted:      #edf3f7
    --gray:       #60636b
    --gold:       #d3b257
    --royal:      #00133f
    --mauve:      #a7253f
    --offwhite:   #d1d3d4
    --muted-gold: #ad8806

- No hex color outside `:root` unless it matches one of these 11 values.
- Prohibited: `#c9a74a` (rogue gold), bright reds (`#DC2626`, `#991b1b`, `#FF6B6B`),
  oranges (`#EA580C`, `#ff6b35`), purples (`#4C1D95`, `#6c23b5`, `#2E1065`),
  off-palette grays/blues. Anything not in the 11 is off-brand.

### WCAG contrast overrides (light backgrounds)

- Gold text must resolve to `--muted-gold` (#ad8806), never `--gold` (fails AA).
- Accent/green text must resolve to `--dark` (#004071), never `--accent` (fails AA).

### Typography

- Default pairing: `DM Serif Display` (heading) + `Outfit` (body), declared in `:root`.
- Lesson-specific font overrides go in `<style id="theme-override">`, never in `:root`.
- Each lesson uses a unique pairing from `font-pairings.md` — no repeats.

### Theme system

- Never invent a theme. Apply the pre-approved package from `theme-registry.json`.
- Never write custom CSS or modify `theme-library.css` — assemble from its snippets.
- Logo `SPOKES-Logo.png` belongs in each lesson's project root.

For anything not covered here, open the matching file in the kit above.
```

- [ ] **Step 3: Verify the palette in the skill matches the source standard (no drift)**

```bash
for hex in 007baf 37b550 004071 ffffff edf3f7 60636b d3b257 00133f a7253f d1d3d4 ad8806; do
  grep -qi "#$hex" ~/.claude/skills/spokes-ae-branding/SKILL.md && grep -qi "#$hex" ~/.agents/brand-kits/adult-education/spokes/SPOKES-STANDARD.md && echo "OK $hex" || echo "DRIFT $hex"
done
```
Expected: 11 `OK` lines, no `DRIFT`.

- [ ] **Step 4: Confirm skill is registered**

Verify the skill loads by listing skills (the `spokes-ae-branding` entry should appear with its description). If a registry refresh is needed, note it for the user.

---

### Task 7: Repoint the `spokes-modules-developer` agent (layer C, part 1)

**Files:**
- Modify: `~/.claude/agents/spokes-modules-developer.md` (6 path refs + 2 `brand-palette.md` refs)

**Interfaces:**
- Consumes: kit paths from Task 2.

- [ ] **Step 1: Record before-state counts**

```bash
F=~/.claude/agents/spokes-modules-developer.md
echo "old-base:   $(grep -c 'Dev/Employability Skills Curriculum/SPOKES Builder' "$F")"   # expect 7
echo "brand-pal:  $(grep -c 'brand-palette.md' "$F")"                                       # expect 2
echo "new-base:   $(grep -c 'brand-kits/adult-education/spokes' "$F")"                      # expect 0
```
Expected: `old-base: 7`, `brand-pal: 2`, `new-base: 0`.

- [ ] **Step 2: Repoint base path, fix brand-palette → standard, relabel**

```bash
F=~/.claude/agents/spokes-modules-developer.md
sed -i 's|C:/Users/Instructor/Dev/Employability Skills Curriculum/SPOKES Builder/|C:/Users/Instructor/.agents/brand-kits/adult-education/spokes/|g' "$F"
sed -i 's|brand-palette\.md|SPOKES-STANDARD.md|g' "$F"
sed -i 's|\*\*Brand palette:\*\*|**Brand standard:**|g' "$F"
```

- [ ] **Step 3: Verify after-state counts + spot-check a line**

```bash
F=~/.claude/agents/spokes-modules-developer.md
echo "old-base:   $(grep -c 'Dev/Employability Skills Curriculum/SPOKES Builder' "$F")"   # expect 0
echo "brand-pal:  $(grep -c 'brand-palette.md' "$F")"                                       # expect 0
echo "new-base:   $(grep -c 'brand-kits/adult-education/spokes' "$F")"                      # expect 7
grep -n 'Brand standard' "$F"
```
Expected: `old-base: 0`, `brand-pal: 0`, `new-base: 7`, and the `**Brand standard:**` line points to `.../spokes/SPOKES-STANDARD.md`.

- [ ] **Step 4: Confirm every new path resolves to a real file**

```bash
for p in template.html components.md theme-registry.json theme-library.css font-pairings.md SPOKES-STANDARD.md; do
  test -f ~/.agents/brand-kits/adult-education/spokes/$p && echo "OK $p" || echo "MISSING $p"
done
```
Expected: 6 `OK` lines.

---

### Task 8: Repoint the `spokes-lesson` skill (layer C, part 2)

**Files:**
- Modify: `~/.claude/skills/spokes-lesson/SKILL.md` (1 path ref)

- [ ] **Step 1: Before-state**

```bash
F=~/.claude/skills/spokes-lesson/SKILL.md
echo "old-base: $(grep -c 'Dev/Employability Skills Curriculum/SPOKES Builder' "$F")"   # expect 1
```
Expected: `old-base: 1`.

- [ ] **Step 2: Repoint**

```bash
F=~/.claude/skills/spokes-lesson/SKILL.md
sed -i 's|C:/Users/Instructor/Dev/Employability Skills Curriculum/SPOKES Builder/|C:/Users/Instructor/.agents/brand-kits/adult-education/spokes/|g' "$F"
```

- [ ] **Step 3: After-state**

```bash
F=~/.claude/skills/spokes-lesson/SKILL.md
echo "old-base: $(grep -c 'Dev/Employability Skills Curriculum/SPOKES Builder' "$F")"   # expect 0
echo "new-base: $(grep -c 'brand-kits/adult-education/spokes' "$F")"                     # expect 1
grep -n 'theme-registry.json' "$F"
```
Expected: `old-base: 0`, `new-base: 1`, and the read line points to the kit's `theme-registry.json`.

> Note: `~/.claude/skills/` and `~/.claude/agents/` are not git repositories in this setup (consistent with the existing `spokes-lesson` skill). These two repoints are verified by the grep counts above rather than committed. Show the user the before/after grep output as the audit trail.

---

### Task 9: Final verification (definition of done) + report

**Files:** read-only checks across kit, skill, agent, and the curriculum repo.

- [ ] **Step 1: Kit integrity**

```bash
ls -1 ~/.agents/brand-kits/adult-education/spokes        # 8 files + MANIFEST.md = 9
git -C ~/.agents/brand-kits log --oneline -1             # the seed commit
git -C ~/.agents/brand-kits status -s                    # clean
```
Expected: 9 entries (8 source files + MANIFEST.md), one commit, clean tree.

- [ ] **Step 2: No stale references remain anywhere in tooling**

```bash
grep -rl 'Dev/Employability Skills Curriculum/SPOKES Builder' ~/.claude/agents/spokes-modules-developer.md ~/.claude/skills/spokes-lesson/SKILL.md ; echo "exit=$?"
```
Expected: no file paths printed, `exit=1` (grep found nothing).

- [ ] **Step 3: Curriculum project untouched except the spec/plan docs**

```bash
cd "/c/Users/Instructor/Dev/curriculum/Employability Skills Curriculum"
git status -s | grep -E 'SPOKES Builder|SPOKES-STANDARD|SPOKES-Logo' ; echo "exit=$?"
```
Expected: no brand source files appear as modified/deleted (`exit=1`). The project's brand files are unchanged.

- [ ] **Step 4: Report**

Report to the user: kit path + seed commit hash + file count; skill created; both tooling files repointed (with before/after grep counts); curriculum project brand files untouched; deferred drift decision still open.

---

## Self-Review

**Spec coverage:**
- Part A (canonical kit) → Tasks 2–5. ✓
- Part B (scoped skill) → Task 6. ✓
- Part C (repoint agent + skill) → Tasks 7–8. ✓
- Provenance MANIFEST + README → Task 4. ✓
- Git versioning of kit → Task 5. ✓
- Dry-run gate → Task 1. ✓
- Byte-identity + parity → Task 3. ✓
- Secret scan before commit → Task 5 Step 3. ✓
- "Copy not move / project untouched" → enforced in Tasks 2–3, verified Task 9 Step 3. ✓
- Verification/definition-of-done → Task 9. ✓

**Placeholder scan:** No TBD/TODO. All file contents (SKILL.md, README.md) are given verbatim; MANIFEST sha256 rows are generated by command (runtime data, not placeholders).

**Type/string consistency:** Base path `C:/Users/Instructor/Dev/curriculum/Employability Skills Curriculum/SPOKES Builder/` — note the agent/skill files contain the *old* (pre-`curriculum/`) base `C:/Users/Instructor/Dev/Employability Skills Curriculum/SPOKES Builder/`; the sed patterns in Tasks 7–8 target that exact old string (no `curriculum/` segment), which is why the repoint also fixes the breakage. New base `C:/Users/Instructor/.agents/brand-kits/adult-education/spokes/` is identical across the skill, agent, README, and MANIFEST. Counts (old-base 7/1, brand-palette 2, new-base 7/1) are consistent between before/after steps.
