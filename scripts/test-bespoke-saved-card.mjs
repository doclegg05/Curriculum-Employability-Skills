#!/usr/bin/env node
// Simulated hosted origin, fully intercepted: no production requests or submissions.
// The saved-design card and the top-bar badge say exactly what is on screen: checking, couldn't check,
// saved, changes not saved, saving, no save yet, or opened with updates. One scenario per state.
import assert from 'node:assert/strict';
import {createDevServer} from './bespoke-dev-server.mjs';
import {browserType} from './bespoke-test-browser.mjs';
import {builderDestination, saveControl} from './bespoke-test-navigation.mjs';
import catalog from '../bespoke/builder-catalog.json' with {type: 'json'};
import {applyPreset, defaultDesign, roleStyleDefaults} from '../bespoke/builder-model.mjs';
import {EDIT_LINE} from '../bespoke/saved-status.mjs';

const CODE = 'K7QX-M3PD';
const SESSION_KEY = '[REDACTED]';
const DRAFT_KEY = '[REDACTED]';
const REVISION = 'b'.repeat(40), NEXT_REVISION = 'c'.repeat(40);
const SAVED_AT = '2026-11-06T14:10:00Z', NEXT_SAVED_AT = '2026-11-06T15:00:00Z';
const LESSON = {id: 'money-management', title: 'Money Management'};
const TEAM = {name: 'Saved team', spokesperson: {name: 'Saved lead', email: 'saved@example.org'}};
const PRIOR_WORK_LINE = 'Work from this browser before you entered the code is in ⋯ > Recover previous draft.';
// State 5: this browser last saw revision A; the team saved B (REVISION) since, and C (NEXT_REVISION) during the replace.
const OLD_REVISION = 'a'.repeat(40), FINAL_REVISION = 'd'.repeat(40), FINAL_SAVED_AT = '2026-11-06T16:00:00Z';
const BACKUP_DRAFT_KEY = 'bespoke-previous-' + 'draft-v2';
const CONFLICT_HEADING = "This browser has changes that aren't in the team's saved design.";
const FULL_RECOVERY_NOTICE = "Your browser changes couldn't be kept as a recovery copy, so the saved design was not loaded. Download a backup first.";
const replaceQuestion = time => `This will replace the design saved ${time}. Replace it?`;
const base = defaultDesign(catalog);
const selectionOf = design => ({schema: 'bespoke-selection/v2', date: '2026-11-06', lesson: LESSON, team: TEAM, design});
const savedSelection = selectionOf(base);
// The retired v2 fixture from test-bespoke-draft-conversion.mjs: convertToStandard changes it on open.
const third = catalog.fonts.find(font => ![base.fonts.heading, base.fonts.body].includes(font.id));
const retired = {...base, background: 'dot-grid', roleStyles: {cards: {...roleStyleDefaults(catalog, base, 'cards'), headingFont: third.id}}};
const builtDesign = applyPreset(catalog, 'modern', defaultDesign(catalog));
const draft = design => JSON.stringify({design, lessonId: LESSON.id, teamName: 'Built here', spokespersonName: 'Lead', changes: [], redo: [], meaningfulDesign: true});
const session = (fields = {}) => JSON.stringify({lessonId: LESSON.id, editCode: CODE, revision: REVISION, savedAt: SAVED_AT, baseSelectionKey: null, pendingSave: null, ...fields});
const server = await createDevServer({port: 0});

function deferred() { let resolve; const promise = new Promise(r => { resolve = r; }); return {promise, resolve}; }
// A held request: `arrived` settles when the request reaches the fake service, `release()` lets it answer.
function hold() { const arrived = deferred(), gate = deferred(); return {arrived: arrived.promise, release: gate.resolve, wait: () => { arrived.resolve(); return gate.promise; }}; }

