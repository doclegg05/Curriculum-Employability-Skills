#!/usr/bin/env python3
"""Unit tests for Bespoke selection schema generate + validate."""

from __future__ import annotations

import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
SCRIPTS = REPO_ROOT / "scripts"
FIXTURES = SCRIPTS / "test-fixtures" / "bespoke"
SCHEMA = REPO_ROOT / "bespoke" / "selection.schema.json"


class SelectionSchemaTests(unittest.TestCase):
    def test_generate_check_is_clean(self) -> None:
        result = subprocess.run(
            [sys.executable, str(SCRIPTS / "generate-selection-schema.py"), "--check"],
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
        )
        self.assertEqual(result.returncode, 0, result.stderr or result.stdout)

    def test_money_management_fixture_passes(self) -> None:
        result = subprocess.run(
            [
                sys.executable,
                str(SCRIPTS / "validate-bespoke-selection.py"),
                str(FIXTURES / "selection-money-management.json"),
            ],
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
        )
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_invalid_fixture_fails_with_readable_message(self) -> None:
        result = subprocess.run(
            [
                sys.executable,
                str(SCRIPTS / "validate-bespoke-selection.py"),
                str(FIXTURES / "selection-invalid-slug.json"),
            ],
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
        )
        self.assertNotEqual(result.returncode, 0)
        combined = result.stdout + result.stderr
        self.assertIn("FAIL", combined)
        self.assertTrue(
            "colorLead" in combined or "lesson.id" in combined or "pattern" in combined,
            combined,
        )

    def test_expect_fail_mode(self) -> None:
        result = subprocess.run(
            [
                sys.executable,
                str(SCRIPTS / "validate-bespoke-selection.py"),
                "--expect-fail",
                str(FIXTURES / "selection-invalid-slug.json"),
            ],
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
        )
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_schema_enums_include_catalog_slugs(self) -> None:
        schema = json.loads(SCHEMA.read_text(encoding="utf-8"))
        library = json.loads(
            (REPO_ROOT / "SPOKES Builder" / "bespoke-library-catalog.json").read_text(
                encoding="utf-8"
            )
        )
        card_slugs = [o["slug"] for o in library["families"]["cards"]["options"]]
        self.assertEqual(
            schema["properties"]["theme"]["properties"]["cards"]["properties"]["lessonWide"][
                "enum"
            ],
            card_slugs,
        )

    def test_stale_schema_check_fails(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            bad = Path(tmp) / "selection.schema.json"
            bad.write_text('{"title":"stale"}\n', encoding="utf-8")
            result = subprocess.run(
                [
                    sys.executable,
                    str(SCRIPTS / "generate-selection-schema.py"),
                    "--check",
                    "--out",
                    str(bad),
                ],
                cwd=REPO_ROOT,
                capture_output=True,
                text=True,
            )
            self.assertNotEqual(result.returncode, 0)


if __name__ == "__main__":
    unittest.main()
