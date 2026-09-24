#!/usr/bin/env node
// Shared-model regression checks: no account, service, deployment or teacher data.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { applyPreset, colorAvailability, contrast, contrastIssues, cssForDesign, defaultDesign, designSchema, inkFor, migrateV1, renderSlide, roleOptions, structuralErrors, validateDesign } from '../bespoke/builder-model.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'bespoke/builder-catalog.json'), 'utf8'));
const oldCatalog = JSON.parse(fs.readFileSync(path.join(root, 'bespoke/catalog.json'), 'utf8'));
const clone = value => JSON.parse(JSON.stringify(value));
let checked = 0;
function check(name, callback) { callback(); checked++; console.log(`PASS ${name}`); }

check('all 11 original palette colors and 12 existing families have local font assets', () => {
  assert.equal(catalog.palette.length, 11);
  assert.equal(catalog.fonts.length, 12);
  for (const pair of oldCatalog.fontPairings) for (const role of ['heading', 'body']) assert(catalog.fonts.some(font => font.family === pair[role]));
  for (const font of catalog.fonts) for (const source of font.sources) assert(fs.existsSync(path.join(root, 'fonts', source.file)), source.file);
  for (const color of catalog.palette) assert(contrast(color.hex, catalog.palette.find(c => c.id === inkFor(catalog, color.id)).hex) >= 4.5);
});

check('default and six editable brand presets are valid and independent copies', () => {
  assert.deepEqual(validateDesign(catalog, defaultDesign(catalog)), []);
  for (const item of catalog.presets) {
    const design = applyPreset(catalog, item.id);
    assert.deepEqual(validateDesign(catalog, design), [], item.id);
    design.roles.sidebar = 'mauve';
    design.slides.cards.count = '1';
    assert.deepEqual(item.design, applyPreset(catalog, item.id));
  }
});

check('independent edits and preset changes preserve sample text and unrelated choices', () => {
  const design = applyPreset(catalog, 'professional');
  const before = clone(design);
  design.fonts.heading = 'inter';
  assert.equal(design.fonts.body, before.fonts.body);
  assert.deepEqual(design.roles, before.roles);
  assert.deepEqual(design.slides, before.slides);
  design.samples.boxes[3] = 'A recoverable fourth box.';
  design.slides.cards.count = '1';
  const reopened = JSON.parse(JSON.stringify(design));
  reopened.slides.cards.count = '4';
  assert.equal(reopened.samples.boxes[3], 'A recoverable fourth box.');
  assert.deepEqual(applyPreset(catalog, 'fun', reopened).samples, reopened.samples);
});

check('every role offers the full palette; a surface change warns without mutating other choices', () => {
  const design = defaultDesign(catalog);
  for (const role of catalog.roles) assert.equal(roleOptions(catalog, design, role.id).length, 11);
  const white = colorAvailability(catalog, design, 'titleBackground', 'light');
  assert.equal(white.ok, true);
  assert(white.warnings.length);
  assert.equal(design.roles.titleText, 'light');
  const candidate = clone(design);
  candidate.roles.titleBackground = 'light';
  assert.deepEqual(structuralErrors(catalog, candidate), []);
  assert(validateDesign(catalog, candidate).some(error => error.includes('Title & divider headings')));
  assert.doesNotThrow(() => renderSlide(catalog, candidate, 'title'));
  assert.doesNotThrow(() => cssForDesign(catalog, candidate));
  candidate.roles.titleBackgroundEnd = 'light';
  candidate.roles.titleText = 'royal';
  candidate.roles.subtitle = 'royal';
  candidate.roles.dividerBackground = 'light';
  assert.deepEqual(validateDesign(catalog, candidate), []);
});

check('brand and contrast rules explain unsafe text and safe repairs', () => {
  const design = defaultDesign(catalog);
  for (const id of ['gold', 'accent']) {
    const choice = colorAvailability(catalog, design, 'body', id);
    assert.equal(choice.ok, false); assert.match(choice.reason, /reserved/);
  }
  assert.equal(colorAvailability(catalog, design, 'body', 'light').ok, false);
  assert.equal(colorAvailability(catalog, design, 'body', 'royal').ok, true);
  assert.equal(colorAvailability(catalog, design, 'sidebar', 'gold').ok, true);
  const invalid = clone(design);
  invalid.roles.subtitle = 'light'; invalid.roles.titleBackgroundEnd = 'light';
  assert(validateDesign(catalog, invalid).some(error => error.includes('Subtitle')));
  invalid.slides.title.colors = 'solid'; invalid.slides.title.layout = 'left';
  assert.deepEqual(validateDesign(catalog, invalid), []);
});

