#!/usr/bin/env python3
"""Apply a Bespoke selection.json to theme-registry + lesson-registry (FID-2).

Does NOT wire into spoke-signals.yml yet — call manually or from tests:

  python3 scripts/bespoke-apply-selection.py \\
    --selection scripts/test-fixtures/bespoke/selection-money-management.json \\
    --theme-registry /tmp/theme-registry.json \\
    --lesson-registry /tmp/lesson-registry.json

Layer-2 leadComponent / secondaryAccent come from the FID-5 derivation table
(no new wizard steps).
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from copy import deepcopy
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parent))
from bespoke_support import require_valid_selection, selection_digest

REPO_ROOT = Path(__file__).resolve().parent.parent

CHAPTER_KEYS = ["W", "I", "P1", "P2", "P3", "E", "A"]

# FID-5 — deterministic WIPPEA-role table (no instructor steps).
# secondaryAccent alternates gold / primary (lead-appropriate default).
DERIVED_LAYER2: dict[str, dict[str, str]] = {
    "W": {"leadComponent": "takeaways", "secondaryAccent": "gold"},
    "I": {"leadComponent": "cards-grid", "secondaryAccent": "primary"},
    "P1": {"leadComponent": "smart-stack", "secondaryAccent": "gold"},
    "P2": {"leadComponent": "areas-grid", "secondaryAccent": "primary"},
    "P3": {"leadComponent": "dangers-grid", "secondaryAccent": "gold"},
    "E": {"leadComponent": "takeaways", "secondaryAccent": "primary"},
    "A": {"leadComponent": "content-list", "secondaryAccent": "gold"},
}

BESPOKE_STATUS = "bespoke-pending"


def normalize_lesson_id(raw: str) -> str:
    slug = str(raw or "").strip().lower()
    if slug.startswith("lesson-"):
        slug = slug[len("lesson-") :]
    if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", slug):
        raise SystemExit(f"Invalid lesson.id slug: {raw!r}")
    return f"lesson-{slug}"


def derive_chapter_styles(theme: dict) -> dict[str, dict[str, str]]:
    cards = theme.get("cards") or {}
    divider = str(theme.get("dividerStyle") or "gradient-sweep")
    lesson_wide = str(cards.get("lessonWide") or "left-border")
    vary = bool(cards.get("varyByChapter"))
    per_chapter = cards.get("chapterStyles") if vary else None
    if not isinstance(per_chapter, dict):
        per_chapter = {}

    out: dict[str, dict[str, str]] = {}
    for key in CHAPTER_KEYS:
        card_slug = str(per_chapter.get(key) or lesson_wide)
        derived = DERIVED_LAYER2[key]
        out[key] = {
            "divider": divider,
            "cards": card_slug,
            "leadComponent": derived["leadComponent"],
            "secondaryAccent": derived["secondaryAccent"],
        }
    return out


def selection_to_theme_entry(payload: dict) -> dict[str, Any]:
    theme = payload.get("theme") or {}
    required = [
        "colorLead",
        "sidebarColor",
        "backgroundTexture",
        "titleSlide",
        "dividerStyle",
        "fontPairing",
    ]
    missing = [k for k in required if not theme.get(k)]
    if missing:
        raise SystemExit(f"selection theme missing fields: {missing}")
    return {
        "colorLead": theme["colorLead"],
        "sidebarColor": theme["sidebarColor"],
        "backgroundTexture": theme["backgroundTexture"],
        "titleSlide": theme["titleSlide"],
        "dividerStyle": theme["dividerStyle"],
        "fontPairing": theme["fontPairing"],
        "chapterStyles": derive_chapter_styles(theme),
        "bespokeSelectionSha256": selection_digest(payload),
    }


def upsert_theme_registry(registry: dict, lesson_key: str, entry: dict) -> dict:
    lessons = registry.setdefault("lessons", {})
    if not isinstance(lessons, dict):
        raise SystemExit("theme-registry.json: 'lessons' must be an object")
    lessons[lesson_key] = entry
    return registry


def upsert_lesson_registry(registry: dict, payload: dict, lesson_key: str) -> dict:
    rules = registry.setdefault("rules", {})
    status_values = list(rules.get("statusValues") or [])
    if BESPOKE_STATUS not in status_values:
        status_values.append(BESPOKE_STATUS)
        rules["statusValues"] = status_values

    lessons = registry.setdefault("lessons", [])
    if not isinstance(lessons, list):
        raise SystemExit("lesson-registry.json: 'lessons' must be an array")

    lesson = payload.get("lesson") or {}
    title = lesson.get("displayTitle") or lesson.get("title") or lesson_key
    subtitle = lesson.get("subtitle") or ""
    description = subtitle or f"Bespoke pending build for {title}."

    new_entry = {
        "id": lesson_key,
        "themePackage": lesson_key,
        "title": title,
        "description": description,
        "icon": "sparkles",
        "themeKey": lesson_key.replace("lesson-", ""),
        "path": f"{lesson_key}/index.html",
        "status": BESPOKE_STATUS,
        "slides": 0,
        "videos": 0,
        "variant": None,
        "fontPair": {"heading": "", "body": "", "approved": False},
        "colorSchema": {
            "approved": False,
            "approvalRef": "Bespoke Spoke Signal — pending build",
        },
        "combinatorics": {
            "texture": (payload.get("theme") or {}).get("backgroundTexture"),
            "colorLead": (payload.get("theme") or {}).get("colorLead"),
            "effects": [],
        },
        "interactions": {"minimumRequired": 0, "implemented": 0},
        "qualityGates": {
            "accessibility": "pending",
            "multimodal": "pending",
            "wippea": "pending",
            "brand": "pending",
            "engagement": "pending",
        },
        "notes": "Inserted by bespoke-apply-selection.py (bespoke-pending).",
    }

    for i, existing in enumerate(lessons):
        if isinstance(existing, dict) and existing.get("id") == lesson_key:
            # Idempotent upsert: preserve slides/videos if already built; refresh theme + status.
            merged = deepcopy(existing)
            merged.update(
                {
                    "title": new_entry["title"],
                    "description": new_entry["description"],
                    "themePackage": lesson_key,
                    "status": BESPOKE_STATUS,
                    "combinatorics": new_entry["combinatorics"],
                    "notes": new_entry["notes"],
                }
            )
            lessons[i] = merged
            return registry

    lessons.append(new_entry)
    return registry


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, data: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def apply_selection(
    payload: dict,
    *,
    theme_registry: dict,
    lesson_registry: dict,
    expected_previous: str | None = None,
) -> tuple[dict, dict, str]:
    require_valid_selection(payload)
    if payload.get("schema") == "bespoke-selection/v2":
        raise ValueError(
            "Bespoke v2 is a complete component design; the legacy theme registry cannot represent it. "
            "Keep the immutable selection.json, design.css and v2 build-contract.json for a separately "
            "authorized lesson build. Registry application requires a reviewed v2 consumer; no files changed."
        )
    # Work on copies so rejected updates cannot leave one registry mutated.
    theme_registry = deepcopy(theme_registry)
    lesson_registry = deepcopy(lesson_registry)
    lesson = payload.get("lesson") or {}
    lesson_key = normalize_lesson_id(str(lesson.get("id") or ""))
    for existing in lesson_registry.get("lessons", []):
        if existing.get("id") == lesson_key and (
            existing.get("status") != BESPOKE_STATUS
            or existing.get("slides", 0) or existing.get("videos", 0)
        ):
            raise ValueError(f"Refusing to replace an existing lesson release: {lesson_key}")
    prior_theme = theme_registry.get("lessons", {}).get(lesson_key)
    if prior_theme and prior_theme.get("bespokeSelectionSha256") != selection_digest(payload):
        actual_previous = prior_theme.get("bespokeSelectionSha256")
        if not actual_previous or expected_previous != actual_previous:
            raise ValueError("Pending design changed; review the existing proposal and pass --expected-selection-sha256 with its current digest")
    entry = selection_to_theme_entry(payload)
    upsert_theme_registry(theme_registry, lesson_key, entry)
    upsert_lesson_registry(lesson_registry, payload, lesson_key)
    return theme_registry, lesson_registry, lesson_key


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--selection", type=Path, required=True)
    parser.add_argument(
        "--theme-registry",
        type=Path,
        default=REPO_ROOT / "SPOKES Builder" / "theme-registry.json",
    )
    parser.add_argument(
        "--lesson-registry",
        type=Path,
        default=REPO_ROOT / "lesson-registry.json",
    )
    parser.add_argument("--expected-selection-sha256", help="Current pending selection digest required when replacing a different proposal")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print lesson key and derived chapterStyles; do not write",
    )
    args = parser.parse_args(argv)

    payload = load_json(args.selection)
    theme_reg = load_json(args.theme_registry)
    lesson_reg = load_json(args.lesson_registry)

    try:
        theme_reg, lesson_reg, lesson_key = apply_selection(
            payload, theme_registry=theme_reg, lesson_registry=lesson_reg,
            expected_previous=args.expected_selection_sha256
        )
    except ValueError as exc:
        print(str(exc), file=sys.stderr)
        return 1

    if args.dry_run:
        print(json.dumps({"lessonKey": lesson_key, "theme": theme_reg["lessons"][lesson_key]}, indent=2))
        return 0

    write_json(args.theme_registry, theme_reg)
    write_json(args.lesson_registry, lesson_reg)
    print(f"Upserted {lesson_key} into {args.theme_registry} and {args.lesson_registry}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
