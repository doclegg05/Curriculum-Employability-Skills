/** Synthetic browser regression checks. No external accounts, uploads or real team data. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { handleAction } from '../netlify/functions/bespoke-handoff.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const types = { '.html':'text/html', '.js':'text/javascript', '.json':'application/json', '.css':'text/css', '.woff2':'font/woff2', '.png':'image/png' };
const server = http.createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const target = path.resolve(root, '.' + pathname + (pathname.endsWith('/') ? 'index.html' : ''));
    if (!target.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    const body = await fs.readFile(target); res.setHeader('Content-Type', types[path.extname(target)] || 'application/octet-stream'); res.end(body);
  } catch { res.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const url = `http://127.0.0.1:${server.address().port}/bespoke/`;
const browser = await chromium.launch({ headless:true });
const fixture = JSON.parse(await fs.readFile(path.join(root,'scripts/test-fixtures/bespoke/selection-money-management.json'),'utf8'));
let passed = 0;
const errors = [];
async function newPage(context, beforeGoto) {
  const page = await context.newPage(); page.on('pageerror', e => errors.push(e.message));
  page.on('dialog', dialog => dialog.accept());
  if (beforeGoto) await beforeGoto(page);
  await page.goto(url); await page.locator('#stepList button').first().waitFor(); return page;
}
async function importFile(page, payload, name='team-selection.json') {
  await page.locator('#teamFileInput').setInputFiles({name, mimeType:'application/json', buffer:Buffer.from(JSON.stringify(payload))});
}
async function saveFile(page, button='#btnDownloadDesign') {
  if (button === '#btnDownloadDesign' && await page.locator(button).count() === 0) {
    await page.getByRole('button', { name: /Review/ }).click();
  }
  if (button === '#btnDownloadDesign') await page.locator('details.builder-note').evaluate(el => { el.open = true; });
  const download = page.waitForEvent('download'); await page.locator(button).click();
  const file = await download; return {name:file.suggestedFilename(), value:JSON.parse(await fs.readFile(await file.path(),'utf8'))};
}
function memoryGitHub() {
  const files = new Map();
  return {
    dispatches: [],
    async readDraft(lessonId) { return files.get(lessonId) || null; },
    async writeDraft(lessonId, envelope, sha) {
      const current = files.get(lessonId);
      if (sha && (!current || current.sha !== sha)) { const err = new Error('conflict'); err.status = 409; throw err; }
      const next = { sha: `sha-${files.size + 1}`, envelope };
      files.set(lessonId, next);
      return next.sha;
    },
    async dispatchSpokeSignal(payloadJson) { this.dispatches.push(payloadJson); }
  };
}
function ok(name) { passed++; console.log(`PASS ${name}`); }
try {
  const context = await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce',permissions:['clipboard-read','clipboard-write']});
  const page = await newPage(context);
  await page.locator('#btnNext').click();
  assert.equal(await page.locator('#lessonSelect').count(),1); ok('beginner workflow does not require edit code');
  await importFile(page, fixture); await page.getByText('Opened team-selection.json.',{exact:false}).waitFor();
  const exported = await saveFile(page);
  for (const key of ['lesson','team','theme','sampleContent','unspoken','presetId']) assert.deepEqual(exported.value[key],fixture[key]);
  assert.match(exported.name,/money-management-.*selection\.json$/); ok('design file round trips every choice and text field');
  await page.reload(); await page.locator('#btnSubmit').waitFor();
  assert.deepEqual((await saveFile(page)).value.theme,fixture.theme); ok('reopening browser restores saved draft');
  const bad = structuredClone(fixture); bad.theme.colorLead='unapproved-pink';
  await importFile(page,bad); await page.locator('#fileStatus').filter({hasText:'Could not open'}).waitFor();
  assert.deepEqual((await saveFile(page)).value.theme,fixture.theme); ok('invalid import leaves previous work intact');
  const empty = structuredClone(fixture); empty.sampleContent={bullets:'',mythReality:''};
  await importFile(page,empty); await page.locator('#fileStatus').filter({hasText:'Opened'}).waitFor();
  assert.deepEqual((await saveFile(page)).value.sampleContent,empty.sampleContent); ok('empty sample text round trips without old content');
  await page.locator('#btnRecoverDraft').click(); await page.locator('#btnSubmit').waitFor();
  assert.deepEqual((await saveFile(page)).value.sampleContent,fixture.sampleContent); ok('previous draft can be recovered');
  await page.getByRole('button',{name:/Step 1 of .*How to use/}).click();
  await page.locator('#stepPanel summary').click(); await page.locator('#editCode').fill('test-code');
  await page.getByRole('button',{name:/Step 10 of .*Review/}).click(); await page.locator('#btnSubmit').click();
  await page.getByText('Saving is not connected yet',{exact:false}).waitFor(); ok('send does not pretend the design was delivered before Britt connects saving');
  const second = await newPage(context);
  await second.getByRole('button',{name:/Step 2 of .*Lesson & team/}).click(); await second.locator('#teamName').fill('Changed in other tab');
  await page.locator('#saveStatus').filter({hasText:'Not saved'}).waitFor();
  const kept = await saveFile(page); assert.equal(kept.value.team.name,fixture.team.name);
  const shared = await second.evaluate(()=>JSON.parse(localStorage.getItem('bespoke-draft-v1')).teamName);
  assert.equal(shared,'Changed in other tab'); ok('concurrent tabs pause saving and preserve both working copies');
  await second.close(); await page.reload(); await page.locator('#stepList button').first().waitFor();
  await page.getByRole('button',{name:/Step 1 of .*How to use/}).click();
  await page.locator('#stepPanel summary').click(); await page.locator('#editCode').fill('test-code');
  await page.getByRole('button',{name:/Step 10 of .*Review/}).click(); await page.locator('#btnCopyView').click();
  await page.locator('#shareStatus').filter({hasText:'Snapshot link copied'}).waitFor();
  const link = await page.evaluate(()=>navigator.clipboard.readText());
  const fresh = await browser.newContext({reducedMotion:'reduce'}); const view = await fresh.newPage();
  view.on('pageerror',e=>errors.push(e.message));view.on('dialog',d=>d.accept());await view.goto(link);
  await view.locator('body[data-access="view"]').waitFor(); assert.equal(await view.locator('#btnSave').isDisabled(),true);
  await view.locator('#btnLeadUnlock').click(); await view.locator('#leadCodeInput').fill('test-code'); await view.locator('#leadCodeForm button').click();
  await view.locator('body[data-access="edit"]').waitFor(); assert.equal(new URL(view.url()).hash,'');
  await view.getByRole('button',{name:/Step 2 of .*Lesson & team/}).click(); await view.locator('#teamName').fill('Newer than snapshot');
  await view.reload(); await view.locator('#teamName').waitFor(); assert.equal(await view.locator('#teamName').inputValue(),'Newer than snapshot');
  ok('fresh browser unlocks snapshot and reload retains later edits');
  await fresh.close();
  // Audit actual operable surfaces after edits, desktop and phone.
  await page.reload(); await page.locator('#btnSubmit').waitFor();
  await page.addScriptTag({path:path.join(root,'node_modules/axe-core/axe.min.js')});
  const violations = await page.evaluate(async()=> (await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})));
  assert.deepEqual(violations,[]); ok('review screen has no axe WCAG A/AA violations in tested state');
  for (const width of [1280,768,390]) {
    await page.setViewportSize({width,height:900});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`overflow at ${width}`);
    assert.equal(await page.locator('#btnSave').isVisible(),true);
    assert.equal(await page.locator('#btnOpen').isVisible(),true);
    assert.equal(await page.locator('#btnSend').isVisible(),true);
  } ok('save controls reachable at desktop tablet and phone widths');
  await page.setViewportSize({width:1440,height:900});
  await page.getByRole('button',{name:/Step 7 of .*Cards/}).click();
  await page.locator('#varyCards').uncheck(); await page.locator('#varyCards').check();
  const seeded = (await saveFile(page)).value;
  await page.getByRole('button',{name:/Step 7 of .*Cards/}).click();
  assert.equal(Object.values(seeded.theme.cards.chapterStyles).includes('gradient-fill'),false);
  assert.equal(await page.locator('select[aria-label="Card style for chapter W"] option[value="gradient-fill"]').evaluate(option => option.disabled),true);
  ok('blocked styles cannot enter chapter choices or automatic rotation');
  const badCard = structuredClone(fixture); badCard.theme.cards.lessonWide='gradient-fill';
  await importFile(page,badCard); await page.locator('#fileStatus').filter({hasText:'Could not open'}).waitFor();
  assert.deepEqual((await saveFile(page)).value.theme,seeded.theme); ok('blocked style import preserves draft');
  assert.deepEqual(errors,[]); ok('no browser runtime errors');
  await context.close();
  const unavailable = await browser.newContext({reducedMotion:'reduce'});
  await unavailable.addInitScript(()=>{Storage.prototype.setItem=function(){throw new DOMException('Unavailable','QuotaExceededError');};});
  const blocked = await newPage(unavailable); await blocked.locator('#saveStatus').filter({hasText:'Could not save'}).waitFor();
  await blocked.getByRole('button',{name:/Step 10 of .*Review/}).click();
  await saveFile(blocked); ok('storage failure is visible and portable file saving still works'); await unavailable.close();
  const damaged = await browser.newContext({reducedMotion:'reduce'});
  await damaged.addInitScript(()=>{if(!localStorage.getItem('bespoke-draft-v1')) localStorage.setItem('bespoke-draft-v1',JSON.stringify({step:999,stepId:'removed-step',teamName:'Recoverable team'}));});
  const recovered = await newPage(damaged);
  await recovered.locator('#btnNext').click(); assert.equal(await recovered.locator('#teamName').inputValue(),'Recoverable team');
  ok('outdated saved step safely returns to beginning without losing text'); await damaged.close();
  const github = memoryGitHub();
  async function installHandoff(page) {
    await page.route('**/handoff-config.json', route => route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({ apiBase: 'https://handoff.test/api/bespoke' })
    }));
    await page.route('https://handoff.test/api/bespoke', async route => {
      if (route.request().method() === 'OPTIONS') {
        await route.fulfill({ status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' } });
        return;
      }
      const body = JSON.parse(route.request().postData() || '{}');
      assert.equal(JSON.stringify(body).includes('test-token-not-a-real-secret'), false);
      const result = await handleAction(body, { github, token: 'test-token-not-a-real-secret' });
      await route.fulfill({
        status: result.status,
        contentType: 'application/json',
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify(result.body)
      });
    });
  }
  const cloudContext = await browser.newContext({ reducedMotion: 'reduce' });
  const lead = await newPage(cloudContext, installHandoff);
  await importFile(lead, fixture);
  await lead.getByRole('button', { name: /Step 1 of .*How to use/ }).click();
  await lead.locator('#stepPanel summary').click();
  await lead.locator('#editCode').fill('room-code');
  await lead.locator('#btnSave').click();
  await lead.locator('#fileStatus').filter({ hasText: 'Choose Open on any computer' }).waitFor();
  const otherContext = await browser.newContext({ reducedMotion: 'reduce' });
  const other = await newPage(otherContext, installHandoff);
  await other.locator('#btnOpen').click();
  await other.locator('#openEditCode').fill('nope');
  await other.locator('#openConfirm').click();
  await other.locator('#openError').filter({ hasText: 'That code is not right. Try again.' }).waitFor();
  assert.equal(github.dispatches.length, 0);
  await other.locator('#openEditCode').fill('room-code');
  await other.locator('#openConfirm').click();
  await other.locator('#fileStatus').filter({ hasText: 'Opened the saved design' }).waitFor();
  await other.getByRole('button', { name: /Step 2 of .*Lesson & team/ }).click();
  assert.equal(await other.locator('#teamName').inputValue(), 'Dogfood team');
  await lead.locator('#btnSend').click();
  await lead.locator('#fileStatus').filter({ hasText: 'Sent to Britt' }).waitFor();
  assert.equal(github.dispatches.length, 1);
  assert.equal(github.dispatches[0].includes('room-code'), false);
  ok('save, open, and send keep the edit code on the server');
  assert.deepEqual(errors, []);
  await otherContext.close();
  await cloudContext.close();
  console.log(`BeSpoke browser checks: ${passed} passed.`);
} finally { await browser.close(); await new Promise(resolve=>server.close(resolve)); }
