import importlib.util
import json
import unittest
from pathlib import Path

from bespoke_support import selection_digest

ROOT = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("receipt", ROOT / "bespoke-check-receipt.py")
receipt = importlib.util.module_from_spec(spec)
spec.loader.exec_module(receipt)


class ReceiptTests(unittest.TestCase):
    def setUp(self):
        self.payload = json.loads((ROOT / "test-fixtures/bespoke/selection-money-management.json").read_text())
        self.receipt_id = f"{self.payload['date']}-{selection_digest(self.payload)[:16]}"

    def test_exact_saved_revision_and_manual_intake(self):
        receipt.check_receipt(self.payload, self.receipt_id, "money-management")
        receipt.check_receipt(self.payload, "", "")

    def test_modified_design_cannot_reuse_receipt(self):
        self.payload["team"]["name"] = "different revision"
        with self.assertRaises(ValueError):
            receipt.check_receipt(self.payload, self.receipt_id, "money-management")

    def test_mismatched_lesson_and_partial_identity_fail(self):
        for identity, lesson in [(self.receipt_id, "goal-setting"), (self.receipt_id, ""), ("", "money-management")]:
            with self.subTest(identity=identity, lesson=lesson), self.assertRaises(ValueError):
                receipt.check_receipt(self.payload, identity, lesson)
