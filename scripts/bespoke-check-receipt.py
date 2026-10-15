#!/usr/bin/env python3
"""Check the service receipt against the exact validated proposal payload."""
import json
import os
import sys
from pathlib import Path

from bespoke_support import require_valid_selection, selection_digest


def check_receipt(payload, receipt_id, lesson_id):
    require_valid_selection(payload)
    if not receipt_id and not lesson_id:
        return  # Existing manual/issue intake has no service receipt.
    expected = f"{payload['date']}-{selection_digest(payload)[:16]}"
    if receipt_id != expected or lesson_id != payload['lesson']['id']:
        raise ValueError("Receipt does not identify this saved lesson revision")


if __name__ == "__main__":
    try:
        payload = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
        check_receipt(payload, os.environ.get("RECEIPT_ID", ""), os.environ.get("RECEIPT_LESSON", ""))
    except (ValueError, IndexError, OSError) as exc:
        print(f"Receipt validation failed: {exc}", file=sys.stderr)
        sys.exit(1)
    print("Receipt identity verified (or manual intake).")
