#!/usr/bin/env python3
"""Check a built lesson against its saved Bespoke design contract (static only)."""
from __future__ import annotations

import argparse
from html.parser import HTMLParser
import json
from pathlib import Path
import sys

from bespoke_design import sha


class Deck(HTMLParser):
    def __init__(self):
        super().__init__()
        self.styles = []
        self.current_style = None
        self.digest = None
        self.dark = False
        self.chapters = {}

    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        classes = (attrs.get("class") or "").split()
        if tag == "style":
            self.current_style = [attrs.get("id"), ""]
            self.styles.append(self.current_style)
        if tag == "meta" and attrs.get("name") == "bespoke-selection-sha256":
            self.digest = attrs.get("content")
        if "main" in classes and "theme-dark" in classes:
            self.dark = True
        if "slide-section" in classes:
            self.chapters[attrs.get("data-chapter-num")] = attrs.get("data-chapter")

    def handle_endtag(self, tag):
        if tag == "style":
            self.current_style = None

    def handle_data(self, text):
        if self.current_style is not None:
            self.current_style[1] += text


def check_design(contract: dict, html_file: Path) -> list[str]:
    errors = []
    deck = Deck()
    deck.feed(html_file.read_text(encoding="utf-8"))
    if contract.get("schema") != "bespoke-build-contract/v1":
        return ["Unknown design contract schema"]
    if deck.digest != contract["selectionSha256"]:
        errors.append("Missing or wrong bespoke-selection-sha256 meta tag")
    selected = [text for name, text in deck.styles if name == "theme-override"]
    if len(selected) != 1 or sha(selected[0].strip() + "\n") != contract["cssSha256"]:
        errors.append("theme-override differs from the saved design.css")
    if not deck.styles or deck.styles[-1][0] != "theme-override":
        errors.append("theme-override must be the last embedded style block")
    if contract["mainClassRequired"] == "theme-dark" and not deck.dark:
        errors.append("Dark design requires main.theme-dark")
    for key, number in contract["chapterMap"].items():
        if deck.chapters.get(key) != number:
            errors.append(f"Missing or wrong chapter divider mapping: {key} must be chapter {number}")
    for relative in contract["fontPaths"]:
        if not (html_file.parent / relative).is_file():
            errors.append(f"Missing font file relative to final HTML: {relative}")
    return errors


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("contract", type=Path)
    parser.add_argument("html", type=Path)
    args = parser.parse_args()
    errors = check_design(json.loads(args.contract.read_text(encoding="utf-8")), args.html)
    if errors:
        print("\n".join(errors), file=sys.stderr)
        return 1
    print("Bespoke static design contract passed. Browser appearance/content review is still required.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
