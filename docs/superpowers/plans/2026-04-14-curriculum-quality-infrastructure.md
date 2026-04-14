# Curriculum Quality Infrastructure — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the enforcement infrastructure (SPOKES-STANDARD.md, validate-lesson.py, PostToolUse hook, CLAUDE.md updates) that enables automated quality checking of all SPOKES lessons.

**Architecture:** A layered system where CLAUDE.md references SPOKES-STANDARD.md (the spec), which is enforced by validate-lesson.py (Python stdlib validator), triggered automatically by a PostToolUse hook on lesson file writes. The validator parses HTML/CSS/JS blocks independently and checks ~63 rules, exiting non-zero on CRITICAL failures.

**Tech Stack:** Python 3.13 (stdlib only — html.parser, re, sys, pathlib), Claude Code hooks (settings.local.json)

**Spec:** `docs/superpowers/specs/2026-04-14-curriculum-quality-standard-design.md`

**Scope:** This plan covers infrastructure only. A separate plan (Plan 2: Lesson Remediation) will be written after the validator is built, using the validator's baseline output to generate the exact fix list per lesson.

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `SPOKES-STANDARD.md` | Create | Authoritative spec — all 63 rules with IDs, severity, validation type |
| `scripts/validate-lesson.py` | Create | Automated validator — parses lesson HTML, checks rules, outputs PASS/FAIL/WARN |
| `scripts/test_validator.py` | Create | Test suite for the validator using unittest |
| `scripts/test-fixtures/minimal-pass.html` | Create | Minimal HTML fixture that passes all CRITICAL rules |
| `scripts/test-fixtures/minimal-fail.html` | Create | Minimal HTML fixture that fails specific CRITICAL rules |
| `CLAUDE.md` (project root) | Create | Agent entry point with required-reading directive |
| `.claude/settings.local.json` | Modify | Add PostToolUse hook for lesson file validation |
| `SPOKES Builder/CLAUDE.md` | Modify | Remove design rules, add reference to SPOKES-STANDARD.md |
| `docs/repo-standards.md` | Modify | Remove quality enforcement section |
| `docs/archive/brand-palette.md` | Create (move) | Archived original |
| `docs/archive/STYLING-GUIDE-communicating.md` | Create (move) | Archived original |

---

### Task 1: Create SPOKES-STANDARD.md

**Files:**
- Create: `SPOKES-STANDARD.md`

This is the authoritative spec document. Its content is fully defined in the design spec — this task transcribes it into the canonical format with version header.

- [ ] **Step 1: Create SPOKES-STANDARD.md**

Write the file at `SPOKES-STANDARD.md` (project root). The content is the full rule inventory from the design spec, reformatted into the canonical structure:

```markdown
# SPOKES Lesson Standard v1.0

> This is the single source of truth for all SPOKES lesson requirements.
> Agents MUST read this file before creating or modifying any lesson.
> Rules are enforced by `scripts/validate-lesson.py` via PostToolUse hook.

## How to Read This Document

Each rule has:
- **Rule ID** — unique identifier (e.g., CLR-01) used in validator output
- **Severity** — CRITICAL (blocks), WARN (flagged), INFO (noted)
- **Validation** — deterministic (conclusively verified) or heuristic (keyword check, manual review recommended)
- **Rule** — the testable requirement
- **Rationale** — why this rule exists
```

Transcribe all 63 rules from the design spec Sections 1-10. Each rule formatted as:

