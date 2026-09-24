"""Run the committed JavaScript design authority without duplicating its rules."""
from __future__ import annotations

import json
from pathlib import Path
import shutil
import subprocess

ROOT = Path(__file__).resolve().parents[1]


def model_result(payload: object, operation: str = "validate") -> dict:
    node = shutil.which("node")
    if not node:
        raise ValueError("Bespoke v2 validation and design generation require Node.js 22 or later.")
    try:
        result = subprocess.run(
            [node, str(ROOT / "scripts/bespoke-model-bridge.mjs"), operation],
            input=json.dumps(payload, ensure_ascii=True), capture_output=True,
            text=True, timeout=20, check=False,
        )
    except (OSError, subprocess.TimeoutExpired) as exc:
        raise ValueError("Bespoke v2 model authority could not run.") from exc
    if result.returncode:
        # Never echo the supplied selection or runtime environment in an error.
        raise ValueError("Bespoke v2 model authority failed; check Node.js 22+ and committed model/schema dependencies.")
    try:
        output = json.loads(result.stdout)
    except json.JSONDecodeError as exc:
        raise ValueError("Bespoke v2 model authority returned an invalid response.") from exc
    return output
