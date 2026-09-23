// Render template.html with each library title-slide option at 1280x720 and
// check the title slide's text layout: the heading, divider, subtitle and
// copyright sit inside the slide, are not clipped, and are not covered.
// Usage: node scripts/check-title-layouts.mjs [--shots <dir>] [slug ...]
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const shotsAt = args.indexOf("--shots");
const shots = shotsAt >= 0 ? args.splice(shotsAt, 2)[1] : null;
const only = new Set(args);

const options = JSON.parse(fs.readFileSync(path.join(root, "SPOKES Builder/theme-options.json"), "utf8"));
const titles = options.sections.find((s) => (s.family || s.id) === "titleSlides").options
  .filter((o) => !only.size || only.has(o.slug));
const template = fs.readFileSync(path.join(root, "SPOKES Builder/template.html"), "utf8")
  .replaceAll("{{LESSON_TITLE}}", "Money Management")
  .replace("{{SUBTITLE}}", "Skills for Life — planning every dollar");

const pages = new Map(titles.map((o) => [`/probe/${o.slug}.html`,
  template.replace("</head>", `<style id="theme-override">\n${o.css}\n</style>\n</head>`)]));
const types = { ".png": "image/png", ".woff2": "font/woff2", ".css": "text/css", ".js": "text/javascript" };
const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split("?")[0]);
  if (pages.has(url)) { res.writeHead(200, { "content-type": "text/html" }); return res.end(pages.get(url)); }
  // Template assets resolve from "SPOKES Builder/" (../ reaches the repo root).
  const file = path.join(root, url.startsWith("/probe/") ? path.join("SPOKES Builder", url.slice(7)) : url);
  if (!file.startsWith(root) || !fs.existsSync(file)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "content-type": types[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});
await new Promise((resolve) => server.listen(0, resolve));
const base = `http://localhost:${server.address().port}`;

const browser = await chromium.launch();
const failures = [];
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, reducedMotion: "reduce" });
  for (const option of titles) {
    await page.goto(`${base}/probe/${option.slug}.html`);
    // Measure the settled slide: wait for the entrance animations to finish.
    // Two frames first so delayed entrance animations are registered, then let them all finish.
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished.catch(() => null))));
    const problems = await page.evaluate(() => {
      const slide = document.querySelector(".slide-title");
      const frame = slide.getBoundingClientRect();
      const found = [];
      const warnings = [];
      const parts = ["img.logo", "h1", ".divider", ".subtitle", ".copyright"]
        .map((selector) => ({ selector, el: slide.querySelector(selector) }))
        .filter((part) => part.el);
      for (const part of parts) {
        const box = part.el.getBoundingClientRect();
        part.box = box;
        if (box.width === 0 || box.height === 0) { const cs = getComputedStyle(part.el); found.push(`${part.selector} has no size (box ${box.width}x${box.height}, css ${cs.width}x${cs.height}, ${cs.display}, anim ${part.el.getAnimations().map((a) => a.playState).join("/")})`); continue; }
        const inside = box.left >= frame.left - 1 && box.right <= frame.right + 1 && box.top >= frame.top - 1 && box.bottom <= frame.bottom + 1;
        if (!inside) found.push(`${part.selector} outside the slide`);
        if (part.el.scrollWidth > part.el.clientWidth + 1) found.push(`${part.selector} text overflows`);
        if (["h1", ".divider", ".subtitle", ".copyright"].includes(part.selector)) {
          // Near both edges and the middle: the text must be what is on top.
          // A hit on .slide-title itself means a ::before/::after panel covers it.
          for (const fx of [0.03, 0.5, 0.97]) {
            const hit = document.elementFromPoint(box.left + box.width * fx, box.top + box.height / 2);
            if (hit && slide.contains(hit) && hit !== part.el && !part.el.contains(hit)) {
              // Text under a panel may still read through a see-through ring or glow: a person judges.
              // The rule is a solid bar, so a panel over it hides it.
              const note = `${part.selector} covered at ${Math.round(fx * 100)}% by ${hit === slide ? "a slide panel" : hit.className || hit.tagName}`;
              (part.selector === ".divider" || hit !== slide ? found : warnings).push(note);
              break;
            }
          }
        }
      }
      // No two pieces of title content may collide (2px tolerance).
      for (let i = 0; i < parts.length; i += 1) {
        for (let j = i + 1; j < parts.length; j += 1) {
          const a = parts[i].box, b = parts[j].box;
          if (!a || !b || !a.width || !b.width) continue;
          const x = Math.min(a.right, b.right) - Math.max(a.left, b.left);
          const y = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
          if (x > 2 && y > 2) found.push(`${parts[i].selector} overlaps ${parts[j].selector}`);
        }
      }
      return { found, warnings };
    });
    if (shots) {
      fs.mkdirSync(shots, { recursive: true });
      await page.screenshot({ path: path.join(shots, `${option.slug}.png`) });
    }
    const { found, warnings } = problems;
    const status = found.length ? "FAIL" : warnings.length ? "WARN" : "PASS";
    console.log(`${status} ${option.slug}${[...found, ...warnings].length ? ": " + [...found, ...warnings].join("; ") : ""}`);
    if (found.length) failures.push(option.slug);
  }
} finally {
  await browser.close();
  server.close();
}
console.log(`title layouts: ${titles.length - failures.length}/${titles.length} pass`);
process.exitCode = failures.length ? 1 : 0;
