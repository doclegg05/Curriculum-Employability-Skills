#!/usr/bin/env node
// Browser checks for the canvas shell: slim top bar, docked toolbar, hideable options drawer.
import assert from 'node:assert/strict';
import {createDevServer} from './bespoke-dev-server.mjs';
import {browserType} from './bespoke-test-browser.mjs';
import {clickMenuItem, openMoreMenu} from './bespoke-test-navigation.mjs';

const server = await createDevServer({port: 0});
const browser = await browserType.launch({headless: true});
const errors = [];
const open = async width => {
  const context = await browser.newContext({viewport: {width, height: 900}, reducedMotion: 'reduce'});
  await context.addInitScript(() => { window.__bespokeAutosave = {enabled: false}; });
  const page = await context.newPage();
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(server.baseUrl + '/bespoke/');
  await page.locator('#localPreviewNotice').waitFor({state: 'visible'});
  return {context, page};
};
const rect = (page, selector) => page.locator(selector).first().evaluate(el => {
  const r = el.getBoundingClientRect();
  return {left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height};
});
const pass = name => console.log('ok - ' + name);

try {
  {
    const {context, page} = await open(1440);
    await page.locator('#stage-slides').click();
    assert.equal(await page.locator('#workspace').getAttribute('data-editor'), 'true');

    const bar = await rect(page, '.app-bar');
    assert.ok(bar.height <= 64, `top bar is slim, got ${bar.height}px`);
    const slideTop = (await rect(page, '#modelStage .bespoke-slide')).top;
    assert.ok(slideTop < 220, `slide starts near the top of the window, got ${slideTop}px`);
    pass('top bar is slim and the slide starts near the top');

    await page.locator('#modelStage .slide-title-text').click();
    assert.equal(await page.locator('#contextToolbar.is-floating').count(), 1, 'toolbar floats on wide screens');
    const toolbar = await rect(page, '#contextToolbar');
    const slide = await rect(page, '#modelStage .bespoke-slide');
    assert.ok(toolbar.bottom <= slide.top, `toolbar sits above the slide, never over it (${toolbar.bottom} > ${slide.top})`);
    for (const id of ['#selectedElement', '#context-text', '#context-color', '#context-size', '#context-align', '#context-placement'])
      assert.ok(await page.locator('#contextToolbar ' + id).isVisible(), id + ' is a quick control');
    assert.equal(await page.locator('#contextToolbar #context-font').count(), 0, 'font waits in the drawer');
    pass('toolbar docks above the slide with the quick text controls');

    assert.equal(await page.locator('#workspace').getAttribute('data-options'), 'false');
    assert.equal(await page.locator('#chromeRail').isVisible(), false, 'drawer is closed by default');
    await page.locator('#btnMoreOptions').click();
    assert.equal(await page.locator('#chromeRail').isVisible(), true, 'More slide options opens the drawer');
    assert.equal(await page.locator('#selectionInspector #context-font').count(), 1, 'font control is in the drawer');
    assert.ok(await page.locator('#btnHideDrawer').isVisible(), 'Hide options button is visible while the drawer is open');
    pass('options drawer is closed by default and opens on request');

    await page.locator('#btnHideDrawer').click();
    assert.equal(await page.locator('#workspace').getAttribute('data-options'), 'false');
    assert.equal(await page.locator('#chromeRail').isVisible(), false, 'Hide options closes the drawer');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'btnMoreOptions', 'focus returns to the control that opened it');
    pass('Hide options closes the drawer and returns focus');

    await clickMenuItem(page, '#btnHelp');
    assert.equal(await page.locator('#builderHelp').isVisible(), true);
    await page.locator('#btnCloseHelp').click();
    assert.equal(await page.evaluate(() => document.activeElement.matches('.more-menu > summary')), true, 'closing help returns focus to the menu trigger');
    pass('menu items work and help returns focus to the trigger');

    await openMoreMenu(page);
    for (const id of ['#btnHelp', '#btnOpen', '#btnHistory', '#btnLeaveSession', '#btnDownloadBackup'])
      assert.ok(await page.locator(id).isVisible(), id + ' is in the menu');
    await page.keyboard.press('Escape');

    await page.locator('#stage-review').click();
    assert.ok(await page.locator('#btnSave').evaluate(el => el.classList.contains('btn-secondary')), 'Save is secondary on Review');
    await context.close();
    pass('Review stage demotes Save');
  }
  {
    const {context, page} = await open(1024);
    await page.locator('#stage-slides').click();
    await page.locator('#modelStage .slide-title-text').click();
    assert.equal(await page.locator('#contextToolbar.is-floating').count(), 0, 'tablet keeps its stacked layout');
    assert.equal(await page.locator('#selectionInspector #contextToolbar').count(), 1);
    await context.close();
    pass('tablet width keeps the inspector layout');
  }
  for (const width of [390, 320]) {
    const {context, page} = await open(width);
    for (const stage of ['#stage-start', '#stage-slides', '#stage-review']) {
      const surface = page.locator('#surface-design');
      if (await surface.isVisible()) await surface.click();
      await page.locator(stage).click();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${width}px ${stage}: no horizontal overflow`);
    }
    await openMoreMenu(page);
    const menu = await rect(page, '.more-menu-list');
    assert.ok(menu.left >= 0 && menu.right <= width, `${width}px: menu stays inside the screen`);
    await context.close();
    pass(`${width}px top bar and menu fit the screen`);
  }
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
  await server.close?.();
}
