#!/usr/bin/env python3
"""Generate bespoke/selection.schema.json enums from the library catalog + meta.

Reads:
  - SPOKES Builder/bespoke-library-catalog.json  (family option slugs)
  - bespoke/catalog.json                        (presets, font pairings, chapter keys)

Writes:
  - bespoke/selection.schema.json

Run with --check to exit non-zero if the committed schema is stale.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
LIBRARY_CATALOG = REPO_ROOT / "SPOKES Builder" / "bespoke-library-catalog.json"
META_CATALOG = REPO_ROOT / "bespoke" / "catalog.json"
SCHEMA_PATH = REPO_ROOT / "bespoke" / "selection.schema.json"

FAMILY_TO_THEME_FIELD = {
    "colorLeads": "colorLead",
    "sidebarColors": "sidebarColor",
    "backgroundTextures": "backgroundTexture",
    "titleSlides": "titleSlide",
    "dividers": "dividerStyle",
    "cards": "cardsLessonWide",
}


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def family_slugs(library: dict, family: str) -> list[str]:
    options = (library.get("families") or {}).get(family, {}).get("options") or []
    slugs = [str(opt["slug"]) for opt in options if opt.get("slug")]
    if not slugs:
        raise SystemExit(f"Library catalog family {family!r} has no option slugs")
    return slugs


def build_schema(library: dict, meta: dict) -> dict:
    chapter_keys = list(meta.get("chapterKeys") or ["W", "I", "P1", "P2", "P3", "E", "A"])
    preset_ids = [str(p["id"]) for p in meta.get("presets") or [] if p.get("id")]
    font_ids = [str(f["id"]) for f in meta.get("fontPairings") or [] if f.get("id")]
    if not preset_ids:
        raise SystemExit("bespoke/catalog.json has no preset ids")
    if not font_ids:
        raise SystemExit("bespoke/catalog.json has no font pairing ids")

    enums = {field: family_slugs(library, family) for family, field in FAMILY_TO_THEME_FIELD.items()}
    card_slugs = enums["cardsLessonWide"]
    catalog_version = str(library.get("version") or "")

    chapter_styles_props = {
        key: {"type": "string", "enum": card_slugs} for key in chapter_keys
    }

    return {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": "https://spokes.local/schemas/bespoke-selection/v1",
        "title": "Bespoke selection (bespoke-selection/v1)",
        "description": (
            "Machine-readable Bespoke wizard payload. Enums are generated from "
            "SPOKES Builder/bespoke-library-catalog.json and bespoke/catalog.json "
            "by scripts/generate-selection-schema.py — do not hand-edit enums."
        ),
        "type": "object",
        "additionalProperties": False,
        "required": [
            "schema",
            "date",
            "lesson",
            "team",
            "presetId",
            "theme",
        ],
        "properties": {
            "schema": {
                "type": "string",
                "const": "bespoke-selection/v1",
            },
            "submittedAt": {
                "type": "string",
                "description": "ISO-8601 timestamp from the browser at submit time.",
            },
            "date": {
                "type": "string",
                "pattern": "^[0-9]{4}-[0-9]{2}-[0-9]{2}$",
                "description": "Calendar date (YYYY-MM-DD) used for submission folder naming.",
            },
            "libraryCatalogVersion": {
                "type": ["string", "null"],
                "description": (
                    f"Expected to match library catalog version ({catalog_version!r} at generation)."
                ),
            },
            "lesson": {
                "type": "object",
                "additionalProperties": False,
                "required": ["id", "title"],
                "properties": {
                    "id": {
                        "type": "string",
                        "pattern": "^[a-z0-9]+(?:-[a-z0-9]+)*$",
                        "minLength": 1,
                        "description": (
                            "Lesson slug without the lesson- prefix; "
                            "FID-2 normalizes to lesson-<id> for registries."
                        ),
                    },
                    "title": {"type": "string", "minLength": 1},
                    "displayTitle": {"type": "string"},
                    "subtitle": {"type": "string"},
                },
            },
            "team": {
                "type": "object",
                "additionalProperties": False,
                "required": ["spokesperson"],
                "properties": {
                    "name": {"type": "string"},
                    "spokesperson": {
                        "type": "object",
                        "additionalProperties": False,
                        "required": ["name"],
                        "properties": {
                            "name": {"type": "string", "minLength": 1},
                            "email": {"type": "string"},
                        },
                    },
                },
            },
            "presetId": {
                "type": "string",
                "enum": preset_ids,
            },
            "theme": {
                "type": "object",
                "additionalProperties": False,
                "required": [
                    "colorLead",
                    "sidebarColor",
                    "backgroundTexture",
                    "titleSlide",
                    "dividerStyle",
                    "fontPairing",
                    "cards",
                ],
                "properties": {
                    "colorLead": {"type": "string", "enum": enums["colorLead"]},
                    "sidebarColor": {"type": "string", "enum": enums["sidebarColor"]},
                    "backgroundTexture": {
                        "type": "string",
                        "enum": enums["backgroundTexture"],
                    },
                    "titleSlide": {"type": "string", "enum": enums["titleSlide"]},
                    "dividerStyle": {"type": "string", "enum": enums["dividerStyle"]},
                    "fontPairing": {"type": "string", "enum": font_ids},
                    "cards": {
                        "type": "object",
                        "additionalProperties": False,
                        "required": ["lessonWide", "varyByChapter"],
                        "properties": {
                            "lessonWide": {
                                "type": "string",
                                "enum": card_slugs,
                            },
                            "varyByChapter": {"type": "boolean"},
                            "chapterStyles": {
                                "type": ["object", "null"],
                                "additionalProperties": False,
                                "properties": chapter_styles_props,
                            },
                        },
                    },
                    "catalogIds": {
                        "type": "object",
                        "description": (
                            "UI keys {family}.{slug} for builder footnotes; "
                            "not used by registry apply."
                        ),
                        "additionalProperties": True,
                    },
                },
            },
            "sampleContent": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "bullets": {"type": "string"},
                    "mythReality": {"type": "string"},
                },
            },
            "unspoken": {"type": "string"},
        },
        "x-bespoke": {
            "schemaId": "bespoke-selection/v1",
            "generatedFrom": {
                "libraryCatalog": "SPOKES Builder/bespoke-library-catalog.json",
                "libraryCatalogVersion": catalog_version,
                "metaCatalog": "bespoke/catalog.json",
            },
            "chapterKeys": chapter_keys,
            "customChecks": [
                "lesson.id must be a kebab-case slug (no lesson- prefix required)",
                "when theme.cards.varyByChapter is true, chapterStyles must include every chapter key",
                "libraryCatalogVersion should match the committed library catalog version",
                "THM-04 adjacent-chapter uniqueness is soft-warn until FID-4",
            ],
        },
    }


def dump_schema(schema: dict) -> str:
    return json.dumps(schema, indent=2, ensure_ascii=False) + "\n"


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--check",
        action="store_true",
        help="Exit 1 if committed schema differs from regenerated output",
    )
    parser.add_argument(
        "--out",
        type=Path,
        default=SCHEMA_PATH,
        help=f"Output path (default: {SCHEMA_PATH})",
    )
    args = parser.parse_args(argv)

    library = load_json(LIBRARY_CATALOG)
    meta = load_json(META_CATALOG)
    schema = build_schema(library, meta)
    text = dump_schema(schema)

    if args.check:
        if not args.out.exists():
            print(f"ERROR: missing schema at {args.out}", file=sys.stderr)
            return 1
        existing = args.out.read_text(encoding="utf-8")
        if existing != text:
            print(
                f"ERROR: {args.out.relative_to(REPO_ROOT)} is stale. "
                "Run: python3 scripts/generate-selection-schema.py",
                file=sys.stderr,
            )
            return 1
        print(f"selection schema up to date: {args.out.relative_to(REPO_ROOT)}")
        return 0

    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(text, encoding="utf-8")
    try:
        rel = args.out.relative_to(REPO_ROOT)
    except ValueError:
        rel = args.out
    print(f"Wrote {rel}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
