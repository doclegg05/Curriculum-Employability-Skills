// Dialog and print-view behavior of scripts/print-slides.js on a fixture page.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import test, { after, before } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";
import { pdfPageCount } from "./print-slides-lib.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const fixtureUrl = pathToFileURL(path.join(root, "scripts/test-fixtures/print-slides.html")).href;
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];
let browser;

before(async () => { browser = await chromium.launch(); });
after(async () => { await browser.close(); });

async function openFixture(hash = "") {
  const page = await browser.newPage();
  await page.goto(fixtureUrl + hash, { waitUntil: "load" });
  await page.evaluate(() => {
    window.__printCalls = 0;
    window.print = () => { window.__printCalls += 1; };
  });
  return page;
}

const dialogOpen = (page) => page.evaluate(() => document.getElementById("spokesPrintSlides").open);

test("button sits right after Print All", async () => {
  const page = await openFixture();
  assert.equal(await page.evaluate(() => document.querySelector(".print-all-btn").nextElementSibling.className), "print-slides-btn");
  assert.equal(await page.textContent(".print-slides-btn"), "Print slides");
  await page.close();
});

test("keyboard opens and Escape closes, returning focus to the button", async () => {
  const page = await openFixture();
  await page.focus(".print-slides-btn");
  await page.keyboard.press("Enter");
  assert.equal(await dialogOpen(page), true);
  await page.keyboard.press("Escape");
  assert.equal(await dialogOpen(page), false);
  assert.equal(await page.evaluate(() => document.activeElement.className), "print-slides-btn");
  await page.close();
});

test("open dialog has no axe violations", async () => {
  const page = await openFixture();
  await page.click(".print-slides-btn");
  await page.addScriptTag({ content: await readFile(require.resolve("axe-core/axe.min.js"), "utf8") });
  const ids = await page.evaluate(async (tags) => {
    const result = await window.axe.run("#spokesPrintSlides", { runOnly: { type: "tag", values: tags } });
    return result.violations.map((v) => `${v.id}: ${v.nodes.length}`);
  }, AXE_TAGS);
  assert.deepEqual(ids, []);
  await page.close();
});

test("page count follows the version and layout choice", async () => {
  const page = await openFixture();
  await page.click(".print-slides-btn");
  assert.equal(await page.textContent(".sp-count"), "4 pages including the cover");
  await page.check('input[name="spLayout"][value="two"]');
  assert.equal(await page.textContent(".sp-count"), "3 pages including the cover");
  await page.close();
});

test("print builds the workbook, then afterprint removes it", async () => {
  const page = await openFixture();
  await page.click(".print-slides-btn");
  await page.check('input[name="spVersion"][value="teacher"]');
  await page.click(".sp-print");
  await page.waitForFunction(() => window.__printCalls === 1);
  const info = await page.evaluate(() => ({
    pages: document.querySelectorAll("#spokes-print-root .sp-page").length,
    printing: document.body.classList.contains("sp-printing"),
    rule: document.getElementById("spokes-print-page").textContent,
    cover: document.querySelector(".sp-cover-version").textContent,
    labels: [...document.querySelectorAll("img.sp-picture")].map((img) => img.dataset.spLabel),
    open: document.getElementById("spokesPrintSlides").open,
  }));
  assert.deepEqual(info, {
    pages: 4,
    printing: true,
    rule: "@page { size: letter portrait; margin: 0.5in 0.5in 0.5in 1in; }",
    cover: "Teacher copy, includes answers",
    labels: ["Slide 1", "Slide 2", "Slide 3"],
    open: false,
  });
  await page.evaluate(() => window.dispatchEvent(new Event("afterprint")));
  assert.equal(await page.evaluate(() => document.getElementById("spokes-print-root")), null);
  assert.equal(await page.evaluate(() => document.body.classList.contains("sp-printing")), false);
  await page.close();
});

test("printing twice without afterprint leaves one workbook", async () => {
  const page = await openFixture();
  for (const layout of ["notes", "full"]) {
    await page.click(".print-slides-btn");
    await page.check(`input[name="spLayout"][value="${layout}"]`);
    await page.click(".sp-print");
  }
  await page.waitForFunction(() => window.__printCalls === 2);
  assert.equal(await page.evaluate(() => document.querySelectorAll("#spokes-print-root").length), 1);
  assert.equal(await page.evaluate(() => document.querySelectorAll("#spokes-print-page").length), 1);
  assert.match(await page.evaluate(() => document.getElementById("spokes-print-page").textContent), /letter landscape/);
  await page.close();
});

test("a picture that fails to load stops printing and says which slide", async () => {
  const page = await openFixture("#broken");
  await page.click(".print-slides-btn");
  await page.check('input[name="spVersion"][value="teacher"]');
  await page.click(".sp-print");
  await page.waitForSelector(".sp-status:not([hidden])");
  assert.match(await page.textContent(".sp-status"), /Slide 3 could not be loaded, so nothing was printed/);
  assert.equal(await page.evaluate(() => window.__printCalls), 0);
  assert.equal(await page.evaluate(() => document.getElementById("spokes-print-root")), null);
  assert.equal(await dialogOpen(page), true);
  await page.close();
});

test("a lesson without pictures explains and disables Print", async () => {
  const page = await openFixture("#none");
  await page.click(".print-slides-btn");
  assert.match(await page.textContent(".sp-status"), /have not been made for this lesson yet/);
  assert.equal(await page.isDisabled(".sp-print"), true);
  assert.equal(await page.textContent(".sp-count"), "");
  await page.close();
});

test("the printed PDF has exactly the promised pages in every layout", async () => {
  const page = await openFixture();
  let printed = 0;
  for (const [layout, expected] of [["notes", 4], ["two", 3], ["full", 4]]) {
    await page.click(".print-slides-btn");
    await page.check(`input[name="spLayout"][value="${layout}"]`);
    await page.click(".sp-print");
    printed += 1;
    // The workbook is hidden on screen by design; wait for the print call instead.
    await page.waitForFunction((n) => window.__printCalls === n, printed);
    await page.emulateMedia({ media: "print" });
    const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: true });
    assert.equal(pdfPageCount(pdf), expected, `${layout} layout`);
    await page.emulateMedia({ media: "screen" });
    await page.evaluate(() => window.dispatchEvent(new Event("afterprint")));
  }
  await page.close();
});
