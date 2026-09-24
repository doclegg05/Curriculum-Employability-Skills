import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { CHARACTERISTICS, compareDesign } from '../bespoke/similarity.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (name) => JSON.parse(fs.readFileSync(path.join(root, name), 'utf8'));
const fingerprints = read('bespoke/lesson-fingerprints.json');
const catalog = read('bespoke/builder-catalog.json');
const get = (object, key) => key.split('.').reduce((value, part) => value?.[part], object);
function set(object, key, value) {
  const parts = key.split('.'); let target = object;
  for (const part of parts.slice(0, -1)) target = target[part] ||= {};
  target[parts.at(-1)] = value;
}
const design = () => structuredClone(catalog.defaultDesign || catalog.defaults);
function alternative(key, current) {
  let options;
  if (key.startsWith('roles.')) options = catalog.palette.map((c) => c.id);
  else if (key.startsWith('fonts.')) options = catalog.fonts.map((f) => f.id);
  else if (key === 'background') options = catalog.backgrounds.map((b) => b.id);
  else {
    const [, group, field] = key.split('.');
    options = catalog.slideGroups.find((g) => g.id === group)?.decisions.find((d) => d.id === field)?.options.map((o) => o.id);
  }
  const next = options?.find((value) => value !== current);
  assert.notEqual(next, undefined, `No supported alternative for ${key}`);
  return next;
}

test('six reference sources are current actual lesson files with per-characteristic evidence', () => {
  assert.equal(fingerprints.lessons.length, 6);
  for (const lesson of fingerprints.lessons) {
    assert.equal(lesson.source.path, `lesson-${lesson.id}/index.html`);
    const actualHash = crypto.createHash('sha256').update(fs.readFileSync(path.join(root, lesson.source.path))).digest('hex');
    assert.equal(lesson.source.sha256, actualHash);
    for (const { key } of CHARACTERISTICS) {
      assert.notEqual(get(lesson, key), undefined, `${lesson.id}: missing ${key}`);
      assert.ok(lesson.evidence[key]?.selector, `${lesson.id}: missing ${key} source`);
      if (get(lesson, key) === null) assert.ok(lesson.evidence[key].reason, `${lesson.id}: unexplained unknown ${key}`);
    }
    for (const value of Object.values(lesson.roles)) if (value != null) assert.ok(catalog.palette.some((p) => p.id === value));
    for (const value of Object.values(lesson.fonts)) if (value != null) assert.ok(catalog.fonts.some((f) => f.id === value));
  }
});

test('actual remixes are not replaced by stale preset or nearest-color aliases', () => {
  const find = (id) => fingerprints.lessons.find((l) => l.id === id);
  assert.equal(find('time-management').roles.sidebar, null, 'off-palette composite sidebar must be unknown');
  assert.equal(find('time-management').slides.divider.layout, null, 'custom split composition must not count as ordinary left alignment');
  assert.equal(find('communicating-with-the-public').fonts.heading, null, 'Bookman declaration must not be mislabeled Crimson Pro');
  assert.equal(find('communicating-with-the-public').roles.titleBackground, null, 'photo overlay must not be a guessed swatch');
  assert.equal(find('communicating-with-the-public').slides.cards.count, null, 'mixed 2/4-box slides must not get a single count');
  assert.equal(find('interview-skills').slides.title.layout, 'split');
  assert.equal(find('employee-accountability').slides.cards.count, '4');
});

test('every measured color, independent font, layout and style contributes exactly once', () => {
  let checked = 0;
  for (const lesson of fingerprints.lessons) {
    const matching = design();
    for (const { key } of CHARACTERISTICS) if (get(lesson, key) != null) set(matching, key, get(lesson, key));
    const [base] = compareDesign({ lessons: [lesson] }, matching);
    assert.equal(base.shared, base.total);
    for (const { key } of CHARACTERISTICS) {
      if (get(lesson, key) == null) continue;
      const changed = structuredClone(matching);
      const value = get(lesson, key);
      set(changed, key, alternative(key, value));
      const [after] = compareDesign({ lessons: [lesson] }, changed);
      assert.equal(after.shared, base.shared - 1, `${lesson.id} ${key}`);
      assert.equal(after.total, base.total);
      assert.deepEqual(after.differences.map((d) => d.key), [key]);
      checked += 1;
    }
  }
  assert.ok(checked > 60, 'exercise the real measured comparisons');
});

test('unknowns never count even when both sides are null; missing user values are explained', () => {
  const empty = { id: 'unknown', title: 'Unknown', evidence: {} };
  const [result] = compareDesign({ lessons: [empty] }, {});
  assert.equal(result.shared, 0);
  assert.equal(result.total, 0);
  assert.equal(result.unknown.length, CHARACTERISTICS.length);
  assert.ok(result.unknown.every((u) => u.reason));
  const [missing] = compareDesign(fingerprints, {});
  assert.equal(missing.total, 0);
  assert.ok(missing.unknown.some((u) => u.reason.includes('not set')));
});

test('false title-bar selections are comparable values, not unknowns', () => {
  const reference = { id: 'synthetic', title: 'Synthetic', slides: { cards: { titleBar: false } } };
  const [result] = compareDesign({ lessons: [reference] }, { slides: { cards: { titleBar: false } } });
  assert.equal(result.total, 1);
  assert.equal(result.shared, 1);
  assert.equal(result.matches[0].key, 'slides.cards.titleBar');
});

test('ranking favors shared evidence over tiny perfect coverage; ties are deterministic', () => {
  const one = { id: 'tiny', title: 'Tiny', roles: { sidebar: 'dark' } };
  const more = { id: 'more', title: 'More', roles: { sidebar: 'dark', titleText: 'light', body: 'gray' } };
  const ranked = compareDesign({ lessons: [one, more] }, { roles: { sidebar: 'dark', titleText: 'light', body: 'royal' } });
  assert.equal(ranked[0].id, 'more');
  assert.equal(ranked[0].rankBasis, 'shared-count');
  assert.equal(ranked[0].advisory, true);
});

test('similarity is read-only and supports a missing library safely', () => {
  const draft = design(), before = JSON.stringify(draft), sources = JSON.stringify(fingerprints);
  const result = compareDesign(fingerprints, draft);
  assert.equal(JSON.stringify(draft), before);
  assert.equal(JSON.stringify(fingerprints), sources);
  assert.deepEqual(compareDesign(null, draft), []);
  assert.ok(result.every((r) => r.total + r.unknown.length === CHARACTERISTICS.length));
  assert.ok(result.every((r) => !('percentage' in r) && !('blocked' in r)));
});
