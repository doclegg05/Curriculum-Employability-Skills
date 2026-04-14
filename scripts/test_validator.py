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
