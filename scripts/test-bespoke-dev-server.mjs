import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { createDevServer, LOCAL_PREVIEW_CODE } from './bespoke-dev-server.mjs';
import catalog from '../bespoke/builder-catalog.json' with { type: 'json' };
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const localFetch = globalThis.fetch;
const lessonId = 'money-management';
const selection = () => ({ schema: 'bespoke-selection/v2', date: '2026-09-24', lesson: { id: lessonId, title: 'Synthetic local preview' }, team: { spokesperson: { name: 'Synthetic reviewer' } }, design: structuredClone(catalog.defaults) });
async function action(app, action, fields = {}, headers = {}) {
  const response = await localFetch(app.baseUrl + '/api/bespoke', { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify({ action, lessonId, editCode: LOCAL_PREVIEW_CODE, ...fields }) });
  return { status: response.status, body: await response.json() };
}

test('loopback preview serves essential assets, overrides remote config and blocks exposed repo/private routes', async () => {
  const app = await createDevServer({ port: 0 });
  try {
    assert.equal(app.server.address().address, '127.0.0.1');
    const config = await (await localFetch(app.baseUrl + '/bespoke/handoff-config.json')).json();
    assert.deepEqual(config, { apiBase: app.baseUrl + '/api/bespoke', localPreview: true });
    for (const route of ['/bespoke/', '/bespoke/builder-model.mjs', '/bespoke/builder-catalog.json', '/SPOKES%20Builder/bespoke-library-catalog.json', '/SPOKES%20Builder/theme-options.json', '/bespoke/legacy.html', '/bespoke/app.js', '/fonts/outfit-latin.woff2', '/SPOKES-Logo.png']) assert.equal((await localFetch(app.baseUrl + route)).status, 200, route);
    for (const route of ['/.git', '/.env', '/package.json', '/netlify/functions/bespoke-handoff.mjs', '/scripts/bespoke-dev-server.mjs', '/bespoke/%2e%2e/%2e%2e/etc/passwd']) assert.equal((await localFetch(app.baseUrl + route)).status, 404, route);
    const reboundStatus = await new Promise((resolve, reject) => {
      http.get(app.baseUrl + '/bespoke/', { headers: { Host: 'remote.example' } }, response => { response.resume(); resolve(response.statusCode); }).on('error', reject);
    });
    assert.equal(reboundStatus, 403);
    assert.equal((await action(app, 'open', {}, { Origin: 'https://unrelated.example' })).status, 403);
  } finally { await app.close(); }
});

test('synthetic handler persists/reopens full selections and keeps revision/retry/history protection without network', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'bespoke-preview-test-'));
  let app;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('Unexpected outbound server fetch'); };
  try {
    app = await createDevServer({ port: 0, runtimeDir: directory });
    const first = { selection: selection(), expectedRevision: null, mutationId: randomUUID() };
    const saved = await action(app, 'save', first); assert.equal(saved.status, 200, JSON.stringify(saved));
    assert.equal((await action(app, 'save', first)).body.replayed, true);
    const second = structuredClone(first.selection);
    second.design.slides.cards.count = '1'; second.design.samples.boxes[3] = 'Hidden draft survives restart';
    const changed = await action(app, 'save', { selection: second, expectedRevision: saved.body.revision, mutationId: randomUUID() }); assert.equal(changed.status, 200);
    assert.equal((await action(app, 'save', { ...first, mutationId: randomUUID() })).status, 409);
    assert.deepEqual((await action(app, 'openRevision', { revision: saved.body.revision })).body.selection, first.selection);
    assert.equal((await action(app, 'history')).body.history.length, 2);
    assert.equal((await action(app, 'send', { selection: second, expectedRevision: changed.body.revision })).status, 403);
    assert.equal((await action(app, 'status', { submissionId: '2026-09-24-0123456789abcdef' })).status, 403);
    assert.equal((await action(app, 'open', { editCode: 'wrong-synthetic-code-long-enough' })).status, 403);
    for (const id of ['goal-setting', 'professionalism-and-diversity', 'knowing-your-rights', 'communicating-assertively', 'workplace-ethics']) assert.equal((await action(app, 'open', { lessonId: id })).status, 200);
    const stateFile = app.runtimeFile;
    assert.equal((await fs.stat(stateFile)).mode & 0o777, 0o600);
    assert.equal((await fs.readFile(stateFile, 'utf8')).includes('Hidden draft survives restart'), false);
    await app.close(); app = await createDevServer({ port: 0, runtimeDir: directory });
    const reopened = await action(app, 'open'); assert.equal(reopened.body.revision, changed.body.revision); assert.deepEqual(reopened.body.selection, second);
    assert.equal((await action(app, 'history')).body.history.length, 2);
    // The old mutation remains recognizable even after later writes and restart.
    assert.equal((await action(app, 'save', first)).body.replayed, true);
  } finally { globalThis.fetch = originalFetch; if (app) await app.close(); await fs.rm(directory, { recursive: true, force: true }); }
});

test('runtime must be outside the repository and malformed existing data is preserved', async () => {
  const forbidden = path.join(root, 'bespoke', 'must-not-create-local-runtime');
  await assert.rejects(createDevServer({ port: 0, runtimeDir: forbidden }), /outside/);
  await assert.rejects(fs.stat(forbidden), { code: 'ENOENT' });
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'bespoke-broken-runtime-'));
  try {
    const file = path.join(directory, 'bespoke-local-state.json');
    await fs.writeFile(file, 'preserve malformed existing data');
    await assert.rejects(createDevServer({ port: 0, runtimeDir: directory }), /preserve the file/);
    assert.equal(await fs.readFile(file, 'utf8'), 'preserve malformed existing data');
  } finally { await fs.rm(directory, { recursive: true, force: true }); }
});
