#!/usr/bin/env python3
"""Validate Bespoke selection.json payloads against bespoke/selection.schema.json.

Uses a small Draft-2020-12 subset (type, const, enum, required, properties,
additionalProperties, pattern, minLength, null unions) so quality.sh stays
dependency-free. Custom post-schema checks cover chapter coverage and catalog
version; THM-04 adjacent uniqueness is required when chapter variation is enabled.
"""

from __future__ import annotations

import argparse
from datetime import date
import json
import re
import sys
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parent.parent
SCHEMA_PATH = REPO_ROOT / "bespoke" / "selection.schema.json"
LIBRARY_CATALOG = REPO_ROOT / "SPOKES Builder" / "bespoke-library-catalog.json"


class ValidationError(Exception):
    def __init__(self, path: str, message: str) -> None:
        self.path = path
        self.message = message
        super().__init__(f"{path}: {message}")


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def type_ok(value: Any, expected: str | list[str]) -> bool:
    types = expected if isinstance(expected, list) else [expected]
    for t in types:
        if t == "object" and isinstance(value, dict):
            return True
        if t == "array" and isinstance(value, list):
            return True
        if t == "string" and isinstance(value, str):
            return True
        if t == "boolean" and isinstance(value, bool):
            return True
        if t == "number" and isinstance(value, (int, float)) and not isinstance(value, bool):
            return True
        if t == "integer" and isinstance(value, int) and not isinstance(value, bool):
            return True
        if t == "null" and value is None:
            return True
    return False


def validate_against_schema(instance: Any, schema: dict, path: str = "$") -> list[str]:
    errors: list[str] = []

    if "const" in schema and instance != schema["const"]:
        errors.append(f"{path}: expected const {schema['const']!r}, got {instance!r}")
        return errors

    if "type" in schema and not type_ok(instance, schema["type"]):
        errors.append(f"{path}: expected type {schema['type']!r}, got {type(instance).__name__}")
        return errors

    if instance is None:
        return errors

    if "enum" in schema and instance not in schema["enum"]:
        errors.append(f"{path}: {instance!r} is not one of the allowed values")

    if isinstance(instance, str):
        if "minLength" in schema and len(instance) < schema["minLength"]:
            errors.append(f"{path}: string shorter than minLength {schema['minLength']}")
        if "pattern" in schema and not re.search(schema["pattern"], instance):
            errors.append(f"{path}: string does not match pattern {schema['pattern']!r}")

    if isinstance(instance, dict):
        required = schema.get("required") or []
        for key in required:
            if key not in instance:
                errors.append(f"{path}: missing required property {key!r}")
        props = schema.get("properties") or {}
        additional = schema.get("additionalProperties", True)
        for key, value in instance.items():
            if key in props:
                errors.extend(validate_against_schema(value, props[key], f"{path}.{key}"))
            elif additional is False:
                errors.append(f"{path}: unexpected property {key!r}")
            elif isinstance(additional, dict):
                errors.extend(validate_against_schema(value, additional, f"{path}.{key}"))

    return errors


def custom_checks(payload: dict, schema: dict) -> tuple[list[str], list[str]]:
    """Return (errors, warnings)."""
    errors: list[str] = []
    warnings: list[str] = []
    meta = schema.get("x-bespoke") or {}
    chapter_keys: list[str] = list(meta.get("chapterKeys") or [])

    theme = payload.get("theme") or {}
    cards = theme.get("cards") or {}
    if cards.get("varyByChapter"):
        styles = cards.get("chapterStyles")
        if not isinstance(styles, dict):
            errors.append("$.theme.cards.chapterStyles: required object when varyByChapter is true")
        else:
            missing = [k for k in chapter_keys if k not in styles]
            if missing:
                errors.append(
                    f"$.theme.cards.chapterStyles: missing chapter keys {missing}"
                )
            # Explicit chapter variation must preserve the wizard contract.
            ordered = [styles.get(k) for k in chapter_keys if k in styles]
            for i in range(len(ordered) - 1):
                if ordered[i] and ordered[i] == ordered[i + 1]:
                    errors.append(
                        f"THM-04: adjacent chapters "
                        f"{chapter_keys[i]!r}/{chapter_keys[i + 1]!r} share card style "
                        f"{ordered[i]!r}"
                    )

    try:
        date.fromisoformat(payload["date"])
    except ValueError:
        errors.append("$.date: must be a real calendar date")
    if not payload["team"]["spokesperson"]["name"].strip():
        errors.append("$.team.spokesperson.name: must not be blank")
    if not payload["lesson"]["title"].strip():
        errors.append("$.lesson.title: must not be blank")

    expected_version = (meta.get("generatedFrom") or {}).get("libraryCatalogVersion")
    got_version = payload.get("libraryCatalogVersion")
    if expected_version and got_version not in (None, expected_version):
        warnings.append(
            f"$.libraryCatalogVersion: payload has {got_version!r}, "
            f"committed catalog is {expected_version!r}"
        )

    return errors, warnings


