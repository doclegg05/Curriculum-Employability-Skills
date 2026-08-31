#!/usr/bin/env node
// Readability gate: Flesch-Kincaid grade-level scoring for student-facing
// content, with a grade-8 ceiling (the SPOKES plain-language standard, same
// knob as VisionQuest's PLAIN_LANGUAGE_MAX_GRADE — the scorer below is a
// dependency-free port of VisionQuest src/lib/sage/readability.ts).
// Canonical copy: education-toolkit. Edit there and sync.
//
// Usage: node tools/readability-gate.mjs [options] <files-or-dirs...>
//
//   --format html|beats|text|auto   force the extractor (default: auto by
//                                   filename — *.html/*.htm -> html,
//                                   *beats*.json or any .json -> beats,
//                                   *.md/*.txt -> text)
//   --allowlist <file.json>         per-repo allowlist of proper nouns and
//                                   program names ({"terms": [...]}) replaced
//                                   with a neutral one-syllable word before
//                                   scoring, so unavoidable names (WorkKeys,
//                                   Schoology) don't distort syllable counts
//   --baseline                      report mode: print per-file grades and
//                                   ALWAYS exit 0 (use this in CI until the
//                                   gate is calibrated)
//   --max-grade <n>                 override the ceiling (default 8)
//
// Extractors:
//   html   visible deck text — <head>, <script>, <style>, <noscript>,
//          <template>, and comments stripped; each block element (heading,
//          li, p, td, ...) counts as at least one sentence so unpunctuated
//          slide copy doesn't merge into one giant "sentence"
//   beats  narration beats.json — every "text" field, with <break .../> tags
//          and [style] tags ([warmly], [pause]) stripped
//   text   plain text / markdown — markdown punctuation and URLs stripped
//
// Exit: default mode exits 1 when any scored file is over the ceiling;
// --baseline always exits 0. Bad arguments or an unreadable allowlist exit 2.

import fs from "node:fs";
import path from "node:path";

const DEFAULT_MAX_GRADE = 8; // SPOKES ceiling (ideal is 6; slack for names)
const MIN_SCORABLE_WORDS = 12; // below this Flesch-Kincaid is too noisy

// ---------------------------------------------------------------------------
// Args
// ---------------------------------------------------------------------------
const argv = process.argv.slice(2);
const opts = { format: "auto", allowlist: null, baseline: false, maxGrade: DEFAULT_MAX_GRADE };
const inputs = [];
for (let i = 0; i < argv.length; i += 1) {
  const a = argv[i];
  if (a === "--format") opts.format = argv[++i];
  else if (a === "--allowlist") opts.allowlist = argv[++i];
  else if (a === "--baseline") opts.baseline = true;
  else if (a === "--max-grade") opts.maxGrade = Number(argv[++i]);
  else if (a === "--help" || a === "-h") {
    console.log("usage: readability-gate.mjs [--format html|beats|text|auto] [--allowlist file.json] [--baseline] [--max-grade n] <files-or-dirs...>");
    process.exit(0);
  } else if (a.startsWith("-")) {
    console.error(`readability-gate: unknown option ${a}`);
    process.exit(2);
  } else inputs.push(a);
}
if (inputs.length === 0) {
  console.error("usage: readability-gate.mjs [--format html|beats|text|auto] [--allowlist file.json] [--baseline] [--max-grade n] <files-or-dirs...>");
  process.exit(2);
}
if (!["html", "beats", "text", "auto"].includes(opts.format)) {
  console.error(`readability-gate: --format must be html|beats|text|auto (got ${opts.format})`);
  process.exit(2);
}
if (!Number.isFinite(opts.maxGrade) || opts.maxGrade <= 0) {
  console.error("readability-gate: --max-grade must be a positive number");
  process.exit(2);
}

// ---------------------------------------------------------------------------
// Allowlist: proper nouns / program names replaced with a neutral
// one-syllable word before scoring. Case-sensitive whole-word match,
// longest phrase first so "ACT WorkKeys" wins over "WorkKeys".
// ---------------------------------------------------------------------------
function loadAllowlist(file) {
  if (!file) return [];
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (err) {
    console.error(`readability-gate: cannot read allowlist ${file}: ${err.message}`);
    process.exit(2);
  }
  const terms = Array.isArray(parsed) ? parsed : parsed.terms;
  if (!Array.isArray(terms) || terms.some((t) => typeof t !== "string" || !t.trim())) {
    console.error(`readability-gate: allowlist ${file} must be {"terms": ["Name", ...]} (non-empty strings)`);
    process.exit(2);
  }
  return [...terms].sort((a, b) => b.length - a.length);
}

