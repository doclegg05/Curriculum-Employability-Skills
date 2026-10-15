#!/usr/bin/env node
// Computed-style checks on the actual canonical template plus generated design
// artifacts. Everything generated lives in a temporary directory and is removed.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'bespoke-design-'));
const python = process.env.PYTHON || 'python3';
let browser;
try {
  // Exercise the production assembler and final checker, not a JS copy of them.
  execFileSync(python, ['-c', String.raw`
import copy,json,pathlib,re,shutil,sys
root,temporary=map(pathlib.Path,sys.argv[1:])
sys.path.insert(0,str(root/'scripts'))
from bespoke_design import build_design, component_sample_html
payload=json.loads((root/'scripts/test-fixtures/bespoke/selection-money-management.json').read_text())
meta=json.loads((root/'bespoke/catalog.json').read_text())
template=(root/'SPOKES Builder/template.html').read_text()
shutil.copytree(root/'fonts',temporary/'fonts')
scenarios=[]
for pair in meta['fontPairings']:
    current=copy.deepcopy(payload)
    current['theme']['fontPairing']=pair['id']
    scenarios.append((pair['id'],current))
base=copy.deepcopy(payload)
base['theme'].update(colorLead='blue',sidebarColor='dark',backgroundTexture='plain',titleSlide='centered-gradient',dividerStyle='gradient-sweep',cards={'lessonWide':'left-border','varyByChapter':False,'chapterStyles':None})
scenarios.append(('base-design',base))
alternative=copy.deepcopy(base)
alternative['theme'].update(colorLead='mauve',sidebarColor='royal',backgroundTexture='dot-grid',titleSlide='framed-center',dividerStyle='framed-gold',cards={'lessonWide':'stamp-frame','varyByChapter':False,'chapterStyles':None})
scenarios.append(('alternative-design',alternative))
for background in ('dark','mauve'):
    current={'schema':'bespoke-selection/v2','date':'2026-09-24','submittedAt':'2026-09-24T16:30:00.000Z','lesson':copy.deepcopy(payload['lesson']),'team':copy.deepcopy(payload['team']),'design':json.loads((root/'bespoke/builder-catalog.json').read_text())['defaults']}
    current['design']['roles'].update(titleText='offwhite',subtitle='light',dividerBackground=background)
    current['design']['background']='crosshatch'
    scenarios.append(('v2-'+background,current))
advisory=copy.deepcopy(current)
advisory['design']['roles'].update(titleBackground='mauve',titleBackgroundEnd='accent',titleText='light',subtitle='light',dividerBackground='accent',heading='accent',body='gold')
advisory['design']['slides']['title']['colors']='gradient'
scenarios.append(('v2-advisory',advisory))

for name,current in scenarios:
    css,contract=build_design(current)
    folder=temporary/name
    folder.mkdir()
    html,count=re.subn(r'<style id="theme-override">.*?</style>',lambda _: '<style id="theme-override">'+css+'</style>',template,flags=re.S)
    if count != 1: raise ValueError('Canonical template must have one theme-override placeholder')
    html=html.replace('</head>','<meta name="bespoke-selection-sha256" content="'+contract['selectionSha256']+'"></head>')
    (folder/'index.html').write_text(html)
    (folder/'build-contract.json').write_text(json.dumps(contract))
    if current.get('schema') == 'bespoke-selection/v2':
        samples=component_sample_html(css,contract).replace('<base href="../../../../../bespoke/">','<base href="./">')
        (folder/'component-samples.html').write_text(samples)

`, root, temporary], { cwd: root, stdio: 'pipe' });

  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ reducedMotion: 'reduce' });
  // Fixtures never fetch real accounts or remote lesson assets.
  await page.route(/^https?:/, route => route.abort());
  const meta = JSON.parse(await fs.readFile(path.join(root, 'bespoke/catalog.json'), 'utf8'));
  for (const pair of meta.fontPairings) {
    const folder = path.join(temporary, pair.id);
    execFileSync(python, [path.join(root, 'scripts/bespoke-check-design.py'), path.join(folder, 'build-contract.json'), path.join(folder, 'index.html')], { cwd: root, stdio: 'pipe' });
    await page.goto(pathToFileURL(path.join(folder, 'index.html')).href);
    const fonts = await page.evaluate(async () => {
      // The base skeleton does not include every component; add one matrix
      // instance using canonical component classes to exercise its base rule.
      const matrix = document.createElement('div');
      matrix.innerHTML = '<div class="matrix-cell"><div class="matrix-action">Synthetic font check</div></div>';
      document.body.append(matrix);
      await document.fonts.ready;
      const font = selector => getComputedStyle(document.querySelector(selector)).fontFamily;
      return { title: font('.slide-title h1'), card: font('.card h4'), matrix: font('.matrix-cell .matrix-action'), body: font('body'), chapterLabel: font('.slide-section .chapter-label') };
    });
    for (const target of ['title', 'card', 'matrix']) assert.ok(fonts[target].includes(pair.heading), `${pair.id}: ${target} used ${fonts[target]}`);
    for (const target of ['body', 'chapterLabel']) assert.ok(fonts[target].includes(pair.body), `${pair.id}: ${target} used ${fonts[target]}`);
    console.log(`PASS generated fonts: ${pair.id}`);
  }

  for (const [background, rgb] of [['dark', 'rgb(0, 64, 113)'], ['mauve', 'rgb(167, 37, 63)']]) {
    const folder = path.join(temporary, 'v2-'+background);
    execFileSync(python, [path.join(root, 'scripts/bespoke-check-design.py'), path.join(folder, 'build-contract.json'), path.join(folder, 'component-samples.html')], { cwd: root, stdio: 'pipe' });
    for (const file of ['index.html', 'component-samples.html']) {
      await page.goto(pathToFileURL(path.join(folder, file)).href);
      const canonical = file === 'index.html';
      const styles = await page.evaluate(canonical => {
        const root = document.querySelector(canonical ? '.slide-section' : '[data-kind="divider"]');
        if (canonical) root.insertAdjacentHTML('beforeend', '<p>Supporting copy uses the subtitle role.</p>');
        return { pattern: getComputedStyle(root).backgroundImage, background: getComputedStyle(root).backgroundColor, heading: getComputedStyle(root.querySelector('h2')).color, supporting: [...root.querySelectorAll('p, .chapter-label')].map(el => getComputedStyle(el).color) };
      }, canonical);
      assert.equal(styles.background, rgb);
      assert.equal((styles.pattern.match(/linear-gradient/g) || []).length, 2, `${file}: both pattern directions are layered above the chosen base`);
      assert.equal(styles.heading, 'rgb(209, 211, 212)', `${file}: selected heading color`);
      assert(styles.supporting.length >= 2 && styles.supporting.every(color => color === 'rgb(255, 255, 255)'), `${file}: selected subtitle color applies to labels and supporting copy`);
    }
  }
  console.log('PASS v2 artifact and canonical divider colors follow the explicit heading/supporting roles');

  const advisoryFolder = path.join(temporary, 'v2-advisory');
  const advisoryContract = JSON.parse(await fs.readFile(path.join(advisoryFolder, 'build-contract.json'), 'utf8'));
  assert(advisoryContract.contrastAdvisories.some(message => /Mauve to Green.*Crosshatch.*below the 3:1/.test(message)));
  execFileSync(python, [path.join(root, 'scripts/bespoke-check-design.py'), path.join(advisoryFolder, 'build-contract.json'), path.join(advisoryFolder, 'component-samples.html')], { cwd: root, stdio: 'pipe' });
  for (const file of ['index.html', 'component-samples.html']) {
    await page.goto(pathToFileURL(path.join(advisoryFolder, file)).href);
    const actual = await page.evaluate(canonical => {
      const color = selector => getComputedStyle(document.querySelector(selector)).color;
      const title = document.querySelector(canonical ? '.slide-title' : '[data-kind="title"]');
      return { title: color(canonical ? '.slide-title h1' : '.slide-title-text'), divider: color(canonical ? '.slide-section h2' : '[data-kind="divider"] h2'), subtitle: color(canonical ? '.slide-section .chapter-label' : '[data-kind="divider"] .slide-body'), heading: color(canonical ? '.card h4' : '.slide-card h3'), body: color(canonical ? '.card p' : '.slide-card .slide-body'), background: getComputedStyle(title).backgroundImage };
    }, file === 'index.html');
    assert.deepEqual({ title: actual.title, divider: actual.divider, subtitle: actual.subtitle, heading: actual.heading, body: actual.body }, { title:'rgb(255, 255, 255)', divider:'rgb(255, 255, 255)', subtitle:'rgb(255, 255, 255)', heading:'rgb(55, 181, 80)', body:'rgb(211, 178, 87)' });
    assert(actual.background.includes('rgb(167, 37, 63)') && actual.background.includes('rgb(55, 181, 80)'));
    if(file === 'component-samples.html') assert.match(await page.locator('.contrast-advisory').textContent(), /team leader can keep this choice/);
  }
  console.log('PASS low-contrast title/divider/body/heading colors remain exact in generated and canonical output, with advisory guidance');

  async function appearance(name) {
    await page.goto(pathToFileURL(path.join(temporary, name, 'index.html')).href);
    return page.evaluate(() => {
      const style = selector => getComputedStyle(document.querySelector(selector));
      const title = style('.slide-title h1');
      const divider = style('.slide-section[data-chapter="3"] h2');
      const card = style('.card:not(.gold-border)');
      return {
        titleBorder: title.borderTopWidth,
        dividerBorder: divider.borderTopWidth,
        cardOutline: card.outlineStyle,
        cardBorder: card.borderTopWidth,
        sidebar: style('.sidebar').backgroundColor,
        texture: style('.main').backgroundImage,
        heading: style('.slide:not(.slide-section):not(.slide-title) h2').color,
      };
    });
  }
  // Fixture assigns Shadow Float to I/chapter 2. The canonical cards live
  // there; applying the P1 style globally would give an outlined bottom border.
  await page.goto(pathToFileURL(path.join(temporary, meta.fontPairings[0].id, 'index.html')).href);
  const chapterCard = await page.locator('[data-chapter="2"] .card:not(.gold-border)').first().evaluate(element => {
    const style = getComputedStyle(element);
    return { top: style.borderTopWidth, bottom: style.borderBottomWidth, shadow: style.boxShadow };
  });
  assert.equal(chapterCard.top, '3px');
  assert.equal(chapterCard.bottom, '0px');
  assert.notEqual(chapterCard.shadow, 'none');
  console.log('PASS selected per-chapter card style reaches its canonical chapter');

  const baseline = await appearance('base-design');
  const alternative = await appearance('alternative-design');
  assert.equal(baseline.titleBorder, '0px');
  // Chromium may snap the authored 1.5px border to one device pixel.
  assert.ok(parseFloat(alternative.titleBorder) > 0 && parseFloat(alternative.titleBorder) <= 1.5);
  assert.equal(baseline.dividerBorder, '0px');
  assert.equal(alternative.dividerBorder, '2px');
  assert.equal(baseline.cardOutline, 'none');
  assert.equal(alternative.cardOutline, 'solid');
  assert.equal(alternative.cardBorder, '3px');
  assert.equal(baseline.sidebar, 'rgb(0, 64, 113)');
  assert.equal(alternative.sidebar, 'rgb(0, 19, 63)');
  assert.equal(baseline.texture, 'none');
  assert.ok(alternative.texture.includes('radial-gradient'));
  assert.equal(baseline.heading, 'rgb(0, 123, 175)');
  assert.equal(alternative.heading, 'rgb(167, 37, 63)');
  console.log('PASS generated title, divider, card, sidebar, texture and lead effects on canonical markup');
} finally {
  if (browser) await browser.close();
  await fs.rm(temporary, { recursive: true, force: true });
}
