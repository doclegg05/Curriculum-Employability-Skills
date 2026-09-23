"""Download-button text contrast for every color lead in the theme library.

Resolves the button's resting and hover colors the way a lesson cascades them:
template.html base and :hover rules, then the lead snippet from theme-options.json
(same specificity, later wins; :hover beats the base rule). Every result must
meet WCAG AA for normal text (4.5:1).
"""
from pathlib import Path
import json
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]
TEMPLATE = (ROOT / "SPOKES Builder/template.html").read_text(encoding="utf-8")
OPTIONS = json.loads((ROOT / "SPOKES Builder/theme-options.json").read_text(encoding="utf-8"))
AA = 4.5


def palette():
    root = re.search(r":root\s*\{(.*?)\}", TEMPLATE, re.S).group(1)
    return {name: value.lower() for name, value in re.findall(r"--([\w-]+):\s*(#[0-9a-fA-F]{6})", root)}


PALETTE = palette()


def declarations(css, selector):
    """Merged declarations of every rule whose selector list is exactly `selector`."""
    found = {}
    css = re.sub(r"/\*.*?\*/", "", css, flags=re.S)
    for sel, body in re.findall(r"([^{}]+)\{([^}]*)\}", css):
        if [s.strip() for s in sel.split(",")] == [selector]:
            for prop, value in re.findall(r"([\w-]+)\s*:\s*([^;]+);?", body):
                found[prop.strip()] = value.strip()
    return found


def color(value):
    value = value.strip()
    var = re.fullmatch(r"var\(--([\w-]+)\)", value)
    if var:
        return PALETTE[var.group(1)]
    if re.fullmatch(r"#[0-9a-fA-F]{6}", value):
        return value.lower()
    raise ValueError(f"Unresolvable color {value!r}")


def brightness(hex_color, factor):
    channels = [int(hex_color[i:i + 2], 16) for i in (1, 3, 5)]
    return "#" + "".join(f"{min(255, round(c * factor)):02x}" for c in channels)


def luminance(hex_color):
    def channel(c):
        c /= 255
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = (channel(int(hex_color[i:i + 2], 16)) for i in (1, 3, 5))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast(a, b):
    high, low = sorted((luminance(a), luminance(b)), reverse=True)
    return (high + 0.05) / (low + 0.05)


def button_states(lead_css):
    """(resting background, text), (hover background, text) for one lead."""
    base = {**declarations(TEMPLATE, ".download-btn"), **declarations(lead_css, ".download-btn")}
    hover = {**base, **declarations(TEMPLATE, ".download-btn:hover"), **declarations(lead_css, ".download-btn:hover")}
    rest = (color(base["background"]), color(base["color"]))
    hover_bg = color(hover["background"])
    factor = re.search(r"brightness\(([\d.]+)\)", hover.get("filter", ""))
    if factor:
        hover_bg = brightness(hover_bg, float(factor.group(1)))
    return rest, (hover_bg, color(hover["color"]))


def leads():
    for section in OPTIONS["sections"]:
        if (section.get("family") or section["id"]) == "colorLeads":
            yield from section["options"]


class DownloadButtonContrast(unittest.TestCase):
    def test_template_default_button_meets_aa(self):
        (bg, fg), (hover_bg, hover_fg) = button_states("")
        self.assertGreaterEqual(contrast(bg, fg), AA, f"template rest {fg} on {bg}")
        self.assertGreaterEqual(contrast(hover_bg, hover_fg), AA, f"template hover {hover_fg} on {hover_bg}")

    def test_every_color_lead_button_meets_aa_at_rest_and_on_hover(self):
        for lead in leads():
            (bg, fg), (hover_bg, hover_fg) = button_states(lead.get("css", ""))
            with self.subTest(lead=lead["slug"], state="rest"):
                self.assertGreaterEqual(contrast(bg, fg), AA, f"{fg} on {bg}")
            with self.subTest(lead=lead["slug"], state="hover"):
                self.assertGreaterEqual(contrast(hover_bg, hover_fg), AA, f"{hover_fg} on {hover_bg}")


if __name__ == "__main__":
    unittest.main()
