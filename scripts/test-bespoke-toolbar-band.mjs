import assert from 'node:assert/strict';
import test from 'node:test';

const { heldBand } = await import('../bespoke/toolbar-band.mjs');

test('the band above the slide grows with its tallest toolbar and does not shrink back', () => {
  // Background selected: one row. Text selected: two rows. Background again: the band keeps the taller height,
  // so the slide below it stays where it is.
  let held = heldBand({ held: null, width: 1152, content: 83 });
  assert.deepEqual(held, { width: 1152, height: 83 });
  held = heldBand({ held, width: 1152, content: 171 });
  assert.equal(held.height, 171);
  held = heldBand({ held, width: 1152, content: 83 });
  assert.equal(held.height, 171, 'a shorter toolbar leaves the band as tall as before');
});

test('a new width starts again, because the toolbar wraps differently there', () => {
  const held = heldBand({ held: { width: 1152, height: 171 }, width: 772, content: 120 });
  assert.deepEqual(held, { width: 772, height: 120 });
});

test('a band with nothing in it holds no height', () => {
  assert.deepEqual(heldBand({ held: { width: 1152, height: 171 }, width: 1152, content: 0 }), { width: 1152, height: 0 });
});
