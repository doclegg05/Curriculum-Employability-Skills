#!/usr/bin/env node
// Simulated hosted origin, fully intercepted: no production requests or submissions.
// Pressing Send to Britt takes a minute or two, so a pop-up says the click worked until the outcome is known.
import assert from 'node:assert/strict';
import {createDevServer} from './bespoke-dev-server.mjs';
import {browserType} from './bespoke-test-browser.mjs';
import catalog from '../bespoke/builder-catalog.json' with {type: 'json'};
import {defaultDesign} from '../bespoke/builder-model.mjs';
import {submissionId} from '../netlify/functions/bespoke-handoff.mjs';
import {proxyPageFile} from './bespoke-test-proxy.mjs';

const selection = {
  schema: 'bespoke-selection/v2',
  date: '2026-10-30',
  lesson: {id: 'money-management', title: 'Money Management'},
  team: {name: 'Synthetic team', spokesperson: {name: 'Synthetic reviewer', email: 'synthetic@example.org'}},
  design: defaultDesign(catalog)
};
const receipt = submissionId(selection);
const url = 'https://github.com/doclegg05/Curriculum-Employability-Skills/pull/123';
const POLL_WAIT = {timeout: 9000};
const server = await createDevServer({port: 0});

function storeReply(body, replies) {
  if (body.action === 'open') return {json: {ok: true, revision: 'b'.repeat(40), savedAt: '2026-10-30T14:00:00Z', selection}};
  if (body.action === 'save' && replies.save) return replies.save(body);
  if (body.action === 'send') return replies.send(body);
  if (body.action === 'status') return replies.status();
  throw new Error('Unexpected synthetic action: ' + body.action);
}

const processing = () => ({json: {ok: true, status: 'processing', submissionId: receipt, runId: 12}});
const received = () => ({json: {ok: true, status: 'received', submissionId: receipt, runId: 12, url, revision: 'a'.repeat(40)}});

async function scenario(name, replies, run) {
  const browser = await browserType.launch({headless: true});
  const context = await browser.newContext();
  const errors = [];
  try {
    await context.addInitScript(() => {
      window.__bespokeAutosave = {enabled: false};
      if (!localStorage.getItem('bespoke-team-session-v2')) localStorage.setItem('bespoke-team-session-v2', JSON.stringify({lessonId: 'money-management', editCode: 'synthetic-review-test-access-code', revision: null, savedAt: null, baseSelectionKey: null, pendingSave: null}));
    });
    await context.route('**/*', async route => {
      const u = new URL(route.request().url());
      if (u.pathname === '/bespoke/handoff-config.json') return route.fulfill({json: {apiBase: 'https://bespoke.test/api/bespoke'}});
      if (u.pathname === '/api/bespoke') {
        const reply = await storeReply(route.request().postDataJSON(), replies);
        return route.fulfill(reply);
      }
      // At teardown the context can close under a request: the helper fails that one request instead of crashing Node.
      return proxyPageFile(route, server);
    });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    page.setDefaultTimeout(10000);
    await page.goto('https://bespoke.test/bespoke/');
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('bespoke-team-session-v2') || 'null')?.revision);
    await page.locator('#stage-review').click();
    await page.locator('#coordinatorAgree').check();
    await run(page);
    assert.deepEqual(errors, []);
    console.log(`PASS ${name}`);
  } finally {
    await context.close();
    await browser.close();
  }
}

const dialog = page => page.locator('#sendWaitDialog');
const send = page => page.locator('#btnSendToBritt').click();

