// Prints each SPOKES handout page in handout-src/ to the PDF its lesson links
// to, at the same path, so the lesson's link and its place in the lesson stay
// as they are. The list of pages and PDFs is handout-src/handouts.json.
//
// Usage:
//   node scripts/build-handouts.mjs              build every handout
//   node scripts/build-handouts.mjs <name> ...   build the handouts whose
//                                                source or PDF path holds <name>
// Exits 1 when a page is missing, a font or the logo does not load, or the
// PDF has a different number of pages than the list says.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LIST = path.join(root, 'handout-src/handouts.json');

function readList() {
  const { handouts } = JSON.parse(fs.readFileSync(LIST, 'utf8'));
  if (!Array.isArray(handouts) || !handouts.length) throw new Error(`${LIST} lists no handouts.`);
  for (const h of handouts) {
    if (!h.source || !h.pdf || !Number.isInteger(h.pages)) throw new Error(`Each handout needs source, pdf and pages: ${JSON.stringify(h)}`);
    if (!fs.existsSync(path.join(root, h.source))) throw new Error(`Missing handout page: ${h.source}`);
  }
  return handouts;
}

// A PDF's page count, read from its page objects (the same count
// scripts/print-slides-lib.mjs uses).
const pageCount = (bytes) => (bytes.toString('latin1').match(/\/Type\s*\/Page(?!s)/g) || []).length;

// A packet page (handout-src/packet.js) marks <html data-packet> "loading",
// then "ready" or "error: <reason>". Ordinary handout pages have no mark.
async function waitForPacket(page, source) {
  const state = await page.evaluate(() => document.documentElement.dataset.packet ?? null);
  if (state === null) return;
  await page.waitForFunction(() => document.documentElement.dataset.packet !== 'loading', null, { timeout: 30000 });
  const done = await page.evaluate(() => document.documentElement.dataset.packet);
  if (done !== 'ready') throw new Error(`${source}: packet ${done}`);
}

async function build(page, handout) {
  await page.goto(pathToFileURL(path.join(root, handout.source)).href, { waitUntil: 'load' });
  await waitForPacket(page, handout.source);
  // A face the page never uses is never fetched, so load every declared face:
  // that proves each font file exists, whether or not this page needs it.
  await page.evaluate(() => Promise.allSettled([...document.fonts].map((face) => face.load())));
  await page.evaluate(() => document.fonts.ready);
  const problems = await page.evaluate(() => {
    const found = [];
    // A packet holds each handout in its own shadow root; check inside them too.
    const roots = [document, ...[...document.querySelectorAll('.packet-part')].map((part) => part.shadowRoot)];
    for (const face of document.fonts) if (face.status !== 'loaded') found.push(`font ${face.family} did not load`);
    for (const root of roots) {
      const where = root === document ? '' : ` in ${root.host.dataset.part}`;
      for (const img of root.querySelectorAll('img')) if (!img.complete || !img.naturalWidth) found.push(`image ${img.getAttribute('src')} did not load${where}`);
      // Writing lines are rows that handout-src/lines.js adds; empty blocks
      // mean the script did not run and the page would print without lines.
      for (const block of root.querySelectorAll('.lines, .ruled')) {
        if (!block.children.length) found.push(`a block of writing lines is empty${where} (is lines.js loaded?)`);
      }
      for (const sheet of root.querySelectorAll('.sheet')) {
        if (sheet.scrollHeight > sheet.clientHeight + 1) found.push(`a sheet runs ${sheet.scrollHeight - sheet.clientHeight}px past the bottom of the page${where}`);
      }
    }
    return found;
  });
  if (problems.length) throw new Error(`${handout.source}: ${problems.join('; ')}`);
  const pdf = await page.pdf({ format: 'Letter', printBackground: true, preferCSSPageSize: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
  const pages = pageCount(pdf);
  if (pages !== handout.pages) throw new Error(`${handout.source}: made ${pages} page(s), the list says ${handout.pages}`);
  fs.writeFileSync(path.join(root, handout.pdf), pdf);
  return `${handout.pdf} (${pages} page${pages === 1 ? '' : 's'}, ${Math.round(pdf.length / 1024)} KB)`;
}

const wanted = process.argv.slice(2);
const handouts = readList().filter((h) => !wanted.length || wanted.some((w) => h.source.includes(w) || h.pdf.includes(w)));
if (!handouts.length) {
  console.error(`No handout matches: ${wanted.join(', ')}`);
  process.exit(1);
}

// A packet page reads its handouts from sibling files, which Chromium only
// allows a file:// page to do with this switch.
const browser = await chromium.launch({ args: ['--allow-file-access-from-files'] });
let failed = 0;
try {
  const context = await browser.newContext({ serviceWorkers: 'block' });
  // Handout pages are local files. Anything they ask of the network is refused.
  await context.route(/^https?:\/\//, (route) => route.abort());
  const page = await context.newPage();
  for (const handout of handouts) {
    try {
      console.log(`ok   ${await build(page, handout)}`);
    } catch (error) {
      failed += 1;
      console.error(`FAIL ${error.message}`);
    }
  }
} finally {
  await browser.close();
}
if (failed) {
  console.error(`\n${failed} of ${handouts.length} handout(s) failed.`);
  process.exitCode = 1;
} else {
  console.log(`\nBuilt ${handouts.length} handout(s).`);
}
