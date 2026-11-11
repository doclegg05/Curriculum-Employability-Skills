#!/usr/bin/env python3
"""Convert a lesson deck's pixel-sized layout values to rem, in place.

Why: a lesson's text is sized in rem, so it follows the root font size, but
images, card heights, gaps and the sidebar were sized in px and stayed put.
With both in rem, one root size scales the whole slide, and a slide that fits
one screen fits every screen of the same shape.

What it changes: in every <style> block and inline style attribute, a px
length of 12 or more on a layout property becomes rem at 16px to the rem.
At a 16px root the page is laid out exactly as before, so phones (which keep
the browser's default root size) do not change.

What it leaves alone: borders, outlines, shadows, filters, transforms,
backgrounds, letter spacing, anything under 12px, @keyframes and @font-face,
media query conditions, the root font size (it defines the rem), and the tap
targets the validator measures in px (MOB-02, MOB-03).

Usage:
    python3 scripts/lesson-px-to-rem.py lesson-x/index.html           convert
    python3 scripts/lesson-px-to-rem.py lesson-x/index.html --check   exit 1 if any are left
"""
from __future__ import annotations

import re
import sys

BASIS = 16
MIN_PX = 12
MAX_RADIUS_PX = 200  # larger radii are "fully round" pills, not a size

LAYOUT_PROPS = re.compile(
    r"^(?:(?:min-|max-)?(?:width|height)|flex|flex-basis|(?:row-|column-|grid-)?gap|"
    r"padding(?:-\w+)*|margin(?:-\w+)*|top|right|bottom|left|inset(?:-\w+)*|"
    r"font-size|line-height|text-indent|border-radius|border-(?:top|bottom)-(?:left|right)-radius|"
    r"grid-template-(?:columns|rows)|grid-auto-(?:columns|rows)|--[\w-]+)$"
)
KEEP_PX_SELECTORS = re.compile(r"\.sidebar-toggle|\.nav-btn|\.key-icon")
ROOT_SELECTOR = re.compile(r"^(?:html|:root)$")  # its font-size defines the rem, so it stays in px
SKIP_AT_RULES = re.compile(r"^@(?:-webkit-)?(?:keyframes|font-face|page)\b")
PX = re.compile(r"(?<![\w.#-])(-?\d+(?:\.\d+)?)px\b")
SCRIPT_BLOCK = re.compile(r"(<script\b.*?</script>)", re.S)


def to_rem(match: re.Match[str], prop: str) -> str:
    px = float(match.group(1))
    if abs(px) < MIN_PX:
        return match.group(0)
    if "radius" in prop and abs(px) >= MAX_RADIUS_PX:
        return match.group(0)
    rem = f"{px / BASIS:.4f}".rstrip("0").rstrip(".")
    return f"{rem}rem"


def convert_declarations(
    body: str, counts: dict[str, int], convert: bool = True, skip: frozenset[str] = frozenset()
) -> str:
    """Rewrite `prop: value` pairs in one rule body. Returns the new body."""
    out, i, n = [], 0, len(body)
    while i < n:
        j, depth, quote = i, 0, ""
        while j < n:  # find the end of this declaration
            c = body[j]
            if quote:
                quote = "" if c == quote else quote
            elif c in "\"'":
                quote = c
            elif c == "(":
                depth += 1
            elif c == ")":
                depth -= 1
            elif c == ";" and depth == 0:
                break
            elif body.startswith("/*", j):
                j = body.find("*/", j) + 1
                if j == 0:
                    j = n - 1
            j += 1
        decl = body[i:j]
        m = re.match(r"(\s*(?:/\*.*?\*/\s*)*)([\w-]+)(\s*:\s*)(.*)$", decl, re.S)
        if m and LAYOUT_PROPS.match(m.group(2)) and m.group(2) not in skip:
            prop, value = m.group(2), m.group(4)
            left = [x for x in PX.finditer(value) if to_rem(x, prop) != x.group(0)]
            if left:
                counts[prop] = counts.get(prop, 0) + len(left)
                if convert:
                    value = PX.sub(lambda x: to_rem(x, prop), value)
                    decl = m.group(1) + prop + m.group(3) + value
        out.append(decl)
        if j < n:
            out.append(";")
        i = j + 1
    return "".join(out)


def convert_css(css: str, counts: dict[str, int], convert: bool = True) -> str:
    """Walk rules and at-rule blocks. Declarations are only rewritten inside style rules."""
    out, i, n = [], 0, len(css)
    while i < n:
        if css.startswith("/*", i):
            end = css.find("*/", i)
            end = n if end < 0 else end + 2
            out.append(css[i:end])
            i = end
            continue
        brace = css.find("{", i)
        if brace < 0:
            out.append(css[i:])
            break
        prelude = css[i:brace]
        if "}" in prelude:  # stray close brace: copy up to it and carry on
            cut = i + prelude.index("}") + 1
            out.append(css[i:cut])
            i = cut
            continue
        depth, j = 1, brace + 1
        while j < n and depth:
            if css.startswith("/*", j):
                k = css.find("*/", j)
                j = n if k < 0 else k + 2
                continue
            depth += css[j] == "{"
            depth -= css[j] == "}"
            j += 1
        body = css[brace + 1 : j - 1]
        head = prelude.strip()
        head = re.sub(r"^(?:/\*.*?\*/\s*)+", "", head, flags=re.S)
        if SKIP_AT_RULES.match(head):
            new_body = body
        elif head.startswith("@"):
            new_body = convert_css(body, counts, convert)
        elif KEEP_PX_SELECTORS.search(head):
            new_body = body
        else:
            skip = frozenset({"font-size"}) if ROOT_SELECTOR.match(head) else frozenset()
            new_body = convert_declarations(body, counts, convert, skip)
        out.append(prelude + "{" + new_body + "}")
        i = j
    return "".join(out)


def convert_html(html: str, convert: bool = True) -> tuple[str, dict[str, int]]:
    """Convert the page's own styles. A script is copied through untouched,
    so a page that a script writes into another window keeps its px."""
    counts: dict[str, int] = {}
    parts = SCRIPT_BLOCK.split(html)
    converted = [
        part if SCRIPT_BLOCK.fullmatch(part) else convert_markup(part, counts, convert) for part in parts
    ]
    return "".join(converted), counts


def convert_markup(html: str, counts: dict[str, int], convert: bool) -> str:
    html = re.sub(
        r"(<style\b[^>]*>)(.*?)(</style>)",
        lambda m: m.group(1) + convert_css(m.group(2), counts, convert) + m.group(3),
        html,
        flags=re.S,
    )
    html = re.sub(
        r'(\sstyle=")([^"]*)(")',
        lambda m: m.group(1) + convert_declarations(m.group(2), counts, convert) + m.group(3),
        html,
    )
    return html


def main(argv: list[str]) -> int:
    paths = [a for a in argv if not a.startswith("--")]
    check = "--check" in argv
    if len(paths) != 1:
        print(__doc__)
        return 2
    path = paths[0]
    with open(path, encoding="utf-8") as fh:
        original = fh.read()
    converted, counts = convert_html(original, convert=not check)
    total = sum(counts.values())
    detail = ", ".join(f"{k} {v}" for k, v in sorted(counts.items(), key=lambda kv: -kv[1])[:8])
    if check:
        print(f"{path}: {total} px layout value(s) left" + (f" ({detail})" if total else ""))
        return 1 if total else 0
    if converted != original:
        with open(path, "w", encoding="utf-8") as fh:
            fh.write(converted)
    print(f"{path}: converted {total} px layout value(s)" + (f" ({detail})" if total else ""))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
