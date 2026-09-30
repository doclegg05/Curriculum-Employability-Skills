import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {
  SECTIONS, advance, back, buildQuestions, byIdMap, jumpToQuestion, jumpToSection,
  normalizeGuide, questionAt, sectionsOf, skipSection, startGuide
} from '../bespoke/guide/questions.mjs';

export const catalog = JSON.parse(fs.readFileSync(new URL('../bespoke/builder-catalog.json', import.meta.url), 'utf8'));
const all = buildQuestions(catalog);
const byId = byIdMap(all);

test('the guide has 40 questions, or 39 when the team is already filled in', () => {
  assert.equal(buildQuestions(catalog).length, 40);
  assert.equal(buildQuestions(catalog, { teamComplete: true }).length, 39);
  assert.equal(buildQuestions(catalog, { teamComplete: true }).some(q => q.kind === 'team'), false);
});

test('sections run start, shared, then one per slide type in lesson order', () => {
  const seen = [...new Set(all.map(q => q.section))];
  assert.deepEqual(seen, SECTIONS.map(s => s.id));
  assert.deepEqual(seen.slice(2), ['title', 'divider', 'cards', 'video', 'activity']);
});

test('inside a slide type layout comes first, recap comes last', () => {
  for (const kind of ['title', 'divider', 'cards', 'video', 'activity']) {
    const list = all.filter(q => q.section === kind);
    assert.equal(list[0].kind, 'decision');
    assert.equal(list[0].decision, 'layout', kind);
    assert.equal(list.at(-1).kind, 'recap', kind);
    const firstColor = list.findIndex(q => q.kind === 'background');
    const lastDecision = list.map(q => q.kind).lastIndexOf('decision');
    assert.ok(firstColor > lastDecision, `${kind} asks background after its structural decisions`);
  }
});

test('colors and watermark decisions are not asked as structural questions', () => {
  assert.equal(all.some(q => q.kind === 'decision' && ['colors', 'watermark'].includes(q.decision)), false);
  assert.ok(byId.get('divider.watermark'), 'divider has a watermark question of its own');
  assert.equal(byId.has('video.text'), false, 'video body text is hidden by the model, so it is not asked');
});

test('every question id is unique', () => {
  assert.equal(new Set(all.map(q => q.id)).size, all.length);
});

test('startGuide, advance and back walk the list and finish cleanly', () => {
  let g = startGuide(all);
  assert.equal(g.on, true);
  g = advance(g);
  assert.equal(g.index, 1);
  assert.equal(back(g).index, 0);
  assert.equal(back(back(g)).index, 0, 'Back stops at the first question');
  for (let i = 0; i < all.length + 3; i += 1) g = advance(g);
  assert.equal(g.done, true);
  assert.equal(g.on, false);
});

test('advance never mutates its input', () => {
  const g = Object.freeze(startGuide(all));
  advance(g);
  assert.equal(g.index, 0);
});

test('teams can jump back to reached sections and never ahead of them', () => {
  let g = startGuide(all);
  for (let i = 0; i < 12; i += 1) g = advance(g);
  const sections = sectionsOf(g, byId);
  assert.equal(sections.find(s => s.id === 'start').reached, true);
  assert.equal(sections.find(s => s.id === 'activity').reached, false);
  const before = g.index;
  assert.equal(jumpToSection(g, 'activity', byId).index, before, 'an unreached section stays put');
  assert.equal(jumpToSection(g, 'start', byId).index, 0);
  assert.equal(jumpToQuestion(g, 'activity.layout').index, before);
  assert.equal(jumpToQuestion(g, 'preset').index, all.findIndex(q => q.id === 'preset'));
});

test('skipSection moves to the first question of the next section, or finishes', () => {
  let g = jumpToQuestion({ ...startGuide(all), furthest: all.length - 1 }, 'title.logo');
  g = skipSection(g, byId);
  assert.equal(questionAt(g, byId).id, 'divider.layout');
  const last = { ...startGuide(all), index: all.length - 2, furthest: all.length - 1 };
  const finished = skipSection(last, byId);
  assert.equal(finished.done, true);
});

test('normalizeGuide rejects garbage and repairs out-of-range positions', () => {
  assert.equal(normalizeGuide(null, all), null);
  assert.equal(normalizeGuide('x', all), null);
  assert.equal(normalizeGuide({ ids: 'nope' }, all), null);
  assert.equal(normalizeGuide({ ids: ['not-a-question'] }, all), null);
  const fixed = normalizeGuide({ ids: ['preset', 'ghost', 'shared.fonts'], index: 99, furthest: -4, on: true }, all);
  assert.deepEqual(fixed.ids, ['preset', 'shared.fonts']);
  assert.equal(fixed.index, 1);
  assert.equal(fixed.furthest, 1);
  assert.equal(fixed.on, true);
  assert.equal(fixed.done, false);
});
