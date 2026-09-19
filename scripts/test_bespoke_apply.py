#!/usr/bin/env python3
"""Tests for bespoke-apply-selection.py and FID-5 derivation."""

from __future__ import annotations

import importlib.util
import json
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
SCRIPTS = REPO_ROOT / "scripts"
FIXTURE = SCRIPTS / "test-fixtures" / "bespoke" / "selection-money-management.json"


def load_apply_module():
    path = SCRIPTS / "bespoke-apply-selection.py"
    spec = importlib.util.spec_from_file_location("bespoke_apply_selection", path)
    mod = importlib.util.module_from_spec(spec)
    assert spec.loader
    spec.loader.exec_module(mod)
    return mod


mod = load_apply_module()


class DeriveTests(unittest.TestCase):
    def test_normalize_lesson_id(self) -> None:
        self.assertEqual(mod.normalize_lesson_id("money-management"), "lesson-money-management")
        self.assertEqual(
            mod.normalize_lesson_id("lesson-money-management"), "lesson-money-management"
        )

    def test_derivation_covers_every_chapter(self) -> None:
        for key in mod.CHAPTER_KEYS:
            self.assertIn(key, mod.DERIVED_LAYER2)
            self.assertIn("leadComponent", mod.DERIVED_LAYER2[key])
            self.assertIn("secondaryAccent", mod.DERIVED_LAYER2[key])

    def test_derive_uniform_cards(self) -> None:
        theme = {
            "dividerStyle": "framed-gold",
            "cards": {"lessonWide": "pill", "varyByChapter": False, "chapterStyles": None},
        }
        styles = mod.derive_chapter_styles(theme)
        self.assertEqual(set(styles), set(mod.CHAPTER_KEYS))
        for key, block in styles.items():
            self.assertEqual(block["divider"], "framed-gold")
            self.assertEqual(block["cards"], "pill")
            self.assertEqual(block["leadComponent"], mod.DERIVED_LAYER2[key]["leadComponent"])
            self.assertEqual(
                block["secondaryAccent"], mod.DERIVED_LAYER2[key]["secondaryAccent"]
            )

    def test_derive_vary_by_chapter(self) -> None:
        payload = json.loads(FIXTURE.read_text(encoding="utf-8"))
        styles = mod.derive_chapter_styles(payload["theme"])
        self.assertEqual(styles["W"]["cards"], "left-border")
        self.assertEqual(styles["I"]["cards"], "shadow-float")
        self.assertEqual(styles["P3"]["leadComponent"], "dangers-grid")
        self.assertEqual(styles["A"]["secondaryAccent"], "gold")


class ApplyTests(unittest.TestCase):
    def test_apply_to_tmp_registries(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            theme_src = REPO_ROOT / "SPOKES Builder" / "theme-registry.json"
            lesson_src = REPO_ROOT / "lesson-registry.json"
            theme_dst = tmp_path / "theme-registry.json"
            lesson_dst = tmp_path / "lesson-registry.json"
            shutil.copy(theme_src, theme_dst)
            shutil.copy(lesson_src, lesson_dst)

            before_theme = json.loads(theme_dst.read_text(encoding="utf-8"))
            before_count = len(before_theme["lessons"])

            result = subprocess.run(
                [
                    sys.executable,
                    str(SCRIPTS / "bespoke-apply-selection.py"),
                    "--selection",
                    str(FIXTURE),
                    "--theme-registry",
                    str(theme_dst),
                    "--lesson-registry",
                    str(lesson_dst),
                ],
                cwd=REPO_ROOT,
                capture_output=True,
                text=True,
            )
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

            theme = json.loads(theme_dst.read_text(encoding="utf-8"))
            lesson = json.loads(lesson_dst.read_text(encoding="utf-8"))
            self.assertIn("lesson-money-management", theme["lessons"])
            self.assertEqual(len(theme["lessons"]), before_count + 1)
            entry = theme["lessons"]["lesson-money-management"]
            self.assertEqual(entry["colorLead"], "blue")
            self.assertEqual(entry["chapterStyles"]["P1"]["cards"], "outlined")
            self.assertEqual(entry["chapterStyles"]["P1"]["leadComponent"], "smart-stack")

            self.assertEqual(
                theme["lessons"]["lesson-time-management"]["colorLead"],
                before_theme["lessons"]["lesson-time-management"]["colorLead"],
            )

            ids = [row["id"] for row in lesson["lessons"]]
            self.assertIn("lesson-money-management", ids)
            mm = next(row for row in lesson["lessons"] if row["id"] == "lesson-money-management")
            self.assertEqual(mm["status"], "bespoke-pending")
            self.assertIn("bespoke-pending", lesson["rules"]["statusValues"])

            result2 = subprocess.run(
                [
                    sys.executable,
                    str(SCRIPTS / "bespoke-apply-selection.py"),
                    "--selection",
                    str(FIXTURE),
                    "--theme-registry",
                    str(theme_dst),
                    "--lesson-registry",
                    str(lesson_dst),
                ],
                cwd=REPO_ROOT,
                capture_output=True,
                text=True,
            )
            self.assertEqual(result2.returncode, 0, result2.stdout + result2.stderr)
            theme2 = json.loads(theme_dst.read_text(encoding="utf-8"))
            lesson2 = json.loads(lesson_dst.read_text(encoding="utf-8"))
            self.assertEqual(len(theme2["lessons"]), before_count + 1)
            self.assertEqual(
                sum(1 for row in lesson2["lessons"] if row["id"] == "lesson-money-management"),
                1,
            )


if __name__ == "__main__":
    unittest.main()
