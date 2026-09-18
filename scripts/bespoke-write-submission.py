#!/usr/bin/env python3
"""Build Bespoke Spoke Signal submission files from selection JSON."""

from __future__ import annotations

import argparse
import html
import json
import pathlib
import sys


def esc(value: object) -> str:
    return html.escape(str(value or ""), quote=False)


def build_intake_markdown(payload: dict, date: str) -> str:
    lesson = payload.get("lesson") or {}
    team = payload.get("team") or {}
    sp = team.get("spokesperson") or {}
    theme = payload.get("theme") or {}
    cards = theme.get("cards") or {}
    sample = payload.get("sampleContent") or {}
    title = lesson.get("displayTitle") or lesson.get("title") or lesson.get("id") or "Lesson"
    bullets = sample.get("bullets") or ""
    myth = sample.get("mythReality") or ""
    if cards.get("varyByChapter"):
        card_line = f"vary by chapter: {json.dumps(cards.get('chapterStyles'))}"
    else:
        card_line = cards.get("lessonWide") or ""

    return f"""# SPOKES Lesson Content Intake Template

**Filled by Bespoke** via Spoke Signals. Template remains canonical (D11).

---

## Section 1: Lesson Overview

| Field | Your Entry |
|-------|------------|
| **Lesson Title** | {esc(title)} |
| **Lesson Subtitle** | {esc(lesson.get("subtitle") or "_TBD_")} |
| **Module Number** | _TBD_ |
| **Content Team / Author** | {esc(team.get("name") or sp.get("name"))} |
| **Spokesperson** | {esc(sp.get("name"))} &lt;{esc(sp.get("email") or "n/a")}&gt; |
| **Date Submitted** | {esc(date)} |
| **Lesson Description** | Spoke Signal submission. Look choices below; full WIPPEA content via OneDrive. |

### Design choices (from Bespoke)

| Dimension | Selection |
|-----------|-----------|
| Preset | {esc(payload.get("presetId"))} |
| Color lead | {esc(theme.get("colorLead"))} |
| Sidebar | {esc(theme.get("sidebarColor"))} |
| Texture | {esc(theme.get("backgroundTexture"))} |
| Title slide | {esc(theme.get("titleSlide"))} |
| Divider | {esc(theme.get("dividerStyle"))} |
| Font pairing | {esc(theme.get("fontPairing"))} |
| Cards | {esc(card_line)} |
| Unspoken | {esc(payload.get("unspoken") or "_none_")} |

---

## Section 2: Content by WIPPEA Stage

### Stage W -- Warm-Up (Chapter 1)

**Opening Activity or Reflection Prompt:**

```
{bullets or "[Write here]"}
```

### Stage I -- Introduction (Chapter 2)

**Framing Statement:**

```
{myth or "[Write here]"}
```

### Remaining stages

_Full P1–A content delivered via the team OneDrive folder._

---

## Section 4: Submission metadata

- Pipeline: Spoke Signals
- Schema: bespoke-selection/v1
- Gate: Britt reviews PR; merge = greenlight to build (D10)
"""


def write_submission(payload: dict, repo_root: pathlib.Path) -> pathlib.Path:
    if payload.get("schema") != "bespoke-selection/v1":
        raise SystemExit(f"Unexpected schema: {payload.get('schema')}")
    lesson = payload.get("lesson") or {}
    lesson_id = str(lesson.get("id") or "").strip()
    if not lesson_id:
        raise SystemExit("Payload missing lesson.id")
    date = str(payload.get("date") or "").strip()
    if not date:
        raise SystemExit("Payload missing date")

    dest = repo_root / "docs" / "phase-2" / "submissions" / lesson_id / date
    dest.mkdir(parents=True, exist_ok=True)
    (dest / "selection.json").write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    (dest / "content-intake.md").write_text(build_intake_markdown(payload, date), encoding="utf-8")
    return dest


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("payload", type=pathlib.Path, help="Path to bespoke-selection JSON")
    parser.add_argument(
        "--repo-root",
        type=pathlib.Path,
        default=pathlib.Path(__file__).resolve().parents[1],
    )
    args = parser.parse_args(argv)
    payload = json.loads(args.payload.read_text(encoding="utf-8"))
    dest = write_submission(payload, args.repo_root)
    print(f"Wrote {dest}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
