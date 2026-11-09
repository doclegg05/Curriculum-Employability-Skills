#!/usr/bin/env node
// Browser test for the Cushion Challenge: class mode, change pick, Back, Change this answer, reload, mode switch.
// Run outside the agent sandbox: npm install && npx playwright install chromium && node scripts/test-cushion-browser.mjs
// CHROME=/path/to/chrome overrides the Playwright browser.
import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
const GAME = fileURLToPath(new URL("../lesson-Money-Management/Part-2-Save-Money-Before-You-Spend-It-Britt/cushion-challenge.html", import.meta.url));
const url = "file://" + GAME + "?mode=class";

(async () => {
  const browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  // Chrome blocks caption files on file:// pages; the hosted site loads them and the offline
  // package embeds them (decision 2026-10-15 in .claude/MEMORY.md). Ignore only that message.
  const FILE_VTT_BLOCKED = /^Unsafe attempt to load URL file:\S+\.vtt from frame with URL file:/;
  page.on("console", (m) => { if (m.type() === "error" && !FILE_VTT_BLOCKED.test(m.text())) errors.push(m.text()); });
  await page.goto(url);
  await page.evaluate(() => localStorage.clear());
  await page.goto(url);
  const amt = () => page.textContent("#amt");
  const next = () => page.click('[data-go="next"]');
  const reveal = () => page.click("[data-reveal]");
  const key = (k) => page.keyboard.press(k);
  const log = [];

  await next();                                   // Month 1
  await key("A"); await key("B");                 // $10 then change to $25
  assert.equal(await page.isEnabled('.choice[data-key="A"]'), true, "choices stay live before reveal");
  await reveal();
  assert.equal(await amt(), "$100"); log.push("month1 $100 after changing pick A->B");
  await key("A");
  assert.equal(await amt(), "$100", "pick locked after reveal");
  await next(); await key("C"); await reveal();   // bankon
  await next(); await key("A"); await reveal();   // auto yes
  assert.equal(await amt(), "$200");
  await next(); await key("B"); await reveal();   // planned
  await next();                                   // tire
  assert.equal(await amt(), "$180"); log.push("tire month $180");
  await next(); await key("C"); await reveal();   // ask
  await next(); await key("A"); await reveal();   // refund 0
  assert.equal(await amt(), "$280");
  await next();                                   // results
  const res = await page.textContent("#stage");
  assert.match(res, /From her saving habit\$280/); assert.match(res, /Her Savings Covered the Flat Tire/);
  log.push("results habit $280, tire covered");

  for (let i = 0; i < 5; i++) await page.click('[data-go="back"]');
  assert.match(await page.textContent("h2"), /Make Saving Automatic/);
  assert.equal(await amt(), "$200"); log.push("back to Month 2 automatic: $200 point in time");
  await page.reload();
  assert.match(await page.textContent("h2"), /Make Saving Automatic/);
  assert.equal(await amt(), "$200"); log.push("reload keeps screen and cushion");

  const box = await page.locator('[data-change]').boundingBox();
  assert.ok(box.height >= 44, "change button height " + box.height);
  await page.click("[data-change]");
  assert.equal(await amt(), "$100");
  assert.equal(await page.textContent("#announce"), "This answer and the ones after it were cleared.");
  await key("B"); await reveal();                 // auto no
  assert.equal(await amt(), "$200", "hand-moved in month 2");
  await next(); assert.match(await page.textContent("h2"), /Picture Day/);
  assert.equal(await page.isEnabled('.choice[data-key="A"]'), true, "later answer was cleared");
  await key("A"); await reveal();                 // pictures from cushion
  await next();                                   // tire, busy month
  assert.equal(await amt(), "$50"); log.push("redo path: 200-30=170, tire -120 = $50");

  await page.click("#mode");                      // to solo with nothing pending
  await next(); await page.click('.choice[data-key="C"]');
  assert.equal(await page.isDisabled('.choice[data-key="A"]'), true, "solo pick locks at once");
  await next();
  await page.click("#mode");                      // back to class, pick pending, then switch mode
  await key("D");
  const pending = await amt();
  await page.click("#mode");
  assert.equal(await amt(), pending, "mode switch changes no money");
  assert.equal(await page.isVisible("[data-reveal]"), true, "pending pick keeps Reveal");
  log.push("mode switch keeps pending pick unrevealed");

  const live = await page.$$eval("[aria-live]", (els) => els.map((e) => e.id + ":" + e.getAttribute("aria-live")));
  assert.deepEqual(live, ["announce:polite"]);
  await page.setViewportSize({ width: 375, height: 800 });
  const backBox = await page.locator('[data-go="back"]').boundingBox();
  assert.ok(backBox.height >= 44, "back height " + backBox.height);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  assert.equal(overflow, false, "no horizontal scroll at 375px");
  log.push("phone width: back " + backBox.height + "px, no horizontal scroll");

  assert.deepEqual(errors, []);
  console.log(log.join("\n") + "\nsmoke passed, no console errors");
  await browser.close();
})().catch((e) => { console.error("SMOKE FAIL: " + e.message); process.exit(1); });