check('divider contrast checks selected text on solid and gradient backgrounds without repairing the draft', () => {
  const design = defaultDesign(catalog);
  for (const background of ['accent', 'light']) {
    design.roles.dividerBackground = background;
    const before = JSON.stringify(design);
    const issues = contrastIssues(catalog, design).filter(issue => issue.surface === 'dividerBackground');
    assert.deepEqual(issues.map(issue => issue.role), ['titleText', 'subtitle']);
    assert(issues.every(issue => issue.message.includes('chapter divider background')));
    assert.deepEqual(structuralErrors(catalog, design), []);
    assert.equal(colorAvailability(catalog, design, 'dividerBackground', background).ok, true);
    assert.doesNotThrow(() => cssForDesign(catalog, design));
    assert.equal(JSON.stringify(design), before);
  }
  design.roles.dividerBackground = 'dark';
  assert.deepEqual(validateDesign(catalog, design), []);
  design.slides.divider.colors = 'gradient';
  design.roles.titleBackgroundEnd = 'light';
  const issues = contrastIssues(catalog, design).filter(issue => issue.surface === 'dividerBackground');
  assert.equal(issues.length, 2);
  assert(issues.every(issue => issue.related.includes('titleBackgroundEnd')));
});

check('every current font works independently in both roles', () => {
  const design = defaultDesign(catalog);
  for (const font of catalog.fonts) for (const role of ['heading', 'body']) {
    const copy = clone(design); copy.fonts[role] = font.id;
    assert.deepEqual(validateDesign(catalog, copy), []);
    assert(cssForDesign(catalog, copy).includes(`--font-${role}: "${font.family}"`));
  }
});

check('1–4 boxes, title toggle and treatments drive markup without losing hidden copy', () => {
  const design = defaultDesign(catalog);
  design.samples.boxes = ['First\nSecond', 'Two', 'Three', 'Four'];
  for (const count of ['1', '2', '3', '4']) for (const titleBar of [true, false]) for (const treatment of ['paragraph', 'bullets', 'numbered']) {
    Object.assign(design.slides.cards, { count, titleBar, treatment });
    const html = renderSlide(catalog, design, 'cards');
    assert.equal((html.match(/class="slide-card bespoke-box"/g) || []).length, Number(count));
    assert.equal(html.includes('bespoke-title-bar'), titleBar);
    assert.equal(html.includes('<ul '), treatment === 'bullets');
    assert.equal(html.includes('<ol '), treatment === 'numbered');
    assert.deepEqual(design.samples.boxes, ['First\nSecond', 'Two', 'Three', 'Four']);
  }
});

check('untrusted sample copy is escaped and malformed saved designs are rejected', () => {
  const design = defaultDesign(catalog);
  design.samples.title = '<img src=x onerror="alert(1)">';
  design.samples.boxes[0] = '</p><script>bad()</script>';
  assert(!renderSlide(catalog, design, 'title').includes('<img'));
  assert(!renderSlide(catalog, design, 'cards').includes('<script'));
  for (const bad of [null, [], { ...design, injected: true }, { ...design, roles: null }, { ...design, slides: {} }, { ...design, samples: { ...design.samples, boxes: ['only one'] } }, { ...design, fonts: { heading: 'Franklin Gothic Book', body: 'outfit' } }]) assert(validateDesign(catalog, bad).length);
  const invalidCount = clone(design); invalidCount.slides.cards.count = 4;
  assert(structuralErrors(catalog, invalidCount).length);
  assert.throws(() => cssForDesign(catalog, design, { fontBase: 'https://example.org' }));
  assert.equal(designSchema(catalog).additionalProperties, false);
});

check('all decision values produce a serializable model and shared styles', () => {
  for (const group of catalog.slideGroups) for (const decision of group.decisions) for (const option of decision.options) {
    const design = defaultDesign(catalog);
    design.slides[group.id][decision.id] = option.id;
    assert.deepEqual(structuralErrors(catalog, JSON.parse(JSON.stringify(design))), []);
    assert(renderSlide(catalog, design, group.id).includes(`data-kind="${group.id}"`));
    assert(cssForDesign(catalog, design).includes('--role-body:'));
  }
  const css = cssForDesign(catalog, defaultDesign(catalog), { canonical: false });
  assert(!css.includes(', body {'));
  const canonical = cssForDesign(catalog, defaultDesign(catalog));
  for (const selector of ['.slide-title', '.sidebar', '.slide-section', '.card', '.activity-box', '.video-container']) assert(canonical.includes(selector));
});

check('v1 migration preserves independent fonts and sample copy and discloses approximations', () => {
  const old = JSON.parse(fs.readFileSync(path.join(root, 'scripts/test-fixtures/bespoke/selection-money-management.json'), 'utf8'));
  const original = JSON.stringify(old);
  const { design, warnings } = migrateV1(old, catalog, oldCatalog);
  assert.equal(design.fonts.heading, 'dm-serif-display');
  assert.equal(design.fonts.body, 'outfit');
  assert.equal(design.samples.title, old.lesson.displayTitle);
  assert.equal(design.samples.subtitle, old.lesson.subtitle);
  assert.equal(design.samples.boxes[0], old.sampleContent.bullets);
  assert.equal(design.samples.boxes[1], old.sampleContent.mythReality);
  assert(warnings.some(warning => warning.includes('chapter')));
  assert(warnings.some(warning => warning.includes('approximated')));
  assert.equal(JSON.stringify(old), original);
  assert.deepEqual(structuralErrors(catalog, design), []);
});

console.log(`BeSpoke builder model: ${checked} checks passed.`);
