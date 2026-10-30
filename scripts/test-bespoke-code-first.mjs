#!/usr/bin/env node
// Simulated hosted origin, fully intercepted: no production requests or submissions.
// A team enters its code before it builds, and entering a code never wipes work already in the browser.
import assert from 'node:assert/strict';
import {createDevServer} from './bespoke-dev-server.mjs';
import {browserType} from './bespoke-test-browser.mjs';
import catalog from '../bespoke/builder-catalog.json' with {type: 'json'};
import {applyPreset, defaultDesign} from '../bespoke/builder-model.mjs';

const CODE = 'K7QX-M3PD';
const SESSION_KEY = 'bespoke-team-session-v2';
const DRAFT_KEY = 'bespoke-draft-v2';
const builtDesign = applyPreset(catalog, 'modern', defaultDesign(catalog));
const sharedSelection = {
  schema: 'bespoke-selection/v2',
  date: '2026-10-30',
  lesson: {id: 'money-management', title: 'Money Management'},
  team: {name: 'Saved team', spokesperson: {name: 'Saved lead', email: 'saved@example.org'}},
  design: defaultDesign(catalog)
};
const draftBuiltBeforeTheCode = stepId => JSON.stringify({design: builtDesign, lessonId: 'money-management', teamName: 'Built first', spokespersonName: 'Lead', changes: [], redo: [], ...(stepId ? {stepId} : {})});
const server = await createDevServer({port: 0});

async function scenario(name, {draft = null, shared = null, hash = ''}, run) {
  const browser = await browserType.launch({headless: true});
  const context = await browser.newContext();
  const errors = [], saves = [];
  try {
    await context.addInitScript(([key, value]) => {
      window.__bespokeAutosave = {enabled: false};
      if (value && !localStorage.getItem(key)) localStorage.setItem(key, value);
    }, [DRAFT_KEY, draft]);
    await context.route('**/*', async route => {
      const u = new URL(route.request().url());
      if (u.pathname === '/bespoke/handoff-config.json') return route.fulfill({json: {apiBase: 'https://bespoke.test/api/bespoke'}});
      if (u.pathname === '/api/bespoke') {
        const body = route.request().postDataJSON();
        if (body.action === 'open') return route.fulfill({json: {ok: true, access: 'edit', revision: shared ? 'b'.repeat(40) : null, savedAt: shared ? '2026-10-30T14:00:00Z' : null, selection: shared}});
        if (body.action === 'save') {
          saves.push(body.selection);
          return route.fulfill({json: {ok: true, revision: 'c'.repeat(40), savedAt: '2026-10-30T15:00:00Z', selection: body.selection}});
        }
        throw new Error('Unexpected synthetic action: ' + body.action);
      }
      return route.fulfill({response: await route.fetch({url: server.baseUrl + u.pathname + u.search, headers: {...route.request().headers(), origin: server.baseUrl}})});
    });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    page.setDefaultTimeout(10000);
    await page.goto('https://bespoke.test/bespoke/' + hash);
    await page.locator('#stage-team').waitFor();
    await run(page, saves);
    assert.deepEqual(errors, []);
    console.log(`PASS ${name}`);
  } finally {
    await context.close();
    await browser.close();
  }
}

const stage = page => page.locator('#workspace').getAttribute('data-stage');
const openDialog = page => page.locator('#openDialog');
async function enterCode(page) {
  if (!await openDialog(page).isVisible()) await page.locator('#btnEnterTeamCode').click();
  await page.locator('#openLesson').selectOption('money-management');
  await page.locator('#openEditCode').fill(CODE);
  await page.locator('#openConfirm').click();
  await openDialog(page).waitFor({state: 'hidden'});
}

try {
  await scenario('a new team cannot leave Lesson & team until its code is in', {}, async page => {
    assert.equal(await stage(page), 'team');
    await page.locator('#teamCodeFirst').waitFor();
    await page.locator('#stage-start').click();
    await openDialog(page).waitFor();
    assert.equal(await stage(page), 'team', 'a stage pill does not get past the code');
    await page.locator('#openCancel').click();
    await page.locator('#btnNext').click();
    await openDialog(page).waitFor();
    assert.equal(await stage(page), 'team', 'Continue does not get past the code');
    await page.locator('#openCancel').click();
    await page.locator('#stage-review').click();
    await openDialog(page).waitFor();
    assert.equal(await stage(page), 'team', 'jumping to Send does not get past the code');
  });

  await scenario('once the code is in, the team moves on and the prompt is gone', {}, async page => {
    await enterCode(page);
    assert.equal(await page.locator('#teamCodeFirst').count(), 0);
    await page.locator('#stage-start').click();
    await page.locator('#workspace[data-stage=start]').waitFor();
    assert.equal(await openDialog(page).isVisible(), false);
  });

  await scenario('work built before the code survives and is saved for the team', {draft: draftBuiltBeforeTheCode()}, async (page, saves) => {
    await enterCode(page);
    assert.equal(await page.locator('#teamName').inputValue(), 'Built first', 'the team details are kept');
    assert.equal(JSON.parse(await page.evaluate(key => localStorage.getItem(key), DRAFT_KEY)).design.startingPoint, 'modern', 'the design is kept');
    assert.equal(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).baseSelectionKey, SESSION_KEY) === null, true, 'kept work still counts as unsaved');
    await page.locator('#btnSave').click();
    await page.waitForFunction(key => JSON.parse(localStorage.getItem(key))?.revision, SESSION_KEY);
    assert.equal(saves.length, 1, 'Save sends the kept work to the service');
    assert.equal(saves[0].design.startingPoint, 'modern');
    assert.equal(saves[0].team.name, 'Built first');
  });

  await scenario('a team with a saved design still opens that design', {draft: draftBuiltBeforeTheCode(), shared: sharedSelection}, async page => {
    await enterCode(page);
    assert.equal(await page.locator('#teamName').inputValue(), 'Saved team');
  });

  await scenario('a private link for another lesson does not wipe work built before it', {draft: draftBuiltBeforeTheCode('team'), hash: `#team=goal-setting.${CODE}`}, async page => {
    await page.waitForFunction(key => JSON.parse(localStorage.getItem(key) || 'null')?.lessonId === 'goal-setting', SESSION_KEY);
    assert.equal(await page.locator('#teamName').inputValue(), 'Built first', 'the team details are kept');
    assert.equal(JSON.parse(await page.evaluate(key => localStorage.getItem(key), DRAFT_KEY)).design.startingPoint, 'modern', 'the design is kept');
    assert.equal(await page.locator('#lessonSelect').inputValue(), 'goal-setting', 'the link sets the lesson');
  });

  await scenario('a draft left on a later stage still waits for the code', {draft: draftBuiltBeforeTheCode('slides')}, async page => {
    await page.locator('#teamCodeFirst').waitFor();
    assert.equal(await stage(page), 'team');
    await enterCode(page);
    await page.locator('#stage-slides').click();
    await page.locator('#workspace[data-stage=slides]').waitFor();
    assert.equal(JSON.parse(await page.evaluate(key => localStorage.getItem(key), DRAFT_KEY)).design.startingPoint, 'modern', 'the work is still there');
  });
} finally {
  await server.close();
}
