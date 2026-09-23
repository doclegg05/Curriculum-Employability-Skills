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
