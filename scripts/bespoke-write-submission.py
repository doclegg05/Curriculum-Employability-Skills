#!/usr/bin/env python3
"""Validate and save an immutable Bespoke design proposal and canonical intake."""
from __future__ import annotations

import argparse
import html
import json
import os
from pathlib import Path
import re
import shutil
import sys
import tempfile

sys.path.insert(0, str(Path(__file__).resolve().parent))
from bespoke_support import ROOT, require_valid_selection, selection_digest
from bespoke_design import build_design


def esc(value: object) -> str:
    """Keep user text inside one Markdown table cell."""
    return html.escape(str(value or ""), quote=False).replace("|", "&#124;").replace("\r", "").replace("\n", "<br>")


def fenced(value: str) -> str:
    """Preserve literal sample text even when it contains Markdown fences."""
    longest = max((len(m.group()) for m in re.finditer(r"`+", value)), default=0)
    fence = "`" * max(3, longest + 1)
    return f"{fence}text\n{value}\n{fence}"


def build_intake_markdown(payload: dict, date: str) -> str:
    # D11: retain every section of the actual template. Preview copy is not a
    # teacher-approved Warm-Up or Introduction and must not be assigned to either.
    template = (ROOT / "SPOKES Builder/content-intake-template.md").read_text(encoding="utf-8")
    lesson, team, theme = payload["lesson"], payload["team"], payload["theme"]
    spokesperson = team["spokesperson"]
    title = lesson.get("displayTitle") or lesson["title"]
    overview = {
        "Lesson Title": title,
        "Lesson Subtitle": lesson.get("subtitle", ""),
        "Content Team / Author": team.get("name") or spokesperson["name"],
        "Date Submitted": date,
    }
    for label, value in overview.items():
        pattern = r"^\| \*\*" + re.escape(label) + r"\*\* \|.*$"
        template = re.sub(pattern, lambda m: f"| **{label}** | {esc(value)} |", template, flags=re.MULTILINE)
    rows = {
        "Spokesperson": spokesperson["name"],
        "Spokesperson email": spokesperson.get("email", ""),
        "Preset": payload["presetId"],
        **{key: theme[key] for key in ("colorLead", "sidebarColor", "backgroundTexture", "titleSlide", "dividerStyle", "fontPairing")},
        "Cards": json.dumps(theme["cards"], ensure_ascii=False),
        "Team notes (Unspoken)": payload.get("unspoken", ""),
    }
    table = "\n".join(f"| {key} | {esc(value)} |" for key, value in rows.items())
    sample = payload.get("sampleContent") or {}
    return template.rstrip() + f"""

---

## Bespoke design proposal

This package records design choices for Britt's review. The unfinished template
above still needs the team's full content and resource references. Preview text
below is sample copy only; it has not been mapped to a WIPPEA stage.
Merge is approval to begin a separate lesson build, not a completed lesson.

| Dimension | Selection |
|-----------|-----------|
{table}

### Preview bullets (preserved verbatim)

{fenced(sample.get("bullets", ""))}

### Preview myth/reality (preserved verbatim)

{fenced(sample.get("mythReality", ""))}

- Payload schema: bespoke-selection/v1
- Selection SHA-256: `{selection_digest(payload)}`
- Approval: Britt reviews the draft PR before any build.
"""


def write_submission(payload: dict, repo_root: Path) -> Path:
    require_valid_selection(payload)
    lesson_id, date = payload["lesson"]["id"], payload["date"]
    submission_id = f"{date}-{selection_digest(payload)[:16]}"
    root = repo_root.resolve()
    dest = root / "docs/phase-2/submissions" / lesson_id / submission_id
    if not dest.resolve().is_relative_to(root / "docs/phase-2/submissions"):
        raise ValueError("Submission destination escapes the submissions directory")
    selection = json.dumps(payload, indent=2, ensure_ascii=False) + "\n"
    if dest.exists():
        previous = dest / "selection.json"
        if not previous.is_file() or previous.read_text(encoding="utf-8") != selection:
            raise ValueError("Existing submission differs; refusing to overwrite it")
        if any(not (dest / name).is_file() for name in ("content-intake.md", "design.css", "build-contract.json")):
            raise ValueError("Existing submission is incomplete; review it before retrying")
        return dest  # Retry preserves instructor edits to intake and proposal history.
    intake = build_intake_markdown(payload, date)
    css, contract = build_design(payload)
    dest.parent.mkdir(parents=True, exist_ok=True)
    staging = Path(tempfile.mkdtemp(prefix=".submission-", dir=dest.parent))
    try:
        (staging / "selection.json").write_text(selection, encoding="utf-8")
        (staging / "content-intake.md").write_text(intake, encoding="utf-8")
        (staging / "design.css").write_text(css, encoding="utf-8")
        (staging / "build-contract.json").write_text(json.dumps(contract, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        os.rename(staging, dest)
    finally:
        if staging.exists():
            shutil.rmtree(staging)
    return dest


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("payload", type=Path)
    parser.add_argument("--repo-root", type=Path, default=ROOT)
    parser.add_argument("--github-output", type=Path, help="Append validated metadata for GitHub Actions")
    args = parser.parse_args(argv)
    try:
        payload = json.loads(args.payload.read_text(encoding="utf-8"))
        dest = write_submission(payload, args.repo_root)
        if args.github_output:
            with args.github_output.open("a", encoding="utf-8") as output:
                output.write(f"lesson_id={payload['lesson']['id']}\ndate={payload['date']}\nsubmission_id={dest.name}\npath={dest.relative_to(args.repo_root.resolve()).as_posix()}\n")
    except (ValueError, OSError) as exc:
        print(str(exc), file=sys.stderr)
        return 1
    print(f"Wrote {dest}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
