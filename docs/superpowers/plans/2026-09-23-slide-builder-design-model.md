# Slide builder design model implementation plan (Plan 1 of 3)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the `bespoke-selection/v2` design model (palette picks, color roles, slide pieces) with contrast rules enforced identically in the browser, the Netlify service and the Python submission tools, lesson CSS generation from it, and a similarity meter measured from the six real lesson decks.

**Architecture:** One data file, `SPOKES Builder/role-components.json`, holds the palette, the role table and every slide-piece option with its CSS and declared color pairs. A pure ES module (`bespoke/design-model.mjs`) and a pure Python module (`scripts/bespoke_roles.py`) read that file and implement the same functions. A parity test runs both and compares the output byte for byte. Validators dispatch on the payload's `schema` field, so v1 and v2 both stay valid during the switch-over.

**Tech stack:** Python 3 standard library, Node 22 ES modules, `node:test`, Python `unittest`, Playwright (already in `node_modules`). No new dependencies.

**Spec:** `docs/bespoke/slide-builder-spec.md`

## Global constraints

- Colors come only from the 11-color palette in `SPOKES Builder/template.html` `:root` (SPOKES-STANDARD CLR-01). Option CSS contains no hex values (CLR-02). `rgba()` of palette colors is allowed (CLR-04).
- Gold (`gold`) and Green (`accent`) never color text (CLR-05, CLR-06).
- Contrast thresholds: text 4.5:1, large text 3:1, shapes 3:1, inks 4.5:1. Luminance uses the WCAG formula with the 0.03928 threshold, as `scripts/test_bespoke_theme_contrast.py` does.
- Blending rounds each channel with `floor(value + 0.5)`, never Python's `round()` (banker's rounding breaks parity with JS).
- Lesson CSS goes in one `<style id="theme-override">` block (THM-01). Font overrides stay as v1 generates them (TYP-02).
- v1 payloads (`bespoke-selection/v1`) must keep validating and generating exactly as today. Every existing test must still pass.
- Payloads stay free of numeric JSON fields: `canonicalJson` in `netlify/functions/_shared/selection.mjs` must match Python's `json.dumps(sort_keys=True)`.
- Redeploy the Netlify service from the branch before merging any change to what it accepts (`.claude/MEMORY.md`, decision log 2026-09-23). The deploy is run by Britt.
- Run `bash scripts/quality.sh` before each commit that touches validators or generators. It must end with `quality.sh: all checks passed`.

## File map

| File | Status | Responsibility |
|---|---|---|
| `SPOKES Builder/role-components.json` | Create | Palette, neutrals, text bans, roles, slide groups, option CSS and pairs, default design |
| `bespoke/design-model.mjs` | Create | Pure JS: contrast, inks, color references, role options, design check, role variables, design CSS, similarity |
| `scripts/bespoke_roles.py` | Create | Pure Python mirror of the same functions |
| `scripts/test-bespoke-design-model.mjs` | Create | `node:test` unit tests for the JS module |
| `scripts/test_bespoke_roles.py` | Create | Python unit tests, JS/Python parity, data-file sanity |
| `scripts/generate-selection-schema.py` | Modify | Also writes `bespoke/selection-v2.schema.json` |
| `bespoke/selection-v2.schema.json` | Generated | v2 payload schema |
| `scripts/validate-bespoke-selection.py` | Modify | Array keywords; dispatch v1/v2 by `schema`; v2 custom checks |
| `scripts/bespoke_support.py` | Modify | `require_valid_selection` picks the schema by payload id |
| `netlify/functions/_shared/selection.mjs` | Modify | Array keywords; v2 dispatch and checks |
| `scripts/bespoke_design.py` | Modify | v2 CSS and `bespoke-build-contract/v2` |
| `scripts/bespoke-check-design.py` | Modify | Accept v2 contracts |
| `scripts/bespoke-write-submission.py` | Modify | v2 intake rows |
| `scripts/bespoke-apply-selection.py` | Modify | v2 registry entries |
| `scripts/check-v2-layouts.mjs` | Create | Render every v2 option on the template; fail on collisions, overflow or a layout that isn't where its name says |
| `scripts/generate-lesson-fingerprints.mjs` | Create | Measure the six decks; write or check `bespoke/lesson-fingerprints.json` |
| `bespoke/lesson-fingerprints.json` | Generated | Measured role colors, font pairing and pattern per released lesson |
| `scripts/test-fixtures/bespoke/selection-v2-money-management.json` | Create | Valid v2 fixture |
| `scripts/test-fixtures/bespoke/selection-v2-invalid-contrast.json` | Create | v2 fixture that fails contrast |
| `scripts/quality.sh` | Modify | Run the new tests and the fingerprint check |

