#!/usr/bin/env python3
"""Generate SPOKES Builder/theme-library.css from theme-options.json.

theme-options.json is the single source for library CSS snippets. This script
emits the commented agent-facing library file. Use --check to ensure the
committed CSS matches a fresh generation (normalized whitespace).
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
OPTIONS_PATH = REPO_ROOT / "SPOKES Builder" / "theme-options.json"
CSS_PATH = REPO_ROOT / "SPOKES Builder" / "theme-library.css"

SECTION_ORDER = [
    "backgroundTextures",
    "darkTheme",
    "colorLeads",
    "sidebarColors",
    "cards",
    "dividers",
    "titleSlides",
]


def load_options(path: Path = OPTIONS_PATH) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def comment_css(css: str, notes: list[str] | None = None, *, live: bool = False) -> str:
    parts: list[str] = []
    for note in notes or []:
        note = note.strip()
        if not note:
            continue
        parts.append(f"/* {note} */")
    css = css.strip()
    if not css:
        if not parts:
            parts.append("/* No overrides needed — this is the template default. */")
        return "\n".join(parts)
    if live:
        parts.append(css)
        return "\n".join(parts)
    lines = css.splitlines()
    body = "\n".join(f"   {line}" if line.strip() else "" for line in lines)
    parts.append(f"/*\n{body}\n*/")
    return "\n".join(parts)


def render_section(section: dict) -> str:
    title = section["title"]
    intro = section.get("intro") or ""
    lines = [
        "/* ==========================================================================",
        f"   {title}",
        "   --------------------------------------------------------------------------",
    ]
    for intro_line in intro.strip().splitlines() or [""]:
        lines.append(f"   {intro_line}" if intro_line.strip() else "   ")
    lines.append("   ========================================================================== */")
    lines.append("")

    for opt in section.get("options") or []:
        marker = opt["marker"]
        lines.append(f"/* --- {marker} --- */")
        if opt.get("blocked"):
            lines.append(f"/* BLOCKED: {opt.get('reason') or 'Not approved for new selections.'} Do not use in new builds. */")
        lines.append(
            comment_css(
                opt.get("css") or "",
                opt.get("notes") or [],
                live=bool(opt.get("live")),
            )
        )
        lines.append("")
        lines.append("")
    return "\n".join(lines).rstrip() + "\n"


def render_library(data: dict) -> str:
    chunks: list[str] = [data["fileHeader"].rstrip() + "\n\n"]
    sections = {s["id"]: s for s in data["sections"]}
    for sid in SECTION_ORDER:
        if sid not in sections:
            raise SystemExit(f"theme-options.json missing section {sid!r}")
        chunks.append(render_section(sections[sid]))
        chunks.append("\n")
    # Preserve any extra sections not in SECTION_ORDER
    for section in data["sections"]:
        if section["id"] not in SECTION_ORDER:
            chunks.append(render_section(section))
            chunks.append("\n")
    text = "".join(chunks)
    # Normalize: single trailing newline, no trailing spaces
    text = "\n".join(line.rstrip() for line in text.splitlines()) + "\n"
    # Collapse 3+ blank lines to 2
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text


def normalize_css(text: str) -> str:
    """Normalize for comparison: strip trailing space, collapse blank runs."""
    text = "\n".join(line.rstrip() for line in text.splitlines())
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip() + "\n"


def option_css_map(data: dict) -> dict[tuple[str, str], str]:
    out: dict[tuple[str, str], str] = {}
    for section in data["sections"]:
        family = section.get("family") or section["id"]
        for opt in section.get("options") or []:
            if "slug" not in opt:
                continue
            css = re.sub(r"\s+", " ", (opt.get("css") or "").strip())
            out[(family, opt["slug"])] = css
    return out


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Verify CSS matches generation")
    parser.add_argument("--options", type=Path, default=OPTIONS_PATH)
    parser.add_argument("--out", type=Path, default=CSS_PATH)
    args = parser.parse_args(argv)

    data = load_options(args.options)
    generated = render_library(data)

    if args.check:
        if not args.out.exists():
            print(f"ERROR: missing {args.out}", file=sys.stderr)
            return 1
        existing = args.out.read_text(encoding="utf-8")
        # Prefer structural option-css equality; also require normalized full-file match
        # after the first committed generation.
        if normalize_css(existing) != normalize_css(generated):
            print(
                f"ERROR: {args.out.relative_to(REPO_ROOT)} is out of sync with "
                f"{args.options.relative_to(REPO_ROOT)}.\n"
                "Run: python3 scripts/generate-theme-library.py",
                file=sys.stderr,
            )
            # Show a short unified hint
            exp = normalize_css(generated).splitlines()
            got = normalize_css(existing).splitlines()
            for i, (a, b) in enumerate(zip(exp, got)):
                if a != b:
                    print(f"  first diff near line {i + 1}:", file=sys.stderr)
                    print(f"    expected: {a[:120]}", file=sys.stderr)
                    print(f"    got:      {b[:120]}", file=sys.stderr)
                    break
            else:
                print(
                    f"  length differs: generated {len(exp)} lines vs committed {len(got)}",
                    file=sys.stderr,
                )
            return 1
        print(f"theme-library.css up to date with {args.options.relative_to(REPO_ROOT)}")
        return 0

    args.out.write_text(generated, encoding="utf-8")
    print(f"Wrote {args.out.relative_to(REPO_ROOT)} ({len(generated)} bytes)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