// The fake service answers from `store`; `hooks[action]` may hold a request or replace its answer.
async function scenario(name, {seed = {}, local = false, autosave = {enabled: false}, store = {}, hooks = {}}, run) {
  const browser = await browserType.launch({headless: true});
  const context = await browser.newContext({timezoneId: 'America/New_York', locale: 'en-US', viewport: {width: 1440, height: 1000}});
  const errors = [], calls = [], unexpected = [];
  const data = {revision: REVISION, savedAt: SAVED_AT, selection: savedSelection, ...store};
  try {
    await context.addInitScript(([entries, autosave]) => {
      window.__bespokeAutosave = autosave;
      if (sessionStorage.getItem('test-seeded')) return;
      sessionStorage.setItem('test-seeded', '1');
      for (const [key, value] of entries) localStorage.setItem(key, value);
    }, [Object.entries(seed), autosave]);
    const answer = async (route, body) => {
      calls.push({action: body.action, lessonId: body.lessonId, expectedRevision: body.expectedRevision, at: Date.now()});
      const hook = hooks[body.action]?.shift?.();
      if (hook?.wait) await hook.wait();
      if (hook?.reply) return route.fulfill(hook.reply);
      if (body.action === 'open') return route.fulfill({json: {ok: true, access: 'edit', revision: data.revision, savedAt: data.savedAt, selection: data.selection}});
      if (body.action === 'save') {
        Object.assign(data, {revision: NEXT_REVISION, savedAt: NEXT_SAVED_AT, selection: body.selection});
        return route.fulfill({json: {ok: true, revision: data.revision, savedAt: data.savedAt}});
      }
      unexpected.push(body.action);
      return route.fulfill({status: 400, json: {ok: false, error: 'unexpected', message: 'Unexpected synthetic action.'}});
    };
    await context.route('**/*', async route => {
      const u = new URL(route.request().url());
      if (u.pathname === '/api/bespoke') return answer(route, route.request().postDataJSON());
      if (local) return u.origin === server.baseUrl ? route.continue() : route.abort();
      if (u.pathname === '/bespoke/handoff-config.json') return route.fulfill({json: {apiBase: 'https://bespoke.test/api/bespoke'}});
      return route.fulfill({response: await route.fetch({url: server.baseUrl + u.pathname + u.search, headers: {...route.request().headers(), origin: server.baseUrl}})});
    });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    page.on('dialog', dialog => dialog.accept());
    page.setDefaultTimeout(10000);
    await page.goto(local ? server.baseUrl + '/bespoke/' : 'https://bespoke.test/bespoke/');
    await run(page, calls);
    assert.deepEqual(errors, []);
    assert.deepEqual(unexpected, []);
    console.log(`PASS ${name}`);
  } finally {
    await context.close();
    await browser.close();
  }
}

const heading = page => page.locator('#savedCard .saved-card-heading');
const badge = page => page.locator('#saveBadge');
const cardText = page => page.locator('#savedCard').innerText();
async function showsHeading(page, text) { await heading(page).filter({hasText: text}).waitFor(); }
async function showsBadge(page, text) { await page.waitForFunction(t => { const b = document.querySelector('#saveBadge'); return b && !b.hidden && b.textContent === t; }, text); }
async function savedState(page) {
  await showsHeading(page, "You're looking at your team's saved design");
  await showsBadge(page, 'Saved');
}
async function paint(page, color) {
  await builderDestination(page, 'Shared colors');
  await page.locator('#colorRole').selectOption('sidebar');
  await page.locator(`[data-color="${color}"]`).click();
}
const saves = calls => calls.filter(call => call.action === 'save');
const conflict409 = (revision, savedAt) => ({reply: {status: 409, json: {ok: false, error: 'conflict', message: 'A newer design is saved.', revision, savedAt}}});
// The design this page keeps as its browser draft: what the screen shows.
const shownDesign = page => page.evaluate(key => JSON.parse(localStorage.getItem(key)).design, DRAFT_KEY);
async function showsConflict(page, savedAgain) {
  await showsHeading(page, CONFLICT_HEADING);
  assert.match(await cardText(page), new RegExp(`The team's design was saved again ${savedAgain}\\.`));
  await page.locator('#savedUseSaved').waitFor();
  await page.locator('#savedKeepChanges').waitFor();
  await showsBadge(page, 'Changes not saved');
}
async function asks(page, time) {
  await page.waitForFunction(text => { const d = document.querySelector('#replaceDialog'); return d?.open && d.textContent.includes(text); }, replaceQuestion(time));
}
const closed = page => page.waitForFunction(() => !document.querySelector('#replaceDialog')?.open);
const saveResponse = page => page.waitForResponse(response => response.url().endsWith('/api/bespoke') && response.request().postDataJSON()?.action === 'save');

