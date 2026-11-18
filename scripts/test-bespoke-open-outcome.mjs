import assert from 'node:assert/strict';
import test from 'node:test';

const { openOutcome } = await import('../bespoke/open-outcome.mjs');

const base = {
  dirty: false, replace: false, editedWhileOpening: false, remoteChanged: false,
  incomingKey: 'saved', currentKey: 'screen', hasWork: true,
};
const outcome = over => openOutcome({ ...base, ...over });

test('a page load whose saved design is already on screen writes no recovery copy', () => {
  // The recovery copy holds work the team set aside. A reload must not swap it for a copy of the screen.
  assert.deepEqual(outcome({ replace: true, incomingKey: 'same', currentKey: 'same' }), { action: 'adopt', keepCopy: false });
});

test('a clean page load takes a newer saved design and keeps a recovery copy', () => {
  assert.deepEqual(outcome({ replace: true, remoteChanged: true }), { action: 'apply', keepCopy: true });
});

test('Open team design with nothing unsaved takes the saved design without a recovery copy', () => {
  assert.deepEqual(outcome({ remoteChanged: true }), { action: 'apply', keepCopy: false });
});

test("a save whose reply was lost is adopted, not reported as someone else's save", () => {
  // The tab closed mid-save: the service has this design under a revision the browser never heard of.
  assert.deepEqual(outcome({ dirty: true, remoteChanged: true, incomingKey: 'same', currentKey: 'same' }),
    { action: 'adopt', keepCopy: false });
});

test('unsaved work against a different newer save is a conflict', () => {
  assert.deepEqual(outcome({ dirty: true, remoteChanged: true }), { action: 'conflict', keepCopy: false });
});

test('unsaved work against the save it started from is left alone', () => {
  assert.deepEqual(outcome({ dirty: true }), { action: 'blocked', keepCopy: false });
});

test("Use the team's saved design replaces unsaved work and keeps a recovery copy", () => {
  assert.deepEqual(outcome({ dirty: true, replace: true, remoteChanged: true }), { action: 'apply', keepCopy: true });
});

test('an edit made while the saved design was being fetched is never replaced', () => {
  assert.deepEqual(outcome({ dirty: true, replace: true, editedWhileOpening: true, remoteChanged: true }),
    { action: 'conflict', keepCopy: false });
});

test('a team with no save starts from the presets, keeping a copy only of real work', () => {
  assert.deepEqual(outcome({ replace: true, incomingKey: null }), { action: 'reset', keepCopy: true });
  assert.deepEqual(outcome({ replace: true, incomingKey: null, hasWork: false }), { action: 'reset', keepCopy: false });
  assert.deepEqual(outcome({ incomingKey: null }), { action: 'reset', keepCopy: false });
});

test('the saved version this browser already has is adopted, however the service words it', () => {
  // A stored design need not match the page's own wording of it (an older save, a design updated on open).
  // Same version and nothing unsaved here means nothing changes, so the recovery copy is left alone.
  assert.deepEqual(outcome({ replace: true }), { action: 'adopt', keepCopy: false });
  assert.deepEqual(outcome({}), { action: 'adopt', keepCopy: false });
});
