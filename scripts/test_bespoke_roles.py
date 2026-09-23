"""BeSpoke v2 design model: data sanity, Python rules, and JS/Python parity."""
from __future__ import annotations

import json
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
COMPONENTS = json.loads((ROOT / "SPOKES Builder/role-components.json").read_text(encoding="utf-8"))
TEMPLATE = (ROOT / "SPOKES Builder/template.html").read_text(encoding="utf-8")
REF = re.compile(r"^(role|ink):[A-Za-z]+$|^palette:[a-z-]+$")


def refs(value):
    """Every string reference inside a color reference, tints included."""
    if isinstance(value, dict):
        yield from refs(value["tint"])
        yield from refs(value["over"])
    else:
        yield value


class DataFileTests(unittest.TestCase):
    def test_palette_matches_template_root(self) -> None:
        root = re.search(r":root\s*\{(.*?)\}", TEMPLATE, re.S).group(1)
        template = {k: v.lower() for k, v in re.findall(r"--([\w-]+):\s*(#[0-9a-fA-F]{6})", root)}
        self.assertEqual({c["id"]: c["hex"] for c in COMPONENTS["palette"]}, template)

    def test_neutrals_and_text_bans_are_palette_ids(self) -> None:
        ids = {c["id"] for c in COMPONENTS["palette"]}
        self.assertLessEqual(set(COMPONENTS["neutrals"]), ids)
        self.assertEqual(set(COMPONENTS["notText"]), {"gold", "accent"})

    def test_option_css_has_no_hex_and_only_known_role_variables(self) -> None:
        known = set()
        for role in COMPONENTS["roles"]:
            name = re.sub(r"[A-Z]", lambda m: "-" + m.group(0).lower(), role["id"])
            known |= {f"--role-{name}", f"--role-{name}-rgb"}
            if role.get("ink"):
                known |= {f"--role-{name}-ink", f"--role-{name}-ink-rgb"}
        chunks = [COMPONENTS["slides"]["base"]]
        chunks += [o["css"] for g in COMPONENTS["slides"]["groups"] for d in g["decisions"] for o in d["options"]]
        for css in chunks:
            self.assertIsNone(re.search(r"#[0-9a-fA-F]{3,8}\b", css), css)
            for used in re.findall(r"--role-[a-z-]+", css):
                self.assertIn(used, known, css)

    def test_every_pair_reference_is_well_formed(self) -> None:
        roles = {r["id"] for r in COMPONENTS["roles"]}
        pairs = [p for r in COMPONENTS["roles"] for p in r.get("pairs", [])]
        pairs += [p for g in COMPONENTS["slides"]["groups"] for d in g["decisions"] for o in d["options"] for p in o["pairs"]]
        for pair in pairs:
            for ref in [*refs(pair.get("fg", "role:heading")), *refs(pair["bg"])]:
                self.assertRegex(ref, REF)
                kind, name = ref.split(":")
                if kind in ("role", "ink"):
                    self.assertIn(name, roles, ref)

    def test_excludes_name_real_options_in_the_same_group(self) -> None:
        for group in COMPONENTS["slides"]["groups"]:
            decisions = {d["id"]: {o["id"] for o in d["options"]} for d in group["decisions"]}
            for decision in group["decisions"]:
                for option in decision["options"]:
                    for rule in option.get("excludes", []):
                        self.assertIn(rule["option"], decisions.get(rule["decision"], set()), f"{group['id']}.{option['id']}")
                        self.assertNotEqual(rule["decision"], decision["id"])

    def test_every_decision_offers_two_to_four_samples(self) -> None:
        for group in COMPONENTS["slides"]["groups"]:
            for decision in group["decisions"]:
                self.assertTrue(2 <= len(decision["options"]) <= 4, f"{group['id']}.{decision['id']}")

    def test_defaults_name_every_role_and_decision(self) -> None:
        defaults = COMPONENTS["defaults"]
        self.assertEqual(set(defaults["roles"]), {r["id"] for r in COMPONENTS["roles"]})
        for group in COMPONENTS["slides"]["groups"]:
            for decision in group["decisions"]:
                chosen = defaults["slides"][group["id"]][decision["id"]]
                self.assertIn(chosen, [o["id"] for o in decision["options"]], f"{group['id']}.{decision['id']}")


if __name__ == "__main__":
    unittest.main()
