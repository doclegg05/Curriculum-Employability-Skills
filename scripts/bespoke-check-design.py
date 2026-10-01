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
        self.base = None
        self.nodes = []
        self.stack = []

    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        classes = (attrs.get("class") or "").split()
        node = {"tag": tag, "attrs": attrs, "classes": classes, "children": []}
        if self.stack:
            self.stack[-1]["children"].append(node)
        self.nodes.append(node)
        if tag not in {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"}:
            self.stack.append(node)
        if tag == "base":
            self.base = attrs.get("href")
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
        for index in range(len(self.stack) - 1, -1, -1):
            if self.stack[index]["tag"] == tag:
                del self.stack[index:]
                break

    def handle_data(self, text):
        if self.current_style is not None:
            self.current_style[1] += text


def check_design(contract: dict, html_file: Path) -> list[str]:
    errors = []
    deck = Deck()
    deck.feed(html_file.read_text(encoding="utf-8"))
    if contract.get("schema") not in ("bespoke-build-contract/v1", "bespoke-build-contract/v2"):
        return ["Unknown design contract schema"]
    if deck.digest != contract["selectionSha256"]:
        errors.append("Missing or wrong bespoke-selection-sha256 meta tag")
    selected = [text for name, text in deck.styles if name == "theme-override"]
    if len(selected) != 1 or sha(selected[0].strip() + "\n") != contract["cssSha256"]:
        errors.append("theme-override differs from the saved design.css")
    if not deck.styles or deck.styles[-1][0] != "theme-override":
        errors.append("theme-override must be the last embedded style block")
    if contract.get("mainClassRequired") == "theme-dark" and not deck.dark:
        errors.append("Dark design requires main.theme-dark")
    for key, number in contract.get("chapterMap", {}).items():
        if deck.chapters.get(key) != number:
            errors.append(f"Missing or wrong chapter divider mapping: {key} must be chapter {number}")
    font_base = html_file.parent
    if deck.base:
        if ":" in deck.base or deck.base.startswith(("/", "\\")):
            errors.append("Font verification requires a local relative base URL")
        else:
            font_base = (font_base / deck.base).resolve()
    for relative in contract["fontPaths"]:
        if not (font_base / relative).is_file():
            errors.append(f"Missing font file relative to final HTML: {relative}")
    if contract["schema"] == "bespoke-build-contract/v2":
        errors.extend(check_components(contract, deck))
    return errors


def descendants(node):
    for child in node["children"]:
        yield child
        yield from descendants(child)


def check_components(contract: dict, deck: Deck) -> list[str]:
    """Check genuine structural choices; matching CSS is insufficient for v2."""
    errors = []
    for kind, requirement in contract["componentRequirements"].items():
        slides = [node for node in deck.nodes if requirement["rootClass"] in node["classes"] and node["attrs"].get("data-kind") == kind]
        if not slides:
            errors.append(f"Missing reusable {kind} slide markup")
        for slide in slides:
            for attribute, expected in requirement["attributes"].items():
                if slide["attrs"].get(attribute) != expected:
                    errors.append(f"{kind}: {attribute} differs from the saved design")
            if kind == "cards":
                choices = contract["design"]["slides"]["cards"]
                nodes = list(descendants(slide))
                boxes = [node for node in nodes if "bespoke-box" in node["classes"]]
                if len(boxes) != int(choices["count"]):
                    errors.append("cards: actual text box count differs from the saved design")
                bars = [node for node in nodes if "bespoke-title-bar" in node["classes"]]
                if len(bars) != (1 if choices["titleBar"] else 0):
                    errors.append("cards: actual title bar presence differs from the saved design")
                text_tag = {"paragraph": "p", "bullets": "ul", "numbered": "ol"}[choices["treatment"]]
                for box in boxes:
                    tags = [node["tag"] for node in descendants(box)]
                    if text_tag not in tags or any(tag in tags for tag in {"ul", "ol"} - {text_tag}):
                        errors.append("cards: actual paragraph/list markup differs from the saved design")
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