try {
  {
    const open = hold();
    await scenario("state 1: the card says checking until the service answers", {seed: {[SESSION_KEY]: session()}, hooks: {open: [open]}}, async page => {
      await open.arrived;
      await showsHeading(page, "Checking your team's saved design…");
      await showsBadge(page, 'Checking…');
      assert.doesNotMatch(await cardText(page), /saved design$|hasn't saved/m, 'nothing claims a state while checking');
      open.release();
      await savedState(page);
    });
  }

  await scenario("state 2: a failed open says we could not check, and Try again recovers", {
    seed: {[SESSION_KEY]: session()},
    autosave: {enabled: true, idleMs: 50, stepMs: 50},
    hooks: {open: [{reply: {status: 503, json: {ok: false, error: 'store', message: 'The connected store could not complete this request.'}}}]}
  }, async (page, calls) => {
    await showsHeading(page, "We couldn't check your team's saved design.");
    await showsBadge(page, "Couldn't check");
    assert.match(await cardText(page), /Your browser work is still here\./);
    await page.waitForTimeout(200);
    assert.equal(calls.some(call => call.action === 'save'), false, 'autosave does not run after a failed open');
    await page.locator('#savedRetry').click();
    await savedState(page);
    assert.equal(calls.filter(call => call.action === 'open').length, 2, 'Try again opens again');
  });

  await scenario("state 3: an opened save shows its time, colors and the edit line", {seed: {[SESSION_KEY]: session()}}, async page => {
    await savedState(page);
    const text = await cardText(page);
    assert.match(text, /Saved Friday, November 6 at 9:10 AM/, 'the save time is in local time');
    assert.ok(text.includes(EDIT_LINE), 'the card says how to change slide words');
    assert.equal(await page.locator('#savedCard .saved-card-swatches li').count(), 3, 'three main colors');
    assert.equal(await page.locator('#savedCard').getAttribute('role'), 'region');
    await page.locator('#savedOk').click();
    await page.locator('#savedCard').waitFor({state: 'hidden'});
    await showsBadge(page, 'Saved');
  });

  {
    const save = hold();
    await scenario("state 4: an edit closes the card and the badge tracks the save", {seed: {[SESSION_KEY]: session()}, hooks: {save: [save]}}, async page => {
      await savedState(page);
      await paint(page, 'mauve');
      await page.locator('#savedCard').waitFor({state: 'hidden'});
      await showsBadge(page, 'Changes not saved');
      const reply = saveResponse(page);
      await saveControl(page).click();
      await save.arrived;
      await showsBadge(page, 'Saving…');
      save.release();
      await reply;
      await showsBadge(page, 'Saved');
      assert.equal(await page.locator('#savedCard').isHidden(), true, 'the card stays closed after the save');
    });
  }

  {
    const save = hold();
    await scenario("state 4: editing during a save leaves Changes not saved", {seed: {[SESSION_KEY]: session()}, hooks: {save: [save]}}, async page => {
      await savedState(page);
      await paint(page, 'mauve');
      const reply = saveResponse(page);
      await saveControl(page).click();
      await save.arrived;
      await paint(page, 'accent');
      save.release();
      await reply;
      await page.waitForFunction(() => document.querySelector('#saveBadge')?.textContent !== 'Saving…');
      assert.equal(await badge(page).textContent(), 'Changes not saved', 'a save of older choices is not called saved');
    });
  }

  {
    const save = hold();
    // Only the local test page lets a session change lessons while a save is pending.
    // The local test page shows the badge only, never the card (ledger R6).
    await scenario("state 4: a late answer after switching lessons is ignored", {local: true, hooks: {save: [save]}}, async page => {
      await showsBadge(page, 'Saved');
      assert.equal(await page.locator('#savedCard').isHidden(), true, 'no card on the local test page');
      await paint(page, 'mauve');
      await showsBadge(page, 'Changes not saved');
      const reply = saveResponse(page);
      await saveControl(page).click();
      await save.arrived;
      await builderDestination(page, 'Start');
      await page.locator('#lessonSelect').selectOption('goal-setting');
      save.release();
      await reply;
      await page.waitForTimeout(100);
      const stored = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), SESSION_KEY);
      assert.equal(stored.lessonId, 'goal-setting');
      assert.equal(stored.revision, null, 'the late answer did not land on the new lesson');
      assert.notEqual(await badge(page).isVisible() ? await badge(page).textContent() : '', 'Saved', 'the badge does not call the new lesson saved');
      assert.notEqual(await badge(page).isVisible() ? await badge(page).textContent() : '', 'Saving…', 'the old save no longer shows as saving');
    });
  }

  {
    const save = hold();
    await scenario("state 6: browser work ahead of its own save is saved at once", {
      seed: {[SESSION_KEY]: session({baseSelectionKey: 'an older key'}), [DRAFT_KEY]: draft(builtDesign)},
      autosave: {enabled: true, idleMs: 30000, stepMs: 30000},
      hooks: {save: [save]}
    }, async (page, calls) => {
      await save.arrived;
      const opened = calls.find(call => call.action === 'open'), saved = calls.find(call => call.action === 'save');
      assert.ok(saved.at - opened.at < 1000, 'the save starts within a second of the open');
      await showsHeading(page, 'Your latest changes are being saved for the team');
      await showsBadge(page, 'Saving…');
      save.release();
      await savedState(page);
      assert.match(await cardText(page), /Saved Friday, November 6 at 10:00 AM/, 'the card shows the new save time');
    });
  }

  await scenario("state 7: no save yet says so, two wordings (untouched presets)", {
    seed: {[SESSION_KEY]: session({revision: null, savedAt: null})},
    store: {revision: null, savedAt: null, selection: null}
  }, async page => {
    await showsHeading(page, "Your team hasn't saved a design yet.");
    const text = await cardText(page);
    assert.match(text, /You're looking at the starting presets\./);
    assert.ok(text.includes(EDIT_LINE));
    assert.equal(await badge(page).isHidden(), true, 'no badge until the first change');
  });

  await scenario("state 7: no save yet says so, two wordings (browser work)", {
    seed: {[SESSION_KEY]: session({revision: null, savedAt: null}), [DRAFT_KEY]: draft(builtDesign)},
    store: {revision: null, savedAt: null, selection: null}
  }, async page => {
    await showsHeading(page, "Your team hasn't saved a design yet.");
    assert.match(await cardText(page), /The changes on screen are only in this browser until you choose Save for the team\./);
    await showsBadge(page, 'Changes not saved');
  });

  await scenario("state 8: work before the code is in Recover previous draft", {seed: {[DRAFT_KEY]: draft(builtDesign)}}, async page => {
    await page.locator('#stage-team').waitFor();
    if (!await page.locator('#openDialog').isVisible()) await page.locator('#btnEnterTeamCode').click();
    await page.locator('#openLesson').selectOption(LESSON.id);
    await page.locator('#openEditCode').fill(CODE);
    await page.locator('#openConfirm').click();
    await page.locator('#openDialog').waitFor({state: 'hidden'});
    await savedState(page);
    assert.ok((await cardText(page)).includes(PRIOR_WORK_LINE), 'the card says where the earlier work went');
  });

  await scenario("state 9: a converted save is not called saved", {seed: {[SESSION_KEY]: session()}, store: {selection: selectionOf(retired)}}, async page => {
    await showsHeading(page, "Opened your team's saved design with updates.");
    assert.match(await cardText(page), /These updates haven't been saved yet\./);
    await showsBadge(page, 'Changes not saved');
  });
  // Browser work made on revision A, while the team has saved B since.
  const competing = {[SESSION_KEY]: session({revision: OLD_REVISION, baseSelectionKey: 'an older key'}), [DRAFT_KEY]: draft(builtDesign)};
  const quickAutosave = {enabled: true, idleMs: 50, stepMs: 50};

  await scenario('state 5: competing versions wait for a click', {seed: competing, autosave: quickAutosave}, async (page, calls) => {
    await showsConflict(page, 'Friday, November 6 at 9:10 AM');
    await page.waitForTimeout(200);
    assert.deepEqual(saves(calls), [], 'nothing is saved while two versions compete');
    assert.deepEqual((await shownDesign(page)).fonts, builtDesign.fonts, 'the screen still shows the browser work');
  });

  await scenario("state 5: Use the team's saved design keeps a recovery copy", {seed: competing, autosave: quickAutosave}, async (page, calls) => {
    await showsConflict(page, 'Friday, November 6 at 9:10 AM');
    await page.locator('#savedUseSaved').click();
    await savedState(page);
    const recovery = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), BACKUP_DRAFT_KEY);
    assert.deepEqual(recovery.design.fonts, builtDesign.fonts, 'the browser work is in the recovery copy');
    assert.deepEqual((await shownDesign(page)).fonts, base.fonts, 'the screen shows the team save');
    assert.deepEqual(saves(calls), []);
  });

  await scenario('state 5: a full recovery store stops the load', {seed: competing}, async (page, calls) => {
    await showsConflict(page, 'Friday, November 6 at 9:10 AM');
    await page.evaluate(key => {
      const setItem = Storage.prototype.setItem;
      Storage.prototype.setItem = function (name, value) {
        if (name === key) throw new DOMException('The recovery store is full.', 'QuotaExceededError');
        return setItem.call(this, name, value);
      };
    }, BACKUP_DRAFT_KEY);
    await page.locator('#savedUseSaved').click();
    await page.locator('#fileStatus').filter({hasText: FULL_RECOVERY_NOTICE}).waitFor();
    assert.deepEqual((await shownDesign(page)).fonts, builtDesign.fonts, 'nothing was loaded over the browser work');
    assert.equal(calls.filter(call => call.action === 'open').length, 1, 'the saved design was not fetched');
    await showsHeading(page, CONFLICT_HEADING);
  });

  await scenario('state 5: a mid-session conflict reopens the choice', {
    seed: {[SESSION_KEY]: session()},
    hooks: {save: [conflict409(NEXT_REVISION, NEXT_SAVED_AT)]}
  }, async (page, calls) => {
    await savedState(page);
    await paint(page, 'mauve');
    await page.locator('#savedCard').waitFor({state: 'hidden'});
    await saveControl(page).click();
    await showsConflict(page, 'Friday, November 6 at 10:00 AM');
    assert.equal(saves(calls).length, 1, 'nothing else was saved');
    await paint(page, 'accent');
    await showsHeading(page, CONFLICT_HEADING);
  });

  // An older recovery copy (for example the work state 8 points to) survives a failed load.
  const OLDER_RECOVERY = draft({...base, background: 'dot-grid'});
  await scenario("state 5: a failed open after Use the team's saved design keeps the older recovery copy", {
    seed: {...competing, [BACKUP_DRAFT_KEY]: OLDER_RECOVERY},
    hooks: {open: [{}, {reply: {status: 503, json: {ok: false, error: 'store', message: 'The connected store could not complete this request.'}}}]}
  }, async (page, calls) => {
    await showsConflict(page, 'Friday, November 6 at 9:10 AM');
    await page.locator('#savedUseSaved').click();
    await showsHeading(page, "We couldn't check your team's saved design.");
    assert.equal(calls.filter(call => call.action === 'open').length, 2);
    assert.equal(await page.evaluate(key => localStorage.getItem(key), BACKUP_DRAFT_KEY), OLDER_RECOVERY, 'the older recovery copy is unchanged');
    assert.deepEqual((await shownDesign(page)).fonts, builtDesign.fonts, 'the browser work is still on screen');
    assert.deepEqual(saves(calls), []);
  });

  await scenario('state 5: a conflict after a failed open still offers the choice', {
    seed: {[SESSION_KEY]: session()},
    hooks: {
      open: [{reply: {status: 503, json: {ok: false, error: 'store', message: 'The connected store could not complete this request.'}}}],
      save: [conflict409(NEXT_REVISION, NEXT_SAVED_AT)]
    }
  }, async (page, calls) => {
    await showsHeading(page, "We couldn't check your team's saved design.");
    await paint(page, 'mauve');
    await saveControl(page).click();
    await showsConflict(page, 'Friday, November 6 at 10:00 AM');
    assert.equal(saves(calls).length, 1);
  });

  await scenario('Replace it names one version', {
    seed: competing,
    autosave: quickAutosave,
    hooks: {save: [conflict409(NEXT_REVISION, NEXT_SAVED_AT), {reply: {json: {ok: true, revision: FINAL_REVISION, savedAt: FINAL_SAVED_AT}}}]}
  }, async (page, calls) => {
    await showsConflict(page, 'Friday, November 6 at 9:10 AM');
    await page.locator('#savedKeepChanges').click();
    await page.locator('#savedCard').waitFor({state: 'hidden'});
    await showsBadge(page, 'Changes not saved');
    await saveControl(page).click();
    await asks(page, 'Friday, November 6 at 9:10 AM');
    await page.locator('#replaceCancel').click();
    await closed(page);
    await saveControl(page).click();
    await asks(page, 'Friday, November 6 at 9:10 AM');
    await page.keyboard.press('Escape');
    await closed(page);
    await page.waitForTimeout(200);
    assert.deepEqual(saves(calls), [], 'Cancel, Escape and the paused autosave send nothing');

    await page.reload();
    await showsConflict(page, 'Friday, November 6 at 9:10 AM');
    assert.deepEqual((await shownDesign(page)).fonts, builtDesign.fonts, 'the reload kept the browser work');
    await page.locator('#savedKeepChanges').click();
    await saveControl(page).click();
    await asks(page, 'Friday, November 6 at 9:10 AM');
    await page.locator('#replaceConfirm').click();
    // The service moved to C before the replace arrived: the request named B only, and BeSpoke asks again about C.
    await asks(page, 'Friday, November 6 at 10:00 AM');
    assert.deepEqual(saves(calls).map(call => call.expectedRevision), [REVISION]);
    await page.locator('#replaceConfirm').click();
    await closed(page);
    await showsBadge(page, 'Saved');
    assert.deepEqual(saves(calls).map(call => call.expectedRevision), [REVISION, NEXT_REVISION], 'each yes replaced exactly the version it named');
  });

  await scenario('state 10: a view link shows the card and See all choices, no Save', {
    seed: {[SESSION_KEY]: session()},
    hooks: {open: [{reply: {json: {ok: true, access: 'view', revision: REVISION, savedAt: SAVED_AT, selection: savedSelection}}}]}
  }, async page => {
    await showsHeading(page, "You're looking at this team's saved design");
    await page.locator('#savedChoices').waitFor();
    await page.locator('#savedOk').waitFor();
    await page.locator('#saveBadge').waitFor({state: 'hidden'});
    assert.doesNotMatch(await cardText(page), /Make it yours|Save for the team/);
    const enabledSave = await page.getByText('Save for the team').evaluateAll(nodes => nodes.filter(node => node.offsetParent && !node.disabled).length);
    assert.equal(enabledSave, 0, 'no enabled Save for the team control');
    await page.locator('#savedOk').click();
    await page.locator('#savedCard').waitFor({state: 'hidden'});
    await page.locator('#saveBadge').waitFor({state: 'hidden'});
  });
} finally {
  await server.close();
}
