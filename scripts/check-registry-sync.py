#!/usr/bin/env python3
"""Check that Dashboard.html's FALLBACK_LESSONS block matches lesson-registry.json.

The dashboard embeds a hand-mirrored copy of the lesson registry for file://
and offline users. This script parses both and exits non-zero when lesson ids,
titles, or statuses disagree, so the mirror can't drift silently.

Exit codes: 0 = in sync, 1 = drift found, 2 = could not read/parse an input.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
REGISTRY_PATH = REPO_ROOT / "lesson-registry.json"
DASHBOARD_PATH = REPO_ROOT / "Dashboard.html"
COMPARED_FIELDS = ("title", "status")


def fatal(message: str) -> None:
    print(f"ERROR: {message}", file=sys.stderr)
    sys.exit(2)


def extract_fallback_array(html: str) -> str:
    """Return the JS array literal assigned to FALLBACK_LESSONS."""
    match = re.search(r"const\s+FALLBACK_LESSONS\s*=\s*\[", html)
    if not match:
        fatal("FALLBACK_LESSONS assignment not found in Dashboard.html")
    start = match.end() - 1
    depth = 0
    in_string: str | None = None
    i = start
    while i < len(html):
        char = html[i]
        if in_string:
            if char == "\\":
                i += 2
                continue
            if char == in_string:
                in_string = None
        elif char in "'\"":
            in_string = char
        elif char == "[":
            depth += 1
        elif char == "]":
            depth -= 1
            if depth == 0:
                return html[start : i + 1]
        i += 1
    fatal("FALLBACK_LESSONS array is not terminated")
    raise AssertionError("unreachable")


def js_literal_to_json(js_text: str) -> str:
    """Convert the restricted JS literal used by FALLBACK_LESSONS to JSON."""
    out: list[str] = []
    i = 0
    length = len(js_text)
    while i < length:
        char = js_text[i]
        if char == "'":
            i += 1
            buf: list[str] = []
            while i < length:
                inner = js_text[i]
                if inner == "\\":
                    following = js_text[i + 1]
                    buf.append("'" if following == "'" else "\\" + following)
                    i += 2
                    continue
                if inner == "'":
                    break
                buf.append('\\"' if inner == '"' else inner)
                i += 1
            out.append('"' + "".join(buf) + '"')
            i += 1
        elif char == '"':
            out.append(char)
            i += 1
            while i < length:
                inner = js_text[i]
                out.append(inner)
                if inner == "\\":
                    out.append(js_text[i + 1])
                    i += 2
                    continue
                i += 1
                if inner == '"':
                    break
        else:
            out.append(char)
            i += 1
    text = "".join(out)
    text = re.sub(r"([{,]\s*)([A-Za-z_$][A-Za-z0-9_$]*)\s*:", r'\1"\2":', text)
    text = re.sub(r",(\s*[}\]])", r"\1", text)
    return text


def load_registry_lessons() -> dict[str, dict]:
    try:
        data = json.loads(REGISTRY_PATH.read_text(encoding="utf-8"))
    except OSError as exc:
        fatal(f"cannot read {REGISTRY_PATH.name}: {exc}")
    except json.JSONDecodeError as exc:
        fatal(f"{REGISTRY_PATH.name} is not valid JSON: {exc}")
    lessons = data.get("lessons")
    if not isinstance(lessons, list):
        fatal(f"{REGISTRY_PATH.name} has no 'lessons' array")
    return index_by_id(lessons, REGISTRY_PATH.name)


def load_fallback_lessons() -> dict[str, dict]:
    try:
        html = DASHBOARD_PATH.read_text(encoding="utf-8")
    except OSError as exc:
        fatal(f"cannot read {DASHBOARD_PATH.name}: {exc}")
    array_text = js_literal_to_json(extract_fallback_array(html))
    try:
        lessons = json.loads(array_text)
    except json.JSONDecodeError as exc:
        fatal(f"FALLBACK_LESSONS block could not be parsed as JSON: {exc}")
    return index_by_id(lessons, "FALLBACK_LESSONS")


def index_by_id(lessons: list, source: str) -> dict[str, dict]:
    indexed: dict[str, dict] = {}
    for lesson in lessons:
        if not isinstance(lesson, dict) or not lesson.get("id"):
            fatal(f"{source}: lesson entry without an 'id': {lesson!r}")
        lesson_id = lesson["id"]
        if lesson_id in indexed:
            fatal(f"{source}: duplicate lesson id {lesson_id!r}")
        indexed[lesson_id] = lesson
    return indexed


def main() -> int:
    registry = load_registry_lessons()
    fallback = load_fallback_lessons()
    problems: list[str] = []

    for lesson_id in sorted(registry.keys() - fallback.keys()):
        problems.append(f"{lesson_id}: in lesson-registry.json but missing from FALLBACK_LESSONS")
    for lesson_id in sorted(fallback.keys() - registry.keys()):
        problems.append(f"{lesson_id}: in FALLBACK_LESSONS but missing from lesson-registry.json")

    for lesson_id in sorted(registry.keys() & fallback.keys()):
        for field in COMPARED_FIELDS:
            reg_value = registry[lesson_id].get(field)
            fb_value = fallback[lesson_id].get(field)
            if reg_value != fb_value:
                problems.append(
                    f"{lesson_id}: {field} differs — "
                    f"registry={reg_value!r} vs dashboard={fb_value!r}"
                )

    if problems:
        print("Dashboard.html FALLBACK_LESSONS is out of sync with lesson-registry.json:")
        for problem in problems:
            print(f"  - {problem}")
        print("Update the FALLBACK_LESSONS block in Dashboard.html (see its sync comment).")
        return 1

    print(f"registry-sync: {len(registry)} lessons match (id, title, status) — OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
