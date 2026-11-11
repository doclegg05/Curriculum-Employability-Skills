// Unit tests for the page-file proxy the BeSpoke browser tests share. No browser:
// the route is a stand-in that fails the way Playwright does when a browser
// context closes under a request that is still in flight.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { proxyPageFile } from './bespoke-test-proxy.mjs';

const server = { baseUrl: 'http://127.0.0.1:4173' };

function fakeRoute({ fetch, fulfill, abort } = {}) {
  const calls = { fetch: [], fulfill: [], abort: 0 };
  return {
    calls,
    request: () => ({ url: () => 'https://bespoke.test/bespoke/app.css?v=2', headers: () => ({ accept: 'text/css', origin: 'https://bespoke.test' }) }),
    fetch: async (options) => { calls.fetch.push(options); return fetch ? fetch() : { status: 200 }; },
    fulfill: async (options) => { calls.fulfill.push(options); if (fulfill) return fulfill(); },
    abort: async () => { calls.abort += 1; if (abort) return abort(); },
  };
}

test('serves the page file from the local server with the server as origin', async () => {
  const route = fakeRoute();
  const failures = [];
  await proxyPageFile(route, server, { onFailure: (m) => failures.push(m) });
  assert.equal(route.calls.fetch[0].url, 'http://127.0.0.1:4173/bespoke/app.css?v=2');
  assert.deepEqual(route.calls.fetch[0].headers, { accept: 'text/css', origin: 'http://127.0.0.1:4173' });
  assert.deepEqual(route.calls.fulfill, [{ response: { status: 200 } }]);
  assert.equal(route.calls.abort, 0);
  assert.deepEqual(failures, []);
});

test('a context that closes between fetch and fulfill does not reject', async () => {
  // The failure from quality.sh on 2026-11-09: "route.fulfill: Fetch response has been disposed".
  const route = fakeRoute({ fulfill: () => { throw new Error('route.fulfill: Fetch response has been disposed'); } });
  const failures = [];
  await assert.doesNotReject(proxyPageFile(route, server, { onFailure: (m) => failures.push(m) }));
  assert.equal(route.calls.abort, 1);
  assert.deepEqual(failures, [], 'a closed context is the end of the scenario, not a failed page file');
});

test('a closed context that also refuses the abort still does not reject', async () => {
  const closed = () => { throw new Error('route.abort: Target page, context or browser has been closed'); };
  const route = fakeRoute({ fetch: closed, abort: closed });
  await assert.doesNotReject(proxyPageFile(route, server, { onFailure: () => assert.fail('must not report a closed context') }));
});

test('a page file that fails while the scenario is running is reported and aborted', async () => {
  const route = fakeRoute({ fetch: () => { throw new Error('route.fetch: read ECONNRESET\nCall log:\n  - fetching'); } });
  const failures = [];
  await assert.doesNotReject(proxyPageFile(route, server, { onFailure: (m) => failures.push(m) }));
  assert.deepEqual(failures, ['/bespoke/app.css: route.fetch: read ECONNRESET']);
  assert.equal(route.calls.abort, 1);
  assert.equal(route.calls.fulfill.length, 0);
});

test('nothing is reported once the caller says the scenario is finished', async () => {
  const route = fakeRoute({ fetch: () => { throw new Error('route.fetch: read ECONNRESET'); } });
  const failures = [];
  await proxyPageFile(route, server, { finished: () => true, onFailure: (m) => failures.push(m) });
  assert.deepEqual(failures, []);
  assert.equal(route.calls.abort, 1);
});

test('without an onFailure the failure is written to stderr, never dropped', async () => {
  const route = fakeRoute({ fetch: () => { throw new Error('route.fetch: read ECONNRESET'); } });
  const written = [];
  const original = console.warn;
  console.warn = (...args) => written.push(args.join(' '));
  try { await proxyPageFile(route, server); } finally { console.warn = original; }
  assert.equal(written.length, 1);
  assert.match(written[0], /\/bespoke\/app\.css: route\.fetch: read ECONNRESET/);
});
