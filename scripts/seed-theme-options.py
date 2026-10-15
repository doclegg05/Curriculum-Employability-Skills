#!/usr/bin/env python3
"""Seed SPOKES Builder/theme-options.json from the current theme-library.css.

One-shot / re-seed helper. After the first generation lands, prefer editing
theme-options.json and running generate-theme-library.py.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
CSS_PATH = REPO_ROOT / "SPOKES Builder" / "theme-library.css"
CATALOG_PATH = REPO_ROOT / "SPOKES Builder" / "bespoke-library-catalog.json"
OPTIONS_PATH = REPO_ROOT / "SPOKES Builder" / "theme-options.json"

FILE_HEADER = """\
/* ==========================================================================
   SPOKES Two-Layer Theme System — CSS Library
   ==========================================================================

   This file is GENERATED from theme-options.json by
   scripts/generate-theme-library.py. Edit the JSON, then regenerate.
   Agents still copy relevant sections into <style id="theme-override">.

   SCOPE prefix mechanism:
     When building a theme-override block, agents replace the literal text
     SCOPE with [data-chapter="N"] to target chapter-level styles.
     Example:  SCOPE .card  -->  [data-chapter="3"] .card

   DIVIDER_SCOPE prefix mechanism:
     Agents replace the literal text DIVIDER_SCOPE with
     .slide-section[data-chapter="N"] to target section dividers.
     Example:  DIVIDER_SCOPE .divider-title  -->  .slide-section[data-chapter="2"] .divider-title

   Brand palette variables (defined in template.html :root):
     --primary   #007baf
     --accent    #37b550
     --dark      #004071
     --light     #FFFFFF
     --muted     #EDF3F7
     --gray      #60636b
     --gold      #d3b257
     --royal     #00133f
     --mauve     #a7253f
     --offwhite  #d1d3d4
     --muted-gold #ad8806

   No other colors are permitted.
   ========================================================================== */"""

SECTION_META = {
    "backgroundTextures": {
        "title": "BACKGROUND TEXTURES",
        "family": "backgroundTextures",
        "intro": (
            "Six texture options. Each is wrapped in comments. Agents uncomment the\n"
            "one they need and place it inside a <style id=\"theme-override\"> block.\n"
            "The \"plain\" texture uses var(--light) which is already the default, so\n"
            "no override is needed — it is listed here only for completeness."
        ),
    },
    "darkTheme": {
        "title": "DARK THEME INVERSION",
        "family": None,
        "intro": (
            "Applied when backgroundTexture is dark-royal. Agents uncomment the\n"
            "blocks below into style#theme-override and add class=\"theme-dark\" to .main."
        ),
    },
    "colorLeads": {
        "title": "COLOR LEADS",
        "family": "colorLeads",
        "intro": (
            "Nine color-lead options. Agents uncomment the assigned lead into\n"
            "style#theme-override. Do not invent new lead hexes (D6)."
        ),
    },
    "sidebarColors": {
        "title": "SIDEBAR COLORS",
        "family": "sidebarColors",
        "intro": (
            "Two sidebar background options. Agents uncomment the desired option.\n"
            "The \"dark\" sidebar is the default, so no override is needed — it is\n"
            "listed here for completeness."
        ),
    },
    "cards": {
        "title": "CARD STYLES",
        "family": "cards",
        "intro": (
            "Card-style options. Each COMMENTED block uses the SCOPE prefix. When an\n"
            "agent builds a theme-override, replace SCOPE with [data-chapter=\"N\"].\n"
            "Stable IDs: cards.{slug} — see bespoke-library-catalog.json."
        ),
    },
    "dividers": {
        "title": "SECTION DIVIDER STYLES",
        "family": "dividers",
        "intro": (
            "Divider options. Replace DIVIDER_SCOPE with\n"
            ".slide-section[data-chapter=\"N\"]. Stable IDs: dividers.{slug}."
        ),
    },
    "titleSlides": {
        "title": "TITLE SLIDE DESIGNS",
        "family": "titleSlides",
        "intro": (
            "Title-slide design options. Each COMMENTED block targets .slide-title.\n"
            "Stable IDs: titleSlides.{slug}."
        ),
    },
}


def unindent_block(body: str) -> str:
    lines = body.splitlines()
    while lines and not lines[0].strip():
        lines.pop(0)
    while lines and not lines[-1].strip():
        lines.pop()
    indents = [len(line) - len(line.lstrip(" ")) for line in lines if line.strip()]
    mind = min(indents) if indents else 0
    return "\n".join(line[mind:] if len(line) >= mind else line for line in lines).strip()


def is_css_comment_body(body: str) -> bool:
    stripped = body.strip()
    if not stripped:
        return False
    if "No overrides needed" in stripped:
        return False
    cues = ("{", "SCOPE", "DIVIDER_SCOPE", ".slide", ".main", ".sidebar", ".card", ".download")
    return any(cue in stripped for cue in cues)


def region_end(text: str, start: int, all_markers: list[re.Match]) -> int:
    end = len(text)
    for other in all_markers:
        if other.start() > start - 1 and other.start() >= start:
            # caller passes marker.start(); we want first marker AFTER this region's start
            pass
    for other in all_markers:
        if other.start() >= start:
            end = min(end, other.start())
            break
    for sec in re.finditer(r"/\* =+\n", text):
        if sec.start() >= start:
            end = min(end, sec.start())
            break
    return end


def extract_after_marker(
    text: str, marker_match: re.Match, all_markers: list[re.Match], *, allow_live: bool = False
) -> tuple[list[str], str]:
    start = marker_match.end()
    end = region_end(text, start, [m for m in all_markers if m.start() > marker_match.start()])
    # Fix region_end: only markers after current
    end = len(text)
    for other in all_markers:
        if other.start() > marker_match.start():
            end = min(end, other.start())
            break
    for sec in re.finditer(r"/\* =+\n", text):
        if sec.start() > start:
            end = min(end, sec.start())
            break
    raw = text[start:end]
    notes: list[str] = []
    css_parts: list[str] = []
    pos = 0
    while pos < len(raw):
        while pos < len(raw) and raw[pos] in " \t\r\n":
            pos += 1
        if pos >= len(raw):
            break
        if raw.startswith("/*", pos):
            close = raw.find("*/", pos + 2)
            if close < 0:
                break
            body = raw[pos + 2 : close]
            pos = close + 2
            if is_css_comment_body(body):
                css_parts.append(unindent_block(body))
            else:
                note = body.strip()
                if note:
                    notes.append(note)
            continue
        if allow_live:
            # Live (uncommented) CSS until end of region
            live = raw[pos:].strip()
            if live:
                css_parts.append(unindent_block(live))
            break
        break
    return notes, "\n\n".join(p for p in css_parts if p).strip()

def find_marker(markers: list[re.Match], opt: dict) -> re.Match | None:
    slug = opt["slug"]
    css_marker = opt.get("cssMarker") or ""
    fallback: re.Match | None = None
    for match in markers:
        label = match.group(1)
        if css_marker and css_marker in f"--- {label}":
            return match
        if label == slug or label.startswith(slug + " ") or re.match(
            rf"\d+\.\s*{re.escape(slug)}\b", label
        ):
            fallback = fallback or match
    return fallback


def parse_ancillary_dark_theme(text: str, markers: list[re.Match]) -> list[dict]:
    """Capture DARK THEME INVERSION sub-markers that are not catalog options."""
    section_match = re.search(
        r"/\* =+\n\s*DARK THEME INVERSION\n.*?=+\s*\*/", text, re.S
    )
    if not section_match:
        return []
    section_start = section_match.end()
    next_section = re.search(r"/\* =+\n\s*COLOR LEADS\n", text[section_start:])
    section_end = section_start + (next_section.start() if next_section else 0) or len(text)
    region = text[section_start:section_end]
    region_markers = list(re.finditer(r"/\* --- (.+?) --- \*/", region))
    options: list[dict] = []
    for i, match in enumerate(region_markers):
        # Remap to full-text match objects
        full = None
        for m in markers:
            if m.group(1) == match.group(1) and m.start() >= section_start:
                full = m
                break
        if not full:
            continue
        notes, css = extract_after_marker(text, full, markers, allow_live=True)
        options.append(
            {
                "slug": re.sub(r"[^a-z0-9]+", "-", match.group(1).lower()).strip("-"),
                "marker": match.group(1),
                "notes": notes,
                "css": css,
                "empty": not bool(css),
                "ancillary": True,
                "live": True,
            }
        )
    return options


def seed() -> dict:
    text = CSS_PATH.read_text(encoding="utf-8")
    catalog = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
    markers = list(re.finditer(r"/\* --- (.+?) --- \*/", text))

    sections: list[dict] = []

    # Catalog-backed families in stable order
    family_section_ids = [
        "backgroundTextures",
        "colorLeads",
        "sidebarColors",
        "cards",
        "dividers",
        "titleSlides",
    ]

    # Insert dark theme after backgrounds
    for section_id in [
        "backgroundTextures",
        "darkTheme",
        "colorLeads",
        "sidebarColors",
        "cards",
        "dividers",
        "titleSlides",
    ]:
        meta = SECTION_META[section_id]
        section: dict = {
            "id": section_id,
            "title": meta["title"],
            "family": meta["family"],
            "intro": meta["intro"],
            "options": [],
        }
        if section_id == "darkTheme":
            section["options"] = parse_ancillary_dark_theme(text, markers)
            sections.append(section)
            continue

        family = meta["family"]
        assert family
        for opt in catalog["families"][family]["options"]:
            match = find_marker(markers, opt)
            if not match:
                raise SystemExit(f"No CSS marker for {opt['id']}")
            notes, css = extract_after_marker(text, match, markers)
            if css:
                css = "\n".join(line.rstrip() for line in css.splitlines())
            entry = {
                "id": opt["id"],
                "slug": opt["slug"],
                "marker": match.group(1),
                "label": opt.get("label"),
                "notes": notes,
                "css": css,
                "empty": not bool(css),
                "blocked": bool(opt.get("blocked")),
                "reason": opt.get("reason") or "",
            }
            section["options"].append(entry)
        sections.append(section)

    return {
        "version": "1.0.0",
        "description": (
            "Uncommented CSS snippets for the SPOKES theme library. "
            "generate-theme-library.py emits theme-library.css; the Bespoke wizard "
            "injects the same snippets into template markup for preview (FID-3)."
        ),
        "sourceCatalog": "SPOKES Builder/bespoke-library-catalog.json",
        "outputCss": "SPOKES Builder/theme-library.css",
        "fileHeader": FILE_HEADER,
        "sections": sections,
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", type=Path, default=OPTIONS_PATH)
    args = parser.parse_args(argv)
    data = seed()
    args.out.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    opt_count = sum(len(s["options"]) for s in data["sections"])
    print(f"Wrote {args.out.relative_to(REPO_ROOT)} ({opt_count} options across {len(data['sections'])} sections)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