def validate_payload(payload: dict, schema: dict) -> tuple[list[str], list[str]]:
    errors = validate_against_schema(payload, schema)
    if errors:
        return errors, []
    custom_errors, warnings = custom_checks(payload, schema)
    errors.extend(custom_errors)
    return errors, warnings


def collect_paths(paths: list[Path]) -> list[Path]:
    found: list[Path] = []
    for path in paths:
        if path.is_dir():
            found.extend(sorted(path.rglob("selection.json")))
            found.extend(sorted(path.glob("*.json")))
        elif path.is_file():
            found.append(path)
        else:
            print(f"ERROR: path not found: {path}", file=sys.stderr)
            raise SystemExit(2)
    # De-dupe while preserving order
    seen: set[Path] = set()
    unique: list[Path] = []
    for path in found:
        resolved = path.resolve()
        if resolved in seen:
            continue
        # Skip deliberately invalid fixtures when validating a directory of mixed files
        # Callers pass explicit files for negative fixtures.
        seen.add(resolved)
        unique.append(path)
    return unique


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "paths",
        nargs="*",
        type=Path,
        help="selection.json files or directories (default: fixtures + submissions)",
    )
    parser.add_argument(
        "--schema",
        type=Path,
        default=SCHEMA_PATH,
        help="Path to selection.schema.json",
    )
    parser.add_argument(
        "--expect-fail",
        action="store_true",
        help="Exit 0 only when validation fails (negative fixtures)",
    )
    parser.add_argument(
        "--allow-warn",
        action="store_true",
        help="Do not fail on soft-warn custom checks (default behavior already)",
    )
    args = parser.parse_args(argv)

    if not args.schema.exists():
        print(f"ERROR: schema missing: {args.schema}", file=sys.stderr)
        print("Run: python3 scripts/generate-selection-schema.py", file=sys.stderr)
        return 2

    schema = load_json(args.schema)
    if args.paths:
        files = collect_paths(args.paths)
    else:
        defaults = [
            REPO_ROOT / "scripts" / "test-fixtures" / "bespoke",
            REPO_ROOT / "docs" / "phase-2" / "submissions",
        ]
        files = []
        for d in defaults:
            if d.exists():
                files.extend(collect_paths([d]))
        # Default discovery skips intentional invalid fixtures
        files = [
            f
            for f in files
            if "invalid" not in f.name and "broken" not in f.name
        ]

    if not files:
        print("validate-bespoke-selection: no selection.json files to check")
        return 0

    failed = 0
    for path in files:
        try:
            payload = load_json(path)
        except json.JSONDecodeError as exc:
            print(f"FAIL {path}: invalid JSON ({exc})")
            failed += 1
            continue
        if not isinstance(payload, dict):
            print(f"FAIL {path}: payload must be a JSON object")
            failed += 1
            continue
        errors, warnings = validate_payload(payload, schema)
        if errors:
            print(f"FAIL {path}")
            for err in errors:
                print(f"  - {err}")
            failed += 1
        else:
            print(f"OK   {path}")
        for warn in warnings:
            print(f"  warn: {warn}")

    if args.expect_fail:
        if failed == len(files) and failed > 0:
            print(f"validate-bespoke-selection: {failed} file(s) failed as expected")
            return 0
        print(
            "ERROR: --expect-fail set but some files passed validation",
            file=sys.stderr,
        )
        return 1

    if failed:
        print(f"validate-bespoke-selection: {failed}/{len(files)} file(s) failed")
        return 1

    print(f"validate-bespoke-selection: {len(files)} file(s) OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
