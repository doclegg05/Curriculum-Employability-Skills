"""Shared validation and identity for Bespoke file-writing boundaries."""
from __future__ import annotations

import hashlib
import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
_spec = importlib.util.spec_from_file_location("bespoke_validator", ROOT / "scripts/validate-bespoke-selection.py")
_validator = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_validator)


def require_valid_selection(payload: object) -> None:
    schema = json.loads((ROOT / "bespoke/selection.schema.json").read_text(encoding="utf-8"))
    errors, warnings = _validator.validate_payload(payload, schema)
    if errors:
        raise ValueError("Invalid Bespoke selection:\n" + "\n".join(errors))
    # Warnings are surfaced by the validation CLI; never rewrite older payloads.


def selection_digest(payload: dict) -> str:
    canonical = json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()
