#!/usr/bin/env python3
"""Verify theme-options.json, theme-library.css, and the library catalog stay in sync.

Checks:
  1. Every catalog option has a theme-options entry with css (or empty:true)
  2. Every theme-options catalog-backed option exists in the catalog
  3. Every CSS marker for catalog families matches an option
  4. generate-theme-library.py --check passes
  5. No unexpected hex colors outside the SPOKES 11-color set (+ known legacy hovers)
"""

from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
OPTIONS_PATH = REPO_ROOT / "SPOKES Builder" / "theme-options.json"
CATALOG_PATH = REPO_ROOT / "SPOKES Builder" / "bespoke-library-catalog.json"
CSS_PATH = REPO_ROOT / "SPOKES Builder" / "theme-library.css"

CANONICAL_HEX = {
    "007baf",
    "37b550",
    "004071",
    "ffffff",
    "edf3f7",
    "60636b",
    "d3b257",
    "00133f",
    "a7253f",
    "d1d3d4",
    "ad8806",
    # Shorthand / case variants normalized below
}
# Pre-existing hover darkens in color-lead blocks (not new palette entries).
LEGACY_HOVER_HEX = {"8b1e33", "8a6d04"}


def normalize_hex(value: str) -> str:
    value = value.lower()
    if len(value) == 3:
        value = "".join(ch * 2 for ch in value)
    return value


def main() -> int:
    problems: list[str] = []

    options = json.loads(OPTIONS_PATH.read_text(encoding="utf-8"))
    catalog = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))

    opt_index: dict[tuple[str, str], dict] = {}
    for section in options["sections"]:
        family = section.get("family")
        if not family:
            continue
        for opt in section["options"]:
            key = (family, opt["slug"])
            if key in opt_index:
                problems.append(f"duplicate theme-options entry {family}.{opt['slug']}")
            opt_index[key] = opt
            if not opt.get("empty") and not (opt.get("css") or "").strip():
                problems.append(f"{family}.{opt['slug']}: missing css (set empty:true if intentional)")

    for family, data in catalog["families"].items():
        for opt in data["options"]:
            key = (family, opt["slug"])
            if key not in opt_index:
                problems.append(f"catalog option {opt['id']} missing from theme-options.json")
            # blocked/reason may live on catalog; theme-options mirrors when present
            if opt.get("blocked") and not opt.get("reason"):
                problems.append(f"catalog {opt['id']}: blocked without reason")

    for (family, slug), opt in opt_index.items():
        fam = catalog["families"].get(family)
        if not fam:
            problems.append(f"theme-options family {family!r} not in catalog")
            continue
        if not any(o["slug"] == slug for o in fam["options"]):
            problems.append(f"theme-options {family}.{slug} not in catalog")

    # Marker coverage in generated/committed CSS
    css_text = CSS_PATH.read_text(encoding="utf-8")
    markers = {m.group(1) for m in re.finditer(r"/\* --- (.+?) --- \*/", css_text)}
    for section in options["sections"]:
        family = section.get("family")
        if not family:
            continue
        for opt in section["options"]:
            if opt["marker"] not in markers:
                problems.append(
                    f"CSS missing marker for {family}.{opt['slug']}: {opt['marker']!r}"
                )

    # Hex audit on theme-options css fields
    allowed = CANONICAL_HEX | LEGACY_HOVER_HEX
    hex_pat = re.compile(r"#([0-9A-Fa-f]{3,8})\b")
    for section in options["sections"]:
        for opt in section.get("options") or []:
            for match in hex_pat.finditer(opt.get("css") or ""):
                raw = match.group(1)
                if len(raw) in (4, 8):  # ignore alpha short/long for now; flag rgb hex only
                    # 4 or 8 digit hex with alpha — normalize first 6/3
                    continue
                norm = normalize_hex(raw[:6] if len(raw) >= 6 else raw)
                if norm not in allowed:
                    problems.append(
                        f"non-canonical hex #{raw} in {section.get('family') or section['id']}.{opt.get('slug')}"
                    )

    # Generator check
    gen = subprocess.run(
        [sys.executable, str(REPO_ROOT / "scripts" / "generate-theme-library.py"), "--check"],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
    )
    if gen.returncode != 0:
        problems.append("generate-theme-library.py --check failed:\n" + (gen.stderr or gen.stdout))

    if problems:
        print("check-library-sync FAILED:")
        for problem in problems:
            print(f"  - {problem}")
        return 1

    catalog_options = sum(len(f["options"]) for f in catalog["families"].values())
    print(
        f"library-sync: {catalog_options} catalog options, "
        f"{len(opt_index)} theme-options entries, generator check OK"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
