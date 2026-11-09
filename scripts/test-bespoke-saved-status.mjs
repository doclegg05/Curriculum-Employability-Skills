process.env.TZ = 'America/New_York';

import assert from 'node:assert/strict';
import test from 'node:test';

const { EDIT_LINE, formatSavedTime, savedStatus } = await import('../bespoke/saved-status.mjs');

const SAVED_AT = '2026-11-06T14:10:00Z';
const SAVED_TEXT = 'Friday, November 6 at 9:10 AM';
const CONFLICT_AT = '2026-11-06T16:30:00Z';
const CONFLICT_TEXT = 'Friday, November 6 at 11:30 AM';
const DRAFT_AT = '2026-11-05T22:05:00Z';
const DRAFT_TEXT = 'Thursday, November 5 at 5:05 PM';

const base = {
  access: 'edit', phase: 'ready', hasSave: true, savedAt: SAVED_AT, matchesSave: true,
  saving: false, saveFailed: false, conflict: null, keptChanges: false, converted: false,
  untouchedPresets: false, aheadSaving: false, priorWork: false, dismissed: false, draftChangedAt: null,
};
const facts = (over) => ({ ...base, ...over });

function check(f, card, badgeText) {
  const out = savedStatus(f);
  if (card === null) assert.equal(out.card, null);
  else {
    assert.equal(out.card.kind, card.kind);
    assert.equal(out.card.heading, card.heading);
    assert.deepEqual(out.card.lines, card.lines);
    assert.deepEqual(out.card.actions, card.actions);
  }
  assert.equal(out.badge?.text, badgeText);
  return out;
}

test('formatSavedTime uses weekday and local time', () => {
  assert.equal(formatSavedTime('2026-11-06T14:10:00Z', 'en-US'), 'Friday, November 6 at 9:10 AM');
});

test('state 1: checking shows the checking card and badge', () => {
  const out = check(facts({ phase: 'checking', hasSave: false, savedAt: null, matchesSave: false }),
    { kind: 'checking', heading: "Checking your team's saved design…", lines: [], actions: [] }, 'Checking…');
  assert.equal(out.badge.tone, 'busy');
});

test('state 2: a failed check says the browser work is still here (edit)', () => {
  const out = check(facts({ phase: 'failed', hasSave: false, savedAt: null }),
    { kind: 'failed', heading: "We couldn't check your team's saved design.", lines: ['Your browser work is still here.'], actions: ['retry'] },
    "Couldn't check");
  assert.equal(out.badge.tone, 'error');
});

test('state 2: a failed check for view access has no extra line and no badge', () => {
  check(facts({ access: 'view', phase: 'failed', hasSave: false, savedAt: null }),
    { kind: 'failed', heading: "We couldn't check this team's saved design.", lines: [], actions: ['retry'] }, undefined);
});

test('state 3: an opened save says saved, with its time and the edit line', () => {
  const out = check(facts({}),
    { kind: 'saved', heading: "You're looking at your team's saved design", lines: [`Saved ${SAVED_TEXT}`, EDIT_LINE], actions: ['choices', 'ok'] }, 'Saved');
  assert.equal(out.badge.tone, 'ok');
});

test('state 3: prior browser work adds the recover line', () => {
  check(facts({ priorWork: true }),
    {
      kind: 'saved', heading: "You're looking at your team's saved design",
      lines: [`Saved ${SAVED_TEXT}`, EDIT_LINE, 'Work from this browser before you entered the code is in ⋯ > Recover previous draft.'],
      actions: ['choices', 'ok'],
    }, 'Saved');
});

test('state 3: view access shows the save time and no badge', () => {
  check(facts({ access: 'view' }),
    { kind: 'saved', heading: "You're looking at this team's saved design", lines: [`Saved ${SAVED_TEXT}`], actions: ['choices', 'ok'] }, undefined);
});

test('a dismissed card leaves the badge', () => {
  const out = savedStatus(facts({ dismissed: true }));
  assert.equal(out.card, null);
  assert.equal(out.badge.text, 'Saved');
});

test('state 4: an edit after opening hides the card and says changes not saved', () => {
  const out = check(facts({ matchesSave: false }), null, 'Changes not saved');
  assert.equal(out.badge.tone, 'warn');
});

test('state 4: saving shows Saving…', () => {
  const out = check(facts({ matchesSave: false, saving: true }), null, 'Saving…');
  assert.equal(out.badge.tone, 'busy');
});