```markdown
### CLR-01 — Canonical CSS Variables
- **Severity:** CRITICAL
- **Validation:** deterministic
- **Rule:** `:root` must declare exactly 11 CSS variables with canonical hex values: `--primary: #007baf`, `--accent: #37b550`, `--dark: #004071`, `--light: #ffffff`, `--muted: #edf3f7`, `--gray: #60636b`, `--gold: #d3b257`, `--royal: #00133f`, `--mauve: #a7253f`, `--offwhite: #d1d3d4`, `--muted-gold: #ad8806`
- **Rationale:** Prevents palette drift and undocumented colors. All lessons must use the same 11-color system.
```

Include the full canonical hex values in CLR-01, the prohibited color list in CLR-08, the Generation D feature list in Section 5's preamble, and all notes/caveats from CLR-06, A11Y-03, A11Y-12, RDM-04, and RDM-06.

- [ ] **Step 2: Verify rule count**

```bash
grep -c "^### [A-Z]" SPOKES-STANDARD.md
```

Expected: 63 rules (8 CLR + 5 TYP + 19 A11Y + 3 CMP + 12 NAV + 5 THM + 4 MOB + 3 PRF + 4 ENG + 6 RDM = 69 — recount from the design spec after Codex additions to get the exact number)

- [ ] **Step 3: Commit**

```bash
git add SPOKES-STANDARD.md
git commit -m "docs: create SPOKES-STANDARD.md v1.0 — authoritative lesson quality spec"
```

---

### Task 2: Create test fixtures

**Files:**
- Create: `scripts/test-fixtures/minimal-pass.html`
- Create: `scripts/test-fixtures/minimal-fail.html`

These are small HTML files (~100 lines each) that exercise the validator's checks. They are NOT full lessons — they're minimal structures with just enough HTML to trigger specific rule checks.

- [ ] **Step 1: Create the scripts directory and test-fixtures subdirectory**

```bash
mkdir -p scripts/test-fixtures
```

- [ ] **Step 2: Create minimal-pass.html**

A minimal HTML file that passes all CRITICAL rules. Must include:
- `<html lang="en">`
- `<meta name="viewport" content="width=device-width, initial-scale=1">`
- `<title>Test Lesson — SPOKES</title>`
- A `<style>` block with `:root` declaring all 11 CSS variables with canonical hex values, plus `--font-heading: "DM Serif Display", serif` and `--font-body: "Outfit", sans-serif`
- In that same `<style>` block: `@media (prefers-reduced-motion: reduce)` with `animation: 0.01ms` and `transition: 0.01ms`, plus `.confetti { display: none }`
- At least 6 `:focus-visible` CSS rules
- `.slide .gold { color: var(--muted-gold); }` and `.slide .accent { color: var(--dark); }`
- A `<style id="theme-override">` block (can be empty)
- A skip link: `<a href="#mainContent" class="skip-link">Skip to main content</a>` as first focusable element in body
- `<nav aria-label="Lesson chapters">` with a `<button aria-expanded="true" aria-controls="sidebar-nav" style="width:44px;height:44px">` toggle
- `<main id="mainContent">`
- A `<div aria-live="polite" id="slideAnnouncer" class="sr-only"></div>`
- A progress bar: `<div role="progressbar" aria-valuenow="1" aria-valuemin="1" aria-valuemax="5">`
- Navigation buttons as `<button>` elements (not `<span>`), styled at min 44x44px
- A tab component with `role="tablist"`, `role="tab"` buttons with `aria-selected` and `aria-controls`, and `role="tabpanel"` divs
- An accordion header with `aria-expanded` and `aria-controls`
- A flip card div with `tabindex="0"` and `aria-expanded="false"`
- A `<video preload="none" aria-label="Test video"><source src="test.mp4"><track kind="captions" src="test.vtt"></video>`
- A `<div class="activity-box">` and a `<div class="checkpoint-box">`
- A `<script>` block containing these keywords/patterns (for heuristic checks):
  - `const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;`
  - `const showSlide = (index) => {` with `sessionStorage.setItem`, `activeElement?.blur()`, `.pause()`, `startViewTransition`, `prefersReduced`, `slideAnnouncer`
  - `let confettiTriggered = false;`
  - `function switchTab(btn, panelId) {`
  - `function toggleAccordion(btn) {`
  - Keyboard handler with `textarea`, `input`, `[role="tablist"]` guards
  - Touch listener: `.querySelector('.main').addEventListener('touchstart',` with `{ passive: true }`
  - `if (prefersReduced) { doTransition(); } else if (document.startViewTransition) {`

- [ ] **Step 3: Create minimal-fail.html**

Copy of minimal-pass.html with these deliberate violations:
- `<html>` (missing `lang` — fails A11Y-13)
- `:root` includes `--font-heading: "Vollkorn", serif` (fails TYP-02)
- `.slide .gold { color: var(--gold); }` (fails CLR-05)
- A `#c9a74a` hex color in CSS (fails CLR-03)
- No `<track kind="captions">` on video (fails A11Y-07)
- No skip link `<a>` before main content (fails A11Y-04)
- Nav buttons as `<span onclick="...">` (fails A11Y-09)
- Sidebar toggle at `width: 36px; height: 36px` (fails MOB-02)
- No `aria-live` div (fails A11Y-05)
- No `sessionStorage` in script (fails NAV-06)

- [ ] **Step 4: Commit**

```bash
git add scripts/test-fixtures/
git commit -m "test: add validator test fixtures — minimal pass and fail HTML files"
```

---

### Task 3: Write validator tests

**Files:**
- Create: `scripts/test_validator.py`

Write tests FIRST (TDD). These tests define the validator's contract before implementation.

- [ ] **Step 1: Write test_validator.py**

```python
"""Tests for validate-lesson.py — SPOKES lesson quality validator."""
import unittest
import subprocess
import sys
from pathlib import Path

VALIDATOR = Path(__file__).parent / "validate-lesson.py"
FIXTURES = Path(__file__).parent / "test-fixtures"


def run_validator(fixture_name, extra_args=None):
    """Run the validator on a fixture file and return (exit_code, stdout, stderr)."""
    cmd = [sys.executable, str(VALIDATOR), str(FIXTURES / fixture_name)]
    if extra_args:
        cmd.extend(extra_args)
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
    return result.returncode, result.stdout, result.stderr


class TestValidatorPassingFixture(unittest.TestCase):
    """minimal-pass.html should pass all rules."""

    def test_exit_code_zero(self):
        code, stdout, _ = run_validator("minimal-pass.html")
        self.assertEqual(code, 0, f"Expected exit 0, got {code}.\n{stdout}")

    def test_no_fail_lines(self):
        _, stdout, _ = run_validator("minimal-pass.html")
        fail_lines = [l for l in stdout.splitlines() if l.startswith("[FAIL]")]
        self.assertEqual(len(fail_lines), 0, f"Unexpected FAILs:\n" + "\n".join(fail_lines))

    def test_summary_line_exists(self):
        _, stdout, _ = run_validator("minimal-pass.html")
        self.assertIn("SUMMARY:", stdout)


class TestValidatorFailingFixture(unittest.TestCase):
    """minimal-fail.html should fail specific CRITICAL rules."""

    def test_exit_code_nonzero(self):
        code, stdout, _ = run_validator("minimal-fail.html")
        self.assertNotEqual(code, 0, f"Expected non-zero exit.\n{stdout}")

    def test_clr03_catches_rogue_color(self):
        _, stdout, _ = run_validator("minimal-fail.html")
        fail_lines = [l for l in stdout.splitlines() if "CLR-03" in l and "FAIL" in l]
        self.assertGreater(len(fail_lines), 0, "CLR-03 should FAIL for #c9a74a")

    def test_clr05_catches_gold_text(self):
        _, stdout, _ = run_validator("minimal-fail.html")
        fail_lines = [l for l in stdout.splitlines() if "CLR-05" in l and "FAIL" in l]
        self.assertGreater(len(fail_lines), 0, "CLR-05 should FAIL for var(--gold)")

    def test_a11y04_catches_missing_skip_link(self):
        _, stdout, _ = run_validator("minimal-fail.html")
        fail_lines = [l for l in stdout.splitlines() if "A11Y-04" in l and "FAIL" in l]
        self.assertGreater(len(fail_lines), 0, "A11Y-04 should FAIL for missing skip link")

    def test_a11y05_catches_missing_announcer(self):
        _, stdout, _ = run_validator("minimal-fail.html")
        fail_lines = [l for l in stdout.splitlines() if "A11Y-05" in l and "FAIL" in l]
        self.assertGreater(len(fail_lines), 0, "A11Y-05 should FAIL for missing announcer")

    def test_a11y07_catches_missing_captions(self):
        _, stdout, _ = run_validator("minimal-fail.html")
        fail_lines = [l for l in stdout.splitlines() if "A11Y-07" in l and "FAIL" in l]
        self.assertGreater(len(fail_lines), 0, "A11Y-07 should FAIL for missing captions")

    def test_a11y09_catches_span_nav(self):
        _, stdout, _ = run_validator("minimal-fail.html")
        fail_lines = [l for l in stdout.splitlines() if "A11Y-09" in l and "FAIL" in l]
        self.assertGreater(len(fail_lines), 0, "A11Y-09 should FAIL for span nav buttons")

    def test_a11y13_catches_missing_lang(self):
        _, stdout, _ = run_validator("minimal-fail.html")
        fail_lines = [l for l in stdout.splitlines() if "A11Y-13" in l and "FAIL" in l]
        self.assertGreater(len(fail_lines), 0, "A11Y-13 should FAIL for missing lang")

    def test_mob02_catches_small_toggle(self):
        _, stdout, _ = run_validator("minimal-fail.html")
        fail_lines = [l for l in stdout.splitlines() if "MOB-02" in l and "FAIL" in l]
        self.assertGreater(len(fail_lines), 0, "MOB-02 should FAIL for 36x36px toggle")

    def test_typ02_catches_root_font_override(self):
        _, stdout, _ = run_validator("minimal-fail.html")
        fail_lines = [l for l in stdout.splitlines() if "TYP-02" in l and "FAIL" in l]
        self.assertGreater(len(fail_lines), 0, "TYP-02 should FAIL for font override in :root")

    def test_nav06_catches_missing_session_storage(self):
        _, stdout, _ = run_validator("minimal-fail.html")
        fail_lines = [l for l in stdout.splitlines() if "NAV-06" in l and "FAIL" in l]
        self.assertGreater(len(fail_lines), 0, "NAV-06 should FAIL for missing sessionStorage")


class TestValidatorEdgeCases(unittest.TestCase):
    """Edge cases documented in the spec."""

    def test_nonexistent_file_exits_with_error(self):
        code, _, stderr = run_validator("nonexistent.html")
        self.assertNotEqual(code, 0)

    def test_caption_grace_flag(self):
        """With --caption-grace, A11Y-07 should be WARN not FAIL."""
        _, stdout, _ = run_validator("minimal-fail.html", ["--caption-grace"])
        a11y07_lines = [l for l in stdout.splitlines() if "A11Y-07" in l]
        self.assertGreater(len(a11y07_lines), 0, "A11Y-07 should still appear")
        self.assertIn("WARN", a11y07_lines[0], "A11Y-07 should be WARN with --caption-grace")
        self.assertNotIn("FAIL", a11y07_lines[0], "A11Y-07 should NOT be FAIL with --caption-grace")


class TestValidatorOutput(unittest.TestCase):
    """Output format matches spec."""

    def test_output_format_pass(self):
        _, stdout, _ = run_validator("minimal-pass.html")
        lines = [l for l in stdout.splitlines() if l.startswith("[")]
        for line in lines:
            self.assertRegex(line, r"^\[(PASS|WARN|FAIL)\]\s+[A-Z]+-\d+")

    def test_summary_contains_counts(self):
        _, stdout, _ = run_validator("minimal-pass.html")
        summary_lines = [l for l in stdout.splitlines() if "SUMMARY:" in l]
        self.assertGreater(len(summary_lines), 0, "SUMMARY line required")
        self.assertRegex(summary_lines[0], r"PASS.*WARN.*FAIL")

    def test_version_in_output(self):
        _, stdout, _ = run_validator("minimal-pass.html")
        self.assertIn("v1.0", stdout)


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd "C:/Users/Instructor/Dev/Employability Skills Curriculum" && python -m pytest scripts/test_validator.py -v
```

Expected: All tests FAIL (validate-lesson.py does not exist yet)

- [ ] **Step 3: Commit**

```bash
git add scripts/test_validator.py
git commit -m "test: add validator test suite — red phase (all tests fail)"
```

---

### Task 4: Implement validate-lesson.py

**Files:**
- Create: `scripts/validate-lesson.py`

The validator. Python stdlib only. Parses the lesson HTML file, extracts `<style>` and `<script>` blocks, runs checks per rule, outputs results, and exits with appropriate code.

- [ ] **Step 1: Create validate-lesson.py with block parser and rule engine**

The validator has these components:

**1. Block parser** — Custom `HTMLParser` subclass that:
- Tracks current tag and its attributes
- Extracts content of each `<style>` block (with and without `id="theme-override"`)
- Extracts content of each `<script>` block
- Records all HTML tags with their attributes and line numbers
- Builds a list of `Element(tag, attrs, line, content)` namedtuples

**2. Constants:**
```python
SPEC_VERSION = "v1.0"
CANONICAL_COLORS = {
    "--primary": "#007baf", "--accent": "#37b550", "--dark": "#004071",
    "--light": "#ffffff", "--muted": "#edf3f7", "--gray": "#60636b",
    "--gold": "#d3b257", "--royal": "#00133f", "--mauve": "#a7253f",
    "--offwhite": "#d1d3d4", "--muted-gold": "#ad8806",
}
CANONICAL_HEX_SET = {v.lower() for v in CANONICAL_COLORS.values()}
PROHIBITED_COLORS = [
    "#dc2626", "#991b1b", "#ff6b6b", "#ea580c", "#ff6b35",
    "#4c1d95", "#6c23b5", "#2e1065", "#e0e0e0", "#e5e7eb",
    "#5a6a7a", "#2d6db5", "#1e4a7d", "#1a365d", "#2b6cb0",
]
DEFAULT_FONTS = {
    "--font-heading": '"DM Serif Display"',
    "--font-body": '"Outfit"',
}
```

**3. Rule check functions** — Each returns a list of `Result` namedtuples:
```python
Result = namedtuple("Result", ["rule_id", "status", "message", "line"])
```

Rule check groups:
- `check_colors(doc)` — CLR-01 through CLR-08
- `check_typography(doc)` — TYP-01 through TYP-05
- `check_accessibility(doc)` — A11Y-01 through A11Y-19
- `check_components(doc)` — CMP-01 through CMP-03
- `check_navigation(doc)` — NAV-01 through NAV-12 (heuristic)
- `check_theme(doc)` — THM-01 through THM-05
- `check_mobile(doc)` — MOB-01 through MOB-04
- `check_performance(doc)` — PRF-01 through PRF-03
- `check_engagement(doc)` — ENG-01 through ENG-04
- `check_reduced_motion(doc)` — RDM-01 through RDM-06 (partially heuristic)

**4. Reporter:**
```python
def report(results, caption_grace=False):
    # If caption_grace, downgrade A11Y-07 from FAIL to WARN
    # Sort by rule_id
    # Print each result as [STATUS] RULE-ID  message — line N
    # Print SUMMARY: X PASS | Y WARN | Z FAIL (CRITICAL)
    # Print spec version
    # Return exit code: 1 if any FAIL, else 0
```

**5. Main:**
```python
def main():
    parser = argparse.ArgumentParser(description="SPOKES lesson quality validator")
    parser.add_argument("file", help="Path to lesson index.html")
    parser.add_argument("--caption-grace", action="store_true",
                        help="Downgrade A11Y-07 (captions) from CRITICAL to WARN")
    args = parser.parse_args()

    filepath = Path(args.file)
    if not filepath.exists():
        print(f"ERROR: File not found: {filepath}", file=sys.stderr)
        sys.exit(2)

    html_content = filepath.read_text(encoding="utf-8")
    doc = parse_document(html_content)

    results = []
    results.extend(check_colors(doc))
    results.extend(check_typography(doc))
    results.extend(check_accessibility(doc))
    results.extend(check_components(doc))
    results.extend(check_navigation(doc))
    results.extend(check_theme(doc))
    results.extend(check_mobile(doc))
    results.extend(check_performance(doc))
    results.extend(check_engagement(doc))
    results.extend(check_reduced_motion(doc))

    exit_code = report(results, caption_grace=args.caption_grace)
    sys.exit(exit_code)
```

Key implementation details for specific checks:

- **CLR-01:** Extract `:root { ... }` content via regex. Parse each `--variable: #hex;` pair. Verify all 11 present with correct values.
- **CLR-02/03/08:** Regex scan all CSS content (outside `:root`) for `#[0-9a-fA-F]{3,8}` patterns. Exclude matches inside comments. Compare each against CANONICAL_HEX_SET and PROHIBITED_COLORS.
- **CLR-05:** Regex for `.slide\s+\.gold\s*\{[^}]*color:\s*var\(--gold\)` in CSS. Should NOT match. Should find `var(--muted-gold)` instead.
- **A11Y-01:** Check for `role="tablist"`, `role="tab"`, `role="tabpanel"`, `aria-selected`, `aria-controls` in HTML elements. Only check if tabs exist (presence of `tab-btn` class).
- **A11Y-04:** Check that the first `<a>` element in `<body>` has class `skip-link` or href starting with `#`.
- **A11Y-07:** Count `<video>` elements and `<track kind="captions">` elements. If videos > 0 and tracks < videos, FAIL. Auto-PASS if 0 videos.
- **A11Y-09:** Find elements that look like nav buttons (prev/next near navigation code). Check if they are `<button>` or `<span>`. Heuristic: search for `prev` or `next` in button/span text near slide navigation.
- **A11Y-13:** Check `<html>` tag for `lang` attribute.
- **MOB-02/03:** Parse CSS for `.sidebar-toggle` width/height values. Check >= 44. Same for nav button sizing.
- **NAV-06:** Search `<script>` content for `sessionStorage` string.
- **RDM-01:** Search CSS for `prefers-reduced-motion` media query.
- **ENG-01:** Count elements with class `checkpoint-box` or similar quiz indicators. Must be >= 2.
- **ENG-02:** For each `<video>`, check if the next slide section contains `activity-box`, `checkpoint`, or `discussion-prompt` class. Heuristic.

Write the full implementation (~400-500 lines).

- [ ] **Step 2: Run tests**

```bash
cd "C:/Users/Instructor/Dev/Employability Skills Curriculum" && python -m pytest scripts/test_validator.py -v
```

Expected: Most tests PASS. Fix any failures iteratively.

- [ ] **Step 3: Run validator against all 6 real lessons to establish baseline**

```bash
for lesson in lesson-communicating-with-the-public lesson-controlling-anger lesson-time-management lesson-employee-accountability lesson-interview-skills lesson-problem-solving-and-decision-making; do
  echo "=== $lesson ==="
  python scripts/validate-lesson.py "$lesson/index.html" --caption-grace || true
  echo ""
done
```

Save this output — it becomes the input for Plan 2 (Lesson Remediation).

- [ ] **Step 4: Benchmark latency**

```bash
time python scripts/validate-lesson.py lesson-controlling-anger/index.html --caption-grace
```

Expected: under 2 seconds. If over 2s, profile and optimize.

- [ ] **Step 5: Commit**

```bash
git add scripts/validate-lesson.py
git commit -m "feat: implement validate-lesson.py — automated SPOKES quality checker"
```

---

### Task 5: Run tests — green phase

**Files:**
- Modify: `scripts/validate-lesson.py` (if any tests fail)
- Modify: `scripts/test-fixtures/minimal-pass.html` (if fixture needs adjustment)
- Modify: `scripts/test-fixtures/minimal-fail.html` (if fixture needs adjustment)

- [ ] **Step 1: Run full test suite**

```bash
cd "C:/Users/Instructor/Dev/Employability Skills Curriculum" && python -m pytest scripts/test_validator.py -v
```

- [ ] **Step 2: Fix any failures**

Iterate between validator code and test fixtures until all tests pass. Common issues:
- Regex patterns that don't match the fixture HTML exactly
- Line number extraction off by one
- Edge case handling (0-video auto-PASS logic)
- CSS property parsing differences (spaces around colons, semicolons)

- [ ] **Step 3: Run tests one final time**

```bash
cd "C:/Users/Instructor/Dev/Employability Skills Curriculum" && python -m pytest scripts/test_validator.py -v
```

Expected: ALL PASS

- [ ] **Step 4: Commit**

```bash
git add scripts/
git commit -m "test: all validator tests passing — green phase"
```

---

### Task 6: Configure PostToolUse hook

**Files:**
- Modify: `.claude/settings.local.json`

- [ ] **Step 1: Read the current hook documentation**

Check Claude Code's hook API for PostToolUse configuration. The hook needs to:
- Fire after `Write` or `Edit` tool calls
- Match file pattern `lesson-*/index.html`
- Run `python scripts/validate-lesson.py <filepath>`
- Block on non-zero exit

- [ ] **Step 2: Update .claude/settings.local.json**

Add the PostToolUse hook configuration to the existing settings. Preserve all existing `permissions.allow` entries. The hook section goes at the top level alongside `permissions`:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "python scripts/validate-lesson.py \"$CLAUDE_FILE_PATH\" --caption-grace"
          }
        ]
      }
    ]
  },
  "permissions": {
    "allow": [
      ... existing entries preserved ...
    ]
  }
}
```

Note: The exact syntax for file pattern matching and file path variable depends on Claude Code's hook API. Determine the correct approach during implementation. The hook should only fire for files matching `lesson-*/index.html` — if the API doesn't support file pattern matching natively, add a path check at the start of the command (e.g., a bash one-liner that checks the path before running the validator).

- [ ] **Step 3: Test the hook**

Make a trivial edit to a lesson file and verify the validator runs automatically. Check that:
- The validator output appears in the conversation
- A CRITICAL failure blocks the operation (expected — existing lessons have violations)
- The `--caption-grace` flag is working (A11Y-07 shows as WARN not FAIL)

- [ ] **Step 4: Commit**

```bash
git add .claude/settings.local.json
git commit -m "feat: add PostToolUse hook for automatic lesson validation"
```

---

### Task 7: Create project-level CLAUDE.md

**Files:**
- Create: `CLAUDE.md` (project root — `C:\Users\Instructor\Dev\Employability Skills Curriculum\CLAUDE.md`)

Note: There is no existing project-level CLAUDE.md. The global one at `C:\Users\Instructor\CLAUDE.md` has file organization rules that should be preserved in the project-level file.

- [ ] **Step 1: Create CLAUDE.md**

```markdown
# SPOKES Curriculum — Agent Instructions

