"""Tests for scripts/lesson-px-to-rem.py."""
from __future__ import annotations

import importlib.util
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parent / "lesson-px-to-rem.py"
_spec = importlib.util.spec_from_file_location("lesson_px_to_rem", SCRIPT)
assert _spec and _spec.loader
px_to_rem = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(px_to_rem)


def css(text: str) -> str:
    """Convert a stylesheet wrapped in the page shell the script expects."""
    html, _ = px_to_rem.convert_html(f"<style>{text}</style>")
    return html[len("<style>") : -len("</style>")]


class LayoutValues(unittest.TestCase):
    def test_sizes_become_rem_at_sixteen_to_one(self) -> None:
        self.assertEqual(css(".a { width: 250px; height: 44px; }"), ".a { width: 15.625rem; height: 2.75rem; }")

    def test_spacing_and_type_convert(self) -> None:
        self.assertEqual(
            css(".a { padding: 16px 24px; margin-top: -24px; gap: 12px; font-size: 20px; }"),
            ".a { padding: 1rem 1.5rem; margin-top: -1.5rem; gap: 0.75rem; font-size: 1.25rem; }",
        )

    def test_values_inside_functions_convert(self) -> None:
        self.assertEqual(
            css(".a { width: min(100%, 720px); height: calc(100vh - 120px); max-width: clamp(150px, 40vw, 20rem); }"),
            ".a { width: min(100%, 45rem); height: calc(100vh - 7.5rem); max-width: clamp(9.375rem, 40vw, 20rem); }",
        )

    def test_grid_tracks_flex_and_custom_properties_convert(self) -> None:
        self.assertEqual(
            css(".a { grid-template-columns: minmax(120px, 32%) 1fr; flex: 0 0 380px; --board-h: 320px; }"),
            ".a { grid-template-columns: minmax(7.5rem, 32%) 1fr; flex: 0 0 23.75rem; --board-h: 20rem; }",
        )

    def test_small_values_stay_in_px(self) -> None:
        text = ".a { padding: 8px 10px; margin: 4px; gap: 11.5px; top: 2px; }"
        self.assertEqual(css(text), text)

    def test_card_radius_converts_but_a_pill_radius_does_not(self) -> None:
        self.assertEqual(css(".a { border-radius: 16px; }"), ".a { border-radius: 1rem; }")
        self.assertEqual(css(".a { border-radius: 999px; }"), ".a { border-radius: 999px; }")


class LeftAlone(unittest.TestCase):
    def test_decoration_stays_in_px(self) -> None:
        text = (
            ".a { border: 16px solid red; outline: 12px solid blue; outline-offset: 14px;"
            " box-shadow: 0 16px 38px rgba(0, 19, 63, 0.35); text-shadow: 0 12px 24px #000;"
            " letter-spacing: 12px; transform: translateY(-100px); background-size: 28px 28px;"
            " background-position: 20px 40px; filter: blur(12px); }"
        )
        self.assertEqual(css(text), text)

    def test_keyframes_and_font_face_are_skipped(self) -> None:
        text = (
            "@keyframes grow { from { width: 0; } to { width: 120px; } }"
            " @font-face { font-family: X; size-adjust: 100%; }"
        )
        self.assertEqual(css(text), text)

    def test_media_query_conditions_keep_px(self) -> None:
        self.assertEqual(
            css("@media (min-width: 769px) and (max-height: 900px) { .a { width: 320px; } }"),
            "@media (min-width: 769px) and (max-height: 900px) { .a { width: 20rem; } }",
        )

    def test_validator_tap_targets_keep_px(self) -> None:
        text = ".sidebar-toggle { width: 44px; height: 44px; } .nav-btn, .key-icon { min-width: 44px; height: 44px; }"
        self.assertEqual(css(text), text)

    def test_root_font_size_keeps_px_because_it_defines_the_rem(self) -> None:
        text = "@media (min-width: 769px) { html { font-size: clamp(13px, min(2.1vh, 1.181vw), 48px); } }"
        self.assertEqual(css(text), text)
        self.assertEqual(css(":root { font-size: 19px; }"), ":root { font-size: 19px; }")
        self.assertEqual(css("html { font-size: 19px; width: 320px; }"), "html { font-size: 19px; width: 20rem; }")

    def test_comments_strings_and_urls_are_not_rewritten(self) -> None:
        text = '.a { /* was 250px wide */ content: "250px"; background: url("img-250px.png"); }'
        self.assertEqual(css(text), text)

    def test_hex_colors_and_class_names_with_px_are_safe(self) -> None:
        text = ".w-20px { color: #20px; }"
        self.assertEqual(css(text), text)