test('state 4: a failed save shows Save failed', () => {
  const out = check(facts({ matchesSave: false, saveFailed: true }), null, 'Save failed');
  assert.equal(out.badge.tone, 'error');
});

test('an edit while saving is not saved', () => {
  check(facts({ phase: 'ready', hasSave: true, matchesSave: false, saving: false }), null, 'Changes not saved');
});

test('state 5: a conflict names both times and offers the two choices', () => {
  check(facts({ matchesSave: false, conflict: { revision: 'r2', savedAt: CONFLICT_AT }, draftChangedAt: DRAFT_AT }),
    {
      kind: 'conflict', heading: "This browser has changes that aren't in the team's saved design.",
      lines: [`The browser changes are from ${DRAFT_TEXT}.`, `The team's design was saved again on ${CONFLICT_TEXT}.`],
      actions: ['useSaved', 'keepChanges'],
    }, 'Changes not saved');
});

test('state 5: a conflict without a draft time leaves out the browser line', () => {
  check(facts({ matchesSave: false, conflict: { revision: 'r2', savedAt: CONFLICT_AT } }),
    {
      kind: 'conflict', heading: "This browser has changes that aren't in the team's saved design.",
      lines: [`The team's design was saved again on ${CONFLICT_TEXT}.`], actions: ['useSaved', 'keepChanges'],
    }, 'Changes not saved');
});

test('state 5: keeping the changes drops the conflict card', () => {
  check(facts({ matchesSave: false, conflict: { revision: 'r2', savedAt: CONFLICT_AT }, keptChanges: true }), null, 'Changes not saved');
});

test('state 6: latest changes being saved', () => {
  check(facts({ matchesSave: false, aheadSaving: true, saving: true }),
    { kind: 'ahead', heading: 'Your latest changes are being saved for the team', lines: [], actions: [] }, 'Saving…');
});

test('state 6: ahead and the save failed', () => {
  check(facts({ matchesSave: false, aheadSaving: true, saveFailed: true }),
    { kind: 'ahead', heading: 'Your latest changes are only in this browser.', lines: ['Choose Save for the team to try again.'], actions: ['ok'] },
    'Save failed');
});

test('state 7: an empty team with untouched presets has no badge', () => {
  check(facts({ hasSave: false, savedAt: null, matchesSave: false, untouchedPresets: true }),
    {
      kind: 'empty', heading: "Your team hasn't saved a design yet.",
      lines: ["You're looking at the starting presets.", EDIT_LINE], actions: ['ok'],
    }, undefined);
});

test('state 7: an empty team with work on screen says changes not saved', () => {
  check(facts({ hasSave: false, savedAt: null, matchesSave: false }),
    {
      kind: 'empty', heading: "Your team hasn't saved a design yet.",
      lines: ['The changes on screen are only in this browser until you choose Save for the team.', EDIT_LINE], actions: ['ok'],
    }, 'Changes not saved');
});

test('state 9: a converted save for edit access has unsaved updates', () => {
  check(facts({ converted: true, matchesSave: false }),
    {
      kind: 'converted', heading: "Opened your team's saved design with updates.",
      lines: ["These updates haven't been saved yet.", `Saved ${SAVED_TEXT}`], actions: ['choices', 'ok'],
    }, 'Changes not saved');
});

test('state 10: a converted save for view access reads as saved, with no badge', () => {
  check(facts({ access: 'view', converted: true, matchesSave: false }),
    {
      kind: 'saved',
      heading: "You're looking at this team's saved design, shown with updates to the current design standard",
      lines: [`Saved ${SAVED_TEXT}`], actions: ['choices', 'ok'],
    }, undefined);
});

test('the copy has no em dashes', () => {
  const states = [
    facts({ phase: 'checking' }), facts({ phase: 'failed' }), facts({ priorWork: true }),
    facts({ matchesSave: false, conflict: { revision: 'r', savedAt: CONFLICT_AT }, draftChangedAt: DRAFT_AT }),
    facts({ matchesSave: false, aheadSaving: true, saveFailed: true }), facts({ hasSave: false, untouchedPresets: true }),
    facts({ converted: true }), facts({ access: 'view', converted: true }),
  ];
  for (const f of states) {
    const { card } = savedStatus(f);
    assert.ok(!JSON.stringify(card).includes('—'));
  }
});