try {
  let release;
  const held = new Promise(resolve => { release = resolve; });
  await scenario('the pop-up opens on the click and says the click worked, then OK closes it while sending continues', {
    send: async () => { await held; return processing(); },
    status: processing
  }, async page => {
    await send(page);
    await dialog(page).waitFor();
    assert.equal(await page.locator('#sendWaitTitle').textContent(), 'Sending to Britt');
    const words = await dialog(page).textContent();
    assert.match(words, /Your click worked/);
    assert.match(words, /a minute or two/);
    assert.doesNotMatch(words, /Sent to Britt\./, 'the pop-up never claims the design arrived');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'sendWaitOk', 'the keyboard lands on OK');
    release();
    await page.locator('#sendFeedback').filter({hasText: 'Sending to Britt…'}).waitFor();
    assert.equal(await dialog(page).isVisible(), true, 'still processing, so the pop-up stays');
    await page.locator('#sendWaitOk').click();
    await dialog(page).waitFor({state: 'hidden'});
    assert.equal(await page.locator('#sendFeedback').textContent(), 'Sending to Britt…', 'closing it does not cancel the send');
  });

  let ready = false;
  await scenario('the pop-up closes by itself when the receipt arrives', {
    send: processing,
    status: () => ready ? received() : processing()
  }, async page => {
    await send(page);
    await dialog(page).waitFor();
    ready = true;
    await page.locator('#sentView').waitFor(POLL_WAIT);
    assert.equal(await dialog(page).isVisible(), false);
  });

  await scenario('a Send the service refuses closes the pop-up and shows why', {
    send: () => ({status: 502, json: {ok: false, error: 'store', message: 'The connected store could not complete this request.'}}),
    status: processing
  }, async page => {
    await send(page);
    // An outage reads in the page's plain words, with the next step (service-messages.mjs).
    await page.locator('#sendFeedback').filter({hasText: 'BeSpoke could not finish that just now.'}).waitFor();
    assert.match(await page.locator('#sendFeedback').innerText(), /tell Britt/);
    assert.equal(await dialog(page).isVisible(), false);
    assert.equal(await page.locator('#btnSendToBritt').isDisabled(), false, 'the team can retry');
  });

  await scenario('a run that fails after processing closes the pop-up and shows why', {
    send: processing,
    status: () => ({json: {ok: true, status: 'failed', submissionId: receipt, runId: 12, message: 'The review package could not be created.'}})
  }, async page => {
    await send(page);
    await dialog(page).waitFor();
    await page.locator('#sendFeedback').filter({hasText: 'could not be created'}).waitFor(POLL_WAIT);
    assert.equal(await dialog(page).isVisible(), false);
  });

  // Send saves first (Britt, 2026-11-18): a team never has to press Save and then Send.
  const SAVED_REVISION = 'c'.repeat(40);
  const savedOk = () => ({json: {ok: true, revision: SAVED_REVISION, savedAt: '2026-10-30T15:00:00Z'}});
  {
    const savedNotes = [], sentFrom = [];
    await scenario('a note typed just before Send is saved, then sent', {
      save: body => { savedNotes.push(body.selection.unspoken); return savedOk(); },
      send: body => { sentFrom.push(body.expectedRevision); return processing(); },
      status: processing
    }, async page => {
      await page.locator('#reviewNotes').fill('Please check the title color.');
      await send(page);
      await dialog(page).waitFor();
      assert.deepEqual(savedNotes, ['Please check the title color.'], 'the note was saved before the send');
      assert.deepEqual(sentFrom, [SAVED_REVISION], 'the send is the version that was just saved');
      assert.doesNotMatch(await page.locator('#fileStatus').textContent(), /Save the current shared design/);
    });
  }
  {
    let releaseSave;
    const heldSave = new Promise(resolve => { releaseSave = resolve; });
    const sentFrom = [];
    await scenario('a click on Send while a save is running waits for it, then sends', {
      save: async () => { await heldSave; return savedOk(); },
      send: body => { sentFrom.push(body.expectedRevision); return processing(); },
      status: processing
    }, async page => {
      await page.locator('#reviewNotes').fill('One more thing.');
      await page.locator('#btnSendSave').click();
      await page.locator('#sendFeedback').filter({hasText: 'Saving the shared design'}).waitFor();
      await send(page);
      assert.equal(await dialog(page).isVisible(), false, 'nothing is sent while the save is still running');
      assert.deepEqual(sentFrom, []);
      releaseSave();
      await dialog(page).waitFor();
      assert.deepEqual(sentFrom, [SAVED_REVISION], 'the click was not lost');
    });
  }
  {
    let releaseSave;
    const heldSave = new Promise(resolve => { releaseSave = resolve; });
    const sent = [];
    await scenario('a second click while Send is saving first does not send twice', {
      save: async () => { await heldSave; return savedOk(); },
      send: body => { sent.push(body.mutationId); return processing(); },
      status: processing
    }, async page => {
      await page.locator('#reviewNotes').fill('Sent once.');
      await send(page);
      await page.locator('#sendFeedback').filter({hasText: 'Saving the shared design'}).waitFor();
      await send(page);
      releaseSave();
      await dialog(page).waitFor();
      await page.waitForTimeout(500);
      assert.equal(sent.length, 1, 'one click, or two, is one request to Britt');
    });
  }
  await scenario('a save that fails stops the send and says why', {
    save: () => ({status: 502, json: {ok: false, error: 'store', message: 'The connected store could not complete this request.'}}),
    send: () => { throw new Error('Nothing may be sent when the save failed.'); },
    status: processing
  }, async page => {
    await page.locator('#reviewNotes').fill('This note cannot be saved.');
    await send(page);
    await page.locator('#sendFeedback').filter({hasText: 'BeSpoke could not finish that just now.'}).waitFor();
    assert.equal(await dialog(page).isVisible(), false);
  });
} finally {
  await server.close();
}
