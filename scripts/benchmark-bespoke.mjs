#!/usr/bin/env node
// Local lab evidence, not field Core Web Vitals. Fresh contexts and memory service only.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { browserName, browserType } from './bespoke-test-browser.mjs';
import { createDevServer } from './bespoke-dev-server.mjs';

const output = process.env.BESPOKE_REVIEW_DIR || '/tmp/bespoke-qa-performance';
await fs.mkdir(output, { recursive: true });
const server = await createDevServer({ port: 0 });
const browser = await browserType.launch({ headless: true });
const errors = [], externalRequests = [], badResponses = [], loads = [], interactions = [];
const quantiles = values => {
  const ordered = [...values].sort((a, b) => a - b);
  const at = q => Math.round(ordered[Math.max(0, Math.ceil(q * ordered.length) - 1)] * 100) / 100;
  return { count: ordered.length, min: at(0), median: at(.5), p75: at(.75), p95: at(.95), max: at(1) };
};
try {
  for (const width of [1440, 390]) {
    for (let run = 0; run < 5; run++) {
      const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' });
      await context.route(/^https?:/, route => {
        if (new URL(route.request().url()).origin === server.baseUrl) return route.continue();
        externalRequests.push(route.request().url()); return route.abort();
      });
      await context.addInitScript(() => {
        window.__bespokeAutosave = { enabled: false };
        window.__qaPaintSamples = [];
        // Capture starts before the app handler. Two animation frames allow its
        // synchronous update to reach a paint opportunity; this is NOT INP.
        document.addEventListener('click', event => {
          const label = event.target.closest('button')?.textContent?.trim();
          if (!label) return;
          const start = performance.now();
          requestAnimationFrame(() => requestAnimationFrame(() => {
            window.__qaPaintSamples.push({ label, durationMs: performance.now() - start });
          }));
        }, true);
        const ready = () => {
          const notice = document.querySelector('#localPreviewNotice');
          if (notice && !notice.hidden && document.querySelector('#btnSave')?.textContent === 'Save test design' && document.querySelector('#stepList button') && document.querySelector('.bespoke-slide')) {
            window.__qaReadyMs = performance.now();
          } else requestAnimationFrame(ready);
        };
        requestAnimationFrame(ready);
      });
      const page = await context.newPage();
      page.on('pageerror', error => errors.push(error.message));
      page.on('response', response => { if (response.status() >= 400) badResponses.push({ url: response.url(), status: response.status() }); });
      await page.goto(server.baseUrl + '/bespoke/');
      await page.waitForFunction(() => window.__qaReadyMs > 0);
      await page.evaluate(() => document.fonts.ready);
      loads.push(await page.evaluate(({ width, run }) => {
        const nav = performance.getEntriesByType('navigation')[0];
        const resources = performance.getEntriesByType('resource');
        return { width, run, readyMs: window.__qaReadyMs, domContentLoadedMs: nav.domContentLoadedEventEnd,
          loadMs: nav.loadEventEnd, resourceCount: resources.length,
          decodedBytes: resources.reduce((sum, resource) => sum + resource.decodedBodySize, nav.decodedBodySize),
          transferBytes: resources.reduce((sum, resource) => sum + resource.transferSize, nav.transferSize) };
      }, { width, run }));
      if (run === 4) {
        await page.locator('#stepList button').filter({ hasText: 'Paint your elements' }).click();
        await page.locator('#colorRole').selectOption('sidebar');
        await page.waitForFunction(() => window.__qaPaintSamples.length >= 1);
        await page.evaluate(() => { window.__qaPaintSamples.length = 0; });
        for (let i = 0; i < 30; i++) {
          await page.locator('[data-color="' + (i % 2 ? 'primary' : 'mauve') + '"]').click();
          await page.waitForFunction(count => window.__qaPaintSamples.length >= count, i + 1);
        }
        interactions.push(...await page.evaluate(width => window.__qaPaintSamples.map(sample => ({ width, ...sample })), width));
      }
      await context.close();
    }
  }
  assert.deepEqual(errors, [], 'No uncaught runtime errors');
  assert.deepEqual(externalRequests, [], 'No external network dependency');
  assert.deepEqual(badResponses, [], 'No failed assets/API responses');
  const result = {
    measuredAt: new Date().toISOString(), browser: browserName, version: browser.version(),
    method: 'Unthrottled loopback server; five fresh contexts per viewport. Ready means controls, slide and local notice are in the DOM. Paint proxy measures capture click to second animation frame (30 color changes per viewport); it excludes input delay and is not field INP.',
    loads, interactions,
    summaries: [1440, 390].map(width => ({ width,
      readyMs: quantiles(loads.filter(load => load.width === width).map(load => load.readyMs)),
      paintProxyMs: quantiles(interactions.filter(sample => sample.width === width).map(sample => sample.durationMs)) })),
    errors, externalRequests, badResponses,
  };
  await fs.writeFile(path.join(output, browserName + '-performance.json'), JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify({ browser: result.browser, version: result.version, summaries: result.summaries, output }, null, 2));
} finally {
  await browser.close();
  await server.close();
}
