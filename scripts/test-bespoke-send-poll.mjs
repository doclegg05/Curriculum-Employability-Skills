import assert from 'node:assert/strict';
import test from 'node:test';

const { pollStep, POLL_MS, POLL_MAX_MS, SLOW_AFTER_MS, CHECKING_NOTICE, SLOW_NOTICE } = await import('../bespoke/send-poll.mjs');

const processing = { ok: true, status: 'processing' };
const offline = { ok: false, error: 'network', message: 'Could not reach the shared store.' };

test('a receipt ends the wait', () => {
  assert.deepEqual(pollStep({ result: { ok: true, status: 'received' } }), { kind: 'received' });
});

test('a run that failed ends the wait', () => {
  assert.deepEqual(pollStep({ result: { ok: true, status: 'failed' } }), { kind: 'failed' });
});

test('a request still processing is checked again at the usual pace', () => {
  assert.deepEqual(pollStep({ result: processing, failures: 2 }), { kind: 'wait', retryIn: POLL_MS, failures: 0, notice: null });
});

test('one failed check keeps checking instead of ending the wait', () => {
  const step = pollStep({ result: offline });
  assert.equal(step.kind, 'wait');
  assert.equal(step.failures, 1);
  assert.equal(step.retryIn, POLL_MS * 2);
  assert.equal(step.notice, CHECKING_NOTICE);
});

test('repeated failures slow down, up to a ceiling', () => {
  assert.equal(pollStep({ result: offline, failures: 1 }).retryIn, POLL_MS * 4);
  assert.equal(pollStep({ result: offline, failures: 9 }).retryIn, POLL_MAX_MS);
});

test('a timeout, a busy service and an unreadable answer are all worth another check', () => {
  for (const result of [{ ok: false, error: 'timeout' }, { ok: false, error: 'store', httpStatus: 502 }, { ok: false, error: 'setup', httpStatus: 503 }, { ok: false, httpStatus: 429 }]) {
    assert.equal(pollStep({ result }).kind, 'wait', JSON.stringify(result));
  }
});

test('a refused code or request stops the wait, because asking again changes nothing', () => {
  assert.deepEqual(pollStep({ result: { ok: false, error: 'code', httpStatus: 403 } }), { kind: 'stopped' });
  assert.deepEqual(pollStep({ result: { ok: false, error: 'selection', httpStatus: 400 } }), { kind: 'stopped' });
});

test('after five minutes the team is told it is slow and to tell Britt', () => {
  assert.equal(pollStep({ result: processing, elapsedMs: SLOW_AFTER_MS }).notice, SLOW_NOTICE);
  assert.equal(pollStep({ result: offline, elapsedMs: SLOW_AFTER_MS + 1 }).notice, SLOW_NOTICE);
  assert.match(SLOW_NOTICE, /tell Britt/);
});
