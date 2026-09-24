#!/usr/bin/env node
// End-to-end checks use a fresh loopback-only server, synthetic people and memory drafts.
// Nothing here uses provisioned team codes, a hosted API, Send, or released lessons.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { createDevServer, LOCAL_PREVIEW_CODE } from './bespoke-dev-server.mjs';
import { compareDesign } from '../bespoke/similarity.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalog = JSON.parse(await fs.readFile(path.join(root, 'bespoke/builder-catalog.json'), 'utf8'));
const fingerprints = JSON.parse(await fs.readFile(path.join(root, 'bespoke/lesson-fingerprints.json'), 'utf8'));
const oldSelection = JSON.parse(await fs.readFile(path.join(root, 'scripts/test-fixtures/bespoke/selection-money-management.json'), 'utf8'));
const axeSource = await fs.readFile(path.join(root, 'node_modules/axe-core/axe.min.js'), 'utf8');
const browser = await chromium.launch({ headless: true });
const failures = [], assets = [], pageErrors = [], externalRequests = [];
let passed = 0;

async function scenario(name, callback) {
  const server = await createDevServer({ port: 0 });
  const contexts = [], actions = [];
  const makePage = async ({ mobile = false, autosave = { enabled: false } } = {}) => {
    const context = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 }, reducedMotion: 'reduce', acceptDownloads: true });
    contexts.push(context);
    await context.addInitScript(settings => { window.__bespokeAutosave = settings; }, autosave);
    await context.route(/^https?:/, route => {
      if (new URL(route.request().url()).origin === server.baseUrl) return route.continue();
      externalRequests.push(route.request().url()); return route.abort();
    });
    const page = await context.newPage();
    page.on('pageerror', error => pageErrors.push(`${name}: ${error.message}`));
    page.on('dialog', dialog => dialog.accept());
    page.on('request', request => {
      if (request.url().endsWith('/api/bespoke') && request.method() === 'POST') {
        const body = request.postDataJSON(); actions.push({ action: body.action, selection: body.selection });
      }
    });
    page.on('response', response => {
      if (!response.url().endsWith('/api/bespoke') && response.status() >= 400) assets.push({ url: response.url(), status: response.status() });
    });
    await page.goto(server.baseUrl + '/bespoke/');
    await ready(page);
    return page;
  };
  try {
    await callback({ server, makePage, actions });
    passed++; console.log(`PASS ${name}`);
  } catch (error) {
    failures.push({ name, message: error.stack || error.message });
    console.error(`FAIL ${name}: ${error.message}`);
  } finally {
    for (const context of contexts) await context.close();
    await server.close();
  }
}

async function ready(page) {
  await page.locator('#stepList button').first().waitFor();
  await page.locator('#localPreviewNotice').waitFor({ state: 'visible' });
  await page.locator('#btnSave').filter({ hasText: 'Save test design' }).waitFor();
}
// Match human-facing step names without relying on their ordinal position.
async function go(page, label) {
  if (await page.locator('#surface-design').isVisible()) await page.locator('#surface-design').click();
  const steps = page.locator('#stepList button');
  await steps.filter({ hasText: label }).click();
}
const draft = page => page.evaluate(() => JSON.parse(localStorage.getItem('bespoke-draft-v2')));
const design = async page => (await draft(page)).design;
async function paint(page, role, color) {
  await go(page, 'Paint your elements');
  await page.locator('#colorRole').selectOption(role);
  await page.locator(`[data-color="${color}"]`).click();
}
async function choose(page, decision, value) {
  const group = page.getByRole('group', { name: new RegExp(decision) });
  await group.locator(`[data-choice="${value}"]`).click();
}
async function fillTeam(page) {
  await go(page, 'Lesson & team');
  await page.locator('#teamName').fill('Synthetic review team');
  await page.locator('#spokespersonName').fill('Sample Instructor');
  await page.locator('#spokespersonEmail').fill('sample@example.org');
}
async function save(page) {
  const response = page.waitForResponse(response => response.url().endsWith('/api/bespoke') && response.request().postDataJSON()?.action === 'save');
  await page.locator('#btnSave').click();
  const result = await response;
  assert.equal(result.status(), 200, await result.text());
  await page.locator('#fileStatus').filter({ hasText: /Shared design saved|already up to date/ }).waitFor();
}
async function download(page, original = false) {
  const control = page.locator(original ? '#stepPanel button' : '#btnDownloadBackup').filter(original ? { hasText: 'Download original v1 design' } : {});
  if (!original && !await control.isVisible()) await page.locator('.more-menu summary').click();
  const event = page.waitForEvent('download');
  await control.click();
  const file = await event;
  const buffer = await fs.readFile(await file.path());
  return { name: file.suggestedFilename(), buffer, payload: JSON.parse(buffer.toString('utf8')) };
}
async function upload(page, payload, name = 'synthetic-backup.json') {
  await page.locator('#teamFileInput').setInputFiles({ name, mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(payload)) });
  await page.locator('#fileStatus').filter({ hasText: `Opened ${name}.` }).waitFor();
}
async function openService(server) {
  const response = await fetch(server.baseUrl + '/api/bespoke', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'open', lessonId: 'money-management', editCode: LOCAL_PREVIEW_CODE }) });
  assert.equal(response.status, 200);
  return response.json();
}
async function assertNoOverflow(page, label) {
  const metrics = await page.evaluate(() => ({ viewport: innerWidth, body: document.body.scrollWidth, html: document.documentElement.scrollWidth }));
  assert(metrics.body <= metrics.viewport + 1 && metrics.html <= metrics.viewport + 1, `${label}: ${JSON.stringify(metrics)}`);
}
async function axe(page, label) {
  await page.addScriptTag({ content: axeSource });
  // The watermark is intentionally faint decoration, hidden from assistive tech;
  // the visible chapter label supplies the information and stays in this scan.
  const violations = await page.evaluate(async () => (await window.axe.run({ exclude: [['.slide-watermark[aria-hidden="true"]']] }, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } })).violations.map(item => ({ id: item.id, impact: item.impact, nodes: item.nodes.map(node => ({ target: node.target, message: node.failureSummary })) })));
  assert.deepEqual(violations, [], `${label}: ${JSON.stringify(violations, null, 2)}`);
}

