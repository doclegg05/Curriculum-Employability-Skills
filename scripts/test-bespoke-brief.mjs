import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { selectionErrors } from "../netlify/functions/_shared/selection.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const meta = JSON.parse(read("bespoke/catalog.json"));
const library = JSON.parse(read("SPOKES Builder/bespoke-library-catalog.json"));

const sandbox = { window: {} };
vm.runInNewContext(read("bespoke/brief.js"), sandbox);
const Brief = sandbox.window.BespokeBrief;

const FEELS = Brief.QUESTIONS[0].options.map((o) => o.id);
const lessonCtx = (lessonId, teamName = "") => ({
  meta,
  library,
  lessonId,
  lessonTitle: meta.lessons.find((l) => l.id === lessonId).title,
  teamName
});
const brief = (overrides) => ({ ...Brief.DEFAULT_BRIEF, ...overrides });

test("every library option and font pairing has traits", () => {
  for (const [, family] of Brief.FIELDS) {
    const slugs = family === "fonts"
      ? meta.fontPairings.map((p) => p.id)
      : library.families[family].options.map((o) => o.slug);
    for (const slug of slugs) assert.ok(Brief.TRAITS[family][slug], `${family}.${slug} has no traits`);
  }
});

test("topic cues and preset lessons match the catalog", () => {
  assert.deepEqual(Object.keys(Brief.LESSON_COLOR_CUES).sort(), meta.lessons.map((l) => l.id).sort());
  assert.deepEqual(Object.keys(Brief.PRESET_LESSONS).sort(), meta.presets.map((p) => p.id).sort());
  const leads = new Set(library.families.colorLeads.options.map((o) => o.slug));
  for (const cues of Object.values(Brief.LESSON_COLOR_CUES)) cues.forEach((slug) => assert.ok(leads.has(slug), slug));
});

test("no suggestion until the feel question is answered", () => {
  assert.equal(Brief.suggestDesign(lessonCtx("money-management"), brief({})), null);
});

test("suggestions use only available library pieces and respect distinctness", () => {
  const blocked = new Set();
  for (const [, family] of Brief.FIELDS) {
    if (family === "fonts") continue;
    library.families[family].options.filter((o) => o.blocked).forEach((o) => blocked.add(`${family}.${o.slug}`));
  }
  for (const lesson of meta.lessons) {
    for (const feel of FEELS) {
      for (const fresh of Brief.QUESTIONS[2].options) {
        for (const light of ["light", "dark", "either"]) {
          const result = Brief.suggestDesign(lessonCtx(lesson.id, "Team"), brief({ briefFeel: feel, briefFresh: fresh.id, briefLight: light }));
          for (const item of result.explained) {
            assert.ok(Brief.TRAITS[item.family][item.slug], `${item.family}.${item.slug}`);
            assert.ok(!blocked.has(`${item.family}.${item.slug}`), `blocked ${item.family}.${item.slug}`);
          }
          assert.ok(result.closest.shared <= fresh.maxShared, `${lesson.id}/${feel}/${fresh.id}: shares ${result.closest.shared}`);
          assert.ok(meta.presets.some((p) => p.id === result.basePreset));
          if (light === "dark") assert.equal(result.picks.backgroundTexture, "dark-royal");
          if (light === "light") assert.notEqual(result.picks.backgroundTexture, "dark-royal");
        }
      }
    }
  }
});

test("answers change the design", () => {
  const ctx = lessonCtx("workplace-ethics", "Ethics team");
  const designs = new Set(FEELS.map((feel) => JSON.stringify(Brief.suggestDesign(ctx, brief({ briefFeel: feel })).picks)));
  assert.ok(designs.size >= 5, `only ${designs.size} distinct designs from ${FEELS.length} feels`);
});

test("same answers give the same design; another version differs", () => {
  const ctx = lessonCtx("money-management", "Money team");
  const answers = brief({ briefFeel: "welcoming" });
  const first = Brief.suggestDesign(ctx, answers).picks;
  assert.deepEqual(Brief.suggestDesign(ctx, answers).picks, first);
  const others = [1, 2, 3, 4].map((v) => JSON.stringify(Brief.suggestDesign(ctx, { ...answers, briefVariant: v }).picks));
  assert.ok(others.some((p) => p !== JSON.stringify(first)), "no variant differed");
});

test("distinctness reports an existing lesson's own look as fully shared", () => {
  for (const preset of meta.presets) {
    const near = Brief.distinctness(meta, preset.defaults);
    assert.equal(near.shared, near.total);
    assert.equal(near.presetId, preset.id);
  }
});

test("mood words read as plain language", () => {
  assert.equal(Brief.moodWords("cards", "quiet-outline"), "Calm");
  assert.equal(Brief.moodWords("titleSlides", "diagonal-split"), "Lively · Relaxed");
  assert.equal(Brief.moodWords("cards", "no-such-card"), "");
});

test("brief answer ids match the catalog the schema is generated from", () => {
  const keys = { briefFeel: "feel", briefRoom: "room", briefFresh: "fresh", briefLight: "light" };
  for (const q of Brief.QUESTIONS) {
    assert.deepEqual(Array.from(q.options, (o) => o.id), meta.briefAnswers[keys[q.id]], q.id);
  }
});

test("the shared-save validator accepts a valid brief and rejects a bad one", () => {
  const fixture = JSON.parse(read("scripts/test-fixtures/bespoke/selection-money-management.json"));
  const brief = { feel: "welcoming", room: "active", fresh: "fresh", light: "dark", variant: "2" };
  assert.deepEqual(selectionErrors({ ...fixture, brief }, "money-management"), []);
  assert.deepEqual(selectionErrors(fixture, "money-management"), [], "a design without a brief stays valid");
  for (const bad of [{ ...brief, feel: "cheerful" }, { ...brief, variant: 2 }, { ...brief, extra: "x" }, { feel: "calm" }]) {
    assert.notDeepEqual(selectionErrors({ ...fixture, brief: bad }, "money-management"), [], JSON.stringify(bad));
  }
});
