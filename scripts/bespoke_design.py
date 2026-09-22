"""Deterministic design handoff; never creates lesson content or modifies HTML."""
from __future__ import annotations

import hashlib
import json
from pathlib import Path
import re

from bespoke_support import ROOT, require_valid_selection, selection_digest

CHAPTERS = ("W", "I", "P1", "P2", "P3", "E", "A")


def sha(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def build_design(payload: dict) -> tuple[str, dict]:
    require_valid_selection(payload)
    source = (ROOT / "SPOKES Builder/theme-options.json").read_text(encoding="utf-8")
    sections = json.loads(source)["sections"]
    meta = json.loads((ROOT / "bespoke/catalog.json").read_text(encoding="utf-8"))
    theme = payload["theme"]
    pair = next(p for p in meta["fontPairings"] if p["id"] == theme["fontPairing"])
    # Use the same self-hosted face declarations as the instructor preview.
    preview_css = (ROOT / "bespoke/styles.css").read_text(encoding="utf-8")
    faces = [block for block in re.findall(r"@font-face\s*\{[^}]+\}", preview_css)
             if any(f'font-family: "{name}"' in block for name in (pair["heading"], pair["body"]))]
    if not faces or any(not any(f'font-family: "{name}"' in b for b in faces) for name in (pair["heading"], pair["body"])):
        raise ValueError("Selected font pairing is missing its self-hosted font declarations")
    font_paths = re.findall(r'url\("(.*?)"\)', "\n".join(faces))
    for path in font_paths:
        if not (ROOT / "bespoke" / path).is_file():
            raise ValueError(f"Missing font asset: {path}")
    template = (ROOT / "SPOKES Builder/template.html").read_text(encoding="utf-8")
    chunks = [f"/* Bespoke selection SHA-256: {selection_digest(payload)} */", *faces,
              f"body {{ --font-heading: '{pair['heading']}', serif; --font-body: '{pair['body']}', sans-serif; font-family: var(--font-body); }}"]
    # The current skeleton still hardcodes fonts on individual components.
    # Match its selectors exactly so the late override actually wins the cascade.
    template_css = "\n".join(re.findall(r"<style[^>]*>(.*?)</style>", template, re.DOTALL))
    template_css = re.sub(r"/\*.*?\*/", "", template_css, flags=re.DOTALL)
    font_selectors = {"heading": [], "body": []}
    for selectors, declarations in re.findall(r"([^{}]+)\{([^{}]+)\}", template_css):
        for role, original in (("heading", "DM Serif Display"), ("body", "Outfit")):
            if selectors.strip().startswith("@"):
                continue
            named_font = re.search(r"font-family:\s*[\"']" + re.escape(original) + r"[\"']", declarations)
            variable_font = re.search(r"font-family:\s*var\(--font-" + role + r"\)", declarations)
            if named_font or variable_font:
                font_selectors[role].append(selectors.strip())
    for role, selectors in font_selectors.items():
        if not selectors:
            raise ValueError(f"Template {role} font selectors changed; review the generator")
        chunks.append(",\n".join(selectors) + f" {{ font-family: var(--font-{role}); }}")

    def option(family: str, slug: str) -> str:
        for section in sections:
            if (section.get("family") or section["id"]) == family:
                for entry in section.get("options", []):
                    if entry["slug"] == slug:
                        css = entry.get("css", "")
                        if css.startswith("Default background"):
                            raise ValueError("Theme source contains prose in CSS")
                        return css
        raise ValueError(f"No CSS option for {family}.{slug}")

    for family, field in (("colorLeads", "colorLead"), ("sidebarColors", "sidebarColor"),
                          ("backgroundTextures", "backgroundTexture"), ("titleSlides", "titleSlide")):
        chunks.append(option(family, theme[field]))
    for number, chapter in enumerate(CHAPTERS, 1):
        card = theme["cards"]["chapterStyles"][chapter] if theme["cards"]["varyByChapter"] else theme["cards"]["lessonWide"]
        chunks.append(option("cards", card).replace("SCOPE", f'[data-chapter="{number}"]'))
        chunks.append(option("dividers", theme["dividerStyle"]).replace("DIVIDER_SCOPE", f'.slide-section[data-chapter="{number}"]'))
    if theme["backgroundTexture"] == "dark-royal":
        chunks.extend(o["css"] for s in sections if s["id"] == "darkTheme" for o in s["options"])
    css = "\n\n".join(c for c in chunks if c.strip()) + "\n"
    manifest = {
        "schema": "bespoke-build-contract/v1",
        "lessonId": payload["lesson"]["id"],
        "selectionSha256": selection_digest(payload),
        "themeOptionsSha256": sha(source),
        "templateSha256": sha((ROOT / "SPOKES Builder/template.html").read_text(encoding="utf-8")),
        "cssSha256": sha(css),
        "theme": theme,
        "chapterMap": {key: str(i) for i, key in enumerate(CHAPTERS, 1)},
        "fontPairing": pair,
        "fontPaths": font_paths,
        "fontSelectors": font_selectors,
        "mainClassRequired": "theme-dark" if theme["backgroundTexture"] == "dark-royal" else None,
        "acceptance": [
            "Insert design.css verbatim into style#theme-override after base CSS.",
            "Add meta[name=bespoke-selection-sha256] with selectionSha256 as content.",
            "Retain canonical template markup and match chapterMap; do not override chosen theme in later CSS.",
            "Run scripts/bespoke-check-design.py with this contract and the finished HTML.",
            "Run lesson validator and full quality gate; inspect all slides and chosen components in a browser.",
            "Britt and the team review final visual and content fidelity before release. Static checks do not prove appearance.",
        ],
    }
    return css, manifest