class WholePage(unittest.TestCase):
    PAGE = (
        '<html><head><style>.a { width: 250px; }</style>'
        '<style id="theme-override">.b { max-height: 405px; border: 12px solid; }</style></head>'
        '<body><img style="max-width:560px; border:14px solid"><script>el.style.width = size + "px"; const w = "250px";</script>'
        '<p>Bring 250px of nothing.</p></body></html>'
    )

    def test_every_style_block_and_inline_style_converts(self) -> None:
        html, counts = px_to_rem.convert_html(self.PAGE)
        self.assertIn(".a { width: 15.625rem; }", html)
        self.assertIn(".b { max-height: 25.3125rem; border: 12px solid; }", html)
        self.assertIn('style="max-width:35rem; border:14px solid"', html)
        self.assertEqual(sum(counts.values()), 3)

    def test_scripts_and_slide_text_are_untouched(self) -> None:
        html, _ = px_to_rem.convert_html(self.PAGE)
        self.assertIn('el.style.width = size + "px"; const w = "250px";', html)
        self.assertIn("<p>Bring 250px of nothing.</p>", html)

    def test_a_page_written_by_a_script_is_untouched(self) -> None:
        # Employee Accountability's print queue opens a window and writes a
        # whole page into it. That page has its own root size, so its style
        # block and inline styles are not the lesson's to convert.
        popup = (
            "<script>win.document.write(`<html><head><style>h1 { font-size: 20px; }"
            ' main { height: calc(100vh - 68px); }</style></head>'
            '<body><p style="margin: 12px 0 16px">Queue</p></body></html>`);</script>'
        )
        html, counts = px_to_rem.convert_html(self.PAGE + popup + "<style>.c { width: 160px; }</style>")
        self.assertIn(popup, html)
        self.assertIn(".c { width: 10rem; }", html)
        self.assertEqual(sum(counts.values()), 4)

    def test_running_twice_changes_nothing_more(self) -> None:
        once, _ = px_to_rem.convert_html(self.PAGE)
        twice, counts = px_to_rem.convert_html(once)
        self.assertEqual(once, twice)
        self.assertEqual(counts, {})

    def test_check_mode_reports_and_does_not_write(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            page = os.path.join(tmp, "index.html")
            with open(page, "w", encoding="utf-8") as fh:
                fh.write(self.PAGE)
            before = subprocess.run([sys.executable, str(SCRIPT), page, "--check"], capture_output=True, text=True)
            with open(page, encoding="utf-8") as fh:
                self.assertEqual(fh.read(), self.PAGE, "--check must not write")
            self.assertEqual(before.returncode, 1)
            self.assertIn("3 px layout value(s) left", before.stdout)
            convert = subprocess.run([sys.executable, str(SCRIPT), page], capture_output=True, text=True)
            self.assertEqual(convert.returncode, 0)
            after = subprocess.run([sys.executable, str(SCRIPT), page, "--check"], capture_output=True, text=True)
            self.assertEqual(after.returncode, 0)
            self.assertIn("0 px layout value(s) left", after.stdout)


if __name__ == "__main__":
    unittest.main()
