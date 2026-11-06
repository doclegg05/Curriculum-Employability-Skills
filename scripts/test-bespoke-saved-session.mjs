process.env.TZ = 'America/New_York';

import assert from 'node:assert/strict';
import test from 'node:test';

const editModule = await import('../bespoke/saved-session.mjs');
const { editFacts, validTime } = editModule;
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

test('the open, save and card flags pass through; no conflict means none', () => {
  const facts = editFacts(session(), ui({ openPhase: 'failed', saveFailed: true, convertedUnsaved: true, aheadSaving: true, priorWork: true, cardDismissed: true }), true);
  assert.deepEqual(
    { phase: facts.phase, saveFailed: facts.saveFailed, converted: facts.converted, aheadSaving: facts.aheadSaving, priorWork: facts.priorWork, dismissed: facts.dismissed, conflict: facts.conflict, keptChanges: facts.keptChanges, draftChangedAt: facts.draftChangedAt },
    { phase: 'failed', saveFailed: true, converted: true, aheadSaving: true, priorWork: true, dismissed: true, conflict: null, keptChanges: false, draftChangedAt: null });
});

test('the local test page keeps the badge but never shows the card', () => {
  const { savedView } = editModule;
  const facts = editFacts(session(), ui(), false);
  assert.equal(savedView(facts, { localPreview: false }).card.heading, "You're looking at your team's saved design");
  const local = savedView(facts, { localPreview: true });
  assert.equal(local.card, null);
  assert.equal(local.badge.text, 'Saved');
  assert.deepEqual(savedView(null, { localPreview: false }), { card: null, badge: null });
});

const CONFLICT_AT = '2026-11-05T19:15:00Z';

test('a competing save and Keep these changes pass through to the facts', () => {
  const conflict = { revision: 'r2', savedAt: CONFLICT_AT };
  const waiting = editFacts(session(), ui({ cloudConflict: conflict }), true);
  assert.deepEqual(waiting.conflict, { revision: 'r2', savedAt: CONFLICT_AT });
  assert.equal(waiting.keptChanges, false);
  assert.equal(savedStatus(waiting).card.kind, 'conflict');
  assert.deepEqual(savedStatus(waiting).card.actions, ['useSaved', 'keepChanges']);
  const kept = editFacts(session(), ui({ cloudConflict: conflict, keptChanges: true }), true);
  assert.equal(kept.keptChanges, true);
  assert.equal(savedStatus(kept).card, null, 'Keep these changes closes the choice');
  assert.equal(savedStatus(kept).badge.text, 'Changes not saved');
});

test('a competing save with a malformed time names no date instead of throwing', () => {
  const facts = editFacts(session(), ui({ cloudConflict: { revision: 'r2', savedAt: 'garbage' } }), true);
  assert.equal(facts.conflict.savedAt, null);
  const { card } = savedStatus(facts);
  assert.equal(card.kind, 'conflict');
  assert.doesNotMatch(card.lines.join(' '), /December 31|1969|1970/);
});

test('the local test page shows the competing-versions choice, since nothing else offers it', () => {
  const { savedView } = editModule;
  const facts = editFacts(session(), ui({ cloudConflict: { revision: 'r2', savedAt: CONFLICT_AT } }), true);
  assert.equal(savedView(facts, { localPreview: true }).card.kind, 'conflict');
});

test('the replace question names the competing save time', () => {
  const { conflictSavedText } = editModule;
  assert.equal(conflictSavedText({ revision: 'r2', savedAt: CONFLICT_AT }), 'Thursday, November 5 at 2:15 PM');
  assert.equal(conflictSavedText({ revision: 'r2', savedAt: null }), 'most recently');
});

test('askReplace asks exactly the agreed question', async () => {
  const { replaceQuestion } = await import('../bespoke/replace-confirm.mjs');
  assert.equal(replaceQuestion('Thursday, November 5 at 2:15 PM'), 'This will replace the design saved Thursday, November 5 at 2:15 PM. Replace it?');
});
