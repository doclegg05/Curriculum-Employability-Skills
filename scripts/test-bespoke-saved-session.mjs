process.env.TZ = 'America/New_York';

import assert from 'node:assert/strict';
import test from 'node:test';

const { editFacts, validTime } = await import('../bespoke/saved-session.mjs');
const { savedStatus } = await import('../bespoke/saved-status.mjs');

const SAVED_AT = '2026-11-06T14:10:00Z';
const session = (over = {}) => ({ lessonId: 'money-management', revision: 'r1', savedAt: SAVED_AT, ...over });
const ui = (over = {}) => ({
  openPhase: 'ready', savingFor: null, saveFailed: false, convertedUnsaved: false, meaningfulDesign: true,
  aheadSaving: false, priorWork: false, cardDismissed: false, ...over,
});

test('validTime keeps an ISO time and drops anything formatSavedTime would throw on', () => {
  assert.equal(validTime(SAVED_AT), SAVED_AT);
  for (const bad of ['not a time', '', null, undefined, 42]) assert.equal(validTime(bad), null);
});

test('a malformed savedAt from the service skips the time instead of throwing', () => {
  const facts = editFacts(session({ savedAt: '2026-13-45T99:99:99Z' }), ui(), false);
  assert.equal(facts.savedAt, null);
  assert.deepEqual(savedStatus(facts).card.lines.filter(line => line.startsWith('Saved ')), []);
});

test('a session with a save that matches the screen is saved', () => {
  const facts = editFacts(session(), ui(), false);
  assert.equal(facts.access, 'edit');
  assert.equal(facts.hasSave, true);
  assert.equal(facts.matchesSave, true);
  assert.equal(savedStatus(facts).badge.text, 'Saved');
});

test('unsaved work, or no save at all, never matches', () => {
  assert.equal(editFacts(session(), ui(), true).matchesSave, false);
  assert.equal(editFacts(session({ revision: null }), ui(), false).matchesSave, false);
});

test('saving is true only while this session has a save in flight', () => {
  const current = session();
  assert.equal(editFacts(current, ui({ savingFor: current }), true).saving, true);
  assert.equal(editFacts(current, ui({ savingFor: session() }), true).saving, false, 'another session’s save is not this one');
});

test('untouched presets means no save and no meaningful design', () => {
  assert.equal(editFacts(session({ revision: null }), ui({ meaningfulDesign: false }), true).untouchedPresets, true);
  assert.equal(editFacts(session({ revision: null }), ui({ meaningfulDesign: true }), true).untouchedPresets, false);
  assert.equal(editFacts(session(), ui({ meaningfulDesign: false }), false).untouchedPresets, false);
});

test('the open, save and card flags pass through; conflict waits for its own task', () => {
  const facts = editFacts(session(), ui({ openPhase: 'failed', saveFailed: true, convertedUnsaved: true, aheadSaving: true, priorWork: true, cardDismissed: true }), true);
  assert.deepEqual(
    { phase: facts.phase, saveFailed: facts.saveFailed, converted: facts.converted, aheadSaving: facts.aheadSaving, priorWork: facts.priorWork, dismissed: facts.dismissed, conflict: facts.conflict, keptChanges: facts.keptChanges, draftChangedAt: facts.draftChangedAt },
    { phase: 'failed', saveFailed: true, converted: true, aheadSaving: true, priorWork: true, dismissed: true, conflict: null, keptChanges: false, draftChangedAt: null });
});
