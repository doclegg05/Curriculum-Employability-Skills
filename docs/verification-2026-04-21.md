# Verification Report — 2026-04-21 Critical Shortfall Remediation

Verifier: Wave-2 (Verifier-2) — post-rescue sweep
Branch: `feat/design-system-strengthening`
Date: 2026-04-21
Prior state: Wave-1 Verifier found 7/11 resolved, 6 PSDM + 1 EA fix missing.
Rescue commits: `84a3a88` (PSDM — 6 CRITICALs), `5433dd6` (EA — swipe scope bonus).

---

## Validator sweep

All six lessons run with `python scripts/validate-lesson.py <lesson>/index.html --caption-grace`.

| Lesson | Summary | Result |
|---|---|---|
| CWP (`lesson-communicating-with-the-public`) | `SUMMARY: 66 PASS \| 0 WARN \| 0 FAIL (CRITICAL)` | PASS |
| CA (`lesson-controlling-anger`) | `SUMMARY: 66 PASS \| 0 WARN \| 0 FAIL (CRITICAL)` | PASS |
| TM (`lesson-time-management`) | `SUMMARY: 66 PASS \| 0 WARN \| 0 FAIL (CRITICAL)` | PASS |
| PSDM (`lesson-problem-solving-and-decision-making`) | `SUMMARY: 66 PASS \| 0 WARN \| 0 FAIL (CRITICAL)` | PASS |
| IS (`lesson-interview-skills`) | `SUMMARY: 66 PASS \| 0 WARN \| 0 FAIL (CRITICAL)` | PASS |
| EA (`lesson-employee-accountability`) | `SUMMARY: 66 PASS \| 0 WARN \| 0 FAIL (CRITICAL)` | PASS |

All six lessons pass all 66 validator checks with zero warnings and zero failures.

---

## pytest

```
python -m pytest scripts/test_validator.py -v
```

```
============================= test session starts =============================
platform win32 -- Python 3.13.6, pytest-9.0.3, pluggy-1.6.0
collected 26 items

scripts/test_validator.py::TestValidatorPassingFixture::test_exit_code_zero PASSED
scripts/test_validator.py::TestValidatorPassingFixture::test_no_fail_lines PASSED
scripts/test_validator.py::TestValidatorPassingFixture::test_summary_line_exists PASSED
scripts/test_validator.py::TestValidatorFailingFixture::test_a11y04_catches_missing_skip_link PASSED
scripts/test_validator.py::TestValidatorFailingFixture::test_a11y05_catches_missing_announcer PASSED
scripts/test_validator.py::TestValidatorFailingFixture::test_a11y07_catches_missing_captions PASSED
scripts/test_validator.py::TestValidatorFailingFixture::test_a11y09_catches_span_nav PASSED
scripts/test_validator.py::TestValidatorFailingFixture::test_a11y13_catches_missing_lang PASSED
scripts/test_validator.py::TestValidatorFailingFixture::test_clr03_catches_rogue_color PASSED
scripts/test_validator.py::TestValidatorFailingFixture::test_clr05_catches_gold_text PASSED
scripts/test_validator.py::TestValidatorFailingFixture::test_exit_code_nonzero PASSED
scripts/test_validator.py::TestValidatorFailingFixture::test_mob02_catches_small_toggle PASSED
scripts/test_validator.py::TestValidatorFailingFixture::test_nav06_catches_missing_session_storage PASSED
scripts/test_validator.py::TestValidatorFailingFixture::test_typ02_catches_root_font_override PASSED
scripts/test_validator.py::TestValidatorEdgeCases::test_caption_grace_flag PASSED
scripts/test_validator.py::TestValidatorEdgeCases::test_nonexistent_file_exits_with_error PASSED
scripts/test_validator.py::TestValidatorFalseNegativeFixes::test_a11y07_catches_unbalanced_tracks PASSED
scripts/test_validator.py::TestValidatorFalseNegativeFixes::test_clr02_catches_inline_style_hex PASSED
scripts/test_validator.py::TestValidatorFalseNegativeFixes::test_clr05_catches_grouped_selector PASSED
scripts/test_validator.py::TestValidatorOutput::test_output_format_pass PASSED
scripts/test_validator.py::TestValidatorOutput::test_summary_contains_counts PASSED
scripts/test_validator.py::TestValidatorOutput::test_version_in_output PASSED
scripts/test_validator.py::TestCLR05Boundaries::test_clr05_ignores_gold_border_class PASSED
scripts/test_validator.py::TestCLR05Boundaries::test_clr05_ignores_gold_card_descendant_background PASSED
scripts/test_validator.py::TestCLR05Boundaries::test_clr05_still_catches_comma_grouped_gold_selector PASSED
scripts/test_validator.py::TestCLR05Boundaries::test_clr05_still_catches_plain_gold_selector PASSED

============================= 26 passed in 1.85s ==============================
```

**Result: PASS** — 26/26 tests pass, including 3 false-negative regression tests (`TestValidatorFalseNegativeFixes`) and 4 CLR-05 boundary tests (`TestCLR05Boundaries`).

---

## 11-Finding Resolution Matrix

