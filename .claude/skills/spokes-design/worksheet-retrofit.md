# SPOKES Worksheet Retrofit — Claude Code Handoff

Everything you need to have Claude Code re-skin your worksheets to the SPOKES
brand. Copy the two blocks below into your repo.

---

## 0. One-time setup

1. Export this design system and place it in your target repo at:
   `.claude/skills/spokes-design/`
   (bring at least: `SKILL.md`, `readme.md`, `styles.css`, `tokens/`,
   `assets/SPOKES-Logo.png`, `templates/spokes-worksheet/`,
   `documents/worksheet.card.html`)
2. Add the `CLAUDE.md` block (below) to the repo root.
3. Paste the kickoff prompt (below) into Claude Code.

---

## 1. CLAUDE.md — paste into your repo root (or append)

```md
## SPOKES brand — worksheets

All worksheets in this repo must follow the SPOKES design system in
`.claude/skills/spokes-design/`.

Ground truth reference: `.claude/skills/spokes-design/documents/worksheet.card.html`
(standalone print-ready HTML) and `templates/spokes-worksheet/` (component form).

Rules (non-negotiable):
- Link `.claude/skills/spokes-design/styles.css`. Use ONLY the brand CSS
  variables (`--primary`, `--gold`, `--dark`, `--gray`, `--muted`, `--offwhite`,
  `--muted-gold`, etc.). NEVER hard-code a hex value.
- Fonts: `var(--font-display)` (DM Serif Display) for H1 and section headings;
  `var(--font-body)` (Outfit) for everything else. Headings are weight 400.
- Structure every worksheet as: header band (SPOKES logo + WIPPEA stage chip +
  module line) → H1 lesson title in `--primary` → subtitle → Name/Date fields →
  numbered prompts (blue/gold alternating circles) with write-on lines →
  optional gold Reflection callout → optional SMART grid → footer
  (SPOKES · Skills for Life + copyright).
- Page: Letter portrait, `@page { size: letter; margin: 0; }`, ~56–60px inner
  padding. Must print cleanly (Cmd/Ctrl-P → Save as PDF).
- RE-SKIN ONLY. Keep each worksheet's own prompts, questions, and answer fields.
  Do not replace real content with the template's placeholder text.
- Colors: green (`--accent`) and gold (`--gold`) are NOT legible as text on
  white — use `--muted-gold` / `--accent-text` for green/gold text.
```

---

## 2A. Kickoff prompt — if your worksheets are HTML

```
Use the SPOKES design system in .claude/skills/spokes-design/.

Reference file (ground truth):
.claude/skills/spokes-design/documents/worksheet.card.html

Task: re-skin our worksheets to match that reference — brand tokens, header
band, type system, prompt/reflection/SMART structure, Letter print geometry —
following the rules in CLAUDE.md.

Do it in this order:
1. List every worksheet file you find and show me the list.
2. Pick ONE (I'll confirm) and convert it end to end. Re-skin structure and
   styling only; keep its own prompts, questions, and answer fields verbatim.
   Link styles.css; use only brand CSS variables (no raw hex).
3. Stop and let me review that one.
4. After I approve, apply the identical transformation to the rest, one file at
   a time, preserving each worksheet's real content.

Report any worksheet whose content doesn't map cleanly to the SPOKES structure
instead of forcing it.
```

## 2B. Kickoff prompt — if your worksheets are Word / PDF / Google Docs

```
Use the SPOKES design system in .claude/skills/spokes-design/.

Reference file (ground truth):
.claude/skills/spokes-design/documents/worksheet.card.html

Our worksheets are currently <Word / PDF / Docs>. This is a rebuild-as-HTML job,
not a CSS reskin. For each source document:
1. Extract its real content — title, instructions, every prompt/question, and
   answer fields.
2. Rebuild it as a standalone print-ready HTML worksheet matching the reference
   and CLAUDE.md rules (brand tokens only, SPOKES header/footer, Letter @page).
3. Preserve all original content exactly; only the layout and styling change.

Start with ONE document, show me the result, and wait for approval before
converting the rest. Keep source files untouched; output new .html files.
```

---

## 3. Tips
- Give it the golden example first (step 2/3) — one approved conversion keeps the
  whole batch consistent far better than a bulk pass.
- If a worksheet has content types the SPOKES kit doesn't cover (tables, matching,
  fill-in-the-blank), ask Claude Code to propose a brand-consistent pattern and
  approve it once, then reuse it everywhere.
- Verify a couple of outputs by printing to PDF to confirm page geometry.
