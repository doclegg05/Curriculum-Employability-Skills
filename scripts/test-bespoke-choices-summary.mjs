import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'bespoke/builder-catalog.json'), 'utf8'));
const { applyPreset, setRoleStyle } = await import('../bespoke/builder-model.mjs');
const { cardHighlights, designSummary } = await import('../bespoke/choices-summary.mjs');

const SECTIONS = ['Starting look', 'Colors', 'Fonts', 'Title slide', 'Divider', 'Text boxes', 'Video', 'Activity'];
const rowsOf = (summary, section) => summary.find(item => item.section === section).rows;

test('highlights name the preset look, three colors and the font pair', () => {
  const highlights = cardHighlights(catalog, applyPreset(catalog, 'professional'));
  assert.equal(highlights.look, 'Editorial');
  assert.equal(highlights.colors.length, 3);
  for (const color of highlights.colors) assert.match(color.hex, /^#[0-9a-f]{6}$/);
  assert.ok(highlights.fonts.includes(' + '));
});

test('a customized design is Your own design', () => {
  const design = { ...applyPreset(catalog, 'professional'), startingPoint: 'custom' };
  assert.equal(cardHighlights(catalog, design).look, 'Your own design');
});

test('the summary lists sections in order and never shows an id', () => {
  const design = applyPreset(catalog, 'modern');
  const summary = designSummary(catalog, design);
  assert.deepEqual(summary.map(item => item.section), SECTIONS);
  const ids = new Set([
    ...catalog.colors.map(item => item.id),
    ...catalog.fonts.map(item => item.id),
    ...catalog.slideGroups.flatMap(group => group.decisions.flatMap(decision => decision.options.map(option => option.id))),
  ].filter(id => typeof id === 'string' && id.length > 1));
  for (const { rows } of summary) for (const row of rows) {
    assert.ok(!ids.has(row.value), `row "${row.label}" shows an id: ${row.value}`);
    assert.ok(!/undefined|null/.test(row.value), `row "${row.label}" shows ${row.value}`);
  }
  for (const row of rowsOf(summary, 'Colors').filter(item => item.label.endsWith('color'))) assert.match(row.hex, /^#[0-9a-f]{6}$/);
});

test('typed words come back in the summary', () => {
  const design = setRoleStyle(catalog, applyPreset(catalog, 'professional'), 'video', 'headingText', 'Watch Dana budget');
  const rows = rowsOf(designSummary(catalog, design), 'Video');
  assert.ok(rows.some(row => row.value === 'Watch Dana budget'));
});

test('hidden words are skipped and text boxes follow the box count', () => {
  const base = applyPreset(catalog, 'professional');
  const hidden = setRoleStyle(catalog, base, 'video', 'headingVisible', false);
  assert.ok(!rowsOf(designSummary(catalog, hidden), 'Video').some(row => row.value === 'See a skill in action'));
  const boxes = rowsOf(designSummary(catalog, base), 'Text boxes').filter(row => /^Text box \d/.test(row.label));
  assert.equal(boxes.length, Number(base.slides.cards.count));
});