Color references used in `pairs`: `"role:<roleId>"` (the role's palette color), `"palette:<id>"`, `"ink:<roleId>"` (White or Royal chosen for that role), and a tint object `{"tint": <ref>, "alpha": <0..1>, "over": <ref>}`.

---

### Task 1: Slide-piece data file

**Files:**
- Create: `SPOKES Builder/role-components.json`
- Test: `scripts/test_bespoke_roles.py` (data-file sanity tests only in this task)

**Interfaces:**
- Produces: the JSON shape every later task reads. Top-level keys `version`, `palette[] {id,name,hex}`, `neutrals[]`, `notText[]`, `roles[] {id,label,note,kind,ink?,only?,pairs?}`, `slides {base, groups[] {id,label,decisions[] {id,label,options[] {id,label,css,pairs[],excludes?[] {decision,option}}}}}`, `defaults {palette, roles, fontPairing, slides}`.
- Six groups, 18 decisions, 57 options: 2 to 4 samples per decision, like a PowerPoint master slide's layouts. Decisions are emitted in listed order, so a later decision (usually layout) wins. `excludes` names options in the same group that an option can't be combined with.
- Every option in this file was rendered on the template and passed `scripts/check-v2-layouts.mjs` (Task 6) while the plan was written.

- [ ] **Step 1: Write the failing sanity tests**

Create `scripts/test_bespoke_roles.py`:

```python
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
```

- [ ] **Step 2: Run the tests and watch them fail**

Run: `python3 -m unittest scripts/test_bespoke_roles.py -v`
Expected: ERROR, `FileNotFoundError: ... role-components.json`.

- [ ] **Step 3: Create the data file**

Create `SPOKES Builder/role-components.json`:

```json
{
  "version": "2.0.0",
  "description": "BeSpoke v2 slide pieces, 2 to 4 samples per decision. Option CSS uses only --role-* and palette variables; every color pair an option creates is listed in its pairs; excludes names options in the same group it can't be combined with. Decisions are emitted in listed order, so later decisions (usually layout) win. Read by bespoke/design-model.mjs and scripts/bespoke_roles.py.",
  "palette": [
    {
      "id": "primary",
      "name": "Blue",
      "hex": "#007baf"
    },
    {
      "id": "dark",
      "name": "Navy",
      "hex": "#004071"
    },
    {
      "id": "royal",
      "name": "Royal",
      "hex": "#00133f"
    },
    {
      "id": "accent",
      "name": "Green",
      "hex": "#37b550"
    },
    {
      "id": "gold",
      "name": "Gold",
      "hex": "#d3b257"
    },
    {
      "id": "muted-gold",
      "name": "Deep gold",
      "hex": "#ad8806"
    },
    {
      "id": "mauve",
      "name": "Mauve",
      "hex": "#a7253f"
    },
    {
      "id": "gray",
      "name": "Gray",
      "hex": "#60636b"
    },
    {
      "id": "offwhite",
      "name": "Silver",
      "hex": "#d1d3d4"
    },
    {
      "id": "muted",
      "name": "Mist",
      "hex": "#edf3f7"
    },
    {
      "id": "light",
      "name": "White",
      "hex": "#ffffff"
    }
  ],
  "neutrals": [
    "light",
    "muted",
    "royal",
    "dark",
    "gray"
  ],
  "notText": [
    "gold",
    "accent"
  ],
  "roles": [
    {
      "id": "sidebar",
      "label": "Sidebar",
      "note": "The chapter list on every slide. Its text color is chosen for you.",
      "kind": "surface",
      "ink": true
    },
    {
      "id": "titleBackground",
      "label": "Title slide background",
      "note": "The first thing learners see.",
      "kind": "surface"
    },
    {
      "id": "titleBackgroundEnd",
      "label": "Title slide second color",
      "note": "The gradient's second color and the split layout's right panel.",
      "kind": "surface"
    },
    {
      "id": "titleText",
      "label": "Title text",
      "note": "Large lettering on the title slide.",
      "kind": "text",
      "pairs": [
        {
          "bg": "role:titleBackground",
          "min": 3
        },
        {
          "bg": "role:titleBackgroundEnd",
          "min": 3
        }
      ]
    },
    {
      "id": "subtitle",
      "label": "Subtitle",
      "note": "The line under the title, and the copyright line.",
      "kind": "text",
      "pairs": [
        {
          "bg": "role:titleBackground",
          "min": 4.5
        },
        {
          "bg": "role:titleBackgroundEnd",
          "min": 4.5
        }
      ]
    },
    {
      "id": "contentBackground",
      "label": "Content slide background",
      "note": "Behind most of the lesson.",
      "kind": "surface",
      "only": [
        "light",
        "muted"
      ]
    },
    {
      "id": "heading",
      "label": "Slide headings",
      "note": "Headings on content slides and cards.",
      "kind": "text",
      "pairs": [
        {
          "bg": "role:contentBackground",
          "min": 3
        }
      ]
    },
    {
      "id": "body",
      "label": "Body text",
      "note": "Paragraphs, card text and lists.",
      "kind": "text",
      "only": [
        "royal",
        "dark",
        "gray"
      ],
      "pairs": [
        {
          "bg": "role:contentBackground",
          "min": 4.5
        }
      ]
    },
    {
      "id": "accent",
      "label": "Accent",
      "note": "Rules, card edges, list arrows and the current chapter.",
      "kind": "shape",
      "ink": true,
      "pairs": [
        {
          "bg": "role:contentBackground",
          "min": 3
        }
      ]
    },
    {
      "id": "button",
      "label": "Buttons",
      "note": "Handout and video buttons. Their text color is chosen for you.",
      "kind": "surface",
      "ink": true
    },
    {
      "id": "dividerBackground",
      "label": "Chapter divider background",
      "note": "Behind each chapter's opening slide. Its text color is chosen for you.",
      "kind": "surface",
      "ink": true
    }
  ],
  "slides": {
    "base": ".sidebar { background: var(--role-sidebar); color: var(--role-sidebar-ink); }\n.sidebar-toggle { background: var(--role-sidebar); color: var(--role-sidebar-ink); }\n.sidebar-collapse-btn { background: rgba(var(--role-sidebar-ink-rgb), 0.15); color: var(--role-sidebar-ink); }\n.sidebar-title, .resources-title, .chapter-header, .slide-item, .resource-link { color: var(--role-sidebar-ink); }\n.chapter-header:hover, .slide-item:hover, .resource-link:hover { background: transparent; color: var(--role-sidebar-ink); text-decoration: underline; }\n.chapter-item.active > .chapter-header { background: transparent; color: var(--role-sidebar-ink); border-left-color: var(--role-accent); font-weight: 600; }\n.slide-item.active { background: transparent; color: var(--role-sidebar-ink); box-shadow: inset 3px 0 0 var(--role-accent); font-weight: 600; }\n.main { background-color: var(--role-content-background); }\n.slide h2 { color: var(--role-heading); }\n.slide p { color: var(--role-body); }\n.divider { background: var(--role-accent); }\n.card h4 { color: var(--role-heading); }\n.card p, .content-list li { color: var(--role-body); }\n.content-list li::before { color: var(--role-accent); }\n.download-btn, .video-btn { background: var(--role-button); color: var(--role-button-ink); }\n.slide-title h1 { color: var(--role-title-text); }\n.slide-title .subtitle, .slide-title .copyright { color: var(--role-subtitle); }\n.slide-title .divider { background: var(--role-accent); }\n.slide-section, .slide-section[data-chapter-num] { background: var(--role-divider-background); }\n.slide-section h2, .slide-section .chapter-label { color: var(--role-divider-background-ink); }\n.slide-section .divider { background: var(--role-accent); }\n.slide-section .section-circle { border-color: rgba(var(--role-divider-background-ink-rgb), 0.25); }\n.slide-section::after { color: rgba(var(--role-divider-background-ink-rgb), 0.06); }\n.slide-video h2 { color: var(--role-heading); }\n.activity-box { border-color: var(--role-accent); }\n.activity-label { color: var(--role-heading); }\n.activity-box p { color: var(--role-body); }",
    "groups": [
      {
        "id": "background",
        "label": "Background",
        "decisions": [
          {
            "id": "pattern",
            "label": "Pattern",
            "options": [
              {
                "id": "plain",
                "label": "Plain",
                "css": ".main { background-image: none; }",
                "pairs": []
              },
              {
                "id": "dot-grid",
                "label": "Dot grid",
                "css": ".main { background-image: radial-gradient(rgba(var(--role-accent-rgb), 0.14) 1px, transparent 1px); background-size: 16px 16px; }",
                "pairs": []
              },
              {
                "id": "diagonal",
                "label": "Diagonal",
                "css": ".main { background-image: repeating-linear-gradient(45deg, rgba(var(--role-accent-rgb), 0.08) 0 1px, transparent 1px 14px); }",
                "pairs": []
              },
              {
                "id": "crosshatch",
                "label": "Crosshatch",
                "css": ".main { background-image: linear-gradient(rgba(var(--role-accent-rgb), 0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(var(--role-accent-rgb), 0.07) 1px, transparent 1px); background-size: 24px 24px; }",
                "pairs": []
              }
            ]
          }
        ]
      },
      {
        "id": "title",
        "label": "Title slide",
        "decisions": [
          {
            "id": "colors",
            "label": "Colors",
            "options": [
              {
                "id": "solid",
                "label": "Solid",
                "css": ".slide-title { background: var(--role-title-background); }",
                "pairs": []
              },
              {
                "id": "gradient",
                "label": "Gradient",
                "css": ".slide-title { background: linear-gradient(135deg, var(--role-title-background), var(--role-title-background-end)); }",
                "pairs": []
              },
              {
                "id": "light",
                "label": "Light",
                "css": ".slide-title { background: var(--role-content-background); }\n.slide-title h1 { color: var(--role-heading); }\n.slide-title .subtitle, .slide-title .copyright { color: var(--role-body); }",
                "pairs": []
              }
            ]
          },
          {
            "id": "logo",
            "label": "Logo",
            "options": [
              {
                "id": "above",
                "label": "Above the title",
                "css": "",
                "pairs": []
              },
              {
                "id": "corner",
                "label": "Top corner",
                "css": ".slide-title { position: relative; }\n.slide-title .logo { position: absolute; top: 2rem; right: 2.5rem; max-width: 160px; margin: 0; }",
                "pairs": []
              }
            ]
          },
          {
            "id": "layout",
            "label": "Layout",
            "options": [
              {
                "id": "center",
                "label": "Centered",
                "css": ".slide-title { align-items: center; text-align: center; }",
                "pairs": []
              },
              {
                "id": "left",
                "label": "Left",
                "css": ".slide-title { align-items: flex-start; text-align: left; padding-left: 7rem; }",
                "pairs": []
              },
              {
                "id": "bottom",
                "label": "Bottom left",
                "css": ".slide-title { align-items: flex-start; justify-content: flex-end; text-align: left; padding-left: 7rem; padding-bottom: 5rem; }",
                "pairs": []
              },
              {
                "id": "split",
                "label": "Split panels",
                "css": ".slide-title { flex-direction: column; align-items: flex-start; justify-content: center; text-align: left; background: none; position: relative; z-index: 1; }\n.slide-title::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 40%; background: var(--role-title-background); z-index: -1; flex: none; display: block; }\n.slide-title::after { content: ''; position: absolute; left: 40%; top: 0; bottom: 0; right: 0; background: var(--role-title-background-end); z-index: -1; flex: none; display: block; }\n.slide-title .logo { max-width: 220px; margin: 0 0 1.5rem; }\n.slide-title h1 { max-width: 90%; margin: 0; }\n.slide-title .divider { margin: 1.5rem 0; }\n.slide-title .subtitle { max-width: 90%; margin-bottom: 0; }\n.slide-title .copyright { position: absolute; bottom: 2rem; left: 5rem; margin: 0; }",
                "pairs": [],
                "excludes": [
                  {
                    "decision": "colors",
                    "option": "light"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "id": "divider",
        "label": "Chapter divider",
        "decisions": [
          {
            "id": "colors",
            "label": "Colors",
            "options": [
              {
                "id": "solid",
                "label": "Solid",
                "css": "",
                "pairs": []
              },
              {
                "id": "gradient",
                "label": "Gradient",
                "css": ".slide-section, .slide-section[data-chapter-num] { background: linear-gradient(135deg, var(--role-divider-background), var(--role-title-background-end)); }",
                "pairs": [
                  {
                    "fg": "ink:dividerBackground",
                    "bg": "role:titleBackgroundEnd",
                    "min": 4.5
                  }
                ]
              },
              {
                "id": "light",
                "label": "Light",
                "css": ".slide-section, .slide-section[data-chapter-num] { background: var(--role-content-background); }\n.slide-section h2 { color: var(--role-heading); }\n.slide-section .chapter-label { color: var(--role-body); }\n.slide-section .section-circle { border-color: rgba(var(--role-accent-rgb), 0.35); }\n.slide-section::after { color: rgba(var(--role-heading-rgb), 0.06); }",
                "pairs": []
              }
            ]
          },
          {
            "id": "watermark",
            "label": "Watermark letter",
            "options": [
              {
                "id": "show",
                "label": "Show",
                "css": "",
                "pairs": []
              },
              {
                "id": "hide",
                "label": "Hide",
                "css": ".slide-section::after { content: none; }",
                "pairs": []
              }
            ]
          },
          {
            "id": "layout",
            "label": "Layout",
            "options": [
              {
                "id": "center",
                "label": "Centered",
                "css": "",
                "pairs": []
              },
              {
                "id": "left",
                "label": "Left",
                "css": ".slide-section { align-items: flex-start; text-align: left; padding-left: 8rem; }\n.slide-section .section-circle { display: none; }",
                "pairs": []
              },
              {
                "id": "band",
                "label": "Band",
                "css": ".slide-section, .slide-section[data-chapter-num] { background: var(--role-content-background); }\n.slide-section::before { content: ''; position: absolute; left: 0; right: 0; top: 30%; height: 40%; background: var(--role-divider-background); flex: none; display: block; z-index: 0; }\n.slide-section > * { position: relative; z-index: 1; }\n.slide-section .section-circle { display: none; }",
                "pairs": [],
                "excludes": [
                  {
                    "decision": "colors",
                    "option": "light"
                  }
                ]
              },
              {
                "id": "number",
                "label": "Big number",
                "css": ".slide-section { align-items: flex-start; justify-content: flex-end; text-align: left; padding: 0 8rem 6rem; }\n.slide-section .section-circle { display: none; }\n.slide-section::after { left: 6%; right: auto; top: 4%; bottom: auto; transform: none; font-size: 18rem; }",
                "pairs": []
              }
            ]
          }
        ]
      },
      {
        "id": "video",
        "label": "Video slide",
        "decisions": [
          {
            "id": "colors",
            "label": "Colors",
            "options": [
              {
                "id": "light",
                "label": "Light",
                "css": ".slide-video { background: var(--role-content-background); }",
                "pairs": []
              },
              {
                "id": "tinted",
                "label": "Tinted",
                "css": ".slide-video { background: linear-gradient(170deg, rgba(var(--role-accent-rgb), 0.12), var(--role-content-background) 60%); }",
                "pairs": [
                  {
                    "fg": "role:heading",
                    "bg": {
                      "tint": "role:accent",
                      "alpha": 0.12,
                      "over": "role:contentBackground"
                    },
                    "min": 3
                  }
                ]
              },
              {
                "id": "dark",
                "label": "Dark",
                "css": ".slide-video { background: var(--role-divider-background); }\n.slide-video h2 { color: var(--role-divider-background-ink); }",
                "pairs": []
              }
            ]
          },
          {
            "id": "frame",
            "label": "Frame",
            "options": [
              {
                "id": "plain",
                "label": "Plain",
                "css": "",
                "pairs": []
              },
              {
                "id": "accent",
                "label": "Accent frame",
                "css": ".video-container { border: 4px solid var(--role-accent); }",
                "pairs": []
              }
            ]
          },
          {
            "id": "titleStyle",
            "label": "Title style",
            "options": [
              {
                "id": "regular",
                "label": "Regular",
                "css": "",
                "pairs": []
              },
              {
                "id": "large",
                "label": "Large",
                "css": ".slide-video h2 { font-size: 2.8rem; }",
                "pairs": []
              },
              {
                "id": "caps",
                "label": "Small caps",
                "css": ".slide-video h2 { font-size: 1.4rem; text-transform: uppercase; letter-spacing: 0.12em; }",
                "pairs": []
              }
            ]
          },
          {
            "id": "layout",
            "label": "Layout",
            "options": [
              {
                "id": "stacked",
                "label": "Title above",
                "css": "",
                "pairs": []
              },
              {
                "id": "side",
                "label": "Side by side",
                "css": ".slide-video.active { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 2fr); align-content: center; align-items: center; gap: 3rem; text-align: left; }\n.slide-video.active::before, .slide-video.active::after { display: none; }\n.slide-video h2 { margin: 0; }",
                "pairs": []
              },
              {
                "id": "banner",
                "label": "Title banner",
                "css": ".slide-video h2 { align-self: stretch; margin: 0 0 2rem; padding: 1rem 2rem; background: var(--role-button); color: var(--role-button-ink); border-radius: 8px; }",
                "pairs": []
              }
            ]
          }
        ]
      },
      {
        "id": "list",
        "label": "Bullet list",
        "decisions": [
          {
            "id": "look",
            "label": "Card look",
            "options": [
              {
                "id": "rail",
                "label": "Left rail",
                "css": ".card, .card.gold-border { background: var(--role-content-background); border: 0; border-left: 6px solid var(--role-accent); box-shadow: 0 4px 14px rgba(0, 19, 63, 0.08); }",
                "pairs": []
              },
              {
                "id": "outline",
                "label": "Outline",
                "css": ".card, .card.gold-border { background: var(--role-content-background); border: 2px solid var(--role-accent); }",
                "pairs": []
              },
              {
                "id": "filled",
                "label": "Filled",
                "css": ".card, .card.gold-border { background: var(--muted); border: 0; }",
                "pairs": [
                  {
                    "fg": "role:heading",
                    "bg": "palette:muted",
                    "min": 3
                  },
                  {
                    "fg": "role:body",
                    "bg": "palette:muted",
                    "min": 4.5
                  }
                ]
              },
              {
                "id": "band",
                "label": "Top band",
                "css": ".card, .card.gold-border { background: var(--role-content-background); border: 0; border-top: 6px solid var(--role-accent); border-radius: 4px 4px 12px 12px; box-shadow: 0 4px 14px rgba(0, 19, 63, 0.08); }",
                "pairs": []
              }
            ]
          },
          {
            "id": "layout",
            "label": "Layout",
            "options": [
              {
                "id": "two",
                "label": "Two columns",
                "css": "",
                "pairs": []
              },
              {
                "id": "three",
                "label": "Three across",
                "css": ".cards-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1.25rem; }\n.card { padding: 1.25rem 1.5rem; }\n.card h4 { font-size: 1.45rem; }\n.card p { font-size: 1.2rem; }",
                "pairs": []
              },
              {
                "id": "rows",
                "label": "Rows",
                "css": ".cards-grid { grid-template-columns: 1fr; gap: 0.75rem; }\n.card { flex-direction: row; align-items: baseline; gap: 2rem; padding: 1rem 2rem; text-align: left; }\n.card h4 { flex: 0 0 32%; margin: 0; text-align: left; }\n.card p { margin: 0; text-align: left; }",
                "pairs": []
              },
              {
                "id": "numbered",
                "label": "Numbered",
                "css": ".cards-grid { counter-reset: spokes-card; }\n.card { position: relative; padding: 1.5rem 2rem 1.5rem 4.75rem; }\n.card::before { counter-increment: spokes-card; content: counter(spokes-card); position: absolute; left: 1.5rem; top: 1.4rem; font-family: var(--font-heading); font-size: 2.2rem; line-height: 1; color: var(--role-heading); }",
                "pairs": []
              }
            ]
          },
          {
            "id": "titleStyle",
            "label": "Title style",
            "options": [
              {
                "id": "regular",
                "label": "Regular",
                "css": "",
                "pairs": []
              },
              {
                "id": "large",
                "label": "Large",
                "css": ".card h4 { font-size: 2rem; line-height: 1.15; }\n.card { padding-top: 1.5rem; padding-bottom: 1.5rem; }",
                "pairs": []
              },
              {
                "id": "caps",
                "label": "Small caps",
                "css": ".card h4 { font-size: 1.15rem; text-transform: uppercase; letter-spacing: 0.12em; }",
                "pairs": []
              }
            ]
          },
          {
            "id": "colors",
            "label": "Colors",
            "options": [
              {
                "id": "light",
                "label": "Light",
                "css": "",
                "pairs": []
              },
              {
                "id": "tinted",
                "label": "Tinted",
                "css": ".card, .card.gold-border { background: rgba(var(--role-accent-rgb), 0.1); }",
                "pairs": [
                  {
                    "fg": "role:heading",
                    "bg": {
                      "tint": "role:accent",
                      "alpha": 0.1,
                      "over": "role:contentBackground"
                    },
                    "min": 3
                  },
                  {
                    "fg": "role:body",
                    "bg": {
                      "tint": "role:accent",
                      "alpha": 0.1,
                      "over": "role:contentBackground"
                    },
                    "min": 4.5
                  }
                ]
              },
              {
                "id": "bold",
                "label": "Bold",
                "css": ".card, .card.gold-border { background: var(--role-button); }\n.card h4, .card p, .card::before { color: var(--role-button-ink); }",
                "pairs": []
              }
            ]
          }
        ]
      },
      {
        "id": "activity",
        "label": "Activity",
        "decisions": [
          {
            "id": "colors",
            "label": "Colors",
            "options": [
              {
                "id": "light",
                "label": "Light",
                "css": ".activity-box { background: var(--role-content-background); }\n.activity-label { color: var(--role-heading); }\n.activity-box p { color: var(--role-body); }",
                "pairs": []
              },
              {
                "id": "tinted",
                "label": "Tinted",
                "css": ".activity-box { background: rgba(var(--role-accent-rgb), 0.1); }\n.activity-label { color: var(--role-heading); }\n.activity-box p { color: var(--role-body); }",
                "pairs": [
                  {
                    "fg": "role:heading",
                    "bg": {
                      "tint": "role:accent",
                      "alpha": 0.1,
                      "over": "role:contentBackground"
                    },
                    "min": 3
                  },
                  {
                    "fg": "role:body",
                    "bg": {
                      "tint": "role:accent",
                      "alpha": 0.1,
                      "over": "role:contentBackground"
                    },
                    "min": 4.5
                  }
                ]
              },
              {
                "id": "solid",
                "label": "Solid",
                "css": ".activity-box { background: var(--role-accent); }\n.activity-label, .activity-box p { color: var(--role-accent-ink); }",
                "pairs": [
                  {
                    "fg": "ink:accent",
                    "bg": "role:accent",
                    "min": 4.5
                  }
                ]
              }
            ]
          },
          {
            "id": "label",
            "label": "Label style",
            "options": [
              {
                "id": "caps",
                "label": "Small caps",
                "css": "",
                "pairs": []
              },
              {
                "id": "heading",
                "label": "Heading font",
                "css": ".activity-label { font-family: var(--font-heading); font-size: 1.6rem; font-weight: 400; text-transform: none; letter-spacing: 0; }",
                "pairs": []
              },
              {
                "id": "pill",
                "label": "Pill",
                "css": ".activity-label { display: inline-block; padding: 0.25rem 0.85rem; border-radius: 999px; background: var(--role-accent); color: var(--role-accent-ink); }",
                "pairs": [
                  {
                    "fg": "ink:accent",
                    "bg": "role:accent",
                    "min": 4.5
                  }
                ]
              }
            ]
          },
          {
            "id": "layout",
            "label": "Layout",
            "options": [
              {
                "id": "box",
                "label": "Box",
                "css": ".activity-box { border: 2px solid var(--role-accent); border-radius: 12px; }",
                "pairs": []
              },
              {
                "id": "callout",
                "label": "Callout",
                "css": ".activity-box { border: 0; border-left: 6px solid var(--role-accent); border-radius: 0 12px 12px 0; }",
                "pairs": []
              },
              {
                "id": "banner",
                "label": "Label banner",
                "css": ".activity-box { border: 2px solid var(--role-accent); border-radius: 12px; padding-top: 0; overflow: hidden; }\n.activity-label { display: block; margin: 0 -2rem 1rem; padding: 0.6rem 2rem; border-radius: 0; background: var(--role-accent); color: var(--role-accent-ink); }",
                "pairs": [
                  {
                    "fg": "ink:accent",
                    "bg": "role:accent",
                    "min": 4.5
                  }
                ],
                "excludes": [
                  {
                    "decision": "label",
                    "option": "pill"
                  }
                ]
              },
              {
                "id": "side",
                "label": "Side label",
                "css": ".activity-box { display: grid; grid-template-columns: minmax(0, 12rem) minmax(0, 1fr); gap: 0 2rem; align-items: baseline; border: 2px solid var(--role-accent); border-radius: 12px; }\n.activity-label { margin: 0; }\n.activity-box > :not(.activity-label) { grid-column: 2; }",
                "pairs": []
              }
            ]
          }
        ]
      }
    ]
  },
  "defaults": {
    "palette": {
      "primary": [
        "dark",
        "mauve"
      ],
      "secondary": [
        "gold"
      ]
    },
    "roles": {
      "sidebar": "dark",
      "titleBackground": "dark",
      "titleBackgroundEnd": "mauve",
      "titleText": "light",
      "subtitle": "light",
      "contentBackground": "light",
      "heading": "mauve",
      "body": "royal",
      "accent": "mauve",
      "button": "mauve",
      "dividerBackground": "mauve"
    },
    "fontPairing": "dm-serif-display-outfit",
    "slides": {
      "background": {
        "pattern": "dot-grid"
      },
      "title": {
        "colors": "gradient",
        "logo": "above",
        "layout": "center"
      },
      "divider": {
        "colors": "solid",
        "watermark": "show",
        "layout": "center"
      },
      "video": {
        "colors": "light",
        "frame": "accent",
        "titleStyle": "regular",
        "layout": "stacked"
      },
      "list": {
        "look": "rail",
        "layout": "two",
        "titleStyle": "regular",
        "colors": "light"
      },
      "activity": {
        "colors": "tinted",
        "label": "caps",
        "layout": "box"
      }
    }
  }
}
```

- [ ] **Step 4: Run the tests and watch them pass**

Run: `python3 -m unittest scripts/test_bespoke_roles.py -v`
Expected: 7 tests, `OK`.

- [ ] **Step 5: Commit**

```bash
git add "SPOKES Builder/role-components.json" scripts/test_bespoke_roles.py
git commit -m "feat(bespoke): v2 slide-piece data file with roles, options and color pairs"
```

---

### Task 2: JS design model

**Files:**
- Create: `bespoke/design-model.mjs`
- Test: `scripts/test-bespoke-design-model.mjs`

**Interfaces:**
- Consumes: `SPOKES Builder/role-components.json` (Task 1), passed in as `components`.
- Produces (all exported, all pure):
  - `kebab(id: string): string`
  - `contrast(hexA: string, hexB: string): number`
  - `inkFor(components, paletteId: string): "light" | "royal"`
  - `resolveColor(components, design, ref): string` (hex)
  - `roleChoices(components, design): string[]`
  - `roleOptions(components, design, roleId): {id, name, ok, reason}[]`
  - `checkDesign(components, design): string[]` (empty when valid)
  - `designCss(components, design): string`
  - `MEASURED_ROLES: string[]` and `similarity(fingerprints, design): {id, title, shared, total, matches}[]` (closest first)
- `design` shape (the v2 payload's `design` object): `{ palette: {primary: string[2], secondary: string[0..3]}, roles: {<roleId>: paletteId}, fontPairing: string, slides: {<groupId>: {<decisionId>: optionId}} }`

- [ ] **Step 1: Write the failing tests**

Create `scripts/test-bespoke-design-model.mjs`:

```js
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import * as M from "../bespoke/design-model.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const components = JSON.parse(fs.readFileSync(path.join(root, "SPOKES Builder/role-components.json"), "utf8"));
const design = () => structuredClone(components.defaults);

test("contrast matches known WCAG values", () => {
  assert.equal(M.contrast("#ffffff", "#000000").toFixed(2), "21.00");
  assert.equal(M.contrast("#ffffff", "#007baf").toFixed(2), "4.72");
  assert.equal(M.contrast("#00133f", "#37b550").toFixed(2), "6.77");
});

test("every palette color has an ink at 4.5:1 or better", () => {
  for (const color of components.palette) {
    const ink = components.palette.find((c) => c.id === M.inkFor(components, color.id));
    assert.ok(M.contrast(ink.hex, color.hex) >= 4.5, `${color.id} with ${ink.id}`);
  }
});

test("the default design is valid", () => {
  assert.deepEqual(M.checkDesign(components, design()), []);
});

test("unreadable pairs and banned text colors are rejected with the reason", () => {
  const d = design();
  d.roles.heading = "offwhite";
  d.palette.secondary = ["offwhite"];
  assert.match(M.checkDesign(components, d).join("\n"), /Slide headings: 1\.\d+:1 on White, needs 3:1/);
  const g = design();
  g.roles.heading = "gold";
  assert.match(M.checkDesign(components, g).join("\n"), /Slide headings: Gold is not used for text/);
});

test("roles may only use picked colors, neutrals, or the role's own list", () => {
  const d = design();
  d.roles.accent = "primary";
  assert.match(M.checkDesign(components, d).join("\n"), /Accent: Blue is not one of the available colors/);
  const b = design();
  b.roles.body = "mauve";
  assert.match(M.checkDesign(components, b).join("\n"), /Body text: Mauve is not one of the available colors/);
});

test("option pairs are checked, including tinted surfaces", () => {
  const d = design();
  d.roles.contentBackground = "muted";
  d.slides.list.look = "filled";
  d.roles.heading = "gray";
  assert.deepEqual(M.checkDesign(components, d), []);
  const solid = design();
  solid.slides.activity.colors = "solid";
  assert.deepEqual(M.checkDesign(components, solid), []);
});

test("options that can't be combined are rejected with both names", () => {
  const d = design();
  d.slides.title.layout = "split";
  d.slides.title.colors = "light";
  assert.match(M.checkDesign(components, d).join("\n"), /Title slide: Split panels can't be combined with Light\./);
  const ok = design();
  ok.slides.title.layout = "split";
  assert.deepEqual(M.checkDesign(components, ok), []);
});

test("an unknown option is reported by group and decision", () => {
  const d = design();
  d.slides.video.frame = "neon";
  assert.match(M.checkDesign(components, d).join("\n"), /Video slide, Frame: choose an option/);
});

test("roleOptions switches off failing colors with the reason", () => {
  const options = M.roleOptions(components, design(), "heading");
  assert.equal(options.find((o) => o.id === "mauve").ok, true);
  assert.match(options.find((o) => o.id === "gold").reason, /not used for text/);
  assert.match(options.find((o) => o.id === "muted").reason, /needs 3:1/);
});

test("designCss declares role variables, inks and rgb triples, then base and options", () => {
  const css = M.designCss(components, design());
  assert.match(css, /--role-heading: var\(--mauve\);/);
  assert.match(css, /--role-accent-rgb: 167, 37, 63;/);
  assert.match(css, /--role-button-ink: var\(--light\);/);
  assert.match(css, /\.sidebar \{ background: var\(--role-sidebar\);/);
  assert.match(css, /linear-gradient\(135deg, var\(--role-title-background\), var\(--role-title-background-end\)\)/);
  assert.doesNotMatch(css, /#[0-9a-f]{6}/i);
  assert.ok(css.endsWith("\n"));
});

test("similarity ranks lessons by shared dimensions", () => {
  const d = design();
  const fingerprints = { lessons: [
    { id: "a", title: "A", roles: { ...d.roles, heading: "primary" }, fontPairing: d.fontPairing, background: "plain" },
    { id: "b", title: "B", roles: { ...d.roles }, fontPairing: d.fontPairing, background: "dot-grid" }
  ] };
  const ranked = M.similarity(fingerprints, d);
  assert.equal(ranked[0].id, "b");
  assert.equal(ranked[0].shared, 11);
  assert.equal(ranked[0].total, 11);
  assert.equal(ranked[1].shared, 9);
});
```

- [ ] **Step 2: Run the tests and watch them fail**

Run: `node --test scripts/test-bespoke-design-model.mjs`
Expected: FAIL, `Cannot find module '.../bespoke/design-model.mjs'`.

- [ ] **Step 3: Write the module**

Create `bespoke/design-model.mjs`:

```js
/**
 * BeSpoke v2 design model. Pure functions; the caller passes in the parsed
 * SPOKES Builder/role-components.json as `components`.
 * scripts/bespoke_roles.py mirrors every function; scripts/test_bespoke_roles.py
 * runs both and compares the results.
 */

/** Roles the similarity meter can measure in a released lesson. */
export const MEASURED_ROLES = Object.freeze([
  "sidebar", "titleBackground", "titleText", "subtitle", "contentBackground", "heading", "body", "accent", "button"
]);

export function kebab(id) {
  return id.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
}

function hexToRgb(hex) {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
}

function rgbToHex(rgb) {
  return `#${rgb.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

function channel(value) {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map(channel);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a, b) {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (high + 0.05) / (low + 0.05);
}

function color(components, id) {
  const found = components.palette.find((c) => c.id === id);
  if (!found) throw new Error(`Unknown palette color ${id}`);
  return found;
}

/** White or Royal, whichever reads better on this palette color. */
export function inkFor(components, id) {
  const hex = color(components, id).hex;
  return contrast(color(components, "light").hex, hex) >= contrast(color(components, "royal").hex, hex) ? "light" : "royal";
}

function blend(fgHex, bgHex, alpha) {
  const fg = hexToRgb(fgHex);
  const bg = hexToRgb(bgHex);
  return rgbToHex(fg.map((v, i) => Math.floor(v * alpha + bg[i] * (1 - alpha) + 0.5)));
}

export function resolveColor(components, design, ref) {
  if (ref && typeof ref === "object") {
    return blend(resolveColor(components, design, ref.tint), resolveColor(components, design, ref.over), ref.alpha);
  }
  const [kind, name] = String(ref).split(":");
  if (kind === "palette") return color(components, name).hex;
  if (kind === "role") return color(components, design.roles[name]).hex;
  if (kind === "ink") return color(components, inkFor(components, design.roles[name])).hex;
  throw new Error(`Unknown color reference ${ref}`);
}

function describe(components, design, ref) {
  if (ref && typeof ref === "object") return `${describe(components, design, ref.tint)} tint`;
  const [kind, name] = String(ref).split(":");
  if (kind === "palette") return color(components, name).name;
  if (kind === "role") return color(components, design.roles[name]).name;
  return color(components, inkFor(components, design.roles[name])).name;
}

/** Colors a role may use: the team's picks plus the always-available neutrals. */
export function roleChoices(components, design) {
  const { primary = [], secondary = [] } = design.palette || {};
  return [...new Set([...primary, ...secondary, ...components.neutrals])];
}

function rolePairs(role) {
  const pairs = (role.pairs || []).map((p) => ({ fg: p.fg || `role:${role.id}`, bg: p.bg, min: p.min }));
  if (role.ink) pairs.push({ fg: `ink:${role.id}`, bg: `role:${role.id}`, min: 4.5 });
  return pairs;
}

function pairProblem(components, design, pair, label) {
  const ratio = contrast(resolveColor(components, design, pair.fg), resolveColor(components, design, pair.bg));
  if (ratio >= pair.min) return null;
  return `${label}: ${ratio.toFixed(2)}:1 on ${describe(components, design, pair.bg)}, needs ${pair.min}:1`;
}

function roleProblem(components, design, role) {
  const value = design.roles?.[role.id];
  if (!value) return `${role.label}: choose a color.`;
  if (!(role.only || roleChoices(components, design)).includes(value)) {
    return `${role.label}: ${color(components, value).name} is not one of the available colors.`;
  }
  if (role.kind === "text" && components.notText.includes(value)) {
    return `${role.label}: ${color(components, value).name} is not used for text (SPOKES rule).`;
  }
  return null;
}

/** Every rule a v2 design must meet. Empty when valid. */
export function checkDesign(components, design) {
  const ids = new Set(components.palette.map((c) => c.id));
  const { primary = [], secondary = [] } = design.palette || {};
  const picked = [...primary, ...secondary];
  const errors = [];
  if (primary.length !== 2) errors.push("Pick exactly two primary colors.");
  if (secondary.length > 3) errors.push("Pick at most three secondary colors.");
  if (new Set(picked).size !== picked.length) errors.push("A color is picked twice.");
  for (const id of picked) if (!ids.has(id)) errors.push(`${id} is not a SPOKES palette color.`);
  if (errors.length) return errors;

  for (const role of components.roles) {
    const problem = roleProblem(components, design, role);
    if (problem) errors.push(problem);
  }
  if (errors.length) return errors;

  for (const role of components.roles) {
    for (const pair of rolePairs(role)) {
      const problem = pairProblem(components, design, pair, role.label);
      if (problem) errors.push(problem);
    }
  }
  for (const group of components.slides.groups) {
    for (const decision of group.decisions) {
      const option = decision.options.find((o) => o.id === design.slides?.[group.id]?.[decision.id]);
      if (!option) {
        errors.push(`${group.label}, ${decision.label}: choose an option.`);
        continue;
      }
      for (const pair of option.pairs) {
        const problem = pairProblem(components, design, pair, `${group.label}, ${option.label}`);
        if (problem) errors.push(problem);
      }
      for (const rule of option.excludes || []) {
        if (design.slides[group.id][rule.decision] !== rule.option) continue;
        const other = group.decisions.find((d) => d.id === rule.decision).options.find((o) => o.id === rule.option);
        errors.push(`${group.label}: ${option.label} can't be combined with ${other.label}.`);
      }
    }
  }
  return errors;
}

/** The colors offered for one role, each switched off with its reason when it would break a rule. */
export function roleOptions(components, design, roleId) {
  const role = components.roles.find((r) => r.id === roleId);
  return (role.only || roleChoices(components, design)).map((id) => {
    const name = color(components, id).name;
    if (role.kind === "text" && components.notText.includes(id)) {
      return { id, name, ok: false, reason: "not used for text (SPOKES rule)" };
    }
    const trial = { ...design, roles: { ...design.roles, [roleId]: id } };
    const related = components.roles.filter((r) => r.id === roleId || rolePairs(r).some((p) => JSON.stringify(p).includes(`role:${roleId}`)));
    for (const other of related) {
      for (const pair of rolePairs(other)) {
        const problem = pairProblem(components, trial, pair, other.label);
        if (problem) return { id, name, ok: false, reason: problem.slice(other.label.length + 2) };
      }
    }
    return { id, name, ok: true, reason: "" };
  });
}

function roleVariables(components, design) {
  const lines = [];
  for (const role of components.roles) {
    const id = design.roles[role.id];
    const name = kebab(role.id);
    lines.push(`--role-${name}: var(--${id});`, `--role-${name}-rgb: ${hexToRgb(color(components, id).hex).join(", ")};`);
    if (role.ink) {
      const ink = inkFor(components, id);
      lines.push(`--role-${name}-ink: var(--${ink});`, `--role-${name}-ink-rgb: ${hexToRgb(color(components, ink).hex).join(", ")};`);
    }
  }
  return lines;
}

/** Role variables, the base rules, then each chosen option in data-file order. */
export function designCss(components, design) {
  const blocks = [`body {\n${roleVariables(components, design).map((l) => `  ${l}`).join("\n")}\n}`, components.slides.base.trim()];
  for (const group of components.slides.groups) {
    for (const decision of group.decisions) {
      const option = decision.options.find((o) => o.id === design.slides[group.id][decision.id]);
      if (option.css.trim()) blocks.push(option.css.trim());
    }
  }
  return `${blocks.join("\n\n")}\n`;
}

/** Released lessons ranked by how many of the 11 measured dimensions they share with a design. */
export function similarity(fingerprints, design) {
  return fingerprints.lessons
    .map((lesson) => {
      const matches = MEASURED_ROLES.filter((r) => lesson.roles[r] && lesson.roles[r] === design.roles[r]);
      if (lesson.fontPairing === design.fontPairing) matches.push("fontPairing");
      if (lesson.background === design.slides?.background?.pattern) matches.push("background");
      return { id: lesson.id, title: lesson.title, shared: matches.length, total: MEASURED_ROLES.length + 2, matches };
    })
    .sort((a, b) => b.shared - a.shared || a.id.localeCompare(b.id));
}
```

- [ ] **Step 4: Run the tests and watch them pass**

Run: `node --test scripts/test-bespoke-design-model.mjs`
Expected: `ℹ pass 11`, `ℹ fail 0`. If "the default design is valid" fails, the failure message names the rule; fix the value in `defaults`, not the rule.

- [ ] **Step 5: Wire into the quality gate and commit**

In `scripts/quality.sh`, extend the existing `node --test` line (currently `node --test scripts/test-bespoke-handoff.mjs scripts/test-bespoke-provision.mjs scripts/test-bespoke-brief.mjs`) by appending ` scripts/test-bespoke-design-model.mjs`.

```bash
git add bespoke/design-model.mjs scripts/test-bespoke-design-model.mjs scripts/quality.sh
git commit -m "feat(bespoke): pure JS design model for v2 roles, contrast, CSS and similarity"
```

---

### Task 3: Python mirror and parity

**Files:**
- Create: `scripts/bespoke_roles.py`
- Modify: `scripts/test_bespoke_roles.py` (append two test classes)

**Interfaces:**
- Consumes: the data file (Task 1); the JS module (Task 2) for parity.
- Produces: `load_components() -> dict`, `contrast(a: str, b: str) -> float`, `ink_for(components, id) -> str`, `resolve_color(components, design, ref) -> str`, `check_design(components, design) -> list[str]`, `design_css(components, design) -> str`. Same outputs as the JS functions of the same names.

- [ ] **Step 1: Write the failing tests**

Append to `scripts/test_bespoke_roles.py` (before the `if __name__` line):

```python
import copy
import subprocess
import sys

sys.path.insert(0, str(ROOT / "scripts"))


def js(expression: str, design: dict):
    """Evaluate a design-model.mjs expression in Node. `M`, `components` and `design` are in scope."""
    script = (
        "import * as M from './bespoke/design-model.mjs';"
        "import fs from 'node:fs';"
        "const components = JSON.parse(fs.readFileSync('SPOKES Builder/role-components.json', 'utf8'));"
        f"const design = {json.dumps(design)};"
        f"process.stdout.write(JSON.stringify({expression}));"
    )
    out = subprocess.run(["node", "--input-type=module", "-e", script], cwd=ROOT, capture_output=True, text=True, check=True)
    return json.loads(out.stdout)


class PythonRulesTests(unittest.TestCase):
    def setUp(self) -> None:
        import bespoke_roles
        self.roles = bespoke_roles
        self.design = copy.deepcopy(COMPONENTS["defaults"])

    def test_default_design_is_valid(self) -> None:
        self.assertEqual(self.roles.check_design(COMPONENTS, self.design), [])

    def test_banned_text_color_is_rejected(self) -> None:
        self.design["roles"]["body"] = "gold"
        self.assertTrue(any("not one of the available colors" in e for e in self.roles.check_design(COMPONENTS, self.design)))


class ParityTests(unittest.TestCase):
    """The browser, the Netlify service and the Python tools must agree exactly."""

    def setUp(self) -> None:
        import bespoke_roles
        self.roles = bespoke_roles
        self.base = copy.deepcopy(COMPONENTS["defaults"])

    def variants(self):
        yield self.base
        for heading in ("gray", "offwhite", "dark"):
            design = copy.deepcopy(self.base)
            design["roles"]["heading"] = heading
            design["palette"]["secondary"] = ["offwhite"]
            yield design
        solid = copy.deepcopy(self.base)
        solid["slides"]["activity"]["colors"] = "solid"
        solid["slides"]["title"]["layout"] = "split"
        solid["slides"]["list"]["look"] = "filled"
        yield solid
        clash = copy.deepcopy(self.base)
        clash["slides"]["title"]["layout"] = "split"
        clash["slides"]["title"]["colors"] = "light"
        clash["slides"]["activity"]["layout"] = "banner"
        clash["slides"]["activity"]["label"] = "pill"
        yield clash

    def test_contrast_matches_js_for_every_palette_pair(self) -> None:
        hexes = [c["hex"] for c in COMPONENTS["palette"]]
        expected = js("components.palette.flatMap(a => components.palette.map(b => M.contrast(a.hex, b.hex)))", self.base)
        actual = [self.roles.contrast(a, b) for a in hexes for b in hexes]
        for e, a in zip(expected, actual):
            self.assertAlmostEqual(e, a, places=12)

    def test_inks_match_js(self) -> None:
        expected = js("components.palette.map(c => M.inkFor(components, c.id))", self.base)
        self.assertEqual([self.roles.ink_for(COMPONENTS, c["id"]) for c in COMPONENTS["palette"]], expected)

    def test_tint_resolution_matches_js(self) -> None:
        ref = {"tint": "role:accent", "alpha": 0.1, "over": "role:contentBackground"}
        self.assertEqual(self.roles.resolve_color(COMPONENTS, self.base, ref), js(f"M.resolveColor(components, design, {json.dumps(ref)})", self.base))

    def test_check_design_matches_js(self) -> None:
        for design in self.variants():
            self.assertEqual(self.roles.check_design(COMPONENTS, design), js("M.checkDesign(components, design)", design))

    def test_design_css_matches_js_byte_for_byte(self) -> None:
        for design in self.variants():
            if self.roles.check_design(COMPONENTS, design):
                continue
            self.assertEqual(self.roles.design_css(COMPONENTS, design), js("M.designCss(components, design)", design))
```

- [ ] **Step 2: Run the tests and watch them fail**

Run: `python3 -m unittest scripts/test_bespoke_roles.py -v`
Expected: ERROR, `ModuleNotFoundError: No module named 'bespoke_roles'`.

- [ ] **Step 3: Write the module**

Create `scripts/bespoke_roles.py`:

```python
"""Python mirror of bespoke/design-model.mjs. Keep the two in step:
scripts/test_bespoke_roles.py runs both and compares the results."""
from __future__ import annotations

import json
import math
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
COMPONENTS_PATH = ROOT / "SPOKES Builder/role-components.json"


def load_components() -> dict:
    return json.loads(COMPONENTS_PATH.read_text(encoding="utf-8"))


def kebab(role_id: str) -> str:
    return re.sub(r"[A-Z]", lambda m: "-" + m.group(0).lower(), role_id)


def _rgb(hex_color: str) -> list[int]:
    return [int(hex_color[i:i + 2], 16) for i in (1, 3, 5)]


def _hex(rgb: list[int]) -> str:
    return "#" + "".join(f"{v:02x}" for v in rgb)


def _channel(value: int) -> float:
    c = value / 255
    return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4


def _luminance(hex_color: str) -> float:
    r, g, b = (_channel(v) for v in _rgb(hex_color))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast(a: str, b: str) -> float:
    high, low = sorted((_luminance(a), _luminance(b)), reverse=True)
    return (high + 0.05) / (low + 0.05)


def _color(components: dict, color_id: str) -> dict:
    for entry in components["palette"]:
        if entry["id"] == color_id:
            return entry
    raise ValueError(f"Unknown palette color {color_id}")


def ink_for(components: dict, color_id: str) -> str:
    hex_color = _color(components, color_id)["hex"]
    light = contrast(_color(components, "light")["hex"], hex_color)
    royal = contrast(_color(components, "royal")["hex"], hex_color)
    return "light" if light >= royal else "royal"


def _blend(fg: str, bg: str, alpha: float) -> str:
    f, b = _rgb(fg), _rgb(bg)
    return _hex([int(math.floor(v * alpha + b[i] * (1 - alpha) + 0.5)) for i, v in enumerate(f)])


def resolve_color(components: dict, design: dict, ref) -> str:
    if isinstance(ref, dict):
        return _blend(resolve_color(components, design, ref["tint"]), resolve_color(components, design, ref["over"]), ref["alpha"])
    kind, name = str(ref).split(":")
    if kind == "palette":
        return _color(components, name)["hex"]
    if kind == "role":
        return _color(components, design["roles"][name])["hex"]
    if kind == "ink":
        return _color(components, ink_for(components, design["roles"][name]))["hex"]
    raise ValueError(f"Unknown color reference {ref}")


def _describe(components: dict, design: dict, ref) -> str:
    if isinstance(ref, dict):
        return f"{_describe(components, design, ref['tint'])} tint"
    kind, name = str(ref).split(":")
    if kind == "palette":
        return _color(components, name)["name"]
    if kind == "role":
        return _color(components, design["roles"][name])["name"]
    return _color(components, ink_for(components, design["roles"][name]))["name"]


def role_choices(components: dict, design: dict) -> list[str]:
    palette = design.get("palette") or {}
    seen: list[str] = []
    for color_id in [*palette.get("primary", []), *palette.get("secondary", []), *components["neutrals"]]:
        if color_id not in seen:
            seen.append(color_id)
    return seen


def _role_pairs(role: dict) -> list[dict]:
    pairs = [{"fg": p.get("fg", f"role:{role['id']}"), "bg": p["bg"], "min": p["min"]} for p in role.get("pairs", [])]
    if role.get("ink"):
        pairs.append({"fg": f"ink:{role['id']}", "bg": f"role:{role['id']}", "min": 4.5})
    return pairs


def _format_ratio(ratio: float) -> str:
    # Match JS Number.prototype.toFixed(2): round half away from zero on the decimal value.
    return f"{math.floor(ratio * 100 + 0.5) / 100:.2f}"


def _format_min(value: float) -> str:
    return str(int(value)) if float(value).is_integer() else str(value)


def _pair_problem(components: dict, design: dict, pair: dict, label: str) -> str | None:
    ratio = contrast(resolve_color(components, design, pair["fg"]), resolve_color(components, design, pair["bg"]))
    if ratio >= pair["min"]:
        return None
    return f"{label}: {_format_ratio(ratio)}:1 on {_describe(components, design, pair['bg'])}, needs {_format_min(pair['min'])}:1"


def _role_problem(components: dict, design: dict, role: dict) -> str | None:
    value = (design.get("roles") or {}).get(role["id"])
    if not value:
        return f"{role['label']}: choose a color."
    if value not in (role.get("only") or role_choices(components, design)):
        return f"{role['label']}: {_color(components, value)['name']} is not one of the available colors."
    if role["kind"] == "text" and value in components["notText"]:
        return f"{role['label']}: {_color(components, value)['name']} is not used for text (SPOKES rule)."
    return None


def check_design(components: dict, design: dict) -> list[str]:
    ids = {c["id"] for c in components["palette"]}
    palette = design.get("palette") or {}
    primary, secondary = palette.get("primary", []), palette.get("secondary", [])
    picked = [*primary, *secondary]
    errors: list[str] = []
    if len(primary) != 2:
        errors.append("Pick exactly two primary colors.")
    if len(secondary) > 3:
        errors.append("Pick at most three secondary colors.")
    if len(set(picked)) != len(picked):
        errors.append("A color is picked twice.")
    errors += [f"{i} is not a SPOKES palette color." for i in picked if i not in ids]
    if errors:
        return errors

    errors = [p for p in (_role_problem(components, design, r) for r in components["roles"]) if p]
    if errors:
        return errors

    for role in components["roles"]:
        for pair in _role_pairs(role):
            problem = _pair_problem(components, design, pair, role["label"])
            if problem:
                errors.append(problem)
    for group in components["slides"]["groups"]:
        for decision in group["decisions"]:
            chosen = ((design.get("slides") or {}).get(group["id"]) or {}).get(decision["id"])
            option = next((o for o in decision["options"] if o["id"] == chosen), None)
            if option is None:
                errors.append(f"{group['label']}, {decision['label']}: choose an option.")
                continue
            for pair in option["pairs"]:
                problem = _pair_problem(components, design, pair, f"{group['label']}, {option['label']}")
                if problem:
                    errors.append(problem)
            for rule in option.get("excludes", []):
                if design["slides"][group["id"]].get(rule["decision"]) != rule["option"]:
                    continue
                decision_other = next(d for d in group["decisions"] if d["id"] == rule["decision"])
                other = next(o for o in decision_other["options"] if o["id"] == rule["option"])
                errors.append(f"{group['label']}: {option['label']} can't be combined with {other['label']}.")
    return errors


def _role_variables(components: dict, design: dict) -> list[str]:
    lines: list[str] = []
    for role in components["roles"]:
        color_id = design["roles"][role["id"]]
        name = kebab(role["id"])
        rgb = ", ".join(str(v) for v in _rgb(_color(components, color_id)["hex"]))
        lines += [f"--role-{name}: var(--{color_id});", f"--role-{name}-rgb: {rgb};"]
        if role.get("ink"):
            ink = ink_for(components, color_id)
            ink_rgb = ", ".join(str(v) for v in _rgb(_color(components, ink)["hex"]))
            lines += [f"--role-{name}-ink: var(--{ink});", f"--role-{name}-ink-rgb: {ink_rgb};"]
    return lines


def design_css(components: dict, design: dict) -> str:
    variables = "\n".join(f"  {line}" for line in _role_variables(components, design))
    blocks = [f"body {{\n{variables}\n}}", components["slides"]["base"].strip()]
    for group in components["slides"]["groups"]:
        for decision in group["decisions"]:
            option = next(o for o in decision["options"] if o["id"] == design["slides"][group["id"]][decision["id"]])
            if option["css"].strip():
                blocks.append(option["css"].strip())
    return "\n\n".join(blocks) + "\n"
```

JS `toFixed(2)` and Python `f"{x:.2f}"` round differently on exact halves. `_format_ratio` rounds half up like JS does for these positive values. The parity test covers it.

- [ ] **Step 4: Run the tests and watch them pass**

Run: `python3 -m unittest scripts/test_bespoke_roles.py -v`
Expected: 14 tests, `OK`. If `test_check_design_matches_js` fails on a ratio string, compare the two messages. The fix belongs in `_format_ratio` or `_format_min`, never in the JS.

- [ ] **Step 5: Commit**

`quality.sh` already runs every `scripts/test_bespoke*.py`, so no wiring is needed.

```bash
git add scripts/bespoke_roles.py scripts/test_bespoke_roles.py
git commit -m "feat(bespoke): Python mirror of the v2 design model with JS parity tests"
```

---

### Task 4: v2 schema and Python validation

**Files:**
- Modify: `scripts/generate-selection-schema.py` (add `build_schema_v2`; `main` writes and checks both files)
- Create (generated): `bespoke/selection-v2.schema.json`
- Modify: `scripts/validate-bespoke-selection.py` (array keywords; `schema_for`; v2 custom checks)
- Modify: `scripts/bespoke_support.py` (`require_valid_selection` picks the schema)
- Create: `scripts/test-fixtures/bespoke/selection-v2-money-management.json`, `scripts/test-fixtures/bespoke/selection-v2-invalid-contrast.json`
- Test: `scripts/test_bespoke_selection.py` (append)

**Interfaces:**
- Consumes: `bespoke_roles.load_components`, `bespoke_roles.check_design` (Task 3).
- Produces: `bespoke/selection-v2.schema.json` (`$id` `https://spokes.local/schemas/bespoke-selection/v2`, `const` `bespoke-selection/v2`); `validate-bespoke-selection.schema_for(payload) -> dict`; `require_valid_selection(payload)` accepting both versions.

- [ ] **Step 1: Create the fixtures**

Create `scripts/test-fixtures/bespoke/selection-v2-money-management.json`:

```json
{
  "schema": "bespoke-selection/v2",
  "submittedAt": "2026-09-23T15:00:00.000Z",
  "date": "2026-09-23",
  "libraryCatalogVersion": "2.0.0",
  "lesson": { "id": "money-management", "title": "Money Management", "displayTitle": "Money Management", "subtitle": "Skills for Life" },
  "team": { "name": "Money Management Team", "spokesperson": { "name": "Sample Spokesperson", "email": "sample@example.org" } },
  "design": {
    "palette": { "primary": ["dark", "mauve"], "secondary": ["gold"] },
    "roles": {
      "sidebar": "dark", "titleBackground": "dark", "titleBackgroundEnd": "mauve", "titleText": "light", "subtitle": "light",
      "contentBackground": "light", "heading": "mauve", "body": "royal", "accent": "mauve", "button": "mauve", "dividerBackground": "mauve"
    },
    "fontPairing": "dm-serif-display-outfit",
    "slides": {
      "background": { "pattern": "dot-grid" },
      "title": { "colors": "gradient", "logo": "above", "layout": "center" },
      "divider": { "colors": "solid", "watermark": "show", "layout": "center" },
      "video": { "colors": "light", "frame": "accent", "titleStyle": "regular", "layout": "stacked" },
      "list": { "look": "rail", "layout": "two", "titleStyle": "regular", "colors": "light" },
      "activity": { "colors": "tinted", "label": "caps", "layout": "box" }
    }
  },
  "sampleContent": { "bullets": "1. Name one money goal", "mythReality": "Myth: Budgets are only for people in debt." },
  "unspoken": ""
}
```

Create `scripts/test-fixtures/bespoke/selection-v2-invalid-contrast.json` as a copy with `"heading": "offwhite"` and `"secondary": ["offwhite"]` (Silver on White fails 3:1):

```bash
python3 - <<'EOF'
import json
p = "scripts/test-fixtures/bespoke/selection-v2-money-management.json"
d = json.load(open(p))
d["design"]["palette"]["secondary"] = ["offwhite"]
d["design"]["roles"]["heading"] = "offwhite"
json.dump(d, open("scripts/test-fixtures/bespoke/selection-v2-invalid-contrast.json", "w"), indent=2)
open("scripts/test-fixtures/bespoke/selection-v2-invalid-contrast.json", "a").write("\n")
EOF
```

- [ ] **Step 2: Write the failing tests**

Append to class `SelectionSchemaTests` in `scripts/test_bespoke_selection.py`:

```python
    def run_validator(self, *args: str) -> subprocess.CompletedProcess:
        return subprocess.run(
            [sys.executable, str(SCRIPTS / "validate-bespoke-selection.py"), *args],
            cwd=REPO_ROOT, capture_output=True, text=True,
        )

    def test_v2_fixture_passes(self) -> None:
        result = self.run_validator(str(FIXTURES / "selection-v2-money-management.json"))
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_v2_contrast_failure_names_the_rule(self) -> None:
        result = self.run_validator(str(FIXTURES / "selection-v2-invalid-contrast.json"))
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("Slide headings:", result.stdout)
        self.assertIn("needs 3:1", result.stdout)

    def test_v2_rejects_three_primaries_and_unknown_option(self) -> None:
        payload = json.loads((FIXTURES / "selection-v2-money-management.json").read_text())
        payload["design"]["palette"]["primary"] = ["dark", "mauve", "gold"]
        payload["design"]["slides"]["video"]["frame"] = "neon"
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "selection.json"
            path.write_text(json.dumps(payload))
            result = self.run_validator(str(path))
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("$.design.palette.primary: more than 2 items", result.stdout)
        self.assertIn("$.design.slides.video.frame", result.stdout)

    def test_v1_fixture_still_passes_through_dispatch(self) -> None:
        sys.path.insert(0, str(SCRIPTS))
        from bespoke_support import require_valid_selection
        require_valid_selection(json.loads((FIXTURES / "selection-money-management.json").read_text()))
        require_valid_selection(json.loads((FIXTURES / "selection-v2-money-management.json").read_text()))
```

- [ ] **Step 3: Run the tests and watch them fail**

Run: `python3 -m unittest scripts/test_bespoke_selection.py -v`
Expected: the four new tests FAIL. The v2 fixture is rejected by the v1 schema with `expected const 'bespoke-selection/v1'`.

- [ ] **Step 4: Add the v2 schema to the generator**

In `scripts/generate-selection-schema.py`, add after the existing constants:

```python
SCHEMA_V2_PATH = REPO_ROOT / "bespoke" / "selection-v2.schema.json"
COMPONENTS = REPO_ROOT / "SPOKES Builder" / "role-components.json"
```

Add this function after `build_schema`:

```python
def build_schema_v2(components: dict, meta: dict, v1: dict) -> dict:
    """v2 payload: same envelope as v1, `design` replaces `theme` and `presetId`."""
    palette_ids = [c["id"] for c in components["palette"]]
    font_ids = [str(f["id"]) for f in meta.get("fontPairings") or [] if f.get("id")]
    slides = {
        group["id"]: {
            "type": "object",
            "additionalProperties": False,
            "required": [d["id"] for d in group["decisions"]],
            "properties": {d["id"]: {"type": "string", "enum": [o["id"] for o in d["options"]]} for d in group["decisions"]},
        }
        for group in components["slides"]["groups"]
    }
    props = v1["properties"]
    return {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": "https://spokes.local/schemas/bespoke-selection/v2",
        "title": "Bespoke selection (bespoke-selection/v2)",
        "description": (
            "BeSpoke slide-builder payload. Enums are generated from SPOKES Builder/role-components.json "
            "and bespoke/catalog.json by scripts/generate-selection-schema.py; do not hand-edit. "
            "Contrast and role rules are checked by scripts/bespoke_roles.py and bespoke/design-model.mjs."
        ),
        "type": "object",
        "additionalProperties": False,
        "required": ["schema", "date", "lesson", "team", "design"],
        "properties": {
            "schema": {"type": "string", "const": "bespoke-selection/v2"},
            "submittedAt": props["submittedAt"],
            "date": props["date"],
            "libraryCatalogVersion": props["libraryCatalogVersion"],
            "lesson": props["lesson"],
            "team": props["team"],
            "design": {
                "type": "object",
                "additionalProperties": False,
                "required": ["palette", "roles", "fontPairing", "slides"],
                "properties": {
                    "palette": {
                        "type": "object",
                        "additionalProperties": False,
                        "required": ["primary", "secondary"],
                        "properties": {
                            "primary": {"type": "array", "items": {"type": "string", "enum": palette_ids}, "minItems": 2, "maxItems": 2, "uniqueItems": True},
                            "secondary": {"type": "array", "items": {"type": "string", "enum": palette_ids}, "maxItems": 3, "uniqueItems": True},
                        },
                    },
                    "roles": {
                        "type": "object",
                        "additionalProperties": False,
                        "required": [r["id"] for r in components["roles"]],
                        "properties": {r["id"]: {"type": "string", "enum": palette_ids} for r in components["roles"]},
                    },
                    "fontPairing": {"type": "string", "enum": font_ids},
                    "slides": {
                        "type": "object",
                        "additionalProperties": False,
                        "required": list(slides),
                        "properties": slides,
                    },
                },
            },
            "sampleContent": props["sampleContent"],
            "unspoken": props["unspoken"],
        },
        "x-bespoke": {
            "schemaId": "bespoke-selection/v2",
            "generatedFrom": {"roleComponents": "SPOKES Builder/role-components.json", "roleComponentsVersion": components["version"], "metaCatalog": "bespoke/catalog.json"},
        },
    }
```

Replace the body of `main` after `args = parser.parse_args(argv)` with:

```python
    library = load_json(LIBRARY_CATALOG)
    meta = load_json(META_CATALOG)
    v1 = build_schema(library, meta)
    targets = [(args.out, dump_schema(v1))]
    if args.out == SCHEMA_PATH:
        targets.append((SCHEMA_V2_PATH, dump_schema(build_schema_v2(load_json(COMPONENTS), meta, v1))))

    if args.check:
        stale = [path for path, text in targets if not path.exists() or path.read_text(encoding="utf-8") != text]
        for path in stale:
            print(f"ERROR: {path.relative_to(REPO_ROOT)} is stale. Run: python3 scripts/generate-selection-schema.py", file=sys.stderr)
        if stale:
            return 1
        for path, _ in targets:
            print(f"selection schema up to date: {path.relative_to(REPO_ROOT)}")
        return 0

    for path, text in targets:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text, encoding="utf-8")
        try:
            rel = path.relative_to(REPO_ROOT)
        except ValueError:
            rel = path
        print(f"Wrote {rel}")
    return 0
```

Run: `python3 scripts/generate-selection-schema.py`
Expected: `Wrote bespoke/selection.schema.json` and `Wrote bespoke/selection-v2.schema.json`. `git diff bespoke/selection.schema.json` must be empty.

- [ ] **Step 5: Teach the Python validator arrays and v2**

In `scripts/validate-bespoke-selection.py`, add array handling to `validate_against_schema`, directly before `if isinstance(instance, dict):`:

```python
    if isinstance(instance, list):
        if "minItems" in schema and len(instance) < schema["minItems"]:
            errors.append(f"{path}: fewer than {schema['minItems']} items")
        if "maxItems" in schema and len(instance) > schema["maxItems"]:
            errors.append(f"{path}: more than {schema['maxItems']} items")
        if schema.get("uniqueItems") and len({json.dumps(i, sort_keys=True) for i in instance}) != len(instance):
            errors.append(f"{path}: items must be unique")
        if isinstance(schema.get("items"), dict):
            for index, item in enumerate(instance):
                errors.extend(validate_against_schema(item, schema["items"], f"{path}[{index}]"))
```

Check that `type_ok` accepts `"array"`. If it doesn't, add `"array": list` to the type map it uses.

Add after `SCHEMA_PATH`:

```python
SCHEMA_V2_PATH = REPO_ROOT / "bespoke" / "selection-v2.schema.json"


def schema_for(payload: Any) -> dict:
    """The committed schema matching the payload's own schema id (v1 when absent or unknown)."""
    version = payload.get("schema") if isinstance(payload, dict) else None
    return load_json(SCHEMA_V2_PATH if version == "bespoke-selection/v2" else SCHEMA_PATH)
```

At the top of `custom_checks`, branch for v2 before the v1 card checks:

```python
    if payload.get("schema") == "bespoke-selection/v2":
        sys.path.insert(0, str(REPO_ROOT / "scripts"))
        from bespoke_roles import check_design, load_components
        errors.extend(check_design(load_components(), payload["design"]))
        try:
            date.fromisoformat(payload["date"])
        except ValueError:
            errors.append("$.date: must be a real calendar date")
        if not payload["team"]["spokesperson"]["name"].strip():
            errors.append("$.team.spokesperson.name: must not be blank")
        if not payload["lesson"]["title"].strip():
            errors.append("$.lesson.title: must not be blank")
        return errors, warnings
```

In `main`, stop loading one schema for every file. Replace `errors, warnings = validate_payload(payload, schema)` with:

```python
        errors, warnings = validate_payload(payload, schema if args.schema != SCHEMA_PATH else schema_for(payload))
```

- [ ] **Step 6: Make the shared helper dispatch**

In `scripts/bespoke_support.py`, replace the body of `require_valid_selection`:

```python
def require_valid_selection(payload: object) -> None:
    errors, warnings = _validator.validate_payload(payload, _validator.schema_for(payload))
    if errors:
        raise ValueError("Invalid Bespoke selection:\n" + "\n".join(errors))
    # Warnings are surfaced by the validation CLI; never rewrite older payloads.
```

- [ ] **Step 7: Run the tests and watch them pass**

Run: `python3 -m unittest discover -s scripts -p 'test_bespoke*.py' -v`
Expected: all tests pass, including the four new ones.

- [ ] **Step 8: Validate v2 fixtures in the quality gate and commit**

In `scripts/quality.sh`, next to the existing `--expect-fail` line for `selection-invalid-slug.json`, add:

```bash
python3 scripts/validate-bespoke-selection.py --expect-fail scripts/test-fixtures/bespoke/selection-v2-invalid-contrast.json
```

The default discovery already picks up `selection-v2-money-management.json` and skips names containing `invalid`.

Run: `bash scripts/quality.sh`
Expected: ends with `quality.sh: all checks passed`.

```bash
git add scripts/generate-selection-schema.py bespoke/selection-v2.schema.json scripts/validate-bespoke-selection.py scripts/bespoke_support.py scripts/test-fixtures/bespoke/selection-v2-*.json scripts/test_bespoke_selection.py scripts/quality.sh
git commit -m "feat(bespoke): selection v2 schema, array validation and v1/v2 dispatch in Python"
```

---

### Task 5: Netlify service accepts v2

**Files:**
- Modify: `netlify/functions/_shared/selection.mjs`
- Test: `scripts/test-bespoke-handoff.mjs` (append)

**Interfaces:**
- Consumes: `bespoke/selection-v2.schema.json` (Task 4), `bespoke/design-model.mjs` `checkDesign` (Task 2), `SPOKES Builder/role-components.json`.
- Produces: `selectionErrors(selection, lessonId, forSend)` accepting both versions. Signature unchanged.

- [ ] **Step 1: Write the failing tests**

Append to `scripts/test-bespoke-handoff.mjs`. The file already imports `fs`, `path`, `test`, `assert` and defines `root`. Add this import to the file's import list:

```js
import { selectionErrors } from '../netlify/functions/_shared/selection.mjs';
```

Then append:

```js
const fixtureV2 = JSON.parse(fs.readFileSync(path.join(root, 'scripts/test-fixtures/bespoke/selection-v2-money-management.json'), 'utf8'));

test('the service accepts a valid v2 design', () => {
  assert.deepEqual(selectionErrors(fixtureV2, 'money-management'), []);
});

test('the service rejects v2 contrast failures with the same message as Python', () => {
  const bad = structuredClone(fixtureV2);
  bad.design.palette.secondary = ['offwhite'];
  bad.design.roles.heading = 'offwhite';
  assert.match(selectionErrors(bad, 'money-management').join('\n'), /Slide headings: 1\.\d\d:1 on White, needs 3:1/);
});

test('the service checks v2 array limits and unknown fields', () => {
  const bad = structuredClone(fixtureV2);
  bad.design.palette.primary = ['dark'];
  bad.design.extra = true;
  const errors = selectionErrors(bad, 'money-management').join('\n');
  assert.match(errors, /\$\.design\.palette\.primary: too few items/);
  assert.match(errors, /\$\.design\.extra: unknown field/);
});
```

- [ ] **Step 2: Run the tests and watch them fail**

Run: `node --test scripts/test-bespoke-handoff.mjs`
Expected: the three new tests FAIL with `$.schema: wrong schema`.

- [ ] **Step 3: Implement dispatch in the service**

In `netlify/functions/_shared/selection.mjs`:

Add imports under the existing ones:

```js
import schemaV2 from '../../../bespoke/selection-v2.schema.json' with { type: 'json' };
import components from '../../../SPOKES Builder/role-components.json' with { type: 'json' };
import { checkDesign } from '../../../bespoke/design-model.mjs';
```

In `check()`, after the `if (typeof value === 'string') { ... }` block, add:

```js
  if (Array.isArray(value)) {
    if (rule.minItems !== undefined && value.length < rule.minItems) errors.push(`${at}: too few items`);
    if (rule.maxItems !== undefined && value.length > rule.maxItems) errors.push(`${at}: too many items`);
    if (rule.uniqueItems && new Set(value.map(item => JSON.stringify(item))).size !== value.length) errors.push(`${at}: items must be unique`);
    if (rule.items) value.forEach((item, index) => errors.push(...check(item, rule.items, `${at}[${index}]`, forSend)));
  }
```

At the top of `selectionErrors`, before `const errors = check(selection, schema, '$', forSend);`, add:

```js
  if (object(selection) && selection.schema === 'bespoke-selection/v2') {
    const errors = check(selection, schemaV2, '$', forSend);
    if (errors.length) return errors;
    if (selection.lesson.id !== lessonId || !LESSON_IDS.includes(lessonId)) errors.push('Choose the matching lesson.');
    if (!selection.lesson.title.trim() || (forSend && !selection.team.spokesperson.name.trim())) errors.push('Add the lesson title and spokesperson name.');
    const date = new Date(`${selection.date}T00:00:00Z`);
    if (Number(selection.date.slice(0, 4)) < 1 || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== selection.date) errors.push('The saved date is invalid.');
    errors.push(...checkDesign(components, selection.design));
    return errors;
  }
```

The Python validator words array errors as "fewer than N items" and "more than N items"; the service says "too few items" and "too many items". Each test asserts its own side's wording. Don't unify them in this task.

- [ ] **Step 4: Run the tests and watch them pass**

Run: `node --test scripts/test-bespoke-handoff.mjs scripts/test-bespoke-provision.mjs`
Expected: all pass. `test-bespoke-provision.mjs` loads the real function and its catalogs, which proves the new imports resolve.

- [ ] **Step 5: Include the new files in the service stage**

`scripts/bespoke-stage-service.mjs` copies the function and three authority JSON files. Add `bespoke/selection-v2.schema.json`, `SPOKES Builder/role-components.json` and `bespoke/design-model.mjs` to its copy list, following the existing entries.

Run: `node scripts/bespoke-stage-service.mjs "$(mktemp -d)/stage" && node --test scripts/test-bespoke-provision.mjs`
Expected: the stage lists the three new files; tests pass.

- [ ] **Step 6: Commit**

```bash
git add netlify/functions/_shared/selection.mjs scripts/test-bespoke-handoff.mjs scripts/bespoke-stage-service.mjs
git commit -m "feat(bespoke): Netlify service validates v2 designs with the shared design model"
```

The service must be redeployed from this branch before any change that sends v2 payloads reaches Pages (Plan 2). Britt runs the deploy.

---

### Task 6: Lesson CSS and build contract v2

**Files:**
- Modify: `scripts/bespoke_design.py` (`build_design` dispatches; v2 path)
- Modify: `scripts/bespoke-check-design.py` (accept `bespoke-build-contract/v2`)
- Create: `scripts/check-v2-layouts.mjs` (every v2 option rendered on the template)
- Test: `scripts/test_bespoke_submission.py` (append), `scripts/test-bespoke-design.mjs` (append a v2 scenario)

**Interfaces:**
- Consumes: `bespoke_roles.design_css`, `bespoke_roles.load_components` (Task 3); `require_valid_selection` (Task 4).
- Produces: `build_design(payload) -> tuple[str, dict]` for both versions. For v2 the contract has `schema: "bespoke-build-contract/v2"`, `design` (the payload's `design`), `roleComponentsSha256`, and every v1 key except `theme` and `mainClassRequired`.

- [ ] **Step 1: Write the failing tests**

Append to class `SubmissionTests` in `scripts/test_bespoke_submission.py`:

```python
    def test_v2_design_css_and_contract(self):
        payload = json.loads((ROOT / "scripts/test-fixtures/bespoke/selection-v2-money-management.json").read_text())
        css, contract = build_design(payload)
        self.assertEqual(contract["schema"], "bespoke-build-contract/v2")
        self.assertEqual(contract["design"], payload["design"])
        self.assertIn("--role-heading: var(--mauve);", css)
        self.assertIn("font-family: var(--font-heading)", css)
        self.assertNotRegex(css.split("*/", 1)[1], r"#[0-9a-fA-F]{6}\b")
        self.assertNotIn("theme", contract)
```

- [ ] **Step 2: Run the test and watch it fail**

Run: `python3 -m unittest scripts/test_bespoke_submission.py -k v2 -v`
Expected: FAIL with `KeyError: 'theme'`.

- [ ] **Step 3: Split `build_design` into shared fonts plus a version-specific body**

In `scripts/bespoke_design.py`:

1. Move the font code (currently `build_design` lines 23–51, from `meta = json.loads(...)` through the loop that appends the two selector rules) into a new function. The body is the existing code; only the pairing lookup changes to take an id:

```python
def font_chunks(pairing_id: str) -> tuple[list[str], list[str], dict, dict]:
    """(css chunks, font paths, font selectors, pairing) for a catalog font pairing."""
    meta = json.loads((ROOT / "bespoke/catalog.json").read_text(encoding="utf-8"))
    pair = next(p for p in meta["fontPairings"] if p["id"] == pairing_id)
    # Use the same self-hosted face declarations as the instructor preview.
    preview_css = (ROOT / "bespoke/styles.css").read_text(encoding="utf-8")
    faces = [block for block in re.findall(r"@font-face\s*\{[^}]+\}", preview_css)
             if any(f'font-family: "{name}"' in block for name in (pair["heading"], pair["body"]))]
    if not faces or any(not any(f'font-family: "{name}"' in b for b in faces) for name in (pair["heading"], pair["body"])):
        raise ValueError("Selected font pairing is missing its self-hosted font declarations")
    font_paths = re.findall(r'url\("(.*?)"\)', "\n".join(faces))
    for path in font_paths:
        if not (ROOT / "bespoke" / path).is_file():
            raise ValueError(f"Missing font asset: {path}")
    template = (ROOT / "SPOKES Builder/template.html").read_text(encoding="utf-8")
    chunks = [*faces, f"body {{ --font-heading: '{pair['heading']}', serif; --font-body: '{pair['body']}', sans-serif; font-family: var(--font-body); }}"]
    template_css = "\n".join(re.findall(r"<style[^>]*>(.*?)</style>", template, re.DOTALL))
    template_css = re.sub(r"/\*.*?\*/", "", template_css, flags=re.DOTALL)
    font_selectors = {"heading": [], "body": []}
    for selectors, declarations in re.findall(r"([^{}]+)\{([^{}]+)\}", template_css):
        for role, original in (("heading", "DM Serif Display"), ("body", "Outfit")):
            if selectors.strip().startswith("@"):
                continue
            named_font = re.search(r"font-family:\s*[\"']" + re.escape(original) + r"[\"']", declarations)
            variable_font = re.search(r"font-family:\s*var\(--font-" + role + r"\)", declarations)
            if named_font or variable_font:
                font_selectors[role].append(selectors.strip())
    for role, selectors in font_selectors.items():
        if not selectors:
            raise ValueError(f"Template {role} font selectors changed; review the generator")
        chunks.append(",\n".join(selectors) + f" {{ font-family: var(--font-{role}); }}")
    return chunks, font_paths, font_selectors, pair
```

   In the v1 path of `build_design`, replace the moved lines with:

```python
    fonts, font_paths, font_selectors, pair = font_chunks(theme["fontPairing"])
    template = (ROOT / "SPOKES Builder/template.html").read_text(encoding="utf-8")
    chunks = [f"/* Bespoke selection SHA-256: {selection_digest(payload)} */", *fonts]
```

   Keep `source` and `sections` (read at the top of `build_design`) for the v1 `option()` helper. Run `python3 -m unittest scripts/test_bespoke_submission.py -v` right after this refactor, before adding v2: the v1 CSS must be byte-identical, which `test_generated_css_preserves_selected_families_and_chapter_mapping` and the design checker test prove.

2. At the top of `build_design`, after `require_valid_selection(payload)`, add:

```python
    if payload.get("schema") == "bespoke-selection/v2":
        return build_design_v2(payload)
```

3. Add:

```python
def build_design_v2(payload: dict) -> tuple[str, dict]:
    from bespoke_roles import COMPONENTS_PATH, design_css, load_components

    design = payload["design"]
    fonts, font_paths, font_selectors, pair = font_chunks(design["fontPairing"])
    css = "\n\n".join([f"/* Bespoke selection SHA-256: {selection_digest(payload)} */", *fonts, design_css(load_components(), design)])
    template = (ROOT / "SPOKES Builder/template.html").read_text(encoding="utf-8")
    contract = {
        "schema": "bespoke-build-contract/v2",
        "lessonId": payload["lesson"]["id"],
        "selectionSha256": selection_digest(payload),
        "roleComponentsSha256": sha(COMPONENTS_PATH.read_text(encoding="utf-8")),
        "templateSha256": sha(template),
        "cssSha256": sha(css),
        "design": design,
        "chapterMap": {key: str(i) for i, key in enumerate(CHAPTERS, 1)},
        "fontPairing": pair,
        "fontPaths": font_paths,
        "fontSelectors": font_selectors,
        "acceptance": [
            "Place design.css as the only <style id=\"theme-override\"> block, after the main <style>.",
            "Do not override chosen roles or options in later CSS.",
            "Run scripts/bespoke-check-design.py against the finished lesson.",
        ],
    }
    return css, contract
```

If `css` ends without a newline, append `"\n"` to match how v1 writes `design.css`; check the v1 return statement and do the same.

- [ ] **Step 4: Accept v2 contracts in the checker**

In `scripts/bespoke-check-design.py`, change the schema check at line 49 from requiring `bespoke-build-contract/v1` to:

```python
    if contract.get("schema") not in ("bespoke-build-contract/v1", "bespoke-build-contract/v2"):
```

The `theme-dark` check reads `mainClassRequired`. v2 contracts omit it, so guard that check with `contract.get("mainClassRequired")`, leaving v1 behavior unchanged.

- [ ] **Step 5: Run the tests and watch them pass**

Run: `python3 -m unittest discover -s scripts -p 'test_bespoke*.py' -v`
Expected: all pass.

- [ ] **Step 6: Prove the CSS renders on the real template**

In `scripts/test-bespoke-design.mjs`, the embedded Python builds scenario folders from v1 payloads. Add one v2 scenario to that Python block, after the `alternative` scenario:

```python
v2=json.loads((root/'scripts/test-fixtures/bespoke/selection-v2-money-management.json').read_text())
scenarios.append(('v2-design',v2))
```

In the JS part, after the `PASS generated title, divider, card, sidebar, texture and lead effects` line, add a v2 block. It runs the real design checker on the generated page, then reads computed colors:

```js
  const v2Folder = path.join(temporary, 'v2-design');
  execFileSync(python, [path.join(root, 'scripts/bespoke-check-design.py'), path.join(v2Folder, 'build-contract.json'), path.join(v2Folder, 'index.html')], { cwd: root, stdio: 'pipe' });
  await page.goto(pathToFileURL(path.join(v2Folder, 'index.html')).href);
  const v2 = await page.evaluate(() => {
    const style = selector => getComputedStyle(document.querySelector(selector));
    return {
      sidebar: style('.sidebar').backgroundColor,
      sidebarText: style('.chapter-header').color,
      title: style('.slide-title h1').color,
      section: style('.slide-section[data-chapter="3"]').backgroundColor,
      heading: style('.slide:not(.slide-section):not(.slide-title) h2').color,
    };
  });
  assert.equal(v2.sidebar, 'rgb(0, 64, 113)');
  assert.equal(v2.sidebarText, 'rgb(255, 255, 255)');
  assert.equal(v2.title, 'rgb(255, 255, 255)');
  assert.equal(v2.section, 'rgb(167, 37, 63)');
  assert.equal(v2.heading, 'rgb(167, 37, 63)');
  console.log('PASS v2 roles reach the canonical template');
```

Run: `node scripts/test-bespoke-design.mjs`
Expected: passes.

- [ ] **Step 7: Check that every v2 option lays out cleanly**

Create `scripts/check-v2-layouts.mjs`. It renders the template with the v2 CSS at 1280×720, changes one decision at a time from the defaults, and shows each slide type the way deck navigation does. It fails when parts collide, spill out of the visible stage, overflow, or when a layout isn't where its name says (side by side must put the title left of the player, and so on). The skeleton has no activity box or bullet list, so it adds both from `components.md` markup.

```js
#!/usr/bin/env node
// Render SPOKES Builder/template.html with v2 slide-piece CSS at 1280x720 and
// check every option of every decision: the slide's parts sit inside the slide,
// don't overlap each other, and don't overflow. One decision changes at a time;
// everything else stays at the data file's defaults. The template skeleton has
// no activity box or bullet list, so both are added from components.md markup.
// Usage: node scripts/check-v2-layouts.mjs [--shots <dir>] [group.decision.option ...]
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { checkDesign, designCss } from "../bespoke/design-model.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const shotsAt = args.indexOf("--shots");
const shots = shotsAt >= 0 ? args.splice(shotsAt, 2)[1] : null;
const only = new Set(args);
const components = JSON.parse(fs.readFileSync(path.join(root, "SPOKES Builder/role-components.json"), "utf8"));
const template = fs.readFileSync(path.join(root, "SPOKES Builder/template.html"), "utf8")
  .replaceAll("{{LESSON_TITLE}}", "Money Management")
  .replace("{{SUBTITLE}}", "Skills for Life, planning every dollar");

/** Which slide shows each group, and which parts of it must not collide. */
const TARGETS = {
  title: { slide: ".slide-title", parts: ["img.logo", "h1", ".divider", ".subtitle", ".copyright"] },
  divider: { slide: '.slide-section[data-chapter="3"]', parts: [".chapter-label", "h2", ".divider"] },
  video: { slide: ".slide-video", parts: ["h2", ".video-container"] },
  list: { slide: "#v2-list", parts: [":scope > h2", ".card"], inner: [".card h4", ".card p"] },
  activity: { slide: "#v2-activity", parts: [".activity-label", ".activity-box p"], box: ".activity-box" },
};

// Canonical component markup (SPOKES Builder/components.md) for pieces the skeleton lacks.
const EXTRA = `
<section class="slide" id="v2-list" data-chapter="3"><h2>Key points</h2>
  <div class="cards-grid">
    <div class="card"><h4>Name one money goal</h4><p>Pick something you can reach this month.</p></div>
    <div class="card gold-border"><h4>List your fixed costs</h4><p>Rent, phone and bus fare come first.</p></div>
    <div class="card"><h4>Trim one expense</h4><p>Small cuts add up over a month.</p></div>
    <div class="card gold-border"><h4>Check in weekly</h4><p>Compare the plan with what you spent.</p></div>
  </div>
</section>
<section class="slide" id="v2-bullets" data-chapter="3"><h2>Before next class</h2>
  <ul class="content-list"><li>Write the budget down</li><li>Keep receipts for a week</li><li>Mark one cost to cut</li></ul>
</section>
<section class="slide" id="v2-activity" data-chapter="3"><h2>Try it</h2>
  <div class="activity-box"><div class="activity-label">Group activity</div><p>With a partner, list three costs you could cut and one goal the savings would fund.</p></div>
</section>`;

const cases = [];
for (const group of components.slides.groups) {
  if (!TARGETS[group.id]) continue;
  for (const decision of group.decisions) {
    for (const option of decision.options) {
      const key = `${group.id}.${decision.id}.${option.id}`;
      if (only.size && !only.has(key)) continue;
      const design = structuredClone(components.defaults);
      design.slides[group.id][decision.id] = option.id;
      // A clash with a default is reported by the model, not by layout; move the default aside.
      for (const rule of option.excludes || []) {
        if (design.slides[group.id][rule.decision] === rule.option) {
          const other = group.decisions.find((d) => d.id === rule.decision).options.find((o) => o.id !== rule.option);
          design.slides[group.id][rule.decision] = other.id;
        }
      }
      const problems = checkDesign(components, design);
      if (problems.length) throw new Error(`${key}: default design becomes invalid: ${problems.join("; ")}`);
      cases.push({ key, group: group.id, css: designCss(components, design) });
    }
  }
}

const pages = new Map(cases.map((c) => [`/probe/${c.key}.html`,
  template.replace("</head>", `<style id="theme-override">\n${c.css}\n</style>\n</head>`).replace("</main>", `${EXTRA}</main>`)]));
const types = { ".png": "image/png", ".woff2": "font/woff2", ".css": "text/css", ".js": "text/javascript" };
const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split("?")[0]);
  if (pages.has(url)) { res.writeHead(200, { "content-type": "text/html" }); res.end(pages.get(url)); return; }
  const file = path.join(root, url.startsWith("/probe/") ? path.join("SPOKES Builder", url.slice(7)) : url);
  if (!file.startsWith(root) || !fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { "content-type": types[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});
await new Promise((resolve) => server.listen(0, resolve));

const browser = await chromium.launch();
const failures = [];
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, reducedMotion: "reduce" });
  for (const c of cases) {
    await page.goto(`http://localhost:${server.address().port}/probe/${c.key}.html`);
    if (!(await page.locator("#v2-list").count())) throw new Error("Template has no </main>; the extra slides were not added");
    const target = TARGETS[c.group];
    const found = await page.evaluate(async ({ t, key }) => {
      // Show only the slide under test, the way the deck's navigation does.
      document.querySelectorAll(".slide.active").forEach((s) => s.classList.remove("active"));
      const slide = document.querySelector(t.slide);
      slide.classList.add("active");
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      await Promise.all(document.getAnimations().filter((a) => a.effect?.getTiming().iterations !== Infinity).map((a) => a.finished.catch(() => null)));
      // The visible frame: the slide clipped to the stage and the window. A slide that grows
      // wider than the stage would otherwise "contain" content that is off screen.
      const problems = [];
      const own = slide.getBoundingClientRect();
      const stage = document.querySelector(".main").getBoundingClientRect();
      const frame = {
        left: Math.max(own.left, stage.left, 0), top: Math.max(own.top, stage.top, 0),
        right: Math.min(own.right, stage.right, innerWidth), bottom: Math.min(own.bottom, stage.bottom, innerHeight),
      };
      if (own.width > stage.width + 1) problems.push("slide is wider than the stage");
      if (slide.scrollHeight > slide.clientHeight + 1) problems.push("content is taller than the slide");
      const boxes = t.parts.flatMap((selector) => [...slide.querySelectorAll(selector)].map((el) => ({ selector, el, box: el.getBoundingClientRect() })));
      for (const { selector, el, box } of boxes) {
        if (!box.width || !box.height) { problems.push(`${selector} has no size`); continue; }
        if (box.left < frame.left - 1 || box.right > frame.right + 1 || box.top < frame.top - 1 || box.bottom > frame.bottom + 1) problems.push(`${selector} outside the slide`);
        if (el.scrollWidth > el.clientWidth + 1) problems.push(`${selector} overflows`);
      }
      for (let i = 0; i < boxes.length; i += 1) {
        for (let j = i + 1; j < boxes.length; j += 1) {
          const a = boxes[i].box, b = boxes[j].box;
          if (Math.min(a.right, b.right) - Math.max(a.left, b.left) > 2 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 2) {
            problems.push(`${boxes[i].selector} overlaps ${boxes[j].selector}`);
          }
        }
      }
      for (const selector of t.inner || []) {
        for (const el of slide.querySelectorAll(selector)) {
          const card = el.closest(".card").getBoundingClientRect();
          const box = el.getBoundingClientRect();
          if (box.left < card.left - 1 || box.right > card.right + 1 || box.bottom > card.bottom + 1) problems.push(`${selector} spills out of its card`);
          if (el.scrollWidth > el.clientWidth + 1) problems.push(`${selector} overflows`);
        }
      }
      if (t.box) {
        const box = slide.querySelector(t.box).getBoundingClientRect();
        for (const selector of t.parts) {
          const part = slide.querySelector(selector).getBoundingClientRect();
          if (part.left < box.left - 1 || part.right > box.right + 1 || part.top < box.top - 1 || part.bottom > box.bottom + 1) problems.push(`${selector} spills out of ${t.box}`);
        }
      }
      // Each layout must actually be where its name says.
      const at = (selector) => slide.querySelector(selector)?.getBoundingClientRect();
      const mid = (own.left + own.right) / 2;
      const cards = [...slide.querySelectorAll(".card")].map((el) => el.getBoundingClientRect());
      const expect = {
        "title.layout.left": () => at("h1").left < mid - 50,
        "title.layout.bottom": () => at("h1").left < mid - 50 && Math.max(...boxes.map((b) => b.box.bottom)) > own.bottom - 140,
        "title.layout.split": () => at("h1").left < mid - 50,
        "divider.layout.left": () => at("h2").left < mid - 50,
        "divider.layout.number": () => at("h2").left < mid - 50,
        "video.layout.side": () => at("h2").right <= at(".video-container").left + 1,
        "video.layout.banner": () => at("h2").width >= at(".video-container").width * 0.9,
        "list.layout.three": () => cards.length >= 3 && Math.abs(cards[0].top - cards[2].top) < 2,
        "list.layout.rows": () => cards.every((c) => Math.abs(c.left - cards[0].left) < 2 && Math.abs(c.width - cards[0].width) < 2),
        "list.layout.two": () => cards.length >= 2 && Math.abs(cards[0].top - cards[1].top) < 2 && Math.abs(cards[0].top - cards[2].top) > 2,
        "activity.layout.side": () => at(".activity-label").right <= at(".activity-box p").left + 1,
        "activity.layout.banner": () => at(".activity-label").width >= at(".activity-box").width * 0.95,
      }[key];
      if (expect && !expect()) problems.push(`layout is not where "${key.split(".").pop()}" says`);
      return [...new Set(problems)];
    }, { t: target, key: c.key });
    if (shots) {
      fs.mkdirSync(shots, { recursive: true });
      await page.screenshot({ path: path.join(shots, `${c.key}.png`) });
    }
    console.log(`${found.length ? "FAIL" : "PASS"} ${c.key}${found.length ? ": " + found.join("; ") : ""}`);
    if (found.length) failures.push(c.key);
  }
} finally {
  await browser.close();
  server.close();
}
console.log(`v2 layouts: ${cases.length - failures.length}/${cases.length} pass`);
process.exitCode = failures.length ? 1 : 0;
```

Prove the checker can fail before trusting a pass. While writing this plan, a checker that only compared parts with the slide's own box passed deliberately broken CSS, because the slide itself grew wider than the stage. Break three options on purpose and confirm all three fail, then restore the file:

```bash
cp "SPOKES Builder/role-components.json" /tmp/rc.bak
python3 - <<'PY'
import json; p = "SPOKES Builder/role-components.json"; d = json.load(open(p))
for g in d["slides"]["groups"]:
    for dd in g["decisions"]:
        for o in dd["options"]:
            if g["id"] == "title" and o["id"] == "left": o["css"] = ".slide-title { padding-left: 60rem; }"
            if g["id"] == "list" and o["id"] == "three": o["css"] = ".cards-grid { grid-template-columns: repeat(3, 40rem); }"
            if g["id"] == "activity" and o["id"] == "side": o["css"] = ".activity-label { position: absolute; top: 0; left: 0; }"
json.dump(d, open(p, "w"), indent=2)
PY
node scripts/check-v2-layouts.mjs title.layout.left list.layout.three activity.layout.side
cp /tmp/rc.bak "SPOKES Builder/role-components.json"
```

Expected: `v2 layouts: 0/3 pass`.

Run: `node scripts/check-v2-layouts.mjs`
Expected: `v2 layouts: 53/53 pass` (57 options minus the 4 background patterns, which have no layout).

Look at the screenshots too (`--shots <dir>`). The checker proves nothing collides, not that a sample looks good.

In `scripts/quality.sh`, after `node scripts/check-title-layouts.mjs`, add:

```bash
  echo "==> v2 slide-piece layouts"
  node scripts/check-v2-layouts.mjs
```

- [ ] **Step 8: Commit**

```bash
git add scripts/bespoke_design.py scripts/bespoke-check-design.py scripts/check-v2-layouts.mjs scripts/quality.sh scripts/test_bespoke_submission.py scripts/test-bespoke-design.mjs
git commit -m "feat(bespoke): generate v2 lesson CSS and build contracts from roles"
```

---

### Task 7: Submission package and registry for v2

**Files:**
- Modify: `scripts/bespoke-write-submission.py` (`build_intake_markdown` rows; payload schema line)
- Modify: `scripts/bespoke-apply-selection.py` (`selection_to_theme_entry` v2)
- Test: `scripts/test_bespoke_submission.py`, `scripts/test_bespoke_apply.py` (append)

**Interfaces:**
- Consumes: `build_design` (Task 6).
- Produces: v2 submissions under `docs/phase-2/submissions/<lesson>/<date>-<sha16>/` with the same four files. The registry entry for a v2 selection is `{"designModel": "roles/v1", "design": <payload design>}` plus `bespokeSelectionSha256`.

- [ ] **Step 1: Write the failing tests**

Append to `SubmissionTests` in `scripts/test_bespoke_submission.py`:

```python
    def test_v2_intake_lists_roles_and_slide_choices(self):
        payload = json.loads((ROOT / "scripts/test-fixtures/bespoke/selection-v2-money-management.json").read_text())
        text = writer.build_intake_markdown(payload, payload["date"])
        self.assertIn("| Slide headings | Mauve |", text)
        self.assertIn("| Title slide, Text position | Center |", text)
        self.assertIn("- Payload schema: bespoke-selection/v2", text)
        with tempfile.TemporaryDirectory() as tmp:
            folder = writer.write_submission(payload, Path(tmp))
            self.assertEqual(sorted(p.name for p in folder.iterdir()), ["build-contract.json", "content-intake.md", "design.css", "selection.json"])
```

Append to the test class in `scripts/test_bespoke_apply.py`, following that file's existing imports and helpers:

```python
    def test_v2_selection_becomes_a_roles_entry(self):
        payload = json.loads((ROOT / "scripts/test-fixtures/bespoke/selection-v2-money-management.json").read_text())
        entry = apply.selection_to_theme_entry(payload)
        self.assertEqual(entry["designModel"], "roles/v1")
        self.assertEqual(entry["design"], payload["design"])
        self.assertNotIn("colorLead", entry)
```

If `ROOT`, `json` or `apply` are named differently in `test_bespoke_apply.py`, use that file's names.

- [ ] **Step 2: Run the tests and watch them fail**

Run: `python3 -m unittest scripts/test_bespoke_submission.py scripts/test_bespoke_apply.py -v`
Expected: the new tests FAIL with `KeyError: 'theme'`.

- [ ] **Step 3: v2 intake rows**

In `scripts/bespoke-write-submission.py` `build_intake_markdown`, replace the `rows = {...}` assignment (currently lines 46–54) with:

```python
    if payload.get("schema") == "bespoke-selection/v2":
        sys.path.insert(0, str(ROOT / "scripts"))
        from bespoke_roles import load_components
        components = load_components()
        names = {c["id"]: c["name"] for c in components["palette"]}
        design = payload["design"]
        rows = {"Spokesperson": spokesperson["name"], "Spokesperson email": spokesperson.get("email", "")}
        rows["Primary colors"] = ", ".join(names[i] for i in design["palette"]["primary"])
        rows["Secondary colors"] = ", ".join(names[i] for i in design["palette"]["secondary"]) or "None"
        rows.update({role["label"]: names[design["roles"][role["id"]]] for role in components["roles"]})
        rows["Font pairing"] = design["fontPairing"]
        for group in components["slides"]["groups"]:
            for decision in group["decisions"]:
                chosen = design["slides"][group["id"]][decision["id"]]
                label = next(o["label"] for o in decision["options"] if o["id"] == chosen)
                rows[f"{group['label']}, {decision['label']}"] = label
        rows["Team notes (Unspoken)"] = payload.get("unspoken", "")
    else:
        rows = {
            "Spokesperson": spokesperson["name"],
            "Spokesperson email": spokesperson.get("email", ""),
            "Preset": payload["presetId"],
            **{key: theme[key] for key in ("colorLead", "sidebarColor", "backgroundTexture", "titleSlide", "dividerStyle", "fontPairing")},
            "Cards": json.dumps(theme["cards"], ensure_ascii=False),
            "Team notes (Unspoken)": payload.get("unspoken", ""),
        }
```

`build_intake_markdown` reads `theme = payload["theme"]` at line 34. Change that read to `theme = payload.get("theme") or {}`. Keep the existing `brief` row block after `rows`; it only applies when `brief` is present, which v2 payloads don't have yet. Add `import sys` if the file lacks it.

Change the literal at line 87 from `- Payload schema: bespoke-selection/v1` to `- Payload schema: {payload["schema"]}`. It sits inside an f-string; check the surrounding quotes.

- [ ] **Step 4: v2 registry entries**

In `scripts/bespoke-apply-selection.py` `selection_to_theme_entry`, add at the top of the function:

```python
    if payload.get("schema") == "bespoke-selection/v2":
        return {"designModel": "roles/v1", "design": payload["design"]}
```

`apply_selection` adds `bespokeSelectionSha256` after calling this function (line 99), so v2 entries get it too.

- [ ] **Step 5: Run the tests and watch them pass**

Run: `python3 -m unittest discover -s scripts -p 'test_bespoke*.py' -v`
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add scripts/bespoke-write-submission.py scripts/bespoke-apply-selection.py scripts/test_bespoke_submission.py scripts/test_bespoke_apply.py
git commit -m "feat(bespoke): v2 submission packages and registry entries"
```

---

### Task 8: Lesson fingerprints and an accurate meter

**Files:**
- Create: `scripts/generate-lesson-fingerprints.mjs`
- Create (generated): `bespoke/lesson-fingerprints.json`
- Modify: `scripts/test-bespoke-design-model.mjs` (append), `scripts/quality.sh`

**Interfaces:**
- Consumes: the six `lesson-*/index.html` decks (found through `lesson-registry.json` `path`), `SPOKES Builder/theme-registry.json` (patterns), `bespoke/catalog.json` (font pairings), `SPOKES Builder/role-components.json` (palette), `similarity` (Task 2). No new dependencies: the script includes a small PNG decoder for Playwright's screenshots.
- Produces: `bespoke/lesson-fingerprints.json`: `{ "version": 1, "generatedBy": "scripts/generate-lesson-fingerprints.mjs", "lessons": [ { "id", "title", "roles": {<measured role>: paletteId|null}, "sources": {<measured role>: selector}, "fontPairing": id|null, "background": slug } ] }`, lessons sorted by id.

- [ ] **Step 1: Write the failing test**

Append to `scripts/test-bespoke-design-model.mjs`:

```js
test("fingerprints cover all six lessons with palette ids and sources", () => {
  const file = path.join(root, "bespoke/lesson-fingerprints.json");
  const fingerprints = JSON.parse(fs.readFileSync(file, "utf8"));
  const ids = new Set(components.palette.map((c) => c.id));
  assert.equal(fingerprints.lessons.length, 6);
  for (const lesson of fingerprints.lessons) {
    for (const role of M.MEASURED_ROLES) {
      assert.ok(lesson.roles[role] === null || ids.has(lesson.roles[role]), `${lesson.id}.${role}`);
      if (lesson.roles[role]) assert.ok(lesson.sources[role], `${lesson.id}.${role} source`);
    }
  }
  const interview = fingerprints.lessons.find((l) => l.id === "interview-skills");
  assert.equal(interview.roles.sidebar, "royal");
  assert.equal(interview.background, "diagonal");
});
```

- [ ] **Step 2: Run the test and watch it fail**

Run: `node --test scripts/test-bespoke-design-model.mjs`
Expected: FAIL, `ENOENT ... lesson-fingerprints.json`.

- [ ] **Step 3: Write the measuring script**

Create `scripts/generate-lesson-fingerprints.mjs`:

```js
#!/usr/bin/env node
// Measure the six released lesson decks for the similarity meter.
// Surfaces (sidebar, title background, content background, button) are read
// from screenshots: every sampled pixel votes for its nearest SPOKES palette
// color, so photo backgrounds, overlays and off-palette colors count as seen.
// Text colors come from computed styles. The font pairing is the first font in
// the heading's stack that a catalog pairing uses. The pattern comes from
// theme-registry.json.
// Usage: node scripts/generate-lesson-fingerprints.mjs [--check]
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "bespoke/lesson-fingerprints.json");
const read = (file) => JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
const palette = read("SPOKES Builder/role-components.json").palette.map((c) => ({
  id: c.id, rgb: [1, 3, 5].map((i) => parseInt(c.hex.slice(i, i + 2), 16))
}));
const fonts = read("bespoke/catalog.json").fontPairings;
const themes = read("SPOKES Builder/theme-registry.json").lessons;
const decks = read("lesson-registry.json").lessons
  .filter((l) => l.path && fs.existsSync(path.join(root, l.path)))
  .sort((a, b) => a.id.localeCompare(b.id));

function nearest(rgb) {
  let best = null;
  for (const c of palette) {
    const d = (c.rgb[0] - rgb[0]) ** 2 + (c.rgb[1] - rgb[1]) ** 2 + (c.rgb[2] - rgb[2]) ** 2;
    if (!best || d < best.d) best = { id: c.id, d };
  }
  return best.id;
}

/** Minimal decoder for Playwright's 8-bit, non-interlaced RGB/RGBA PNG screenshots. */
function decodePng(buffer) {
  let offset = 8;
  let width = 0, height = 0, channels = 0;
  const data = [];
  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString("ascii", offset + 4, offset + 8);
    const body = buffer.subarray(offset + 8, offset + 8 + length);
    if (type === "IHDR") {
      width = body.readUInt32BE(0);
      height = body.readUInt32BE(4);
      if (body[8] !== 8 || body[12] !== 0) throw new Error("Unsupported PNG");
      channels = { 2: 3, 6: 4 }[body[9]];
      if (!channels) throw new Error("Unsupported PNG color type");
    }
    if (type === "IDAT") data.push(body);
    offset += 12 + length;
  }
  const raw = zlib.inflateSync(Buffer.concat(data));
  const stride = width * channels;
  const pixels = Buffer.alloc(height * stride);
  for (let y = 0; y < height; y += 1) {
    const filter = raw[y * (stride + 1)];
    for (let x = 0; x < stride; x += 1) {
      const value = raw[y * (stride + 1) + 1 + x];
      const left = x >= channels ? pixels[y * stride + x - channels] : 0;
      const up = y > 0 ? pixels[(y - 1) * stride + x] : 0;
      const corner = y > 0 && x >= channels ? pixels[(y - 1) * stride + x - channels] : 0;
      let predicted = 0;
      if (filter === 1) predicted = left;
      else if (filter === 2) predicted = up;
      else if (filter === 3) predicted = (left + up) >> 1;
      else if (filter === 4) {
        const p = left + up - corner;
        const [pa, pb, pc] = [Math.abs(p - left), Math.abs(p - up), Math.abs(p - corner)];
        predicted = pa <= pb && pa <= pc ? left : pb <= pc ? up : corner;
      }
      pixels[y * stride + x] = (value + predicted) & 0xff;
    }
  }
  return { width, height, channels, pixels };
}

/** Majority palette color of a screenshot. `band` > 0 samples only that many px from each edge. */
function dominant(png, band = 0) {
  const { width, height, channels, pixels } = decodePng(png);
  const votes = new Map();
  const step = Math.max(1, Math.floor(Math.min(width, height) / 40));
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      if (band && x >= band && x < width - band && y >= band && y < height - band) continue;
      const i = y * width * channels + x * channels;
      const id = nearest([pixels[i], pixels[i + 1], pixels[i + 2]]);
      votes.set(id, (votes.get(id) || 0) + 1);
    }
  }
  return [...votes.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

async function shot(page, selector, band, label) {
  const el = page.locator(selector).first();
  if (!(await el.count()) || !(await el.isVisible())) return null;
  return { id: dominant(await el.screenshot({ animations: "disabled" }), band), source: `${label} (pixels)` };
}

async function textColor(page, selectors) {
  for (const selector of selectors) {
    const rgb = await page.evaluate((s) => {
      const el = document.querySelector(s);
      if (!el) return null;
      const m = getComputedStyle(el).color.match(/rgba?\(([^)]+)\)/);
      return m ? m[1].split(",").slice(0, 3).map(Number) : null;
    }, selector);
    if (rgb) return { id: nearest(rgb), source: `${selector} color` };
  }
  return null;
}

/** Step through the deck with the arrow keys until a plain content slide is showing. */
async function showContentSlide(page) {
  for (let i = 0; i < 60; i += 1) {
    const isContent = await page.evaluate(() => {
      const s = document.querySelector(".slide.active");
      return Boolean(s && !s.matches(".slide-title, .slide-section, .slide-video, .slide-closing, .big-statement"));
    });
    if (isContent) return true;
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(60);
  }
  return false;
}

const server = http.createServer((req, res) => {
  const file = path.join(root, decodeURIComponent(req.url.split("?")[0]));
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
  fs.createReadStream(file).pipe(res);
});
await new Promise((resolve) => server.listen(0, resolve));

const browser = await chromium.launch();
const result = { version: 1, generatedBy: "scripts/generate-lesson-fingerprints.mjs", lessons: [] };
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, reducedMotion: "reduce" });
  for (const deck of decks) {
    await page.goto(`http://localhost:${server.address().port}/${deck.path}`);
    await page.waitForTimeout(800);
    const found = {
      sidebar: await shot(page, ".sidebar", 0, ".sidebar"),
      titleBackground: await shot(page, ".slide-title", 24, ".slide-title edges"),
      titleText: await textColor(page, [".slide-title h1"]),
      subtitle: await textColor(page, [".slide-title .subtitle"]),
      heading: await textColor(page, [".card h4", ".slide:not(.slide-title):not(.slide-section):not(.slide-video) h2"]),
      body: await textColor(page, [".card p", ".content-list li", ".slide:not(.slide-title):not(.slide-section) p"]),
      accent: null,
      contentBackground: null,
      button: null,
    };
    const accent = await page.evaluate(() => {
      const card = document.querySelector(".card");
      const pick = card && parseFloat(getComputedStyle(card).borderLeftWidth) > 0 ? [getComputedStyle(card).borderLeftColor, ".card border-left"]
        : document.querySelector(".content-list li") ? [getComputedStyle(document.querySelector(".content-list li"), "::before").color, ".content-list li::before color"]
        : null;
      if (!pick) return null;
      const m = pick[0].match(/rgba?\(([^)]+)\)/);
      return m ? { rgb: m[1].split(",").slice(0, 3).map(Number), source: pick[1] } : null;
    });
    if (accent) found.accent = { id: nearest(accent.rgb), source: accent.source };
    if (await showContentSlide(page)) {
      found.contentBackground = await shot(page, ".main", 16, ".main edges on the first content slide");
    }
    // Buttons are solid colors, so the computed background is exact; see-through ones are skipped, not guessed.
    const button = await page.evaluate(() => {
      const el = document.querySelector(".slide .download-btn");
      const m = el && getComputedStyle(el).backgroundColor.match(/rgba?\(([^)]+)\)/);
      if (!m) return null;
      const [r, g, b, a = 1] = m[1].split(",").map(Number);
      return a >= 0.5 ? [r, g, b] : null;
    });
    if (button) found.button = { id: nearest(button), source: ".slide .download-btn background" };
    const headingFonts = await page.evaluate(() => {
      const h1 = document.querySelector(".slide-title h1");
      return h1 ? getComputedStyle(h1).fontFamily.split(",").map((f) => f.replace(/["']/g, "").trim()) : [];
    });
    const pairing = fonts.find((f) => headingFonts.includes(f.heading));
    const roles = {};
    const sources = {};
    for (const role of ["sidebar", "titleBackground", "titleText", "subtitle", "contentBackground", "heading", "body", "accent", "button"]) {
      roles[role] = found[role]?.id || null;
      if (found[role]) sources[role] = found[role].source;
    }
    result.lessons.push({
      id: deck.id.replace(/^lesson-/, ""),
      title: deck.title,
      roles,
      sources,
      fontPairing: pairing?.id || null,
      background: themes[deck.id]?.backgroundTexture || null,
    });
  }
} finally {
  await browser.close();
  server.close();
}

const text = `${JSON.stringify(result, null, 2)}\n`;
if (process.argv.includes("--check")) {
  const current = fs.existsSync(out) ? fs.readFileSync(out, "utf8") : "";
  if (current !== text) {
    console.error("bespoke/lesson-fingerprints.json is stale. Run: node scripts/generate-lesson-fingerprints.mjs");
    process.exitCode = 1;
  } else {
    console.log("lesson fingerprints up to date");
  }
} else {
  fs.writeFileSync(out, text);
  console.log(`Wrote bespoke/lesson-fingerprints.json (${result.lessons.length} lessons)`);
}
```

Why screenshots: the released decks have moved past the registry. Time Management's sidebar is `rgb(16, 32, 51)` with a teal overlay, and several title slides are photos under gradient overlays. Parsing CSS reports the wrong color for these, so surfaces are measured as learners see them. Buttons are solid in most decks; the script reads their computed background and skips see-through ones (Time Management's are 10% opaque), leaving `null`, which never matches a design.

- [ ] **Step 4: Generate, then review the file by hand**

Run: `node scripts/generate-lesson-fingerprints.mjs`
Expected: `Wrote bespoke/lesson-fingerprints.json (6 lessons)`.

Open the file and check each lesson against what the deck shows at 1280×720. Measured on 2026-09-23 while writing this plan:

| Lesson | Sidebar | Title bg | Content bg | Heading | Accent | Button | Font |
|---|---|---|---|---|---|---|---|
| communicating-with-the-public | dark | light | muted | primary | accent | dark | crimson-pro-work-sans |
| controlling-anger | dark | royal | royal | light | light | gold | vollkorn-fira-sans |
| employee-accountability | dark | muted | muted | primary | offwhite | dark | merriweather-source-sans-3 |
| interview-skills | royal | royal | muted | royal | accent | gold | playfair-display-inter |
| problem-solving-and-decision-making | royal | royal | muted | royal | primary | royal | bitter-raleway |
| time-management | royal | dark | muted | royal | accent | null | dm-serif-display-outfit |

A value that differs from what you see usually means a selector matched a hidden decoy element. Fix the probe, not the output.

Pixel sampling can differ slightly between macOS and the Linux CI runner (font smoothing at edges). The majority vote absorbs this in practice. If CI's `--check` fails without any deck change, regenerate the file on Linux (run the script in the CI job and commit its output) instead of loosening the check.

Run: `node --test scripts/test-bespoke-design-model.mjs`
Expected: all pass, including the fingerprint test.

- [ ] **Step 5: Keep the file honest in the quality gate**

In `scripts/quality.sh`, inside the block that runs the Playwright checks (after `node scripts/check-title-layouts.mjs`), add:

```bash
  echo "==> lesson fingerprints for the similarity meter"
  node scripts/generate-lesson-fingerprints.mjs --check
```

Run: `bash scripts/quality.sh`
Expected: ends with `quality.sh: all checks passed`.

- [ ] **Step 6: Commit**

```bash
git add scripts/generate-lesson-fingerprints.mjs bespoke/lesson-fingerprints.json scripts/test-bespoke-design-model.mjs scripts/quality.sh
git commit -m "feat(bespoke): measure the six lesson decks for an accurate similarity meter"
```

---

## After Plan 1

- Open one PR for Plan 1. Its description must state the deploy order: Britt stages and deploys the Netlify service from the branch (`node scripts/bespoke-stage-service.mjs "<new stage dir>"`, then the CLI deploy in the stage folder) before merging. The current wizard keeps sending v1, which the new service still accepts.
- Plan 2 (builder interface) uses `roleOptions`, `checkDesign`, `designCss` and `similarity` from `bespoke/design-model.mjs`. The preview applies `designCss` through the existing unit scaling (`scaleLibraryUnits` in `bespoke/app.js`).
- Plan 3 (migration) converts a v1 selection to v2. The conversion can take a v1 lesson look's measured roles from a fingerprint-style measurement of the v1 CSS, the same method Task 8 uses on decks.