function applyAllowlist(text, terms) {
  let out = text;
  for (const term of terms) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    out = out.replace(new RegExp(`(?<![A-Za-z0-9])${escaped}(?![A-Za-z0-9])`, "g"), "term");
  }
  return out;
}

// ---------------------------------------------------------------------------
// Flesch-Kincaid scoring — ported from VisionQuest src/lib/sage/readability.ts
// (same heuristics, so grades are comparable across the education repos).
// ---------------------------------------------------------------------------
function stripFormatting(text) {
  return text
    .replace(/```[\s\S]*?```/g, " ") // code fences
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1") // [label](url) -> label
    .replace(/https?:\/\/\S+/g, " ") // bare urls
    .replace(/[*_`#>~|]/g, " ") // md punctuation
    .replace(/[ \t]+/g, " ")
    .trim();
}

function countSyllables(word) {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return 0;
  if (w.length <= 3) return 1;
  const groups = w.match(/[aeiouy]+/g);
  let count = groups ? groups.length : 1;
  // Drop a trailing silent "e" (make -> 1), keep the "-le" syllable (table -> 2).
  if (w.endsWith("e") && !w.endsWith("le")) count -= 1;
  return Math.max(1, count);
}

// Newlines mark block boundaries fed in by the extractors; each block is at
// least one sentence even without terminal punctuation.
function readabilityStats(text) {
  const clean = stripFormatting(text);
  const wordTokens = clean.match(/[a-zA-Z0-9']+/g) ?? [];
  const sentenceTokens = clean.split(/[.!?\n]+/).filter((s) => s.trim().length > 0);
  const words = wordTokens.length;
  const sentences = Math.max(1, sentenceTokens.length);
  const syllables = wordTokens.reduce((sum, w) => sum + countSyllables(w), 0);
  return { words, sentences, syllables };
}

function assess(text, maxGrade) {
  const { words, sentences, syllables } = readabilityStats(text);
  const grade = words === 0 ? 0 : 0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59;
  const ease = words === 0 ? 100 : 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words);
  const scorable = words >= MIN_SCORABLE_WORDS;
  return {
    grade: Math.round(grade * 10) / 10,
    ease: Math.round(ease * 10) / 10,
    words,
    sentences,
    scorable,
    over: scorable && Math.round(grade * 10) / 10 > maxGrade,
  };
}

// ---------------------------------------------------------------------------
// Extractors
// ---------------------------------------------------------------------------
const ENTITIES = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  mdash: " ", ndash: " ", hellip: "...", rsquo: "'", lsquo: "'",
  ldquo: '"', rdquo: '"', times: "x", copy: "", reg: "", trade: "",
};

function decodeEntities(text) {
  return text
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&([a-zA-Z]+);/g, (m, name) => (name in ENTITIES ? ENTITIES[name] : m));
}

// Closing tags (and <br>) that end a visible block of copy.
const BLOCK_BREAK =
  /<\/(?:p|h[1-6]|li|td|th|tr|caption|figcaption|blockquote|dt|dd|div|section|article|header|footer|label|button|option|summary|details|title)\s*>|<br\s*\/?>/gi;

function extractHtml(source) {
  return decodeEntities(
    source
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<head[\s\S]*?<\/head>/gi, " ")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<template[\s\S]*?<\/template>/gi, " ")
      .replace(BLOCK_BREAK, "\n")
      .replace(/<[^>]+>/g, " "),
  )
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}

function stripBeatMarkup(text) {
  return text
    .replace(/<break[^>]*\/?>/gi, " ") // ElevenLabs break tags
    .replace(/<[^>]+>/g, " ") // any other inline tag
    .replace(/\[[^\]\n]{1,40}\]/g, " ") // [style] tags: [warmly], [pause]
    .replace(/\s+/g, " ")
    .trim();
}

function extractBeats(source, file) {
  let parsed;
  try {
    parsed = JSON.parse(source);
  } catch (err) {
    throw new Error(`invalid JSON: ${err.message}`);
  }
  const list = Array.isArray(parsed) ? parsed : parsed?.beats;
  if (!Array.isArray(list)) throw new Error("expected a JSON array of beats (or {beats: [...]})");
  const texts = list
    .map((b) => (b && typeof b.text === "string" ? stripBeatMarkup(b.text) : ""))
    .filter(Boolean);
  if (texts.length === 0) throw new Error(`no "text" fields found in ${file}`);
  return texts.join("\n");
}

function extractText(source) {
  return source
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");
}

function formatFor(file) {
  if (opts.format !== "auto") return opts.format;
  const base = path.basename(file).toLowerCase();
  if (base.endsWith(".html") || base.endsWith(".htm")) return "html";
  if (base.endsWith(".json")) return "beats";
  return "text";
}

// ---------------------------------------------------------------------------
// File collection
// ---------------------------------------------------------------------------
const SKIP_DIRS = new Set(["node_modules", "dist", "_archive", "renders", "__pycache__"]);

function wanted(name) {
  const lower = name.toLowerCase();
  if (opts.format === "html") return lower.endsWith(".html") || lower.endsWith(".htm");
  if (opts.format === "beats") return lower === "beats.json";
  if (opts.format === "text") return lower.endsWith(".md") || lower.endsWith(".txt");
  return (
    lower.endsWith(".html") || lower.endsWith(".htm") || lower === "beats.json" ||
    lower.endsWith(".md") || lower.endsWith(".txt")
  );
}

function collect(input, out) {
  const abs = path.resolve(input);
  let st;
  try {
    st = fs.statSync(abs);
  } catch {
    console.error(`readability-gate: no such file or directory: ${input}`);
    process.exit(2);
  }
  if (st.isFile()) {
    out.push(abs); // explicit file: always take it
    return;
  }
  for (const entry of fs.readdirSync(abs, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.name.startsWith(".") || SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(abs, entry.name);
    if (entry.isDirectory()) collect(full, out);
    else if (entry.isFile() && wanted(entry.name)) out.push(full);
  }
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------
const allowTerms = loadAllowlist(opts.allowlist);
const files = [];
for (const input of inputs) collect(input, files);
if (files.length === 0) {
  console.error("readability-gate: no matching files found");
  process.exit(2);
}

const cwd = process.cwd();
const rows = [];
for (const file of files) {
  const rel = path.relative(cwd, file);
  const fmt = formatFor(file);
  let text;
  try {
    const source = fs.readFileSync(file, "utf8");
    if (fmt === "html") text = extractHtml(source);
    else if (fmt === "beats") text = extractBeats(source, rel);
    else text = extractText(source);
  } catch (err) {
    rows.push({ file: rel, error: err.message });
    continue;
  }
  rows.push({ file: rel, fmt, ...assess(applyAllowlist(text, allowTerms), opts.maxGrade) });
}

console.log(`readability-gate — Flesch-Kincaid, ceiling grade ${opts.maxGrade}${opts.baseline ? " (BASELINE / report-only)" : ""}`);
if (allowTerms.length > 0) console.log(`allowlist: ${allowTerms.length} term(s) from ${opts.allowlist}`);
console.log();
console.log("grade  ease   words  sent   status  file");
for (const row of rows) {
  if (row.error) {
    console.log(`    -      -      -     -  ERROR   ${row.file} (${row.error})`);
    continue;
  }
  const status = !row.scorable ? "SHORT" : row.over ? "OVER" : "ok";
  console.log(
    `${row.grade.toFixed(1).padStart(5)} ${row.ease.toFixed(1).padStart(6)} ${String(row.words).padStart(6)} ${String(row.sentences).padStart(5)}  ${status.padEnd(6)}  ${row.file}`,
  );
}

const scored = rows.filter((r) => !r.error && r.scorable);
const overs = scored.filter((r) => r.over);
const errors = rows.filter((r) => r.error);
const grades = scored.map((r) => r.grade).sort((a, b) => a - b);
const median =
  grades.length === 0
    ? null
    : grades.length % 2 === 0
      ? (grades[grades.length / 2 - 1] + grades[grades.length / 2]) / 2
      : grades[Math.floor(grades.length / 2)];

console.log();
console.log(`files: ${rows.length}  scored: ${scored.length}  over ceiling: ${overs.length}  errors: ${errors.length}  median grade: ${median === null ? "n/a" : median.toFixed(1)}`);

if (opts.baseline) {
  console.log("baseline mode — exit 0. Drop --baseline to fail on files over the ceiling.");
  process.exit(0);
}
if (errors.length > 0 || overs.length > 0) {
  console.error(`readability-gate: FAIL — ${overs.length} file(s) over grade ${opts.maxGrade}, ${errors.length} unreadable`);
  process.exit(1);
}
console.log("readability-gate: PASS");