## Required Reading

Before creating or modifying any lesson, you MUST read `SPOKES-STANDARD.md` in full.
Violations of CRITICAL rules will be caught by automated hooks and block your work.

## File Organization Standards

- Never nest files or folders more than 3 levels deep from the project root.
  - OK: `project/category/file.md`
  - OK: `project/category/subcategory/file.md`
  - NOT OK: `project/category/subcategory/deep/file.md`
- When creating new files or directories, check current depth first and flatten the structure if needed.

## Lesson Modification Rules

- Never modify the navigation engine directly — it is defined in SPOKES-STANDARD.md Section 5.
- All interactive components must meet accessibility requirements in SPOKES-STANDARD.md Section 3.
- All videos must have caption tracks (A11Y-07).
- The validator (`scripts/validate-lesson.py`) runs automatically on every Write/Edit to `lesson-*/index.html`.
- Fix all CRITICAL failures before proceeding — the hook will block until they are resolved.

## Build Process

For building new lessons, see `SPOKES Builder/CLAUDE.md` for the step-by-step build workflow.
The design rules referenced there are defined in `SPOKES-STANDARD.md`.
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: create project-level CLAUDE.md with required-reading directive"
```

---

### Task 8: Update SPOKES Builder/CLAUDE.md

**Files:**
- Modify: `SPOKES Builder/CLAUDE.md`

- [ ] **Step 1: Read the current file**

Read `SPOKES Builder/CLAUDE.md` to identify which sections contain design rules now in SPOKES-STANDARD.md.

- [ ] **Step 2: Edit the file**

Changes:
1. After the first paragraph ("You are building an interactive HTML slideshow..."), add:
   ```
   > **Design rules are defined in `SPOKES-STANDARD.md` (project root).** This file covers the build process only. If this file and SPOKES-STANDARD.md conflict, the standard wins.
   ```

2. Replace the "Design System Rules" section (lines 174-198) with:
   ```markdown
   ## Design System Rules

   See `SPOKES-STANDARD.md` for the complete rule inventory covering colors (Section 1), typography (Section 2), accessibility (Section 3), components (Section 4), navigation engine (Section 5), theme system (Section 6), mobile/touch (Section 7), performance (Section 8), engagement (Section 9), and reduced motion (Section 10).
   ```

3. In "Important Rules" section (lines 207-230), remove items 1-4 (single file, CSS/JS verbatim, theme override placement, brand colors only) since these duplicate SPOKES-STANDARD.md. Replace with:
   ```markdown
   ## Important Rules

   Design constraints are in `SPOKES-STANDARD.md`. Build-process-specific rules:

   5. **The only JS you change** is the `chapterNames` object to match the lesson's chapter names.
   6. **data-chapter must be sequential** starting from 1.
   7. **First slide** must be `slide-title` with `active` class and `data-chapter="1"`.
   8. **Last slide** must be `slide-closing` with `id="closingSlide"`.
   9. **Every chapter** must start with a `slide-section` divider.
   10. **Videos** — embed with `<video>` tag if provided, placeholder if not.
   11. **SPOKES-Logo.png** must be in the project root.
   12. **File paths in links** must be relative to index.html.
   13. **File nesting** must not exceed 3 levels from project root.
   14. **Font pairings require user approval** before applying to any lesson.
   ```

- [ ] **Step 3: Commit**

```bash
git add "SPOKES Builder/CLAUDE.md"
git commit -m "docs: thin SPOKES Builder/CLAUDE.md — reference SPOKES-STANDARD.md for design rules"
```

---

### Task 9: Update docs/repo-standards.md

**Files:**
- Modify: `docs/repo-standards.md`

- [ ] **Step 1: Read the current file**

Read `docs/repo-standards.md` (already read earlier in this session — 55 lines).

- [ ] **Step 2: Replace the Quality Enforcement section**

Replace lines 48-55 (the "Quality Enforcement" section) with:

```markdown
## Quality Enforcement