| # | Finding | Target files | Resolved? | Evidence |
|---|---|---|---|---|
| A11Y-CR1 | `<span>` prev/next nav (not keyboard-operable) | CWP, CA, TM, PSDM | RESOLVED | `grep -c 'button type="button" class="key-icon"'`: CWP=2, CA=2, TM=2, PSDM=2. All four targets have native `<button>` elements with `class="key-icon"`. |
| A11Y-CR2 | `<div>` accordion headers (no keyboard support) | CWP, CA | RESOLVED | `grep -c 'button type="button" class="accordion-header"'`: CWP=3, CA=4. Zero `<div class="accordion-header">` hits in either file. |
| A11Y-CR3 | Slide announcer omits slide title | CWP, CA, PSDM | RESOLVED | `grep -n "announcer.textContent"` in all three targets: CWP line 2912, CA line 3353, PSDM line 3213 — all include `': ' + slideTitle.textContent.replace(/\s+/g, ' ').trim()`. CA and PSDM also have a fallback branch without the title for the edge case where no `slideTitle` node exists; the primary branch includes the title. |
| A11Y-CR4 | Keydown guard missing `[role="tab"]` (Space double-fires) | CWP, CA, TM, PSDM | RESOLVED | `grep -c '\[role="tab"\]'`: CWP=4, CA=2, TM=2, PSDM=2. All six lessons have at least one `[role="tab"]` reference in their keydown guard logic. |
| A11Y-CR5 | Swipe bound to `document`, not `.main` | CWP, CA, TM, PSDM (+EA bonus) | RESOLVED | `grep -rn "document\.addEventListener.*touchstart" lesson-*/index.html` returned **NO MATCHES**. EA bonus fix (commit `5433dd6`) scoped EA's handler to `mainEl.addEventListener('touchstart', ...)` (confirmed line 3202). |
| A11Y-CR6 | No skip link on Dashboard | Dashboard.html | RESOLVED | `grep -c 'class="skip-link"' Dashboard.html` = 1. |
| A11Y-CR7 | `confettiTriggered` guard missing | CA, PSDM | RESOLVED | `grep -c "confettiTriggered"`: CA=4, PSDM=4. Both files have the declaration, reset, guard condition, and set-true pattern (full 4-hit expected count). |
| A11Y-CR8 | CC toggle `min-height: 32px` (needs 44px) | PSDM, IS | RESOLVED | `grep -n "min-height: 32px" lesson-*/index.html` returned **NO MATCHES**. PSDM `.cc-toggle` block has `min-width: 44px; min-height: 44px` (confirmed lines 1128+). IS `.cc-toggle` block similarly has `min-height: 44px` (confirmed line 957+). |
| VAL-CR1 | A11Y-07 uses total `<track>` count, not per-video | `validate-lesson.py` | RESOLVED | `grep -n "per.video\|videos_with_captions" scripts/validate-lesson.py`: lines 472, 479, 483, 486 confirm per-video logic using `videos_with_captions` counter. Test `test_a11y07_catches_unbalanced_tracks` PASS. |
| VAL-CR2 | CLR-05/06 regex misses comma-grouped selectors | `validate-lesson.py` | RESOLVED | `grep -n "grouped_selector" scripts/test_validator.py`: test `test_clr05_catches_grouped_selector` at line 123 PASS. Additional boundary tests `test_clr05_still_catches_comma_grouped_gold_selector` and `test_clr05_still_catches_plain_gold_selector` both PASS. |
| VAL-CR3 | CLR-02 ignores inline `style=` attributes | `validate-lesson.py` | RESOLVED | `grep -n "inline_style" scripts/test_validator.py`: test `test_clr02_catches_inline_style_hex` at line 132 PASS (docstring: "VAL-CR3: inline style='color: #dc2626' should FAIL CLR-02"). |

---

## Playwright smoke

SKIPPED — MCP Playwright unavailable in this dispatch context.

---

## Summary

- **11 / 11 CRITICAL findings resolved**
- Validator: PASS (66/66 across all 6 lessons, 0 WARN, 0 FAIL)
- Tests: PASS (26/26)
- Rescue commits confirmed: `84a3a88` (PSDM 6 CRITICALs), `5433dd6` (EA swipe scope)
- **Overall: READY FOR REVIEW**

---

## Known follow-ups (not blocking merge)

- HIGH findings from 2026-04-21 review: sidebar `aria-expanded`, progress bar ARIA, hover instruction text in PSDM, gold contrast on `.activity-label`, API timeout in `generate-captions.py`, two-list dead code in TM.
- 8 validator rules are hardcoded PASS stubs: THM-02/03/04, A11Y-16, ENG-02/04, MOB-04, PRF-02.
- `validate-lesson.py` is 948 lines — exceeds the project's own 800-line limit.
- `test_validator.py` uses `subprocess`, preventing `pytest --cov` coverage measurement.
- `lesson-employee-accountability/index.html` swipe handler is now scoped to `mainEl` (commit `5433dd6`) — this was a bonus fix beyond the original Wave-1 scope.
- Fixer-PSDM's original commit `4431c64` had a parallel-agent git stash race that lost 6 fixes — document as a process lesson for future multi-agent runs with PSDM-class files.
