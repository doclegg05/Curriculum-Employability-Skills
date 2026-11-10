// Checks that every slide of every room-scale lesson fits its screen and
// stays clear of the corner logo and the navigation hint: at rest on four
// screens, and after each control on a slide is pressed on two of them.
// A lesson is checked when it carries the room-scale sizing block, so a
// lesson joins this check the day it is converted.
//
// Usage: node scripts/check-lesson-fit.mjs [lesson-folder ...]
// Exits 1 and lists each slide that does not fit.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PROBE = path.join(root, 'scripts/lesson-fit-probe.js');
const MARKER = 'Room-scale sizing';
// Sidebar open and closed, on the smallest and the most common 16:9 screens.
const REST_SCREENS = [
  { width: 1280, height: 720, sidebar: 'open' },
  { width: 1280, height: 720, sidebar: 'closed' },
  { width: 1920, height: 1080, sidebar: 'open' },
  { width: 1920, height: 1080, sidebar: 'closed' },
];
const isPressScreen = (screen) => screen.sidebar === 'open';

const named = process.argv.slice(2).map((name) => name.replace(/\/+$/, ''));
const folders = (named.length ? named : fs.readdirSync(root).filter((name) => name.startsWith('lesson-')).sort())
  .filter((name) => {
    const file = path.join(root, name, 'index.html');
    return fs.existsSync(file) && fs.readFileSync(file, 'utf8').includes(MARKER);
  });
if (!folders.length) {
  console.error(`No lesson with the "${MARKER}" block found${named.length ? ` among: ${named.join(', ')}` : ''}.`);
  process.exit(1);
}

const label = (screen) => `${screen.width}x${screen.height}, sidebar ${screen.sidebar}`;

async function openLesson(context, folder, screen) {
  const page = await context.newPage();
  await page.setViewportSize({ width: screen.width, height: screen.height });
  await page.goto(pathToFileURL(path.join(root, folder, 'index.html')).href, { waitUntil: 'load' });
  await page.addScriptTag({ path: PROBE });
  await page.evaluate((sidebar) => window.spokesFit.prepare({ sidebar }), screen.sidebar);
  return page;
}

// Presses each control on one slide in turn with a real click, as a person
// would, and reports the slide's state after each press.
async function checkPressed(context, folder, screen, slide) {
  const page = await openLesson(context, folder, screen);
  const failures = [];
  try {
    const count = await page.evaluate((n) => window.spokesFit.controls(n), slide);
    for (let i = 1; i <= count; i++) {
      const control = page.locator(`[data-fit-control="${i}"]`);
      if (!(await control.isVisible())) continue; // an earlier press hid it
      await control.click({ force: true, timeout: 5000 });
      const found = await page.evaluate((n) => window.spokesFit.slideProblem(n), slide);
      if (found) failures.push({ slide, problem: `after pressing control ${i}: ${found}` });
    }
  } finally {
    await page.close();
  }
  return failures;
}

async function checkLesson(context, folder) {
  const failures = [];
  for (const screen of REST_SCREENS) {
    const page = await openLesson(context, folder, screen);
    let rest;
    try {
      rest = await page.evaluate(() => window.spokesFit.checkRest());
    } finally {
      await page.close();
    }
    const found = [...rest.problems];
    if (isPressScreen(screen)) {
      for (const slide of rest.interactive) found.push(...await checkPressed(context, folder, screen, slide));
    }
    failures.push(...found.map((f) => `${folder} slide ${f.slide} at ${label(screen)}: ${f.problem}`));
  }
  return failures;
}

const browser = await chromium.launch();
const failures = [];
try {
  // file:// loads are local. Anything a lesson asks of the network is denied.
  const context = await browser.newContext({ reducedMotion: 'reduce', serviceWorkers: 'block' });
  await context.route(/^https?:\/\//, (route) => route.abort());
  for (const folder of folders) {
    const found = await checkLesson(context, folder);
    console.log(`${found.length ? 'FAIL' : 'ok  '} ${folder}${found.length ? `: ${found.length} problem(s)` : ''}`);
    failures.push(...found);
  }
} finally {
  await browser.close();
}

if (failures.length) {
  console.error(`\n${failures.join('\n')}\n\nLesson fit: ${failures.length} problem(s) in ${folders.length} lesson(s).`);
  process.exitCode = 1;
} else {
  console.log(`Lesson fit: every slide fits in ${folders.length} lesson(s), at rest on ${REST_SCREENS.length} screens and with each control pressed.`);
}