Quality checks are automated via `scripts/validate-lesson.py` and enforced by a PostToolUse hook.
See `SPOKES-STANDARD.md` for the complete rule inventory (~63 rules across 10 sections).
See the design spec at `docs/superpowers/specs/2026-04-14-curriculum-quality-standard-design.md` for architecture details.
```

- [ ] **Step 3: Commit**

```bash
git add docs/repo-standards.md
git commit -m "docs: update repo-standards.md — reference automated validator"
```

---

### Task 10: Archive scattered source files

**Files:**
- Create: `docs/archive/brand-palette.md` (moved from `SPOKES Builder/brand-palette.md`)
- Create: `docs/archive/STYLING-GUIDE-communicating.md` (moved from `lesson-communicating-with-the-public/STYLING-GUIDE.md`)

- [ ] **Step 1: Create archive directory and move files**

```bash
mkdir -p docs/archive
git mv "SPOKES Builder/brand-palette.md" docs/archive/brand-palette.md
git mv "lesson-communicating-with-the-public/STYLING-GUIDE.md" docs/archive/STYLING-GUIDE-communicating.md
```

- [ ] **Step 2: Add archive notes to each file**

Prepend to `docs/archive/brand-palette.md`:
```markdown
> **ARCHIVED** — This file has been absorbed into `SPOKES-STANDARD.md` (project root).
> It is kept here as a historical reference. Do not use for design decisions.
> Archived: 2026-04-14