try {
  await scenario('cumulative colors, independent fonts, editable presets, history and v2 file recovery', async ({ makePage }) => {
    const page = await makePage();
    await go(page, 'Your starting point');
    assert.equal(await page.locator('[data-preset]').count(), 6);
    await page.locator('[data-preset="professional"]').click();
    await go(page, 'Text boxes');
    await page.getByText('Try your own sample text', { exact: true }).click();
    await page.locator('#sample-box-3').fill('Keep this fourth sample even while it is hidden.');
    await go(page, 'Your starting point');
    await page.locator('[data-preset="modern"]').click();
    assert.equal((await design(page)).samples.boxes[3], 'Keep this fourth sample even while it is hidden.');
    const beforePaint = await design(page);
    await go(page, 'Paint your elements');
    for (const role of catalog.roles) {
      await page.locator('#colorRole').selectOption(role.id);
      assert.equal(await page.locator('.paint-chip').count(), 11, role.id);
      assert(await page.locator('[data-color="light"]').isVisible(), `${role.id}: White visible`);
    }
    await paint(page, 'sidebar', 'mauve');
    assert.equal((await design(page)).roles.sidebar, 'mauve');
    assert.equal(await page.locator('.slide-sidebar').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(167, 37, 63)');
    const expectedRoles = { ...beforePaint.roles, sidebar: 'mauve' };
    assert.deepEqual((await design(page)).roles, expectedRoles);
    await paint(page, 'contentBackground', 'light');
    await page.locator('#colorRole').selectOption('body');
    const beforeUnsafe = await design(page);
    const gold = page.locator('[data-color="gold"]');
    assert.equal(await gold.getAttribute('aria-disabled'), 'true');
    await gold.focus(); await page.keyboard.press('Enter');
    assert.match(await page.locator('#colorHelp').textContent(), /reserved|not text/);
    assert.deepEqual(await design(page), beforeUnsafe);
    await go(page, 'Fonts & background');
    assert.equal(await page.locator('#font-heading option').count(), 12);
    assert.equal(await page.locator('#font-body option').count(), 12);
    await page.locator('#font-heading').selectOption('bitter');
    assert.equal((await design(page)).fonts.body, beforePaint.fonts.body);
    await page.locator('#font-body').selectOption('crimson-pro');
    assert.deepEqual((await design(page)).fonts, { heading: 'bitter', body: 'crimson-pro' });
    const actualFonts = await page.evaluate(async () => {
      await document.fonts.ready;
      return { heading: getComputedStyle(document.querySelector('.slide-card h3')).fontFamily, body: getComputedStyle(document.querySelector('.slide-card .slide-body')).fontFamily, headingLoaded: document.fonts.check('16px "Bitter"'), bodyLoaded: document.fonts.check('16px "Crimson Pro"') };
    });
    assert.match(actualFonts.heading, /Bitter/); assert.match(actualFonts.body, /Crimson Pro/);
    assert(actualFonts.headingLoaded && actualFonts.bodyLoaded, 'Both independently chosen local webfonts load.');
    await choose(page, 'Background pattern', 'crosshatch');
    await go(page, 'Title slide');
    await choose(page, 'Arrangement', 'bottom');
    const combined = await design(page);
    await go(page, 'Chapter divider'); await choose(page, 'Arrangement', 'number');
    await go(page, 'Text boxes');
    assert.deepEqual((await design(page)).roles, combined.roles);
    assert.deepEqual((await design(page)).fonts, combined.fonts);
    assert.equal((await design(page)).slides.title.layout, 'bottom');
    const expected = await design(page);
    const beforeHistory = (await draft(page)).changes;
    await page.reload(); await ready(page);
    assert.deepEqual(await design(page), expected);
    assert.deepEqual((await draft(page)).changes, beforeHistory);
    await page.locator('#btnUndo').click();
    assert.equal((await design(page)).slides.divider.layout, combined.slides.divider.layout);
    assert.equal((await design(page)).slides.title.layout, 'bottom');
    await page.locator('#btnRedo').click();
    assert.deepEqual(await design(page), expected);
    const closest = compareDesign(fingerprints, expected)[0];
    assert.match(await page.locator('#distinctMeter').textContent(), new RegExp(`${closest.shared}.*of ${closest.total}`));
    assert((await page.locator('#distinctMeter').textContent()).includes(closest.title));
    await page.locator('.similarity summary').click();
    assert.equal(await page.locator('#similarityDetails li').count(), 6);
    assert.match(await page.locator('#similarityDetails').textContent(), /not a perceptual percentage/);
    const backup = await download(page);
    assert.equal(backup.payload.schema, 'bespoke-selection/v2');
    assert.deepEqual(backup.payload.design, expected);
    assert(!backup.buffer.toString('utf8').includes(LOCAL_PREVIEW_CODE));
    const second = await makePage();
    await upload(second, backup.payload, backup.name);
    assert.deepEqual(await design(second), expected);
  });

  await scenario('text boxes retain hidden words across every count, title bar and text treatment', async ({ makePage }) => {
    const page = await makePage();
    await go(page, 'Text boxes');
    await page.getByText('Try your own sample text', { exact: true }).click();
    await page.locator('#sample-box-0').fill('First meaningful point\nSecond meaningful point');
    await page.locator('#sample-box-3').fill('Recoverable fourth point.');
    for (const count of ['1', '2', '3', '4']) {
      await choose(page, 'Number of text boxes', count);
      assert.equal(await page.locator('.bespoke-box').count(), Number(count));
      assert.equal((await design(page)).samples.boxes[3], 'Recoverable fourth point.');
      for (const treatment of ['paragraph', 'bullets', 'numbered']) {
        await choose(page, 'Text treatment', treatment);
        assert.equal(await page.locator('.bespoke-box:first-child ul').count(), treatment === 'bullets' ? 1 : 0);
        assert.equal(await page.locator('.bespoke-box:first-child ol').count(), treatment === 'numbered' ? 1 : 0);
      }
    }
    await choose(page, 'One shared title bar', 'false');
    assert.equal(await page.locator('.bespoke-title-bar').count(), 0);
    await choose(page, 'One shared title bar', 'true');
    assert.equal(await page.locator('.bespoke-title-bar').count(), 1);
    await choose(page, 'Number of text boxes', '1');
    await page.reload(); await ready(page);
    assert.equal((await design(page)).samples.boxes[3], 'Recoverable fourth point.');
    await go(page, 'Text boxes'); await choose(page, 'Number of text boxes', '4');
    assert.match(await page.locator('.bespoke-box').nth(3).textContent(), /Recoverable fourth point/);
    for (const view of ['title', 'divider', 'video', 'activity', 'cards']) {
      await page.locator(`#previewTabs [data-view="${view}"]`).click();
      assert.equal(await page.locator('#modelStage .bespoke-slide').getAttribute('data-kind'), view);
      assert.equal((await design(page)).slides.cards.count, '4');
    }
  });

  await scenario('surface changes retain choices, show repair guidance and refuse unreadable shared saves', async ({ makePage, actions }) => {
    const page = await makePage(); await fillTeam(page);
    const initial = await design(page);
    await paint(page, 'titleBackground', 'light');
    assert.equal((await design(page)).roles.titleText, initial.roles.titleText);
    assert.equal((await design(page)).roles.subtitle, initial.roles.subtitle);
    assert(await page.locator('#readabilityNotes').isVisible());
    assert.match(await page.locator('#readabilityNotes').textContent(), /needs .*:1/);
    const saves = actions.filter(action => action.action === 'save').length;
    await page.locator('#btnSave').click();
    await page.locator('#fileStatus').filter({ hasText: 'Could not save.' }).waitFor();
    assert.equal(actions.filter(action => action.action === 'save').length, saves);
    const invalidDraft = await design(page);
    const repairBackup = await download(page);
    const repairPage = await makePage();
    await upload(repairPage, repairBackup.payload, 'needs-readability-repair.json');
    assert.deepEqual(await design(repairPage), invalidDraft);
    assert(await repairPage.locator('#readabilityNotes').isVisible(), 'An unreadable backup stays recoverable for repair.');
    await page.reload(); await ready(page);
    assert.deepEqual(await design(page), invalidDraft);
    await paint(page, 'titleBackgroundEnd', 'light');
    await paint(page, 'titleText', 'royal');
    await paint(page, 'subtitle', 'royal');
    assert.equal(await page.locator('#readabilityNotes').isVisible(), false);
    await save(page);
    assert.equal(actions.filter(action => action.action === 'save').length, saves + 1);
  });

  await scenario('synthetic shared saves reopen exactly and stale writers retain a recoverable draft', async ({ makePage, server }) => {
    const first = await makePage(); await fillTeam(first); await paint(first, 'sidebar', 'mauve');
    await save(first);
    const saved = await design(first);
    const second = await makePage();
    assert.deepEqual(await design(second), saved);
    await paint(first, 'sidebar', 'royal'); await save(first);
    const newest = await design(first);
    await go(second, 'Fonts & background'); await second.locator('#font-body').selectOption('inter');
    const staleLocal = await design(second);
    await second.locator('#btnSave').click();
    await second.locator('#fileStatus').filter({ hasText: 'Someone saved a newer shared version.' }).waitFor();
    assert.deepEqual(await design(second), staleLocal);
    assert.deepEqual((await openService(server)).selection.design, newest);
    const backup = await download(second);
    assert.deepEqual(backup.payload.design, staleLocal);
    await second.locator('#btnLoadLatest').click();
    await second.locator('#fileStatus').filter({ hasText: 'Opened the latest shared design.' }).waitFor();
    assert.deepEqual(await design(second), newest);
    const recovery = await second.evaluate(() => JSON.parse(localStorage.getItem('bespoke-previous-draft-v2')));
    assert.deepEqual(recovery.design, staleLocal);
  });

  await scenario('undo history survives a clean shared-save reload', async ({ makePage }) => {
    const page = await makePage(); await fillTeam(page); await paint(page, 'sidebar', 'mauve');
    await save(page);
    const saved = await draft(page);
    assert(saved.changes.length > 0);
    await page.reload(); await ready(page);
    assert.deepEqual((await draft(page)).changes, saved.changes, 'Reloading the same confirmed revision must not erase local undo history.');
    assert.equal(await page.locator('#btnUndo').isEnabled(), true);
  });

  await scenario('v1 conversion retains its exact original and stays paused through refresh until explicit save', async ({ makePage, actions, server }) => {
    const page = await makePage({ autosave: { enabled: true, idleMs: 120, stepMs: 120 } });
    await fillTeam(page); await save(page);
    const baseline = await openService(server);
    const before = actions.filter(action => action.action === 'save').length;
    await upload(page, oldSelection, 'original-v1.json');
    assert.deepEqual((await draft(page)).legacySelection, oldSelection);
    assert.match(await page.locator('#restoreNotice').textContent(), /original.*backup|older design/i);
    await go(page, 'Review & save');
    const original = await download(page, true);
    assert.deepEqual(original.payload, oldSelection);
    const converted = await download(page);
    assert.equal(converted.payload.schema, 'bespoke-selection/v2');
    assert.deepEqual(converted.payload.legacySelection, oldSelection);
    await page.waitForTimeout(400);
    assert.equal(actions.filter(action => action.action === 'save').length, before, 'Import requires an explicit save.');
    await page.reload(); await ready(page); await page.waitForTimeout(400);
    assert.equal(actions.filter(action => action.action === 'save').length, before, 'Reload must not release the conversion review pause.');
    assert.equal((await openService(server)).revision, baseline.revision);
    await save(page);
    assert.deepEqual((await openService(server)).selection.legacySelection, oldSelection);
  });

  await scenario('all desktop steps and mobile controls pass WCAG checks and keyboard navigation', async ({ makePage }) => {
    const desktop = await makePage();
    await desktop.locator('[data-preset="professional"]').focus();
    await desktop.keyboard.press('Enter');
    assert.equal(await desktop.locator('[data-preset="professional"]').evaluate(el => el === document.activeElement), true, 'Preset focus survives a rerender.');
    await desktop.keyboard.press('Tab');
    assert.equal(await desktop.locator('[data-preset="modern"]').evaluate(el => el === document.activeElement), true, 'Tab continues to the next preset.');
    await go(desktop, 'Title slide');
    await desktop.getByRole('group', { name: /Arrangement/ }).locator('[data-choice="bottom"]').focus();
    await desktop.keyboard.press('Enter');
    assert.equal(await desktop.getByRole('group', { name: /Arrangement/ }).locator('[data-choice="bottom"]').evaluate(el => el === document.activeElement), true, 'Layout focus survives a rerender.');
    await desktop.keyboard.press('Tab');
    assert.equal(await desktop.getByRole('group', { name: /Arrangement/ }).locator('[data-choice="split"]').evaluate(el => el === document.activeElement), true, 'Tab continues to the next arrangement.');
    const labels = await desktop.locator('#stepList button').allTextContents();
    for (const label of labels) {
      await desktop.locator('#stepList button').filter({ hasText: label }).click();
      await axe(desktop, `desktop ${label}`);
      await assertNoOverflow(desktop, `desktop ${label}`);
    }
    const mobile = await makePage({ mobile: true });
    await go(mobile, 'Paint your elements');
    await mobile.locator('#colorRole').focus();
    assert.equal(await mobile.locator('#colorRole').evaluate(el => el === document.activeElement), true);
    await mobile.keyboard.press('Tab');
    assert.equal(await mobile.evaluate(() => document.activeElement?.classList.contains('paint-chip')), true);
    await mobile.keyboard.press('Enter');
    assert.equal((await design(mobile)).roles.sidebar, 'primary');
    assert.equal(await mobile.locator('[data-color="primary"]').evaluate(el => el === document.activeElement), true, 'Paint focus survives a rerender.');
    await mobile.keyboard.press('Tab');
    assert.equal(await mobile.locator('[data-color="dark"]').evaluate(el => el === document.activeElement), true, 'Tab continues to the next color.');
    await mobile.locator('[data-color="light"]').scrollIntoViewIfNeeded();
    const visible = await mobile.locator('[data-color="light"]').evaluate(el => {
      const r = el.getBoundingClientRect(); const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight && (hit === el || el.contains(hit));
    });
    assert(visible, 'White swatch must be visible, reachable and unobscured on mobile.');
    await axe(mobile, 'mobile paint controls'); await assertNoOverflow(mobile, 'mobile controls');
    await mobile.locator('#surface-design').focus(); await mobile.keyboard.press('ArrowRight');
    assert.equal(await mobile.locator('#workspace').getAttribute('data-active-surface'), 'preview');
    assert(await mobile.locator('#previewPane').isVisible());
    await mobile.locator('#previewTabs [data-view="cards"]').focus(); await mobile.keyboard.press('ArrowRight');
    assert.equal(await mobile.locator('#modelStage .bespoke-slide').getAttribute('data-kind'), 'video');
    await axe(mobile, 'mobile preview'); await assertNoOverflow(mobile, 'mobile preview');
  });
} finally {
  await browser.close();
}

if (pageErrors.length) failures.push({ name: 'runtime errors', message: JSON.stringify(pageErrors) });
if (assets.length) failures.push({ name: 'missing local assets', message: JSON.stringify(assets) });
if (externalRequests.length) failures.push({ name: 'unexpected external requests', message: JSON.stringify(externalRequests) });
if (failures.length) {
  console.error(JSON.stringify(failures, null, 2));
  console.error(`BeSpoke builder browser: ${passed} scenarios passed, ${failures.length} failed.`);
  process.exitCode = 1;
} else console.log(`BeSpoke builder browser: ${passed} scenarios passed; no runtime errors, missing assets, external requests or accessibility violations (decorative aria-hidden watermark excluded).`);
