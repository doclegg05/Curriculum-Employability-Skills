// Computed accessibility check for the lesson decks: axe-core (WCAG A/AA,
// real computed contrast) over the first slide view of every lesson-*/index.html,
// loaded over file:// exactly as a classroom machine opens them.
//
// Usage:  node scripts/a11y-check.mjs            — check against the baseline
//         node scripts/a11y-check.mjs --update   — rewrite the baseline (review
//                                                  the diff; it may only shrink)
//
// Ratchet contract: scripts/a11y-baseline.json is a committed, shrink-only
// allowlist keyed by deck then axe rule id, holding the node count observed
// when the baseline was cut. The check FAILS only on violations outside it:
// a rule not in the baseline for that deck, or more nodes than it allows.
// Counts that drop are reported so the baseline can be tightened; they never
// grow back without a human editing the file.
//
// Harness deps (devDependencies: playwright + axe-core, exact-pinned) are only
// needed to RUN this check — the decks themselves stay dependency-free.
// scripts/quality.sh skips this step with a note when they are not installed.
//
// axe-core is injected from node_modules/axe-core/axe.min.js rather than via
// @axe-core/playwright: the decks run on file://, and injecting the script
// source directly avoids any dependence on an http origin.

import { readFile, writeFile } from "node:fs/promises";
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import { chromium } from "playwright";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const baselinePath = path.join(repoRoot, "scripts", "a11y-baseline.json");
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

function selectDecks() {
  const decks = readdirSync(repoRoot, { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name.startsWith("lesson-"))
    .map((e) => e.name)
    .filter((name) => existsSync(path.join(repoRoot, name, "index.html")))
    .sort();
  if (decks.length === 0) throw new Error("no lesson-*/index.html decks found");
  return decks;
}

async function auditDecks(decks) {
  const require = createRequire(import.meta.url);
  const axeSource = await readFile(require.resolve("axe-core/axe.min.js"), "utf8");
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const results = [];
  try {
    for (const deck of decks) {
      const page = await context.newPage();
      // Animations mid-transition and half-loaded fonts make axe's computed
      // contrast flaky; settle both before analyzing the first slide view.
      await page.emulateMedia({ reducedMotion: "reduce" });
      const fileUrl = pathToFileURL(path.join(repoRoot, deck, "index.html")).href;
      await page.goto(fileUrl, { waitUntil: "load" });
      await page.evaluate(() => document.fonts.ready);
      // The decks build their slide nav with JS at load; give the first slide
      // view two frames plus a beat to reach its settled state before analyzing.
      await page.evaluate(
        () =>
          new Promise((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 300)))
          )
      );
      await page.addScriptTag({ content: axeSource });
      const axe = await page.evaluate(
        (tags) => window.axe.run(document, { runOnly: { type: "tag", values: tags } }),
        AXE_TAGS
      );
      const ruleCounts = Object.fromEntries(
        axe.violations
          .map((v) => [v.id, v.nodes.length])
          .sort(([a], [b]) => a.localeCompare(b))
      );
      results.push({ deck, ruleCounts });
      await page.close();
    }
  } finally {
    await browser.close();
  }
  return results;
}

async function loadBaseline() {
  if (!existsSync(baselinePath)) return null;
  const parsed = JSON.parse(await readFile(baselinePath, "utf8"));
  if (typeof parsed.decks !== "object" || parsed.decks === null) {
    throw new Error(`${baselinePath}: expected a "decks" object`);
  }
  return parsed;
}

function compareToBaseline(results, baseline) {
  const failures = [];
  const shrinkNotes = [];
  for (const result of results) {
    const allowed = baseline.decks[result.deck] ?? {};
    for (const [rule, count] of Object.entries(result.ruleCounts)) {
      const allowedCount = allowed[rule];
      if (allowedCount === undefined) {
        failures.push(`${result.deck}: NEW rule "${rule}" (${count} node${count === 1 ? "" : "s"}) not in baseline`);
      } else if (count > allowedCount) {
        failures.push(`${result.deck}: "${rule}" grew ${allowedCount} -> ${count} nodes`);
      } else if (count < allowedCount) {
        shrinkNotes.push(`${result.deck}: "${rule}" shrank ${allowedCount} -> ${count} — tighten the baseline`);
      }
    }
    for (const rule of Object.keys(allowed)) {
      if (!(rule in result.ruleCounts)) {
        shrinkNotes.push(`${result.deck}: "${rule}" no longer observed — remove it from the baseline`);
      }
    }
  }
  return { failures, shrinkNotes };
}

async function main() {
  const update = process.argv.includes("--update");
  const results = await auditDecks(selectDecks());

  for (const result of results) {
    const rules = Object.entries(result.ruleCounts);
    const summary = rules.length === 0
      ? "clean"
      : rules.map(([rule, n]) => `${rule}: ${n}`).join(", ");
    console.log(`  ${result.deck} — ${summary}`);
  }

  if (update) {
    const baseline = {
      $comment:
        "Shrink-only allowlist for scripts/a11y-check.mjs (axe-core WCAG A/AA, first slide view " +
        "over file://). Keyed by deck then axe rule id -> allowed node count at baseline time. " +
        "Entries may be removed or lowered as violations are fixed; never raised or added " +
        "to admit a new violation. Regenerate with: node scripts/a11y-check.mjs --update",
      axeCoreTags: AXE_TAGS,
      decks: Object.fromEntries(results.map((r) => [r.deck, r.ruleCounts])),
    };
    await writeFile(baselinePath, JSON.stringify(baseline, null, 2) + "\n");
    console.log(`a11y-check: baseline written to ${path.relative(repoRoot, baselinePath)}`);
    return;
  }

  const baseline = await loadBaseline();
  if (baseline === null) {
    console.error("a11y-check: no baseline — run `node scripts/a11y-check.mjs --update` and commit it");
    process.exit(2);
  }
  const { failures, shrinkNotes } = compareToBaseline(results, baseline);
  for (const note of shrinkNotes) console.log(`  note: ${note}`);
  if (failures.length > 0) {
    console.error("a11y-check: FAIL — new accessibility violations beyond the committed baseline:");
    for (const failure of failures) console.error(`  ${failure}`);
    process.exit(1);
  }
  console.log("a11y-check: PASS (no violations beyond the committed baseline)");
}

main().catch((err) => {
  console.error(`a11y-check: fatal — ${err.message}`);
  process.exit(2);
});