```

Prepend to `docs/archive/STYLING-GUIDE-communicating.md`:
```markdown
> **ARCHIVED** — This file has been absorbed into `SPOKES-STANDARD.md` (project root).
> It is kept here as a historical reference. Do not use for design decisions.
> Archived: 2026-04-14

```

- [ ] **Step 3: Update any remaining references**

Search for references to the moved files:

```bash
grep -rn "brand-palette.md" --include="*.md" . | grep -v "docs/archive" | grep -v "node_modules"
grep -rn "STYLING-GUIDE.md" --include="*.md" . | grep -v "docs/archive" | grep -v "node_modules"
```

Update any found references to point to either `SPOKES-STANDARD.md` (for rule lookups) or `docs/archive/` (for historical reference).

- [ ] **Step 4: Commit**

```bash
git add -A docs/archive/ "SPOKES Builder/" "lesson-communicating-with-the-public/"
git commit -m "docs: archive brand-palette.md and STYLING-GUIDE.md — absorbed into SPOKES-STANDARD.md"
```

---

### Task 11: Generate baseline validation report

**Files:**
- Create: `docs/baseline-validation-report.md`

- [ ] **Step 1: Run validator on all 6 lessons and capture output**

```bash
echo "# SPOKES Baseline Validation Report" > docs/baseline-validation-report.md
echo "" >> docs/baseline-validation-report.md
echo "Generated: $(date -I)" >> docs/baseline-validation-report.md
echo "Validator: scripts/validate-lesson.py (SPOKES-STANDARD v1.0)" >> docs/baseline-validation-report.md
echo "Flag: --caption-grace (A11Y-07 downgraded to WARN during caption production)" >> docs/baseline-validation-report.md
echo "" >> docs/baseline-validation-report.md

