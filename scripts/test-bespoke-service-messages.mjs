import assert from 'node:assert/strict';
import test from 'node:test';

const { teacherMessage, wrongCodeMessage, staleCodeMessage, SERVICE_DOWN, SERVICE_UNREADABLE } = await import('../bespoke/service-messages.mjs');

test('a service that cannot finish says the work is safe and when to tell Britt', () => {
  const message = teacherMessage({ ok: false, error: 'store', message: 'The connected store could not complete this request. Keep your working copy and try again.' });
  assert.equal(message, SERVICE_DOWN);
  assert.match(message, /safe in this browser/);
  assert.match(message, /tell Britt/);
  assert.doesNotMatch(message, /store|revision|receipt/i);
});

test('an answer BeSpoke cannot read gets the same treatment', () => {
  assert.equal(teacherMessage({ ok: false, error: 'unreadable' }), SERVICE_UNREADABLE);
  assert.match(SERVICE_UNREADABLE, /tell Britt/);
});

test('every other message from the service is passed on as it is', () => {
  const message = 'A newer design is saved.';
  assert.equal(teacherMessage({ ok: false, error: 'conflict', message }), message);
  assert.equal(teacherMessage({ ok: true }), undefined);
});

test('a refused code names the lesson, because the right code under the wrong lesson is refused too', () => {
  const message = wrongCodeMessage('Goal Setting');
  assert.match(message, /Goal Setting/);
  assert.match(message, /Lesson/);
  assert.match(message, /OneDrive/);
  assert.doesNotMatch(message, /from Britt/);
});

test('a stored code that stopped working asks for the new one and says the work is kept', () => {
  const message = staleCodeMessage();
  assert.match(message, /no longer works/);
  assert.match(message, /kept/);
});
