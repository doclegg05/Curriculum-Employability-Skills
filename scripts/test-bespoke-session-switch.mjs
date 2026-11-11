#!/usr/bin/env node
// Simulated hosted origin, fully intercepted: no production requests or submissions.
// Review findings C1 and C2 (2026-10-22): moving between teams and views in one browser
// never costs a team its session or its pending Send, and never shows it another team's.
import assert from 'node:assert/strict';
import {createDevServer} from './bespoke-dev-server.mjs';
import {browserType} from './bespoke-test-browser.mjs';
import catalog from '../bespoke/builder-catalog.json' with {type: 'json'};
import {defaultDesign} from '../bespoke/builder-model.mjs';
import {proxyPageFile} from './bespoke-test-proxy.mjs';

const EDIT = 'K7QX-M3PD', VIEW = 'V3WQ-8RTN', OTHER = 'R4TW-9HNC';
const SESSION_KEY = 'bespoke-team-session-v2';
const PENDING_STORAGE = 'bespoke-pending-submission-v2';
const REVISION = 'b'.repeat(40);
const sharedSelection = {
  schema: 'bespoke-selection/v2',
  date: '2026-11-03',
  lesson: {id: 'money-management', title: 'Money Management'},
  team: {name: 'Saved team', spokesperson: {name: 'Saved lead', email: 'saved@example.org'}},
  design: defaultDesign(catalog)
};
const editSession = lessonId => JSON.stringify({lessonId, editCode: EDIT, revision: REVISION, savedAt: '2026-11-03T14:00:00Z', baseSelectionKey: null, pendingSave: null});
const pendingReceipt = (lessonId, editCode) => JSON.stringify({stage: 'receipt', lessonId, editCode, expectedRevision: REVISION, submissionId: 'sub-1', runId: null, designKey: '', notes: ''});
const server = await createDevServer({port: 0});

async function scenario(name, seed, run) {
  const browser = await browserType.launch({headless: true});
  const context = await browser.newContext();
  const errors = [], calls = [];
  try {
    await context.addInitScript(entries => {
      window.__bespokeAutosave = {enabled: false};
      // Seed once per browser, so a second tab sees what the first tab left behind.
      if (localStorage.getItem('test-seeded')) return;
      localStorage.setItem('test-seeded', '1');
      for (const [key, value] of entries) localStorage.setItem(key, value);
    }, Object.entries(seed));
    await context.route('**/*', async route => {
      const u = new URL(route.request().url());
      if (u.pathname === '/bespoke/handoff-config.json') return route.fulfill({json: {apiBase: 'https://bespoke.test/api/bespoke'}});
      if (u.pathname === '/api/bespoke') {
        const body = route.request().postDataJSON();
        calls.push({action: body.action, lessonId: body.lessonId, editCode: body.editCode});
        if (body.action === 'open') {
          if (body.editCode === VIEW) return route.fulfill({json: {ok: true, access: 'view', revision: REVISION, savedAt: '2026-11-03T14:00:00Z', selection: sharedSelection}});
          return route.fulfill({json: {ok: true, access: 'edit', revision: REVISION, savedAt: '2026-11-03T14:00:00Z', selection: sharedSelection}});
        }
        if (body.action === 'status') return route.fulfill({json: {ok: true, status: 'processing', runId: null}});
        throw new Error('Unexpected synthetic action: ' + body.action);
      }
      return proxyPageFile(route, server);
    });
    await run(context, calls, async (hash = '') => {
      const page = await context.newPage();
      page.on('pageerror', error => errors.push(error.message));
      page.setDefaultTimeout(10000);
      await page.goto('https://bespoke.test/bespoke/' + hash);
      return page;
    });
    assert.deepEqual(errors, []);
    console.log(`PASS ${name}`);
  } finally {
    await context.close();
    await browser.close();
  }
}

async function until(check, what, ms = 10000) {
  for (const end = Date.now() + ms; Date.now() < end; await new Promise(resolve => setTimeout(resolve, 50))) if (check()) return;
  throw new Error('Timed out: ' + what);
}
const stored = (page, key) => page.evaluate(k => JSON.parse(localStorage.getItem(k) || 'null'), key);

try {
  await scenario('C1: a builder link holding a view code keeps the team session and its pending Send',
    {[SESSION_KEY]: editSession('money-management'), [PENDING_STORAGE]: pendingReceipt('money-management', EDIT)},
    async (context, calls, open) => {
      const viewTab = await open(`#team=money-management.${VIEW}`);
      await viewTab.locator('#btnViewRefresh').waitFor();
      assert.equal((await stored(viewTab, SESSION_KEY))?.editCode, EDIT, 'the stored team session still holds the edit code');
      assert.equal((await stored(viewTab, PENDING_STORAGE))?.submissionId, 'sub-1', 'the pending Send is still stored');
      assert.equal(calls.some(call => call.action === 'status' && call.editCode === VIEW), false, 'the view never checks the Send');
      await viewTab.close();
      calls.length = 0;
      const teamTab = await open();
      await teamTab.waitForFunction(() => document.querySelector('#teamSessionBar') && !document.querySelector('#teamSessionBar').hidden);
      await until(() => calls.some(call => call.action === 'status'), 'the team tab checks its pending Send');
      assert.ok(calls.some(call => call.action === 'open' && call.editCode === EDIT), 'the team tab opens with its own code');
      assert.ok(calls.some(call => call.action === 'status' && call.editCode === EDIT), 'the team tab checks its pending Send again');
    });

  await scenario('C2: another team in the same browser does not see a pending Send it never made',
    {[SESSION_KEY]: editSession('money-management'), [PENDING_STORAGE]: pendingReceipt('goal-setting', OTHER)},
    async (context, calls, open) => {
      const page = await open();
      await page.waitForFunction(() => document.querySelector('#teamSessionBar') && !document.querySelector('#teamSessionBar').hidden);
      await page.waitForFunction(() => document.querySelector('#teamSessionStatus')?.textContent.includes('Shared version saved'));
      assert.equal(await page.locator('#btnCheckStatus').getAttribute('hidden') !== null, true, 'no Check status for another team');
      assert.equal(calls.some(call => call.action === 'status'), false, 'no status check for another team');
      await page.locator('#stage-review').click();
      await page.locator('#workspace[data-stage=review]').waitFor();
      assert.equal(await page.getByText('Sending to Britt…').count(), 0, 'Send is not stuck on another team');
      assert.equal((await stored(page, PENDING_STORAGE))?.lessonId, 'goal-setting', 'the other team keeps its pending Send');
    });

  await scenario('C2: a pending Send made under another code for the same lesson stays hidden',
    {[SESSION_KEY]: editSession('money-management'), [PENDING_STORAGE]: pendingReceipt('money-management', OTHER)},
    async (context, calls, open) => {
      const page = await open();
      await page.waitForFunction(() => document.querySelector('#teamSessionStatus')?.textContent.includes('Shared version saved'));
      assert.equal(await page.locator('#btnCheckStatus').getAttribute('hidden') !== null, true);
      assert.equal(calls.some(call => call.action === 'status'), false);
    });
} finally {
  await server.close();
}