for lesson in lesson-communicating-with-the-public lesson-controlling-anger lesson-time-management lesson-employee-accountability lesson-interview-skills lesson-problem-solving-and-decision-making; do
  echo "## $lesson" >> docs/baseline-validation-report.md
  echo '```' >> docs/baseline-validation-report.md
  python scripts/validate-lesson.py "$lesson/index.html" --caption-grace >> docs/baseline-validation-report.md 2>&1 || true
  echo '```' >> docs/baseline-validation-report.md
  echo "" >> docs/baseline-validation-report.md
done
```

- [ ] **Step 2: Review the report**

Check that:
- All 6 lessons produce output
- Expected failures from audit findings appear (CLR-03 in TM/EA for `#c9a74a`, CLR-05 in CA/EA/PSDM for `var(--gold)`, zero ARIA in CWP/CA/PSDM, etc.)
- 0-video edge case (EA) auto-PASSes video rules
- 0-sound edge case (TM) auto-PASSes RDM-04
- No validator crashes or unexpected errors
- Latency is acceptable for all 6 files

- [ ] **Step 3: Commit**

```bash
git add docs/baseline-validation-report.md
git commit -m "docs: generate baseline validation report for all 6 lessons"
```

This report becomes the input for Plan 2 (Lesson Remediation). Each FAIL line maps to a specific fix with a rule ID and line number.

---

## Self-Review Checklist

- [x] **Spec coverage:** Every infrastructure deliverable in the design spec has a task.
  - SPOKES-STANDARD.md → Task 1
  - validate-lesson.py → Tasks 2-5 (TDD: fixtures, tests, implementation, green)
  - PostToolUse hook → Task 6
  - CLAUDE.md → Task 7
  - SPOKES Builder/CLAUDE.md update → Task 8
  - repo-standards.md update → Task 9
  - File archiving → Task 10
  - Baseline report → Task 11
- [x] **Placeholder scan:** Task 4 (validator implementation) describes architecture and component responsibilities with code snippets rather than the full 400-500 line file, because the test suite (Task 3) defines the exact contract. All other tasks have complete code or exact commands.
- [x] **Type consistency:** `run_validator()` signature consistent across test file. `SPEC_VERSION`, `CANONICAL_COLORS`, `PROHIBITED_COLORS`, `DEFAULT_FONTS` constants referenced consistently. `Result` namedtuple used throughout.
- [x] **Ordering:** Tasks sequenced correctly — spec before fixtures, fixtures before tests, tests before implementation, implementation before hook, hook before CLAUDE.md, doc updates before archiving, archiving before baseline.
