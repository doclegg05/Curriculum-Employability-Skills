#!/usr/bin/env node
// Unit tests for the browser-test wait helpers: every wait ends, with a message naming what it waited for.
import test from 'node:test';
import assert from 'node:assert/strict';
import {within, hold, releaseHeld} from './bespoke-test-waits.mjs';

test('within passes a settled value through', async () => {
  assert.equal(await within(Promise.resolve(7), 'a value', 50), 7);
});

test('within throws a message naming the wait when time runs out', async () => {
  await assert.rejects(within(new Promise(() => {}), 'the page to send open', 20), /Timed out after 0\.02 s waiting for the page to send open/);
});

test('a held request that never arrives fails instead of hanging', async () => {
  const open = hold('the open request', 20);
  await assert.rejects(open.arrived, /Timed out after 0\.02 s waiting for the open request to reach the fake service/);
});

test('a held request resolves arrived when it reaches the service, and answers on release', async () => {
  const save = hold('the save request', 1000);
  let answered = false;
  const handler = save.wait().then(() => { answered = true; });
  await save.arrived;
  assert.equal(answered, false, 'held until released');
  save.release();
  await handler;
  assert.equal(answered, true);
});

test('releaseHeld lets every held route answer, and skips plain hooks', async () => {
  const open = hold('open', 1000), save = hold('save', 1000);
  const waits = [open.wait(), save.wait()];
  releaseHeld({open: [open, {reply: {}}], save: [save], status: []});
  await within(Promise.all(waits), 'both held routes to answer', 200);
});
