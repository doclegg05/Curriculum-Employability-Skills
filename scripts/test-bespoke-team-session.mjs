import assert from 'node:assert/strict';
import test from 'node:test';
import { pendingForSession } from '../bespoke/team-session.mjs';

const pending = { stage: 'receipt', lessonId: 'money-management', editCode: 'K7QX-M3PD', submissionId: 'sub-1' };

test('a pending Send shows for the team that sent it', () => {
  assert.equal(pendingForSession(pending, { lessonId: 'money-management', editCode: 'K7QX-M3PD' }), pending);
});

test('another lesson in the same browser sees no pending Send', () => {
  assert.equal(pendingForSession(pending, { lessonId: 'goal-setting', editCode: 'K7QX-M3PD' }), null);
});

test('another code for the same lesson sees no pending Send', () => {
  assert.equal(pendingForSession(pending, { lessonId: 'money-management', editCode: 'R4TW-9HNC' }), null);
});

test('with no team session, or no pending Send, there is nothing to show', () => {
  assert.equal(pendingForSession(pending, null), null);
  assert.equal(pendingForSession(null, { lessonId: 'money-management', editCode: 'K7QX-M3PD' }), null);
  assert.equal(pendingForSession('not an object', { lessonId: 'money-management', editCode: 'K7QX-M3PD' }), null);
});
