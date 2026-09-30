#!/usr/bin/env node
// Guided-mode checks use a fresh loopback-only server, synthetic people and in-memory drafts.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { browserType } from './bespoke-test-browser.mjs';
import { createDevServer } from './bespoke-dev-server.mjs';
import * as Model from '../bespoke/builder-model.mjs';
import { pixelDifference } from './bespoke-pixel-check.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalog = JSON.parse(await fs.readFile(path.join(root, 'bespoke/builder-catalog.json'), 'utf8'));
const axeSource = await fs.readFile(path.join(root, 'node_modules/axe-core/axe.min.js'), 'utf8');
const browser = await browserType.launch({ headless: true });
const failures = [], pageErrors = [], externalRequests = [];
let passed = 0;

async function scenario(name, callback) {
  if (process.env.BESPOKE_GUIDE_SCENARIO && !name.includes(process.env.BESPOKE_GUIDE_SCENARIO)) return;
  const server = await createDevServer({ port: 0 });
  const contexts = [];
  const makePage = async ({ mobile = false, storageState } = {}) => {
    const context = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 }, reducedMotion: 'reduce', storageState });
    contexts.push(context);
    await context.addInitScript(() => { window.__bespokeAutosave = { enabled: false }; });
    await context.route(/^https?:/, (route) => {
      if (new URL(route.request().url()).origin === server.baseUrl) return route.continue();
      externalRequests.push(route.request().url());
      return route.abort();
    });
    const page = await context.newPage();
    page.on('pageerror', (error) => pageErrors.push(`${name}: ${error.message}`));
    page.on('dialog', (dialog) => dialog.accept());
    await page.goto(server.baseUrl + '/bespoke/');
    await page.locator('#stepList button').first().waitFor();
    await page.locator('#localPreviewNotice').waitFor({ state: 'visible' });
    return page;
  };
  try {
    await callback({ makePage });
    passed += 1;
    console.log(`PASS ${name}`);
  } catch (error) {
    failures.push({ name, message: error.stack || error.message });
    console.error(`FAIL ${name}: ${error.message}`);
  } finally {
    for (const context of contexts) await context.close();
    await server.close();
  }
}

const draft = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('bespoke-draft-v2')));
const design = async (page) => (await draft(page)).design;
const heading = (page) => page.locator('#stepPanel h1').first().innerText();
const count = (page) => page.locator('.guide-count').innerText();
async function startGuide(page) {
  await page.locator('#stage-start').click();
  await page.locator('#btnGuideMe').click();
  await page.locator('.guide-count').waitFor();
}
const next = (page) => page.locator('#btnGuideNext').click();
async function walkTo(page, title) {
  for (let i = 0; i < 60; i += 1) {
    if ((await heading(page)) === title) return;
    await next(page);
  }
  throw new Error(`Never reached "${title}"`);
}

try {
  await scenario('Start offers Guide me and the guide opens on the first question', async ({ makePage }) => {
    const page = await makePage();
    await page.locator('#stage-start').click();
    assert.equal(await page.locator('#btnGuideMe').innerText(), 'Guide me step by step');
    assert.equal(await page.locator('#btnBuildOwn').count(), 1, 'Edit freely (Build my own) is still there');
    await page.locator('#btnGuideMe').click();
    assert.match(await count(page), /^Question 1 of 40 · Starting look$/);
    assert.equal(await heading(page), 'Your team');
    assert.equal(await page.locator('#stage-slides').getAttribute('aria-current'), 'step');
  });

  await scenario('Next and Back move through questions and Exit returns to the free editor', async ({ makePage }) => {
    const page = await makePage();
    await startGuide(page);
    await next(page);
    assert.equal(await heading(page), 'Starting look');
    await next(page);
    assert.equal(await heading(page), 'Fonts');
    await page.locator('#btnGuideBack').click();
    assert.equal(await heading(page), 'Starting look');
    await page.locator('#btnGuideExit').click();
    assert.equal(await page.locator('#roleEditorPanel').count(), 1, 'the free editor is showing');
    await page.locator('#stage-start').click();
    assert.equal(await page.locator('#btnGuideContinue').innerText(), 'Continue guide');
    await page.locator('#btnGuideContinue').click();
    assert.equal(await heading(page), 'Starting look', 'Continue guide returns to the question the team left');
  });

  await scenario('the guide position survives a reload and a corrupt saved guide falls back', async ({ makePage }) => {
    const page = await makePage();
    await startGuide(page);
    await next(page);
    await next(page);
    await next(page);
    assert.equal(await heading(page), 'Background pattern');
    // With no design change the builder re-applies the shared state and opens on Start. The position is kept.
    await page.reload();
    await page.locator('#stepList button').first().waitFor();
    await page.locator('#btnGuideContinue').click();
    assert.equal(await heading(page), 'Background pattern', 'Continue guide returns to the question the team left');
    // After a real choice the draft is restored as it was, guide open.
    await page.locator('.guide-sample[aria-pressed="false"]').first().click();
    await page.reload();
    await page.locator('.guide-count').waitFor();
    assert.equal(await heading(page), 'Background pattern');
    await page.evaluate(() => {
      const d = JSON.parse(localStorage.getItem('bespoke-draft-v2'));
      d.guide = { ids: 'garbage', index: 'x' };
      localStorage.setItem('bespoke-draft-v2', JSON.stringify(d));
    });
    await page.reload();
    await page.locator('#stepList button').first().waitFor();
    assert.equal(await page.locator('.guide-count').count(), 0, 'a corrupt guide is ignored');
    assert.equal(await page.locator('#stepPanel h1').count(), 1, 'the builder still opens');
  });
} finally {
  await browser.close();
}

if (!passed && !failures.length) failures.push({ name: 'scenario selection', message: 'No guided scenario matched the requested filter.' });
if (pageErrors.length) failures.push({ name: 'runtime errors', message: JSON.stringify(pageErrors) });
if (externalRequests.length) failures.push({ name: 'unexpected external requests', message: JSON.stringify(externalRequests) });
if (failures.length) {
  console.error(JSON.stringify(failures, null, 2));
  console.error(`BeSpoke guided browser: ${passed} scenarios passed, ${failures.length} failed.`);
  process.exitCode = 1;
} else console.log(`BeSpoke guided browser: ${passed} scenarios passed; no runtime errors or external requests.`);
