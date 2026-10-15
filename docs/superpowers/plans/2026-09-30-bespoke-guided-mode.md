# BeSpoke guided mode (Guide me) implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an optional **Guide me** walk-through to the existing BeSpoke builder that asks one question per screen, slide by slide, using the builder's current design model.

**Architecture:** Four small pure modules (`questions`, `answers`, `copy`) and two DOM modules (`screens`, `guide`) live in `bespoke/guide/`. They read the existing catalog and model and write through the builder's own `changeDesign`, so the saved design, schema and service do not change. `bespoke/builder-app.mjs` gains a thin bridge (a `host` object, a Start-stage entry, a panel dispatch, and undo that remembers the guide question). The free editor is untouched.

**Tech Stack:** Vanilla ES modules, no build step. `node:test` for pure modules. Playwright and the existing loopback dev server for browser scenarios. `bespoke/builder-model.mjs`, `bespoke/builder-catalog.json`.

**Spec:** `docs/superpowers/specs/2026-09-30-bespoke-guided-workflow-design.md` (approved 2026-09-30). Background: `docs/bespoke/workflow-review-2026-09-24.md`, `docs/bespoke/workflow-fixes-2026-09-24.md`.

## Global Constraints

- No change to the saved design, its schema, or the Netlify service. After the last task, `git diff codex/bespoke-guided-builder -- bespoke/selection-v2.schema.json bespoke/builder-model.mjs bespoke/builder-catalog.json netlify` prints nothing.
- Contrast stays advisory. Every color is always selectable. A hard-to-read choice shows a plain warning with the ratio and can still be saved. No switched-off options.
- No screen the guide adds shows a role name, a color code, or a CSS term. Sentence case. Straight quotes.
- The free editor and every existing browser test keep working. The guide is additive.
- New code goes in new files under `bespoke/guide/`. `bespoke/builder-app.mjs` is already 1,778 lines, over the 800-line limit. This plan adds only the bridge to it, listed in Task 4 and Task 7, and does not split it.
- Other files stay under 800 lines and functions under 50 lines. Designs are replaced, never mutated in place by guide code.
- Files nest at most 3 levels below the project root (`bespoke/guide/x.mjs` is fine).
- No new dependencies and no build step.
- Guide position lives in the browser draft only. It never enters the saved payload.
- Commit subjects use `feat|fix|refactor|docs|test|chore|perf|ci: `. No attribution trailers.
- BeSpoke stays design only. No lesson is built.

## Review Focus

Inputs and conditions the spec implies but the tasks' main tests do not exercise. Each has a test in the task named.

1. **A saved draft with a corrupt or stale guide** (unknown question ids, an index past the end, `ids` not an array). It must fall back to "no guide" and never crash the page. Task 1 (logic), Task 4 (page).
2. **Undo after the team left the guide.** Undo must still restore the design and must not reopen the guide or throw. Task 7.
3. **Two colors the model resolves to the same rendered color** ("Match shared look" and the same color chosen explicitly). The sweep must not call that a dead option. Task 5.
4. **A color question on a gradient slide.** Readability ranking must use both gradient colors, not just the first. Task 2.
5. **A view-only session** (`ui.mode` is view, which the local preview never produces). Guide controls must be disabled like every other control in `#stepPanel`, and the guide must not write drafts. Task 8 asserts the two guards in the source, because no browser scenario can reach a view-only session here.

## Facts this plan relies on

Checked in the repository on 2026-09-30 by reading the code.

- `changeDesign(label, edit, {redraw})` in `builder-app.mjs` is the only place a normal design edit pushes onto `state.changes` (history). Three other sites push directly: `applyPresetChoice`, `localText`'s `oninput`, `addSampleField`'s `input` listener. Task 7 replaces all four with one `recordChange`.
- `updatePreview(design = state.design)` already accepts a trial design. Calling it with a trial gives hover preview without saving. Calling it with no argument restores.
- `renderSlide(catalog, design, view, options)` returns an `<article class="bespoke-slide" data-kind=...>`. `cssForDesign(catalog, design, {scope, fontBase, canonical:false})` accepts a scope matching `^[.#][a-zA-Z][\w-]*$`, and its rules are keyed on `${scope}[data-kind="..."]`, so a thumbnail gets its own class added to the article.
- `Model.setRoleStyle(catalog, design, kind, key, value)` returns a new design and throws on structural errors. `Model.applyPreset(catalog, id, design)` already preserves sample text.
- The catalog has 5 slide kinds (`title`, `divider`, `cards`, `video`, `activity`), 6 presets, 6 font pairings (whose `heading` and `body` are font family names that map to `catalog.fonts[].family`), 5 backgrounds, 11 palette colors, and decisions per kind. Each slide kind's `colors` and `watermark` decisions are replaced in the UI by Background and Watermark controls, so the guide skips them.
- Test harness: `scripts/bespoke-dev-server.mjs` `createDevServer({port:0})` returns `{baseUrl, close}`; `scripts/bespoke-test-browser.mjs` exports `browserType`; `scripts/bespoke-pixel-check.mjs` exports `pixelDifference(page, bufferA, bufferB)`.

## File structure

Create:

| File | Responsibility |
|---|---|
| `bespoke/guide/questions.mjs` | The ordered questions, guide state, navigation. Pure. |
| `bespoke/guide/answers.mjs` | Options, current value, applying an answer, ranked colors, recap lines. Pure. |
| `bespoke/guide/copy.mjs` | Every word the team reads in the guide. Pure. |
| `bespoke/guide/screens.mjs` | Draws a question screen, a recap screen and the progress list. |
| `bespoke/guide/guide.mjs` | Controller: `createGuide(host)`. |
| `bespoke/guide.css` | Guide-only styles. |
| `scripts/test-bespoke-guide.mjs` | `node:test` unit tests for the pure modules. |
| `scripts/test-bespoke-guided-browser.mjs` | Playwright scenarios for the whole guide. |
| `docs/bespoke/verification-2026-09-30-guide.md` | What was verified, written at the end. |

Modify: `bespoke/builder-app.mjs` (bridge), `bespoke/index.html` (one stylesheet link), `bespoke/team-guide.html` (rewrite), `bespoke/README.md` (one section), `scripts/quality.sh`.

---

### Task 0: Baseline

**Files:** none changed.

- [ ] **Step 1: Confirm the branch and a clean tree**

Run: `git branch --show-current && git status --short`
Expected: `claude/bespoke-guided-workflow`, and only untracked files under `docs/superpowers/` (plus this plan).

- [ ] **Step 2: Record the fast test baseline**

Run:
```bash
node scripts/test-bespoke-builder-model.mjs
node scripts/test-bespoke-role-model.mjs
node --test scripts/test-bespoke-role-contracts.mjs scripts/test-bespoke-similarity.mjs
```
Expected: `13 checks passed`, `16 checks passed`, and 16 tests pass with 0 fail. Write the numbers down. They are the baseline.

- [ ] **Step 3: Record the builder browser baseline**

Run: `node scripts/test-bespoke-builder-browser.mjs 2>&1 | tail -4`
Expected: `BeSpoke builder browser: 14 scenarios passed` and no failures. Takes about 45 seconds.

- [ ] **Step 4: Check the review fix F2 is already in place**

Run:
```bash
grep -c "Effective appearance for all five slide types" bespoke/builder-app.mjs
```
Expected: `1`. The spec lists F2 (Review reports effective values per slide type) as a dependency. It is already implemented in `renderReview`, so no task is needed. If the count is `0`, stop and report.

- [ ] **Step 5: Check the catalog facts the plan relies on**

Run:
```bash
node -e "
const c=JSON.parse(require('fs').readFileSync('bespoke/builder-catalog.json','utf8'));
const ok=c.fontPairings.every(p=>c.fonts.some(f=>f.family===p.heading)&&c.fonts.some(f=>f.family===p.body));
console.log('pairings map to fonts:',ok,'| kinds:',c.slideGroups.map(g=>g.id).join(','),'| presets:',c.presets.length,'| backgrounds:',c.backgrounds.length,'| palette:',c.palette.length);
"
```
Expected: `pairings map to fonts: true | kinds: title,divider,cards,video,activity | presets: 6 | backgrounds: 5 | palette: 11`.

---

### Task 1: Questions and guide state

**Files:**
- Create: `bespoke/guide/questions.mjs`, `scripts/test-bespoke-guide.mjs`

**Interfaces:**
- Produces:
  - `SECTIONS`: `{id, label}[]`
  - `buildQuestions(catalog, {teamComplete}) -> Question[]`. `Question = {id, section, kind, view, ...}` with `kind` one of `team | preset | fontPairing | pattern | sharedColor | decision | background | textColor | watermark | recap`.
  - `byIdMap(questions) -> Map`
  - `startGuide(questions) -> Guide` where `Guide = {ids: string[], index, furthest, on, done}`
  - `normalizeGuide(raw, allQuestions) -> Guide | null`
  - `advance(guide)`, `back(guide)`, `skipSection(guide, byId)`, `jumpToSection(guide, sectionId, byId)`, `jumpToQuestion(guide, id)`, `sectionsOf(guide, byId)`, `questionAt(guide, byId)`.

- [ ] **Step 1: Write the failing tests**

Create `scripts/test-bespoke-guide.mjs`:

```js
import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {
  SECTIONS, advance, back, buildQuestions, byIdMap, jumpToQuestion, jumpToSection,
  normalizeGuide, questionAt, sectionsOf, skipSection, startGuide
} from '../bespoke/guide/questions.mjs';

export const catalog = JSON.parse(fs.readFileSync(new URL('../bespoke/builder-catalog.json', import.meta.url), 'utf8'));
const all = buildQuestions(catalog);
const byId = byIdMap(all);

test('the guide has 40 questions, or 39 when the team is already filled in', () => {
  assert.equal(buildQuestions(catalog).length, 40);
  assert.equal(buildQuestions(catalog, { teamComplete: true }).length, 39);
  assert.equal(buildQuestions(catalog, { teamComplete: true }).some(q => q.kind === 'team'), false);
});

test('sections run start, shared, then one per slide type in lesson order', () => {
  const seen = [...new Set(all.map(q => q.section))];
  assert.deepEqual(seen, SECTIONS.map(s => s.id));
  assert.deepEqual(seen.slice(2), ['title', 'divider', 'cards', 'video', 'activity']);
});

test('inside a slide type layout comes first (after the box count for Text boxes), recap comes last', () => {
  for (const kind of ['title', 'divider', 'cards', 'video', 'activity']) {
    const list = all.filter(q => q.section === kind);
    assert.equal(list[0].kind, 'decision');
    assert.equal(list[0].decision, kind === 'cards' ? 'count' : 'layout', kind);
    if (kind === 'cards') assert.equal(list[1].decision, 'layout', 'cards asks layout right after the count');
    assert.equal(list.at(-1).kind, 'recap', kind);
    const firstColor = list.findIndex(q => q.kind === 'background');
    const lastDecision = list.map(q => q.kind).lastIndexOf('decision');
    assert.ok(firstColor > lastDecision, `${kind} asks background after its structural decisions`);
  }
});

test('colors and watermark decisions are not asked as structural questions', () => {
  assert.equal(all.some(q => q.kind === 'decision' && ['colors', 'watermark'].includes(q.decision)), false);
  assert.ok(byId.get('divider.watermark'), 'divider has a watermark question of its own');
  assert.equal(byId.has('video.text'), false, 'video body text is hidden by the model, so it is not asked');
});

test('every question id is unique', () => {
  assert.equal(new Set(all.map(q => q.id)).size, all.length);
});

test('startGuide, advance and back walk the list and finish cleanly', () => {
  let g = startGuide(all);
  assert.equal(g.on, true);
  g = advance(g);
  assert.equal(g.index, 1);
  assert.equal(back(g).index, 0);
  assert.equal(back(back(g)).index, 0, 'Back stops at the first question');
  for (let i = 0; i < all.length + 3; i += 1) g = advance(g);
  assert.equal(g.done, true);
  assert.equal(g.on, false);
});

test('advance never mutates its input', () => {
  const g = Object.freeze(startGuide(all));
  advance(g);
  assert.equal(g.index, 0);
});

test('teams can jump back to reached sections and never ahead of them', () => {
  let g = startGuide(all);
  for (let i = 0; i < 12; i += 1) g = advance(g);
  const sections = sectionsOf(g, byId);
  assert.equal(sections.find(s => s.id === 'start').reached, true);
  assert.equal(sections.find(s => s.id === 'activity').reached, false);
  const before = g.index;
  assert.equal(jumpToSection(g, 'activity', byId).index, before, 'an unreached section stays put');
  assert.equal(jumpToSection(g, 'start', byId).index, 0);
  assert.equal(jumpToQuestion(g, 'activity.layout').index, before);
  assert.equal(jumpToQuestion(g, 'preset').index, all.findIndex(q => q.id === 'preset'));
});

test('skipSection moves to the first question of the next section, or finishes', () => {
  let g = jumpToQuestion({ ...startGuide(all), furthest: all.length - 1 }, 'title.logo');
  g = skipSection(g, byId);
  assert.equal(questionAt(g, byId).id, 'divider.layout');
  const last = { ...startGuide(all), index: all.length - 2, furthest: all.length - 1 };
  const finished = skipSection(last, byId);
  assert.equal(finished.done, true);
});

test('normalizeGuide rejects garbage and repairs out-of-range positions', () => {
  assert.equal(normalizeGuide(null, all), null);
  assert.equal(normalizeGuide('x', all), null);
  assert.equal(normalizeGuide({ ids: 'nope' }, all), null);
  assert.equal(normalizeGuide({ ids: ['not-a-question'] }, all), null);
  const fixed = normalizeGuide({ ids: ['preset', 'ghost', 'shared.fonts'], index: 99, furthest: -4, on: true }, all);
  assert.deepEqual(fixed.ids, ['preset', 'shared.fonts']);
  assert.equal(fixed.index, 1);
  assert.equal(fixed.furthest, 1);
  assert.equal(fixed.on, true);
  assert.equal(fixed.done, false);
});
```

- [ ] **Step 2: Run to verify failure**

Run: `node --test scripts/test-bespoke-guide.mjs 2>&1 | tail -8`
Expected: FAIL, cannot find module `bespoke/guide/questions.mjs`.

- [ ] **Step 3: Implement**

Create `bespoke/guide/questions.mjs`:

```js
import { ROLE_STYLE_KINDS } from '../builder-model.mjs';

export const SECTIONS = [
  { id: 'start', label: 'Starting look' },
  { id: 'shared', label: 'Shared look' },
  { id: 'title', label: 'Title slide' },
  { id: 'divider', label: 'Chapter divider' },
  { id: 'cards', label: 'Text boxes' },
  { id: 'video', label: 'Video slide' },
  { id: 'activity', label: 'Activity' }
];

const SHARED_VIEW = { fontPairing: 'title', pattern: 'cards', sidebar: 'cards', accent: 'cards', button: 'video' };
const NOT_ASKED = ['colors', 'watermark'];

export function buildQuestions(catalog, { teamComplete = false } = {}) {
  const out = [];
  const add = (q) => out.push(Object.freeze(q));
  if (!teamComplete) add({ id: 'team', section: 'start', kind: 'team', view: 'title' });
  add({ id: 'preset', section: 'start', kind: 'preset', view: 'title' });
  add({ id: 'shared.fonts', section: 'shared', kind: 'fontPairing', view: SHARED_VIEW.fontPairing });
  add({ id: 'shared.pattern', section: 'shared', kind: 'pattern', view: SHARED_VIEW.pattern });
  for (const role of ['sidebar', 'accent', 'button']) {
    add({ id: `shared.${role}`, section: 'shared', kind: 'sharedColor', role, view: SHARED_VIEW[role] });
  }
  for (const kind of ROLE_STYLE_KINDS) {
    const group = catalog.slideGroups.find((g) => g.id === kind);
    const decisions = group.decisions.filter((x) => !NOT_ASKED.includes(x.id));
    // Layout is asked first, except for Text boxes: a box layout only looks different once the number of boxes is set.
    const first = kind === 'cards' ? ['count', 'layout'] : ['layout'];
    const ordered = [...first.map((id) => decisions.find((d) => d.id === id)), ...decisions.filter((d) => !first.includes(d.id))];
    for (const d of ordered) {
      add({ id: `${kind}.${d.id}`, section: kind, kind: 'decision', group: kind, decision: d.id, view: kind });
    }
    add({ id: `${kind}.background`, section: kind, kind: 'background', slide: kind, view: kind });
    add({ id: `${kind}.heading`, section: kind, kind: 'textColor', slide: kind, field: 'headingColor', view: kind });
    // The model hides video body text by default (roleStyleDefaults), so a color for it would change nothing visible.
    if (kind !== 'video') add({ id: `${kind}.text`, section: kind, kind: 'textColor', slide: kind, field: 'bodyColor', view: kind });
    if (kind === 'divider') add({ id: 'divider.watermark', section: 'divider', kind: 'watermark', slide: 'divider', view: 'divider' });
    add({ id: `${kind}.recap`, section: kind, kind: 'recap', slide: kind, view: kind });
  }
  return Object.freeze(out);
}

export const byIdMap = (questions) => new Map(questions.map((q) => [q.id, q]));

export const startGuide = (questions) => ({ ids: questions.map((q) => q.id), index: 0, furthest: 0, on: true, done: false });

export function normalizeGuide(raw, allQuestions) {
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.ids)) return null;
  const known = new Set(allQuestions.map((q) => q.id));
  const ids = raw.ids.filter((id) => typeof id === 'string' && known.has(id));
  if (!ids.length) return null;
  const clamp = (n) => (Number.isInteger(n) ? Math.min(Math.max(n, 0), ids.length - 1) : 0);
  const index = clamp(raw.index);
  return { ids, index, furthest: Math.max(index, clamp(raw.furthest)), on: raw.on === true, done: raw.done === true };
}

export const questionAt = (guide, byId) => byId.get(guide.ids[guide.index]);

export function advance(guide) {
  if (guide.index >= guide.ids.length - 1) return { ...guide, on: false, done: true };
  const index = guide.index + 1;
  return { ...guide, index, furthest: Math.max(guide.furthest, index) };
}

export const back = (guide) => ({ ...guide, index: Math.max(0, guide.index - 1) });

export function sectionsOf(guide, byId) {
  const list = [];
  guide.ids.forEach((id, i) => {
    const section = byId.get(id).section;
    if (!list.some((s) => s.id === section)) {
      list.push({ id: section, label: SECTIONS.find((s) => s.id === section).label, firstIndex: i });
    }
  });
  const current = questionAt(guide, byId).section;
  return list.map((s) => ({ ...s, reached: s.firstIndex <= guide.furthest, current: s.id === current }));
}

export function jumpToSection(guide, sectionId, byId) {
  const target = sectionsOf(guide, byId).find((s) => s.id === sectionId);
  return target && target.reached ? { ...guide, index: target.firstIndex } : guide;
}

export function jumpToQuestion(guide, id) {
  const i = guide.ids.indexOf(id);
  return i < 0 || i > guide.furthest ? guide : { ...guide, index: i };
}

export function skipSection(guide, byId) {
  const current = questionAt(guide, byId).section;
  const next = guide.ids.findIndex((id, i) => i > guide.index && byId.get(id).section !== current);
  if (next < 0) return { ...guide, on: false, done: true };
  return { ...guide, index: next, furthest: Math.max(guide.furthest, next) };
}
```

- [ ] **Step 4: Run to verify pass**

Run: `node --test scripts/test-bespoke-guide.mjs 2>&1 | tail -8`
Expected: 9 tests pass, 0 fail.

- [ ] **Step 5: Commit**

```bash
git add bespoke/guide/questions.mjs scripts/test-bespoke-guide.mjs
git commit -m "feat: add guided mode questions and state"
```

---

### Task 2: Answers, ranked colors, recap lines

**Files:**
- Create: `bespoke/guide/answers.mjs`, `bespoke/guide/copy.mjs` (Task 3 fills it in fully; this task creates the minimum `questionCopy` that `recapLines` needs)
- Modify: `scripts/test-bespoke-guide.mjs` (append)

**Interfaces:**
- Consumes: `Model` (`builder-model.mjs`): `contrast`, `effectiveRoleStyle`, `roleStyleDefaults`, `setRoleStyle`, `applyPreset`, `validateDesign`.
- Produces:
  - `SUGGESTED` (4)
  - `readabilityNote(ratio, minimum) -> string`
  - `currentValue(catalog, design, q) -> string`
  - `optionsFor(catalog, design, q) -> {options, more}` where each option is `{id, label, detail?, note?, hex?, ratio?, current?}`
  - `applyAnswer(catalog, design, q, id) -> design` (new object)
  - `recapLines(catalog, design, questions) -> {id, text}[]`

- [ ] **Step 1: Write the failing tests**

Append to `scripts/test-bespoke-guide.mjs`:

```js
import * as Model from '../bespoke/builder-model.mjs';
import { SUGGESTED, applyAnswer, currentValue, optionsFor, readabilityNote, recapLines } from '../bespoke/guide/answers.mjs';

const base = () => Model.defaultDesign(catalog);
const asked = all.filter((q) => !['team', 'recap'].includes(q.kind));

function everyOption(design, q) {
  const { options, more } = optionsFor(catalog, design, q);
  return [...options, ...more];
}

test('the default design is valid, so the guide starts from something usable', () => {
  assert.deepEqual(Model.validateDesign(catalog, base()), []);
});

test('every option of every question yields a valid design that renders its own view', () => {
  for (const q of asked) {
    const choices = everyOption(base(), q);
    assert.ok(choices.length >= 2, `${q.id} offers at least two choices`);
    for (const option of choices) {
      const next = applyAnswer(catalog, base(), q, option.id);
      assert.deepEqual(Model.validateDesign(catalog, next), [], `${q.id} ${option.id}`);
      assert.doesNotThrow(() => Model.renderSlide(catalog, next, q.view, { title: 'T', subtitle: 'S' }), `${q.id} ${option.id}`);
    }
  }
});

test('a choice other than the current one changes the design', () => {
  for (const q of asked) {
    const d = base();
    const current = currentValue(catalog, d, q);
    const other = everyOption(d, q).find((o) => o.id !== current);
    const next = applyAnswer(catalog, d, q, other.id);
    assert.notDeepEqual(next, d, `${q.id} ${other.id}`);
  }
});

test('applyAnswer never mutates the design it is given', () => {
  const frozen = structuredClone(base());
  const before = JSON.stringify(frozen);
  for (const q of asked) applyAnswer(catalog, frozen, q, everyOption(frozen, q)[0].id);
  assert.equal(JSON.stringify(frozen), before);
});

test('current value is found for every kind on the default design', () => {
  assert.equal(currentValue(catalog, base(), byId.get('shared.fonts')), 'dm-serif-display-outfit');
  assert.equal(currentValue(catalog, base(), byId.get('shared.pattern')), base().background);
  assert.equal(currentValue(catalog, base(), byId.get('title.layout')), base().slides.title.layout);
  assert.equal(currentValue(catalog, base(), byId.get('cards.titleBar')), String(base().slides.cards.titleBar));
  assert.equal(currentValue(catalog, base(), byId.get('title.background')), 'inherit');
});

test('boolean and numeric decisions round-trip through string ids', () => {
  const bar = applyAnswer(catalog, base(), byId.get('cards.titleBar'), 'false');
  assert.equal(bar.slides.cards.titleBar, false);
  const count = applyAnswer(catalog, base(), byId.get('cards.count'), '3');
  assert.equal(count.slides.cards.count, '3');
});

test('color questions offer four suggestions ranked by readability, then the rest under More colors', () => {
  const q = byId.get('cards.heading');
  const { options, more } = optionsFor(catalog, base(), q);
  const colors = options.filter((o) => o.id !== 'inherit');
  assert.equal(colors.length, SUGGESTED + (colors.some((o) => o.current) ? 1 : 0));
  for (let i = 1; i < SUGGESTED; i += 1) assert.ok(colors[i - 1].ratio >= colors[i].ratio, 'suggestions run best first');
  const worstSuggested = Math.min(...colors.slice(0, SUGGESTED).map((o) => o.ratio));
  assert.ok(more.every((o) => o.ratio <= worstSuggested + 1e-9), 'nothing under More colors beats a suggestion');
  const ids = [...colors, ...more].map((o) => o.id);
  assert.equal(new Set(ids).size, catalog.palette.length, 'all eleven colors are reachable, none twice');
});

test('the first color question option matches the shared look', () => {
  const { options } = optionsFor(catalog, base(), byId.get('title.heading'));
  assert.equal(options[0].id, 'inherit');
  assert.match(options[0].label, /shared look/i);
});

test('a chosen color that is not in the top four is still shown, marked current', () => {
  const q = byId.get('cards.heading');
  const worst = optionsFor(catalog, base(), q).more.at(-1);
  const next = applyAnswer(catalog, base(), q, worst.id);
  const { options, more } = optionsFor(catalog, next, q);
  const shown = options.find((o) => o.id === worst.id);
  assert.ok(shown && shown.current, 'current color is shown with the suggestions');
  assert.equal(more.some((o) => o.id === worst.id), false);
});

test('readability ranking on a gradient slide uses both gradient colors', () => {
  let d = base();
  d = Model.setRoleStyle(catalog, d, 'title', 'backgroundMode', 'gradient');
  d = Model.setRoleStyle(catalog, d, 'title', 'primary', 'dark');
  d = Model.setRoleStyle(catalog, d, 'title', 'secondary', 'light');
  const { options, more } = optionsFor(catalog, d, byId.get('title.heading'));
  const all = [...options, ...more];
  const ratio = (id) => all.find((o) => o.id === id).ratio;
  assert.ok(ratio('light') < 1.5, 'white text is unreadable on the white end of a navy to white gradient');
  assert.ok(ratio('dark') < 1.5, 'navy text is unreadable on the navy end');
  const middle = all.filter((o) => o.ratio != null && !['light', 'dark'].includes(o.id)).map((o) => o.ratio);
  assert.ok(Math.max(...middle) > ratio('light'), 'a mid-tone color beats either extreme');
});

test('readability words are plain and carry the ratio', () => {
  assert.equal(readabilityNote(7.2, 4.5), 'Easy to read');
  assert.match(readabilityNote(2.04, 3), /^Hard to read \(2\.0 to 1, aim for 3 to 1\)$/);
  assert.equal(readabilityNote(3, 0), '');
});

test('showing the chapter number works even when the design had hidden the watermark', () => {
  const d = base();
  d.slides.divider.watermark = 'hide';
  const next = applyAnswer(catalog, d, byId.get('divider.watermark'), 'inherit');
  assert.equal(Model.effectiveRoleStyle(catalog, next, 'divider').watermarkMode, 'legacy');
  assert.equal(Model.effectiveRoleStyle(catalog, applyAnswer(catalog, d, byId.get('divider.watermark'), 'off'), 'divider').watermarkMode, 'off');
});

test('the guide calls a color hard to read exactly when the model advises against it', () => {
  const roleFor = (q) => (['title', 'divider'].includes(q.slide)
    ? (q.field === 'headingColor' ? 'titleText' : 'subtitle')
    : (q.field === 'headingColor' ? 'heading' : 'body'));
  for (const id of ['title.heading', 'cards.heading', 'cards.text', 'activity.heading', 'video.heading', 'divider.text']) {
    const q = byId.get(id);
    const { options, more } = optionsFor(catalog, base(), q);
    for (const o of [...options, ...more].filter((x) => x.id !== 'inherit')) {
      const modelSaysHard = Model.contrastIssues(catalog, applyAnswer(catalog, base(), q, o.id)).some((i) => i.kind === q.slide && i.role === roleFor(q));
      assert.equal(o.note.startsWith('Hard to read'), modelSaysHard, `${id} ${o.id} (${o.ratio.toFixed(2)})`);
    }
  }
});

test('a hard-to-read color stays selectable and valid', () => {
  const q = byId.get('cards.heading');
  const gold = applyAnswer(catalog, base(), q, 'gold');
  assert.deepEqual(Model.validateDesign(catalog, gold), []);
  assert.ok(Model.contrastIssues(catalog, gold).length > 0, 'the model reports it as advice, not as an error');
});

test('applying a preset keeps the team sample text', () => {
  const d = base();
  d.samples.title = 'My custom title';
  const next = applyAnswer(catalog, d, byId.get('preset'), 'fun');
  assert.equal(next.samples.title, 'My custom title');
  assert.equal(next.startingPoint, 'fun');
});

test('recap lines name each asked question with its current choice', () => {
  const lines = recapLines(catalog, base(), all.filter((q) => q.section === 'title'));
  assert.ok(lines.length >= 4);
  assert.ok(lines.every((l) => l.id && l.text.includes(':')));
  assert.ok(lines.some((l) => l.id === 'title.layout' && /Centered|Left|Bottom|Split/.test(l.text)));
});
```

- [ ] **Step 2: Run to verify failure**

Run: `node --test scripts/test-bespoke-guide.mjs 2>&1 | tail -8`
Expected: FAIL, cannot find module `bespoke/guide/answers.mjs`.

- [ ] **Step 3: Write the minimum copy module**

Create `bespoke/guide/copy.mjs` (Task 3 completes and tests it):

```js
export function questionCopy(q) {
  return { title: q.id, prompt: '' };
}
```

- [ ] **Step 4: Implement answers**

Create `bespoke/guide/answers.mjs`:

```js
import * as Model from '../builder-model.mjs';
import { questionCopy } from './copy.mjs';

export const SUGGESTED = 4;
const clone = (v) => structuredClone(v);
const color = (catalog, id) => catalog.palette.find((c) => c.id === id);
const fontId = (catalog, family) => catalog.fonts.find((f) => f.family === family)?.id;

export function readabilityNote(ratio, minimum) {
  if (!minimum) return '';
  return ratio + 1e-9 >= minimum ? 'Easy to read' : `Hard to read (${ratio.toFixed(1)} to 1, aim for ${minimum} to 1)`;
}

const saved = (catalog, design, slide) => ({ ...Model.roleStyleDefaults(catalog, design, slide), ...design.roleStyles?.[slide] });
const fieldOf = (q) => (q.kind === 'background' ? 'primary' : q.field);

function pairingId(catalog, design) {
  const found = catalog.fontPairings.find((p) => fontId(catalog, p.heading) === design.fonts.heading && fontId(catalog, p.body) === design.fonts.body);
  return found ? found.id : '';
}

export function currentValue(catalog, design, q) {
  switch (q.kind) {
    case 'fontPairing': return pairingId(catalog, design);
    case 'pattern': return design.background;
    case 'sharedColor': return design.roles[q.role];
    case 'decision': return String(design.slides[q.group][q.decision]);
    case 'background':
    case 'textColor': return saved(catalog, design, q.slide)[fieldOf(q)];
    case 'watermark': return saved(catalog, design, 'divider').watermarkMode;
    case 'preset': return design.startingPoint;
    default: return '';
  }
}

function scorer(catalog, design, q) {
  const hex = (id) => color(catalog, id).hex;
  if (q.kind === 'sharedColor') {
    if (q.role === 'accent') {
      const surface = hex(design.roles.contentBackground);
      return { score: (c) => Model.contrast(c.hex, surface), minimum: 3 };
    }
    const white = hex('light'), royal = hex('royal');
    return { score: (c) => Math.max(Model.contrast(c.hex, white), Model.contrast(c.hex, royal)), minimum: 0 };
  }
  const style = Model.effectiveRoleStyle(catalog, design, q.slide);
  // Same rule as the model's advisory (builder-model.mjs roleContrastIssues): only headings on
  // title, divider and video slides are large text. Everything else needs 4.5 to 1.
  const headingMinimum = ['title', 'divider', 'video'].includes(q.slide) && style.headingSize !== 'small' ? 3 : 4.5;
  if (q.kind === 'background') {
    const texts = [style.headingColor];
    let minimum = headingMinimum;
    if (style.bodyVisible) { texts.push(style.bodyColor); minimum = 4.5; }
    return { score: (c) => Math.min(...texts.map((t) => Model.contrast(hex(t), c.hex))), minimum };
  }
  const surfaces = [hex(style.primary)];
  if (style.backgroundMode === 'gradient') surfaces.push(hex(style.secondary));
  return { score: (c) => Math.min(...surfaces.map((s) => Model.contrast(c.hex, s))), minimum: q.field === 'headingColor' ? headingMinimum : 4.5 };
}

function inheritedName(catalog, design, q) {
  const slide = q.slide, field = fieldOf(q);
  const probe = { ...design, roleStyles: { ...design.roleStyles, [slide]: { ...saved(catalog, design, slide), [field]: 'inherit' } } };
  return color(catalog, Model.effectiveRoleStyle(catalog, probe, slide)[field]).name;
}

function rankColors(catalog, design, q) {
  const { score, minimum } = scorer(catalog, design, q);
  const current = currentValue(catalog, design, q);
  const ranked = catalog.palette
    .map((c, i) => ({ c, i, ratio: score(c) }))
    .sort((a, b) => b.ratio - a.ratio || a.i - b.i)
    .map(({ c, ratio }) => ({ id: c.id, label: c.name, hex: c.hex, ratio, note: readabilityNote(ratio, minimum) }));
  const suggested = ranked.slice(0, SUGGESTED);
  let more = ranked.slice(SUGGESTED);
  if (current !== 'inherit' && !suggested.some((o) => o.id === current)) {
    const pick = more.find((o) => o.id === current);
    if (pick) { suggested.push({ ...pick, current: true }); more = more.filter((o) => o.id !== current); }
  }
  return { suggested, more };
}

export function optionsFor(catalog, design, q) {
  switch (q.kind) {
    case 'fontPairing': return { options: catalog.fontPairings.map((p) => ({ id: p.id, label: p.label, detail: p.mood })), more: [] };
    case 'pattern': return { options: catalog.backgrounds.map((b) => ({ id: b.id, label: b.label })), more: [] };
    case 'sharedColor': { const r = rankColors(catalog, design, q); return { options: r.suggested, more: r.more }; }
    case 'decision': {
      const meta = catalog.slideGroups.find((g) => g.id === q.group).decisions.find((d) => d.id === q.decision);
      return { options: meta.options.map((o) => ({ id: String(o.id), label: o.label })), more: [] };
    }
    case 'background':
    case 'textColor': {
      const r = rankColors(catalog, design, q);
      const inherit = { id: 'inherit', label: 'Match shared look', detail: inheritedName(catalog, design, q) };
      return { options: [inherit, ...r.suggested], more: r.more };
    }
    case 'watermark': return { options: [{ id: 'inherit', label: 'Show the chapter number' }, { id: 'off', label: 'No watermark' }], more: [] };
    case 'preset': return { options: catalog.presets.map((p) => ({ id: p.id, label: p.label, detail: p.blurb })), more: [] };
    default: return { options: [], more: [] };
  }
}

export function applyAnswer(catalog, design, q, id) {
  switch (q.kind) {
    case 'fontPairing': {
      const p = catalog.fontPairings.find((x) => x.id === id);
      const next = clone(design);
      next.fonts.heading = fontId(catalog, p.heading);
      next.fonts.body = fontId(catalog, p.body);
      return next;
    }
    case 'pattern': return { ...clone(design), background: id };
    case 'sharedColor': { const next = clone(design); next.roles[q.role] = id; return next; }
    case 'decision': {
      const meta = catalog.slideGroups.find((g) => g.id === q.group).decisions.find((d) => d.id === q.decision);
      const next = clone(design);
      next.slides[q.group][q.decision] = meta.type === 'boolean' ? id === 'true' : id;
      return next;
    }
    case 'background':
    case 'textColor': return Model.setRoleStyle(catalog, design, q.slide, fieldOf(q), id);
    case 'watermark': {
      const next = Model.setRoleStyle(catalog, design, 'divider', 'watermarkMode', id);
      // The model shows the legacy watermark only while the divider's own watermark choice is not hide.
      if (id === 'inherit') next.slides.divider.watermark = 'show';
      return next;
    }
    case 'preset': return Model.applyPreset(catalog, id, design);
    default: throw new Error(`Question "${q.id}" has no answers`);
  }
}

function labelOfCurrent(catalog, design, q) {
  const value = currentValue(catalog, design, q);
  if (value === 'inherit' && ['background', 'textColor'].includes(q.kind)) return `Match shared look (${inheritedName(catalog, design, q)})`;
  const { options, more } = optionsFor(catalog, design, q);
  const hit = [...options, ...more].find((o) => o.id === value);
  if (hit) return hit.label;
  return q.kind === 'watermark' && value === 'text' ? 'Custom watermark' : 'Custom';
}

export function recapLines(catalog, design, questions) {
  return questions
    .filter((q) => q.kind !== 'recap')
    .map((q) => ({ id: q.id, text: `${questionCopy(q).title}: ${labelOfCurrent(catalog, design, q)}` }));
}
```

- [ ] **Step 5: Run to verify pass**

Run: `node --test scripts/test-bespoke-guide.mjs 2>&1 | tail -10`
Expected: all tests pass, 0 fail. `questionCopy` returns the raw id for now, so the recap test only checks that each line contains a colon and a layout label.

Two results to read closely:
- The gradient test asserts white and navy text both measure under 1.5 to 1 on a navy to white gradient. The `inherit` option has no ratio, so the test filters it out before taking the maximum. If an assertion still fails, the message names which side, so fix the ranking.
- If `every option of every question yields a valid design` fails for a preset or pattern, print the failing `q.id` and `option.id` and report it. Do not weaken the test.

- [ ] **Step 6: Commit**

```bash
git add bespoke/guide/answers.mjs bespoke/guide/copy.mjs scripts/test-bespoke-guide.mjs
git commit -m "feat: add guided mode answers and readability ranking"
```

---

### Task 3: Plain-language copy

**Files:**
- Modify: `bespoke/guide/copy.mjs` (replace)
- Modify: `scripts/test-bespoke-guide.mjs` (append)

**Interfaces:**
- Produces: `FORBIDDEN` (RegExp), `sectionLabel(id)`, `questionCopy(q) -> {title, prompt}`, `slideName(kind)`.

- [ ] **Step 1: Write the failing tests**

Append to `scripts/test-bespoke-guide.mjs`:

```js
import { FORBIDDEN, questionCopy, sectionLabel } from '../bespoke/guide/copy.mjs';

test('every question has a real title and prompt', () => {
  for (const q of all) {
    const c = questionCopy(q);
    assert.ok(c.title && c.title !== q.id, `${q.id} has a title`);
    assert.ok(c.prompt && c.prompt.length > 8, `${q.id} has a prompt`);
  }
  for (const s of SECTIONS) assert.equal(sectionLabel(s.id), s.label);
});

test('guide copy and every option label avoid design jargon and color codes', () => {
  const words = [];
  for (const q of all) {
    const c = questionCopy(q);
    words.push(c.title, c.prompt);
    const { options, more } = optionsFor(catalog, base(), q);
    for (const o of [...options, ...more]) words.push(o.label, o.detail ?? '', o.note ?? '');
  }
  for (const w of words) {
    assert.doesNotMatch(w, FORBIDDEN, `"${w}" looks like jargon`);
  }
});

test('the forbidden-words rule catches what it should', () => {
  for (const bad of ['Pick a role', 'titleBackground', '#a7253f', 'Set the CSS', 'rgba(0,0,0,0.5)', 'inherit']) {
    assert.match(bad, FORBIDDEN, bad);
  }
  for (const fine of ['Sidebar color', 'Match shared look', 'Hard to read (2.0 to 1, aim for 3 to 1)', 'DM Serif Display + Outfit']) {
    assert.doesNotMatch(fine, FORBIDDEN, fine);
  }
});
```

- [ ] **Step 2: Run to verify failure**

Run: `node --test scripts/test-bespoke-guide.mjs 2>&1 | grep -E "^# (pass|fail)"`
Expected: fails. `FORBIDDEN` and `sectionLabel` are not exported yet.

- [ ] **Step 3: Implement**

Replace `bespoke/guide/copy.mjs`:

```js
import { SECTIONS } from './questions.mjs';

export const FORBIDDEN = /\b([Rr]oles?|[Hh]ex|[Cc][Ss][Ss]|[Rr][Gg][Bb][Aa]?|[Tt]oken|[Ss]cope|[Ii]nherit|[Gg]radient stop)\b|#[0-9a-f]{3,6}\b|[a-z][A-Z][a-z]/;

const SLIDE = {
  title: 'title slide', divider: 'chapter divider', cards: 'text boxes', video: 'video slide', activity: 'activity slide'
};
export const slideName = (kind) => SLIDE[kind];
export const sectionLabel = (id) => SECTIONS.find((s) => s.id === id).label;

const FIXED = {
  team: ['Your team', 'Confirm the lesson and who is leading the design.'],
  preset: ['Starting look', 'Pick a starting look, or keep the design you have.'],
  'shared.fonts': ['Fonts', 'Which font pairing should every slide use?'],
  'shared.pattern': ['Background pattern', 'Should slide backgrounds have a pattern?'],
  'shared.sidebar': ['Sidebar color', 'What color should the lesson sidebar be?'],
  'shared.accent': ['Accent color', 'What color should lines, edges and markers be?'],
  'shared.button': ['Button color', 'What color should buttons be?'],
  'title.layout': ['Title layout', 'Where should the title sit on the slide?'],
  'title.logo': ['Logo position', 'Where should the SPOKES logo go?'],
  'divider.layout': ['Divider layout', 'How should chapter dividers be laid out?'],
  'divider.watermark': ['Chapter watermark', 'Show the large faint chapter number behind the title?'],
  'cards.count': ['Number of boxes', 'How many text boxes should the slide hold?'],
  'cards.titleBar': ['Title bar', 'Should the boxes share one title bar?'],
  'cards.treatment': ['Box text', 'How should the text inside each box read?'],
  'cards.look': ['Box style', 'What should each box look like?'],
  'cards.layout': ['Box layout', 'How should the boxes be arranged?'],
  'video.layout': ['Video layout', 'How should the video sit on the slide?'],
  'video.frame': ['Video frame', 'Should the video have a colored frame?'],
  'video.titleStyle': ['Video heading', 'How should the video heading look?'],
  'activity.layout': ['Activity layout', 'How should the activity box be laid out?'],
  'activity.labelStyle': ['Activity label', 'How should the activity label look?']
};

const HEADING = { title: 'Title color', divider: 'Chapter heading color', cards: 'Heading color', video: 'Heading color', activity: 'Heading color' };
const TEXT = { title: 'Subtitle color', divider: 'Supporting text color', cards: 'Box text color', video: 'Text color', activity: 'Text color' };

export function questionCopy(q) {
  if (FIXED[q.id]) return { title: FIXED[q.id][0], prompt: FIXED[q.id][1] };
  const name = SLIDE[q.slide];
  if (q.kind === 'background') return { title: 'Background', prompt: `What color should the ${name} background be?` };
  if (q.kind === 'recap') return { title: `Your ${name}`, prompt: 'Here is your finished slide. Happy with it?' };
  if (q.kind === 'textColor') {
    const title = (q.field === 'headingColor' ? HEADING : TEXT)[q.slide];
    return { title, prompt: `What color should the ${title.toLowerCase().replace(/ color$/, '')} be on the ${name}?` };
  }
  throw new Error(`No copy for question "${q.id}"`);
}
```

- [ ] **Step 4: Run to verify pass**

Run: `node --test scripts/test-bespoke-guide.mjs 2>&1 | grep -E "^# (pass|fail)"`
Expected: `# fail 0` and every test passing.

If `guide copy and every option label avoid design jargon` fails on a catalog label, the message names the word. Do not edit the catalog. Add an override map to `answers.mjs` `optionsFor` (id to friendly label) and record it in the ledger as a ruling.

- [ ] **Step 5: Commit**

```bash
git add bespoke/guide/copy.mjs scripts/test-bespoke-guide.mjs
git commit -m "feat: add plain-language copy for guided mode"
```

---

### Task 4: Bridge, Start entry, and a first guided screen

**Files:**
- Create: `bespoke/guide/screens.mjs`, `bespoke/guide/guide.mjs`, `bespoke/guide.css`, `scripts/test-bespoke-guided-browser.mjs`
- Modify: `bespoke/builder-app.mjs`, `bespoke/index.html`

**Interfaces:**
- `createGuide(host) -> {allQuestions, normalize(raw), start(), resume(), restart(), render(panel)}`
- `host` (implemented in `builder-app.mjs` as `guideHost()`):
  - Data: `catalog`, `design` (getter), `slideOptions(design)`, `teamComplete() -> boolean`, `isLead() -> boolean`
  - Guide state: `getGuide()`, `setGuide(guide)` (also saves the draft)
  - Actions: `change(label, edit)`, `requestPreset(id)`, `preview(design | null)`, `setView(view)`, `rerender()`, `openGuide()`, `finish()`, `exitToEditor(kind)`, `announce(text)`
  - Pieces of the existing UI: `renderTeam(el)`, `renderBoxSamples(el)`, `appendScope(el, key)`

This task builds only enough of the screen to show one question, its title and its samples, plus Next, Back and Exit. Task 5 adds thumbnails, hover, colors and More colors. Task 6 adds recap, skip and jump.

- [ ] **Step 1: Write the failing browser scenarios**

Create `scripts/test-bespoke-guided-browser.mjs`:

```js
#!/usr/bin/env node
// Guided-mode checks use a fresh loopback-only server, synthetic people and in-memory drafts.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { browserType } from './bespoke-test-browser.mjs';
import { createDevServer } from './bespoke-dev-server.mjs';
import * as Model from '../bespoke/builder-model.mjs';
import { pixelDifference } from './bespoke-pixel-check.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalog = JSON.parse(await fs.readFile(path.join(root, 'bespoke/builder-catalog.json'), 'utf8'));
const axeSource = await fs.readFile(path.join(root, 'node_modules/axe-core/axe.min.js'), 'utf8');
const browser = await browserType.launch({ headless: true });
const failures = [], pageErrors = [], externalRequests = [];
let passed = 0;

async function scenario(name, callback) {
  if (process.env.BESPOKE_GUIDE_SCENARIO && !name.includes(process.env.BESPOKE_GUIDE_SCENARIO)) return;
  const server = await createDevServer({ port: 0 });
  const contexts = [];
  const makePage = async ({ mobile = false, wide = false, storageState } = {}) => {
    const viewport = mobile ? { width: 390, height: 844 } : wide ? { width: 1920, height: 1080 } : { width: 1440, height: 1000 };
    const context = await browser.newContext({ viewport, reducedMotion: 'reduce', storageState });
    contexts.push(context);
    await context.addInitScript(() => { window.__bespokeAutosave = { enabled: false }; });
    await context.route(/^https?:/, (route) => {
      if (new URL(route.request().url()).origin === server.baseUrl) return route.continue();
      externalRequests.push(route.request().url());
      return route.abort();
    });
    const page = await context.newPage();
    page.on('pageerror', (error) => pageErrors.push(`${name}: ${error.message}`));
    page.on('dialog', (dialog) => dialog.accept());
    await page.goto(server.baseUrl + '/bespoke/');
    await page.locator('#stepList button').first().waitFor();
    await page.locator('#localPreviewNotice').waitFor({ state: 'visible' });
    return page;
  };
  try {
    await callback({ makePage });
    passed += 1;
    console.log(`PASS ${name}`);
  } catch (error) {
    failures.push({ name, message: error.stack || error.message });
    console.error(`FAIL ${name}: ${error.message}`);
  } finally {
    for (const context of contexts) await context.close();
    await server.close();
  }
}

const draft = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('bespoke-draft-v2')));
const design = async (page) => (await draft(page)).design;
const heading = (page) => page.locator('#stepPanel h1').first().innerText();
const count = (page) => page.locator('.guide-count').innerText();
async function startGuide(page) {
  await page.locator('#stage-start').click();
  await page.locator('#btnGuideMe').click();
  await page.locator('.guide-count').waitFor();
}
const next = (page) => page.locator('#btnGuideNext').click();
async function walkTo(page, title) {
  for (let i = 0; i < 60; i += 1) {
    if ((await heading(page)) === title) return;
    await next(page);
  }
  throw new Error(`Never reached "${title}"`);
}

try {
  await scenario('Start offers Guide me and the guide opens on the first question', async ({ makePage }) => {
    const page = await makePage();
    await page.locator('#stage-start').click();
    assert.equal(await page.locator('#btnGuideMe').innerText(), 'Guide me step by step');
    assert.equal(await page.locator('#btnBuildOwn').count(), 1, 'Edit freely (Build my own) is still there');
    await page.locator('#btnGuideMe').click();
    assert.match(await count(page), /^Question 1 of 40 · Starting look$/);
    assert.equal(await heading(page), 'Your team');
    assert.equal(await page.locator('#stage-slides').getAttribute('aria-current'), 'step');
  });

  await scenario('Next and Back move through questions and Exit returns to the free editor', async ({ makePage }) => {
    const page = await makePage();
    await startGuide(page);
    await next(page);
    assert.equal(await heading(page), 'Starting look');
    await next(page);
    assert.equal(await heading(page), 'Fonts');
    await page.locator('#btnGuideBack').click();
    assert.equal(await heading(page), 'Starting look');
    await page.locator('#btnGuideExit').click();
    assert.equal(await page.locator('#roleEditorPanel').count(), 1, 'the free editor is showing');
    await page.locator('#stage-start').click();
    assert.equal(await page.locator('#btnGuideContinue').innerText(), 'Continue guide');
    await page.locator('#btnGuideContinue').click();
    assert.equal(await heading(page), 'Starting look', 'Continue guide returns to the question the team left');
  });

  await scenario('the guide position survives a reload and a corrupt saved guide falls back', async ({ makePage }) => {
    const page = await makePage();
    await startGuide(page);
    await next(page);
    await next(page);
    await next(page);
    assert.equal(await heading(page), 'Background pattern');
    // With no design change the builder re-applies the shared state and opens on Start. The position is kept.
    await page.reload();
    await page.locator('#stepList button').first().waitFor();
    await page.locator('#btnGuideContinue').click();
    assert.equal(await heading(page), 'Background pattern', 'Continue guide returns to the question the team left');
    // After a real choice the draft is restored as it was, guide open.
    await page.locator('.guide-sample[aria-pressed="false"]').first().click();
    await page.reload();
    await page.locator('.guide-count').waitFor();
    assert.equal(await heading(page), 'Background pattern');
    await page.evaluate(() => {
      const d = JSON.parse(localStorage.getItem('bespoke-draft-v2'));
      d.guide = { ids: 'garbage', index: 'x' };
      localStorage.setItem('bespoke-draft-v2', JSON.stringify(d));
    });
    await page.reload();
    await page.locator('#stepList button').first().waitFor();
    assert.equal(await page.locator('.guide-count').count(), 0, 'a corrupt guide is ignored');
    assert.equal(await page.locator('#stepPanel h1').count(), 1, 'the builder still opens');
  });
} finally {
  await browser.close();
}

if (!passed && !failures.length) failures.push({ name: 'scenario selection', message: 'No guided scenario matched the requested filter.' });
if (pageErrors.length) failures.push({ name: 'runtime errors', message: JSON.stringify(pageErrors) });
if (externalRequests.length) failures.push({ name: 'unexpected external requests', message: JSON.stringify(externalRequests) });
if (failures.length) {
  console.error(JSON.stringify(failures, null, 2));
  console.error(`BeSpoke guided browser: ${passed} scenarios passed, ${failures.length} failed.`);
  process.exitCode = 1;
} else console.log(`BeSpoke guided browser: ${passed} scenarios passed; no runtime errors or external requests.`);
```

The unused imports (`Model`, `pixelDifference`, `axeSource`, `catalog`, `design`) are used by the scenarios later tasks add. Keep them.

- [ ] **Step 2: Run to verify failure**

Run: `node scripts/test-bespoke-guided-browser.mjs 2>&1 | tail -6`
Expected: the first scenario fails on `#btnGuideMe` (not found), and the run ends with `0 scenarios passed, 3 failed`.

- [ ] **Step 3: Write the first version of the screens**

Create `bespoke/guide/screens.mjs`:

```js
import { applyAnswer, currentValue, optionsFor } from './answers.mjs';
import { questionCopy, sectionLabel } from './copy.mjs';
import { sectionsOf } from './questions.mjs';

export function el(tag, attrs = {}, ...kids) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === false || value == null) continue;
    node.setAttribute(key, value === true ? '' : String(value));
  }
  for (const kid of kids.flat()) {
    if (kid == null || kid === false) continue;
    node.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  }
  return node;
}

function progress(ctx) {
  const { guide, q, byId, actions } = ctx;
  const list = el('ol', { class: 'guide-sections', 'aria-label': 'Guide sections' });
  for (const s of sectionsOf(guide, byId)) {
    const b = el('button', { type: 'button', class: 'guide-section', 'data-section': s.id, disabled: !s.reached, 'aria-current': s.current ? 'step' : false }, s.label);
    b.addEventListener('click', () => actions.jumpSection(s.id));
    list.append(el('li', {}, b));
  }
  return el('div', { class: 'guide-head' },
    el('p', { class: 'guide-count' }, `Question ${guide.index + 1} of ${guide.ids.length} · ${sectionLabel(q.section)}`), list);
}

function sampleButton(ctx, option, current) {
  const { host, q, actions } = ctx;
  const b = el('button', { type: 'button', class: 'guide-sample', 'data-choice': option.id, 'aria-pressed': String(option.id === current) },
    el('strong', {}, option.label), option.detail ? el('small', {}, option.detail) : null, option.note ? el('small', { class: 'guide-note' }, option.note) : null);
  b.addEventListener('click', () => actions.choose(option));
  void host; void q;
  return b;
}

function questionBody(ctx) {
  const { host, q, catalog } = ctx;
  const copy = questionCopy(q);
  const head = [el('h1', { tabindex: '-1' }, copy.title), el('p', { class: 'panel-lead' }, copy.prompt)];
  if (q.kind === 'team') {
    const team = el('section', { class: 'start-team' });
    host.renderTeam(team);
    return [...head, team];
  }
  const current = currentValue(catalog, host.design, q);
  const { options } = optionsFor(catalog, host.design, q);
  const grid = el('div', { class: 'guide-samples', role: 'group', 'aria-label': `${copy.title} choices` });
  for (const option of options) grid.append(sampleButton(ctx, option, current));
  return [...head, grid];
}

function nav(ctx) {
  const { guide, actions } = ctx;
  const last = guide.index === guide.ids.length - 1;
  const button = (id, cls, text, fn, disabled = false) => {
    const b = el('button', { type: 'button', id, class: cls, disabled }, text);
    b.addEventListener('click', fn);
    return b;
  };
  return el('div', { class: 'panel-nav guide-nav' },
    button('btnGuideBack', 'btn btn-secondary', 'Back', actions.back, guide.index === 0),
    button('btnGuideNext', 'btn btn-primary', last ? 'Finish and review' : 'Next', actions.next),
    button('btnGuideExit', 'text-link', 'Exit guide', actions.exit));
}

export function renderGuide(panel, ctx) {
  panel.replaceChildren(progress(ctx), ...questionBody(ctx), nav(ctx));
  void applyAnswer;
}
```

- [ ] **Step 4: Write the controller**

Create `bespoke/guide/guide.mjs`:

```js
import { questionCopy } from './copy.mjs';
import { advance, back, buildQuestions, byIdMap, jumpToQuestion, jumpToSection, normalizeGuide, questionAt, skipSection, startGuide } from './questions.mjs';
import { applyAnswer } from './answers.mjs';
import { renderGuide } from './screens.mjs';

export function createGuide(host) {
  const catalog = host.catalog;
  const all = buildQuestions(catalog);
  const byId = byIdMap(all);
  let lastIndex = -1;

  const set = (guide) => { host.setGuide(guide); };
  const get = () => host.getGuide();

  const afterMove = (guide) => {
    set(guide);
    if (guide.done) host.finish();
    else host.rerender();
  };

  const actions = {
    next: () => afterMove(advance(get())),
    back: () => afterMove(back(get())),
    skipSection: () => afterMove(skipSection(get(), byId)),
    jumpSection: (id) => afterMove(jumpToSection(get(), id, byId)),
    jumpQuestion: (id) => afterMove(jumpToQuestion(get(), id)),
    exit: () => {
      const g = get();
      const q = questionAt(g, byId);
      set({ ...g, on: false });
      host.exitToEditor(['start', 'shared'].includes(q.section) ? 'title' : q.section);
    },
    choose: (option) => {
      const q = questionAt(get(), byId);
      if (q.kind === 'preset') { host.requestPreset(option.id); return; }
      const label = `${questionCopy(q).title}: ${option.label}`;
      host.change(label, (d) => Object.assign(d, applyAnswer(catalog, host.design, q, option.id)));
    }
  };

  return {
    allQuestions: all,
    normalize: (raw) => normalizeGuide(raw, all),
    start() { set(startGuide(buildQuestions(catalog, { teamComplete: host.teamComplete() }))); host.openGuide(); },
    resume() { set({ ...get(), on: true }); host.openGuide(); },
    render(panel) {
      const guide = get();
      const q = byId.get(guide.ids[guide.index]);
      host.setView(q.view);
      const moved = lastIndex !== guide.index;
      lastIndex = guide.index;
      renderGuide(panel, { guide, q, byId, catalog, host, actions });
      // The preview writes its own live text during render, so announce the question just after it.
      if (moved) setTimeout(() => host.announce(`Question ${guide.index + 1} of ${guide.ids.length}: ${questionCopy(q).title}`), 60);
    }
  };
}
```

- [ ] **Step 5: Add the stylesheet**

Create `bespoke/guide.css` and link it. The builder's existing variables (`--blue`, `--line`, `--navy`, `--muted`) are defined in `bespoke/builder.css`.

```css
.guide-head { margin-bottom: 18px }
.guide-count { font-size: .8rem; color: var(--muted); margin: 0 0 8px }
.guide-sections { display: flex; flex-wrap: wrap; gap: 6px; list-style: none; margin: 0; padding: 0 }
.guide-section { border: 1px solid var(--line); background: #fff; border-radius: 999px; padding: 6px 12px; font-size: .78rem; min-height: 32px; cursor: pointer; color: var(--navy) }
.guide-section[aria-current="step"] { background: var(--blue); color: #fff; border-color: var(--blue) }
.guide-section:disabled { opacity: .5; cursor: default }
.guide-samples { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px; margin: 18px 0 }
.guide-sample { display: flex; flex-direction: column; gap: 6px; text-align: left; padding: 8px; background: #fff; border: 2px solid var(--line); border-radius: 8px; cursor: pointer; font: inherit; color: var(--navy); min-height: 44px }
.guide-sample[aria-pressed="true"] { border-color: var(--blue); box-shadow: 0 0 0 2px var(--blue) }
.guide-sample:focus-visible, .guide-section:focus-visible { outline: 3px solid var(--blue); outline-offset: 2px }
.guide-sample small { color: var(--muted); font-size: .75rem }
.guide-sample .guide-note { color: var(--navy) }
.guide-nav { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin-top: 18px }
.guide-entry { margin: 18px 0; padding: 16px; border: 1px solid var(--line); border-radius: 8px; background: #f6fafc }
.guide-entry h2 { margin: 0 0 6px; font-size: 1.05rem }
.guide-entry .start-actions { display: flex; flex-wrap: wrap; gap: 10px; align-items: center }
```

In `bespoke/index.html`, change `<link rel="stylesheet" href="./builder.css">` to add a second link right after it:

```html
<link rel="stylesheet" href="./guide.css">
```

- [ ] **Step 6: Wire the bridge into `builder-app.mjs`**

Make these edits. Find each anchor with the `grep` shown; line numbers drift. Every edit is additive except items 7 to 9, which change one statement each.

1. **Imports.** After line 2 (`import { compareDesign } from './similarity.mjs';`) add:

```js
import { createGuide } from './guide/guide.mjs';
import { buildQuestions, normalizeGuide } from './guide/questions.mjs';
```

2. **UI state.** Find the line starting `const ui = {` (`grep -n "^const ui = " bespoke/builder-app.mjs`). On the line after that statement ends, add:

```js
ui.guide = null;
let guide = null;
```

3. **Restore.** In `restoreStep(saved)`, before its closing `}`, add:

```js
 ui.guide=normalizeGuide(saved.guide,buildQuestions(catalog));
```

4. **Save.** In `serializeDraft()`, change the returned object to include the guide. Replace `autosavePaused:ui.autosavePaused});` with:

```js
autosavePaused:ui.autosavePaused,guide:ui.guide});
```

5. **New lesson, opened design, new draft.** A guide in progress must not continue over a design it did not build, but reopening the page re-applies the shared design even when nothing changed, and that must not wipe the guide.
   - In `resetDesignForLesson`, change `ui.startingLooksOpen=false;ui.editorRole='title';` to `ui.startingLooksOpen=false;ui.editorRole='title';if(lessonId!==state.lessonId)ui.guide=null;`.
   - In `applySelectionPayload`, after `ui.meaningfulDesign=true;ui.startingLooksOpen=false;` add `if(payload.lesson.id!==state.lessonId||JSON.stringify(nextDesign)!==JSON.stringify(state.design))ui.guide=null;` on its own line, before `draftGeneration++;`.
   - In the `btnClear` click handler, add `ui.guide=null;` right after `if(!keepRecoveryCopy())return;`.

6. **Leaving the guide by stage.** Replace `function goStage(id){state.step=stepIndex(id);render();}` with:

```js
function goStage(id){if(ui.guide?.on&&id!=='slides')ui.guide={...ui.guide,on:false};state.step=stepIndex(id);render();}
```

7. **Leaving the guide from a shared-scope link.** In `showRoleEditor`, at the start of the function body add `if(ui.guide)ui.guide={...ui.guide,on:false};`.

8. **Start stage entry.** In `renderWelcome(panel)`, after the line `const team=document.createElement('section');team.className='start-team';panel.append(team);renderTeam(team);` add:

```js
 const entry=document.createElement('section');entry.className='guide-entry';entry.setAttribute('aria-label','Guided walk-through');
 entry.innerHTML='<h2>Not sure where to start?</h2><p class="helper">Guide me asks one question at a time, slide by slide. Skip anything, and leave whenever you like. Your choices are kept.</p>';
 const entryActions=document.createElement('div');entryActions.className='start-actions';entry.append(entryActions);
 const inProgress=ui.guide&&!ui.guide.done;
 const addEntry=(id,text,cls,fn)=>{const b=document.createElement('button');b.type='button';b.id=id;b.className=cls;b.textContent=text;b.onclick=fn;entryActions.append(b);};
 if(inProgress){addEntry('btnGuideContinue','Continue guide','btn btn-primary',()=>guide.resume());addEntry('btnGuideRestart','Start the guide again','text-link',()=>guide.start());}
 else addEntry('btnGuideMe','Guide me step by step','btn btn-primary',()=>guide.start());
 panel.append(entry);
```

9. **Panel dispatch.** In `renderPanel()`, replace the first two lines

```js
 const panel=byId('stepPanel'),id=STEPS[state.step].id;
 if(id==='start')renderWelcome(panel);else if(id==='review')renderReview(panel);else renderEditors(panel);
```

with:

```js
 const panel=byId('stepPanel'),id=STEPS[state.step].id;
 if(id==='slides'&&ui.guide?.on){guide.render(panel);return;}
 if(id==='start')renderWelcome(panel);else if(id==='review')renderReview(panel);else renderEditors(panel);
```

10. **The host and the instance.** Add this function above `async function init()`:

```js
function guideHost(){
 const slideOptions=design=>({title:design.samples.title,subtitle:design.samples.subtitle,lessonTitle:state.meta.lessons.find(l=>l.id===state.lessonId)?.title,logoUrl:'../SPOKES-Logo.png'});
 return {
  catalog,slideOptions,
  get design(){return state.design;},
  isLead:()=>isLeadSession(),
  teamComplete:()=>Boolean(state.teamName.trim()&&state.spokespersonName.trim()),
  getGuide:()=>ui.guide,
  setGuide:next=>{ui.guide=next;if(isLeadSession())saveDraft();},
  change:(label,edit)=>changeDesign(label,edit),
  requestPreset:id=>requestPreset(id),
  preview:trial=>updatePreview(trial||state.design),
  setView:view=>{state.previewView=view;ui.previewPinned=false;},
  rerender:()=>render(false),
  openGuide:()=>{state.step=stepIndex('slides');render();},
  finish:()=>goStage('review'),
  exitToEditor:kind=>{ui.editorRole=kind;ui.focusStyleField=null;state.previewView=kind;goStage('slides');},
  announce:text=>{const live=byId('liveRegion');if(live)live.textContent=text;},
  renderTeam:el=>renderTeam(el),
  renderBoxSamples:el=>state.design.samples.boxes.forEach((value,i)=>addSampleField(el,'box-'+i,'Box '+(i+1)+(i>=Number(state.design.slides.cards.count)?' (kept in draft)':''),value)),
  appendScope:(el,key)=>appendSharedScope(el,key)
 };
}
```

11. **Create the instance.** In `init()`, immediately after the line `[state.meta,state.library,catalog,fingerprints,selectionSchema]=data;state.design=Model.defaultDesign(catalog);` add:

```js
 guide=createGuide(guideHost());
```

- [ ] **Step 7: Run to verify pass**

Run: `node scripts/test-bespoke-guided-browser.mjs 2>&1 | tail -6`
Expected: `BeSpoke guided browser: 3 scenarios passed; no runtime errors or external requests.`

If the first scenario fails on the count text, the question count is `40` only when the team form is not filled in. The local preview starts with an empty team, so `40` is right. If it shows `39`, the synthetic session pre-fills a team name. Check `state.teamName` in a console and set the expected count in the test to match, and record a ruling in the ledger.

- [ ] **Step 8: Check the free editor is unaffected**

Run: `node scripts/test-bespoke-builder-browser.mjs 2>&1 | tail -3`
Expected: `BeSpoke builder browser: 14 scenarios passed` and no failures, the same as Task 0.

- [ ] **Step 9: Commit**

```bash
git add bespoke/guide bespoke/guide.css bespoke/index.html bespoke/builder-app.mjs scripts/test-bespoke-guided-browser.mjs
git commit -m "feat: add Guide me entry and first guided screens"
```

---

### Task 5: Thumbnails, hover preview, suggested colors, More colors

**Files:**
- Modify: `bespoke/guide/screens.mjs`, `bespoke/guide/guide.mjs`, `bespoke/guide.css`, `scripts/test-bespoke-guided-browser.mjs`

**Interfaces:**
- `thumbnail(ctx, design) -> HTMLElement`: a scaled `.bespoke-slide` for `ctx.q.view` drawn from the real CSS for `design`.
- Sample buttons gain hover and focus preview via `host.preview(trial)` and `host.preview(null)`.
- A color question shows `options` as thumbnails and `more` behind a `More colors` button (`#btnGuideMore`). Each extra color is a `.guide-sample.guide-chip` with a swatch and name.
- Shared-look questions show the existing Shared/Custom scope note through `host.appendScope`.

- [ ] **Step 1: Write the failing scenarios**

Insert these scenarios above the `} finally {` line in `scripts/test-bespoke-guided-browser.mjs`:

```js
  await scenario('samples are real slide thumbnails and hovering previews without choosing', async ({ makePage }) => {
    const page = await makePage();
    await startGuide(page);
    await walkTo(page, 'Title layout');
    const samples = page.locator('.guide-sample');
    assert.equal(await samples.count(), 4);
    assert.equal(await samples.first().locator('.bespoke-slide').count(), 1, 'each sample draws a slide');
    const box = await samples.first().locator('.guide-thumb').boundingBox();
    assert.ok(box.height < box.width * 0.7, `a thumbnail is a 16:9 miniature, not a tall slab (${Math.round(box.width)} x ${Math.round(box.height)})`);
    assert.equal(await samples.first().locator('.guide-thumb').evaluate((t) => t.inert), true, 'thumbnails are inert');
    const before = await design(page);
    const stage = await page.locator('#modelStage').innerHTML();
    const pick = before.slides.title.layout === 'split' ? 'center' : 'split';
    await page.locator(`.guide-sample[data-choice="${pick}"]`).hover();
    assert.notEqual(await page.locator('#modelStage').innerHTML(), stage, 'hovering previews the option');
    assert.deepEqual(await design(page), before, 'hovering does not save it');
    await page.mouse.move(0, 0);
    assert.equal(await page.locator('#modelStage').innerHTML(), stage, 'moving away restores the preview');
    await page.locator(`.guide-sample[data-choice="${pick}"]`).click();
    assert.equal((await design(page)).slides.title.layout, pick);
    assert.equal(await page.locator(`.guide-sample[data-choice="${pick}"]`).getAttribute('aria-pressed'), 'true');
  });

  await scenario('a color question shows four readable suggestions and More colors reveals the rest', async ({ makePage }) => {
    const page = await makePage();
    await startGuide(page);
    await walkTo(page, 'Title color');
    const shown = await page.locator('.guide-sample').evaluateAll((els) => els.map((e) => e.dataset.choice));
    assert.equal(shown[0], 'inherit');
    assert.ok(shown.length >= 5 && shown.length <= 6, `inherit plus four suggestions (and current), saw ${shown.length}`);
    await page.locator('#btnGuideMore').click();
    const all = await page.locator('.guide-sample').evaluateAll((els) => els.map((e) => e.dataset.choice));
    assert.equal(new Set(all.filter((id) => id !== 'inherit')).size, catalog.palette.length, 'all eleven colors are reachable');
    await page.locator('#btnGuideMore').click();
    assert.equal(await page.locator('.guide-sample').count(), shown.length, 'More colors toggles');
  });

  await scenario('a hard-to-read color is allowed and explained in plain words', async ({ makePage }) => {
    const page = await makePage();
    await startGuide(page);
    await walkTo(page, 'Heading color');
    await page.locator('#btnGuideMore').click();
    const risky = page.locator('.guide-sample .guide-note', { hasText: 'Hard to read' }).first();
    assert.ok(await risky.count(), 'some color is flagged hard to read');
    assert.match(await risky.innerText(), /^Hard to read \(\d\.\d to 1, aim for (3|4\.5) to 1\)$/);
    await risky.locator('xpath=ancestor::button').click();
    assert.deepEqual(Model.validateDesign(catalog, await design(page)), [], 'the design is still valid and saved');
    assert.equal(await page.locator('#readabilityNotes').isVisible(), true, 'the preview shows the advisory');
  });

  await scenario('shared-look questions name the slides a change leaves alone', async ({ makePage }) => {
    const page = await makePage();
    await startGuide(page);
    await walkTo(page, 'Background pattern');
    assert.ok(await page.locator('[data-shared-scope="pattern"]').count(), 'the shared-scope note is shown');
  });

  // Wide on purpose: at 1440 px the preview is too narrow to tell the Across and Balanced grid box layouts apart.
  await scenario('every guided sample changes the preview', async ({ makePage }) => {
    const page = await makePage({ wide: true });
    await startGuide(page);
    const dead = [];
    let questionsWithSamples = 0;
    const effective = (d) => JSON.stringify({ roles: d.roles, fonts: d.fonts, slides: d.slides, background: d.background, eff: Model.ROLE_STYLE_KINDS.map((k) => Model.effectiveRoleStyle(catalog, d, k)) });
    for (let guard = 0; guard < 60; guard += 1) {
      const title = await heading(page);
      if (await page.locator('.guide-sample').count()) {
        questionsWithSamples += 1;
        if (await page.locator('#btnGuideMore').count()) await page.locator('#btnGuideMore').click();
        const ids = await page.locator('.guide-sample').evaluateAll((els) => els.map((e) => e.dataset.choice));
        for (const id of ids) {
          const button = page.locator(`.guide-sample[data-choice="${id}"]`);
          if ((await button.getAttribute('aria-pressed')) === 'true') continue;
          await page.mouse.move(0, 0);
          const beforeDesign = await design(page);
          const before = await page.locator('#modelStage').screenshot();
          await button.click();
          if (await page.locator('#presetDialog[open]').count()) await page.locator('#presetApply').click();
          await page.mouse.move(0, 0);
          const after = await page.locator('#modelStage').screenshot();
          const afterDesign = await design(page);
          const moved = await pixelDifference(page, before, after).catch((error) => {
            if (/equal rendered dimensions/.test(error.message)) return { changedFraction: 1 };
            throw error;
          });
          // A faint change (a 6% watermark) stays under the per-pixel threshold, so require exactly no change at all.
          if (moved.changedFraction === 0 && moved.meanChannelDelta === 0 && effective(beforeDesign) !== effective(afterDesign)) dead.push(`${title}: ${id}`);
          if (await page.locator('#btnGuideMore').count() && (await page.locator('#btnGuideMore').getAttribute('aria-expanded')) !== 'true') await page.locator('#btnGuideMore').click();
        }
      }
      if (!(await page.locator('#btnGuideNext').count())) break;
      const last = /Finish/.test(await page.locator('#btnGuideNext').innerText());
      await next(page);
      if (last) break;
    }
    assert.deepEqual(dead, [], 'every option visibly changes the preview');
    assert.ok(questionsWithSamples >= 30, `swept ${questionsWithSamples} questions`);
  });
```

- [ ] **Step 2: Run to verify failure**

Run: `BESPOKE_GUIDE_SCENARIO=thumbnails node scripts/test-bespoke-guided-browser.mjs 2>&1 | tail -6`
Expected: FAIL, no `.bespoke-slide` inside the samples.

- [ ] **Step 3: Implement thumbnails, hover, colors and More colors**

In `bespoke/guide/screens.mjs`, replace `sampleButton` and `questionBody`, and add the thumbnail:

```js
let thumbSerial = 0;
export const THUMB_WIDTH = 720;

// A thumbnail is the real slide drawn at a fixed 720 px width and scaled down to its cell, so the
// slide's own container queries and minimum heights behave as they do in the preview. It is inert:
// the slide markup holds buttons and a disclosure that must never become tab stops.
function thumbnail(ctx, design) {
  const { host, q, catalog } = ctx;
  const id = `gt${(thumbSerial += 1)}`;
  const inner = el('span', { class: 'guide-thumb-inner' });
  const style = document.createElement('style');
  style.textContent = ctx.Model.cssForDesign(catalog, design, { scope: `.${id}`, fontBase: '../fonts', canonical: false });
  inner.innerHTML = ctx.Model.renderSlide(catalog, design, q.view, host.slideOptions(design)).replace('class="bespoke-slide"', `class="bespoke-slide ${id}"`);
  inner.prepend(style);
  return el('span', { class: 'guide-thumb', 'aria-hidden': 'true', inert: true }, inner);
}

export function fitThumbnails(panel) {
  requestAnimationFrame(() => {
    panel.querySelectorAll('.guide-thumb').forEach((t) => t.style.setProperty('--s', String(t.clientWidth / THUMB_WIDTH)));
  });
}

function trialFor(ctx, option) {
  return applyAnswer(ctx.catalog, ctx.host.design, ctx.q, option.id);
}

function sampleButton(ctx, option, current, { chip = false } = {}) {
  const { host, actions } = ctx;
  const trial = trialFor(ctx, option);
  const swatch = chip ? el('span', { class: 'guide-swatch', style: `background:${option.hex}`, 'aria-hidden': 'true' }) : null;
  const b = el('button', { type: 'button', id: `guide-choice-${option.id}`, class: 'guide-sample' + (chip ? ' guide-chip' : ''), 'data-choice': option.id, 'aria-pressed': String(option.id === current) },
    chip ? swatch : thumbnail(ctx, trial),
    el('strong', {}, option.label),
    option.detail ? el('small', {}, option.detail) : null,
    option.note ? el('small', { class: 'guide-note' }, option.note) : null);
  b.addEventListener('click', () => actions.choose(option));
  b.addEventListener('pointerenter', () => host.preview(trial));
  b.addEventListener('focus', () => host.preview(trial));
  b.addEventListener('pointerleave', () => host.preview(null));
  b.addEventListener('blur', () => host.preview(null));
  return b;
}

const SCOPE_KEY = { fontPairing: 'headingFont', pattern: 'pattern', sharedColor: null };

function questionBody(ctx) {
  const { host, q, catalog, actions } = ctx;
  const copy = questionCopy(q);
  const head = [el('h1', { tabindex: '-1' }, copy.title), el('p', { class: 'panel-lead' }, copy.prompt)];
  if (q.kind === 'team') {
    const team = el('section', { class: 'start-team' });
    host.renderTeam(team);
    return [...head, team];
  }
  const current = currentValue(catalog, host.design, q);
  const { options, more } = optionsFor(catalog, host.design, q);
  const grid = el('div', { class: 'guide-samples', role: 'group', 'aria-label': `${copy.title} choices` });
  for (const option of options) grid.append(sampleButton(ctx, option, current));
  const body = [...head, grid];
  if (more.length) {
    const open = ctx.moreOpen;
    const toggle = el('button', { type: 'button', id: 'btnGuideMore', class: 'text-link', 'aria-expanded': String(open) }, open ? 'Fewer colors' : 'More colors');
    toggle.addEventListener('click', actions.toggleMore);
    body.push(toggle);
    if (open) {
      const extra = el('div', { class: 'guide-samples guide-more', role: 'group', 'aria-label': 'More colors' });
      for (const option of more) extra.append(sampleButton(ctx, option, current, { chip: true }));
      body.push(extra);
    }
  }
  const scopeKey = q.kind === 'sharedColor' ? q.role : SCOPE_KEY[q.kind];
  if (scopeKey) {
    const scope = el('div', { class: 'guide-scope' });
    host.appendScope(scope, scopeKey);
    body.push(scope);
  }
  return body;
}
```

Also remove the unused `void host; void q;` line from the first version. `renderGuide` already passes `ctx`; change its signature to use the new fields and drop `void applyAnswer;`:

```js
export function renderGuide(panel, ctx) {
  panel.replaceChildren(progress(ctx), ...questionBody(ctx), nav(ctx));
  fitThumbnails(panel);
}
```

In `bespoke/guide/guide.mjs` add the `Model` import, the More-colors state, and pass them through:

```js
import * as Model from '../builder-model.mjs';
```

Inside `createGuide`, add `let moreFor = null;` next to `let lastIndex = -1;`, add this action, and pass `Model` and `moreOpen`:

```js
    toggleMore: () => { const q = questionAt(get(), byId); moreFor = moreFor === q.id ? null : q.id; host.rerender(); },
```

and change the `renderGuide` call to:

```js
      renderGuide(panel, { guide, q, byId, catalog, host, actions, Model, moreOpen: moreFor === q.id });
```

Append to `bespoke/guide.css`:

```css
.guide-thumb { display: block; position: relative; width: 100%; aspect-ratio: 16 / 9; overflow: hidden; pointer-events: none; border-radius: 4px; background: #dfe7ed }
.guide-thumb-inner { display: block; position: absolute; top: 0; left: 0; width: 720px; height: 405px; container-type: inline-size; transform: scale(var(--s, .2)); transform-origin: top left }
.guide-thumb .bespoke-slide { box-shadow: none; min-height: 405px; height: 405px }
.guide-chip { flex-direction: row; align-items: center; gap: 10px }
.guide-swatch { width: 28px; height: 28px; border-radius: 50%; border: 1px solid #00133f40; flex: none }
.guide-more { grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); margin-top: 10px }
.guide-scope { margin-top: 14px; font-size: .85rem }
```

- [ ] **Step 3b: Keep hover previews from changing the page height**

Hovering a hard-to-read color makes the preview's advisory box appear, which grows the page, shifts the scroll position under the pointer, ends the hover, and loops. A hover preview must redraw only the slide. In `bespoke/builder-app.mjs`:

- Change `function updatePreview(design=state.design){` to `function updatePreview(design=state.design,{quick=false}={}){`.
- After the line `if(sidebarDisclosure)sidebarDisclosure.open=sidebarSampleOpen;` add `if(quick)return;`.
- In `guideHost()`, change `preview:trial=>updatePreview(trial||state.design),` to `preview:trial=>trial?updatePreview(trial,{quick:true}):updatePreview(),`.

- [ ] **Step 4: Run to verify pass**

Run: `node scripts/test-bespoke-guided-browser.mjs 2>&1 | tail -8`
Expected: the thumbnail, color, hard-to-read and shared-scope scenarios pass. Read the sweep result separately in the next step.

- [ ] **Step 5: Fix what the sweep finds**

The "every guided sample changes the preview" scenario reports dead options as `Question title: choice-id`. For each one:

1. Open the guide in the running app, go to that question, choose the option, and look at the preview. Confirm the option really does nothing visible on `q.view`.
2. If the option changes a different slide than the one the question shows (for example, a shared color that only shows on a slide the question's `view` does not display), change that question's `view` in `bespoke/guide/questions.mjs` (`SHARED_VIEW`) to a slide where it shows, update the matching test in `scripts/test-bespoke-guide.mjs` if it names the view, and re-run.
3. If the model genuinely produces no visible change for that option, do not exempt it silently. Write a ruling in the ledger naming the option and why, and add it to a small `KNOWN_INVISIBLE` list in the scenario with a comment.

Re-run until the dead list is empty or fully ruled on.

- [ ] **Step 6: Look at it**

Run the app with the local dev server and step through the guide at 1440 wide and 390 wide:

```bash
node scripts/bespoke-dev-server.mjs
```

(The script prints its URL. Open `/bespoke/`.) Read each thumbnail by eye. Expected: each looks like a small version of the real slide, none clipped or blank. Fix sizing in `bespoke/guide.css` if not. Stop the server when done.

- [ ] **Step 7: Confirm the pure tests and the free editor are still green**

Run: `node --test scripts/test-bespoke-guide.mjs 2>&1 | grep -E "^# (pass|fail)" && node scripts/test-bespoke-builder-browser.mjs 2>&1 | tail -2`
Expected: `# fail 0` and `14 scenarios passed`.

- [ ] **Step 8: Commit**

```bash
git add bespoke/guide bespoke/guide.css scripts/test-bespoke-guided-browser.mjs
git commit -m "feat: add guided thumbnails, hover preview and suggested colors"
```

---

### Task 6: Recap, skip, jump back, finish

**Files:**
- Modify: `bespoke/guide/screens.mjs`, `bespoke/guide/guide.mjs`, `scripts/test-bespoke-guided-browser.mjs`

**Interfaces:**
- Recap screen: the finished slide's choices as a list, each with a **Change** button that jumps to that question; Text boxes recap also shows the sample-line editors.
- Nav gains **Skip this slide type** (`#btnGuideSkip`) on every question inside a slide-type section and on the shared-look section (labeled **Skip shared look**).

- [ ] **Step 1: Write the failing scenarios**

Insert above `} finally {`:

```js
  await scenario('a recap lists the slide choices and Change jumps back to the question', async ({ makePage }) => {
    const page = await makePage();
    await startGuide(page);
    await walkTo(page, 'Your title slide');
    const lines = await page.locator('.guide-recap li').allInnerTexts();
    assert.ok(lines.length >= 5, `recap lists each title question, saw ${lines.length}`);
    assert.ok(lines.some((l) => /^Logo position:/.test(l)));
    await page.locator('.guide-recap li', { hasText: 'Logo position' }).getByRole('button', { name: /Change/ }).click();
    assert.equal(await heading(page), 'Logo position');
  });

  await scenario('the Text boxes recap edits the sample lines and the preview follows', async ({ makePage }) => {
    const page = await makePage();
    await startGuide(page);
    await walkTo(page, 'Your text boxes');
    await page.locator('#sample-box-0').fill('My first sample line');
    assert.match(await page.locator('#modelStage').innerText(), /My first sample line/);
    assert.equal((await design(page)).samples.boxes[0], 'My first sample line');
  });

  await scenario('Skip this slide type moves to the next section and keeps choices', async ({ makePage }) => {
    const page = await makePage();
    await startGuide(page);
    await walkTo(page, 'Title layout');
    const before = await design(page);
    await page.locator('#btnGuideSkip').click();
    assert.equal(await heading(page), 'Divider layout');
    assert.deepEqual(await design(page), before);
  });

  await scenario('teams can jump back to reached sections and not ahead', async ({ makePage }) => {
    const page = await makePage();
    await startGuide(page);
    await walkTo(page, 'Divider layout');
    assert.equal(await page.locator('.guide-section[data-section="title"]').isEnabled(), true);
    assert.equal(await page.locator('.guide-section[data-section="video"]').isDisabled(), true);
    await page.locator('.guide-section[data-section="title"]').click();
    assert.equal(await heading(page), 'Title layout');
  });

  await scenario('pressing Next through every question keeps the design and ends on Review', async ({ makePage }) => {
    const page = await makePage();
    await startGuide(page);
    const start = await design(page);
    for (let guard = 0; guard < 60 && (await page.locator('#btnGuideNext').count()); guard += 1) await next(page);
    assert.equal(await page.locator('#stage-review').getAttribute('aria-current'), 'step');
    assert.deepEqual(await design(page), start, 'Next without choosing changes nothing');
    assert.deepEqual(Model.validateDesign(catalog, await design(page)), []);
    await page.locator('#stage-start').click();
    assert.equal(await page.locator('#btnGuideMe').count(), 1, 'a finished guide offers to start again');
  });
```

- [ ] **Step 2: Run to verify failure**

Run: `BESPOKE_GUIDE_SCENARIO=recap node scripts/test-bespoke-guided-browser.mjs 2>&1 | tail -6`
Expected: FAIL, `.guide-recap` not found.

- [ ] **Step 3: Implement recap and skip**

In `bespoke/guide/screens.mjs` add the import and the recap renderer, and extend `renderGuide` and `nav`:

```js
import { recapLines } from './answers.mjs';
```

```js
function recapBody(ctx) {
  const { host, q, catalog, byId, guide, actions } = ctx;
  const copy = questionCopy(q);
  const slideQuestions = guide.ids.map((id) => byId.get(id)).filter((x) => x.section === q.section);
  const list = el('ul', { class: 'guide-recap' });
  for (const line of recapLines(catalog, host.design, slideQuestions)) {
    const change = el('button', { type: 'button', class: 'text-link' }, `Change ${line.text.split(':')[0].toLowerCase()}`);
    change.addEventListener('click', () => actions.jumpQuestion(line.id));
    list.append(el('li', {}, line.text, ' ', change));
  }
  const body = [el('h1', { tabindex: '-1' }, copy.title), el('p', { class: 'panel-lead' }, copy.prompt), list];
  if (q.section === 'cards') {
    const samples = el('section', { class: 'guide-samples-text' }, el('h2', {}, 'Try your own sample lines'),
      el('p', { class: 'helper' }, 'Sample words test the design. They are not lesson content.'));
    host.renderBoxSamples(samples);
    body.push(samples);
  }
  return body;
}
```

Replace `renderGuide` with:

```js
export function renderGuide(panel, ctx) {
  const body = ctx.q.kind === 'recap' ? recapBody(ctx) : questionBody(ctx);
  panel.replaceChildren(progress(ctx), ...body, nav(ctx));
  fitThumbnails(panel);
}
```

In `nav`, add the skip button between Next and Exit:

```js
  const inSection = ctx.q.kind !== 'team' && ctx.q.kind !== 'preset';
  const skipLabel = ctx.q.section === 'shared' ? 'Skip shared look' : 'Skip this slide type';
```

and build the row as:

```js
  return el('div', { class: 'panel-nav guide-nav' },
    button('btnGuideBack', 'btn btn-secondary', 'Back', actions.back, guide.index === 0),
    button('btnGuideNext', 'btn btn-primary', last ? 'Finish and review' : 'Next', actions.next),
    inSection ? button('btnGuideSkip', 'text-link', skipLabel, actions.skipSection) : null,
    button('btnGuideExit', 'text-link', 'Exit guide', actions.exit));
```

(`ctx` is in scope of `nav` as its parameter. Change its destructure line to keep `ctx`.)

The recap's `recapLines` call uses `questionCopy(q).title` for the first half of each line. The recap's Change button reads the text before the colon.

Append to `bespoke/guide.css`:

```css
.guide-recap { list-style: none; padding: 0; margin: 14px 0 }
.guide-recap li { padding: 8px 0; border-bottom: 1px solid var(--line) }
.guide-samples-text { margin-top: 18px }
```

- [ ] **Step 4: Run to verify pass**

Run: `node scripts/test-bespoke-guided-browser.mjs 2>&1 | tail -6`
Expected: all scenarios so far pass, ending `... scenarios passed; no runtime errors or external requests.`

- [ ] **Step 5: Commit**

```bash
git add bespoke/guide scripts/test-bespoke-guided-browser.mjs bespoke/guide.css
git commit -m "feat: add guided recap, skip, jump back and finish"
```

---

### Task 7: Undo returns to the question

**Files:**
- Modify: `bespoke/builder-app.mjs`, `scripts/test-bespoke-guided-browser.mjs`

**Interfaces:**
- `recordChange(label, before)` replaces the four places that push history. A history entry is `{label, design, guide?}` where `guide` is the guide question index when the change was made inside an active guide.
- `undoChange` moves an active guide back to `entry.guide`.

- [ ] **Step 1: Write the failing scenarios**

Insert above `} finally {`:

```js
  await scenario('Undo returns the guide to the question where the change was made', async ({ makePage }) => {
    const page = await makePage();
    await startGuide(page);
    await walkTo(page, 'Title layout');
    const original = (await design(page)).slides.title.layout;
    const pick = original === 'split' ? 'center' : 'split';
    await page.locator(`.guide-sample[data-choice="${pick}"]`).click();
    assert.equal((await design(page)).slides.title.layout, pick);
    await next(page);
    await next(page);
    assert.notEqual(await heading(page), 'Title layout');
    await page.locator('#btnUndo').click();
    assert.equal(await heading(page), 'Title layout', 'the guide is back on the question');
    assert.equal((await design(page)).slides.title.layout, original, 'the earlier value is back');
    await page.locator('#btnRedo').click();
    assert.equal((await design(page)).slides.title.layout, pick);
    assert.equal(await heading(page), 'Title layout');
  });

  await scenario('Undo after leaving the guide restores the design and does not reopen the guide', async ({ makePage }) => {
    const page = await makePage();
    await startGuide(page);
    await walkTo(page, 'Title layout');
    const original = (await design(page)).slides.title.layout;
    const pick = original === 'split' ? 'center' : 'split';
    await page.locator(`.guide-sample[data-choice="${pick}"]`).click();
    await page.locator('#btnGuideExit').click();
    await page.locator('#btnUndo').click();
    assert.equal((await design(page)).slides.title.layout, original);
    assert.equal(await page.locator('.guide-count').count(), 0, 'the guide stays closed');
    assert.equal(await page.locator('#roleEditorPanel').count(), 1);
  });

  await scenario('history from the free editor still works and old history entries load', async ({ makePage }) => {
    const page = await makePage();
    await page.locator('#stage-slides').click();
    await page.locator('#editor-title').click();
    await page.locator('#roleEditorPanel [data-choice][aria-pressed="false"]').first().click();
    const history = (await draft(page)).changes;
    assert.ok(history.length >= 1, 'the edit was recorded');
    assert.equal(history.at(-1).guide, undefined, 'edits outside the guide carry no guide position');
    await page.locator('#btnUndo').click();
    await page.reload();
    await page.locator('#stepList button').first().waitFor();
    assert.equal(await page.locator('#stepPanel h1').count(), 1);
  });
```

- [ ] **Step 2: Run to verify failure**

Run: `BESPOKE_GUIDE_SCENARIO=Undo node scripts/test-bespoke-guided-browser.mjs 2>&1 | tail -6`
Expected: FAIL on the first scenario: after Undo the heading is not `Title layout`.

- [ ] **Step 3: Replace the four history pushes**

In `bespoke/builder-app.mjs`:

1. Add this function directly above `function changeDesign(`:

```js
function recordChange(label,before){
 const entry={label,design:before};
 if(ui.guide?.on)entry.guide=ui.guide.index;
 state.changes.push(entry);state.changes=state.changes.slice(-40);state.redo=[];
}
```

2. In `changeDesign`, replace

```js
 state.changes.push({label,design:before});state.changes=state.changes.slice(-40);state.redo=[];state.design=next;
```

with

```js
 recordChange(label,before);state.design=next;
```

3. In `applyPresetChoice`, replace

```js
const samples=clone(state.design.samples);state.changes.push({label:'Applied '+preset.label,design:clone(state.design)});state.changes=state.changes.slice(-40);state.redo=[];state.design=
```

with

```js
const samples=clone(state.design.samples);recordChange('Applied '+preset.label,clone(state.design));state.design=
```

4. In `localText`'s `oninput`, replace

```js
  if(!checkpoint){state.changes.push({label:VIEW_NAMES[kind]+': '+label,design:clone(state.design)});state.changes=state.changes.slice(-40);checkpoint=true;}
```

with

```js
  if(!checkpoint){recordChange(VIEW_NAMES[kind]+': '+label,clone(state.design));checkpoint=true;}
```

5. In `addSampleField`'s `input` listener, replace

```js
  if(!checkpoint){state.changes.push({label:label+' edited',design:clone(state.design)});state.changes=state.changes.slice(-40);checkpoint=true;}
```

with

```js
  if(!checkpoint){recordChange(label+' edited',clone(state.design));checkpoint=true;}
```

6. Replace `undoChange` with:

```js
function undoChange(redo=false){
 if(!isLeadSession())return;
 const source=redo?state.redo:state.changes,target=redo?state.changes:state.redo;
 const entry=source.pop();if(!entry)return;
 target.push({label:entry.label,design:clone(state.design),...(Number.isInteger(entry.guide)?{guide:entry.guide}:{})});
 state.design=entry.design;
 if(ui.guide?.on&&Number.isInteger(entry.guide)&&entry.guide>=0&&entry.guide<ui.guide.ids.length)ui.guide={...ui.guide,index:entry.guide};
 saveDraft();render(false);
 fileNotice((redo?'Redid: ':'Undid: ')+entry.label);
}
```

- [ ] **Step 4: Run to verify pass**

Run: `node scripts/test-bespoke-guided-browser.mjs 2>&1 | tail -4`
Expected: all scenarios pass.

- [ ] **Step 5: Confirm the free editor's history behavior did not change**

Run: `node scripts/test-bespoke-builder-browser.mjs 2>&1 | tail -3 && node scripts/test-bespoke-streamlined-workflow.mjs 2>&1 | tail -3`
Expected: `14 scenarios passed` and the streamlined-workflow run ends with a pass line and no failures.

- [ ] **Step 6: Commit**

```bash
git add bespoke/builder-app.mjs scripts/test-bespoke-guided-browser.mjs
git commit -m "feat: make Undo return the guide to the question"
```

---

### Task 8: Plain language, accessibility, small screens, keyboard

**Files:**
- Modify: `scripts/test-bespoke-guided-browser.mjs`, `scripts/test-bespoke-guide.mjs`, then whatever the failures point at in `bespoke/guide/*`

- [ ] **Step 1: Write the scenarios**

Insert above `} finally {`:

```js
  const FORBIDDEN = /\b([Rr]oles?|[Hh]ex|[Cc][Ss][Ss]|[Rr][Gg][Bb][Aa]?|[Tt]oken|[Ss]cope|[Ii]nherit|[Gg]radient stop)\b|#[0-9a-f]{3,6}\b|[a-z][A-Z][a-z]/;
  async function axe(page, label) {
    await page.addScriptTag({ content: axeSource });
    const result = await page.evaluate(() => axe.run('#stepPanel', { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] }, resultTypes: ['violations'] }));
    assert.deepEqual(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`), [], label);
  }

  await scenario('no guided screen shows design jargon or color codes', async ({ makePage }) => {
    const page = await makePage();
    await startGuide(page);
    const screens = [];
    for (let guard = 0; guard < 60 && (await page.locator('#btnGuideNext').count()); guard += 1) {
      if (await page.locator('#btnGuideMore').count()) await page.locator('#btnGuideMore').click();
      const text = await page.locator('#stepPanel').evaluate((panel) => {
        const clone = panel.cloneNode(true);
        clone.querySelectorAll('style, .start-team, .guide-scope, .guide-samples-text').forEach((n) => n.remove());
        // Join leaf elements one per line. innerText would fuse neighboring buttons into one word.
        return [...clone.querySelectorAll('*')].filter((n) => !n.children.length).map((n) => n.textContent.trim()).filter(Boolean).join('\n');
      });
      screens.push(`${await heading(page)}\n${text}`);
      await next(page);
    }
    assert.ok(screens.length >= 39);
    for (const text of screens) assert.doesNotMatch(text, FORBIDDEN, text.slice(0, 60));
  });

  await scenario('guided screens pass the accessibility checks', async ({ makePage }) => {
    const page = await makePage();
    await startGuide(page);
    for (const title of ['Your team', 'Fonts', 'Title layout', 'Title color', 'Your title slide', 'Box layout', 'Your text boxes', 'Video layout', 'Activity layout']) {
      await walkTo(page, title);
      await axe(page, `guide screen "${title}"`);
    }
  });

  await scenario('the guide fits and stays reachable on a phone', async ({ makePage }) => {
    const page = await makePage({ mobile: true });
    await startGuide(page);
    for (const title of ['Fonts', 'Title layout', 'Title color']) {
      await walkTo(page, title);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      assert.ok(overflow <= 1, `no sideways scroll on "${title}", saw ${overflow}`);
      await page.locator('#btnGuideNext').scrollIntoViewIfNeeded();
      assert.equal(await page.locator('#btnGuideNext').isVisible(), true);
    }
    await page.locator('#surface-preview').click();
    assert.equal(await page.locator('#modelStage .bespoke-slide').count(), 1, 'the preview is one tap away');
  });

  await scenario('keyboard users can operate the guide', async ({ makePage }) => {
    const page = await makePage();
    await startGuide(page);
    await walkTo(page, 'Title layout');
    const before = (await design(page)).slides.title.layout;
    const pick = before === 'split' ? 'center' : 'split';
    await page.locator(`.guide-sample[data-choice="${pick}"]`).focus();
    await page.keyboard.press('Enter');
    assert.equal((await design(page)).slides.title.layout, pick);
    assert.equal(await page.evaluate(() => document.activeElement?.id), `guide-choice-${pick}`, 'focus stays on the chosen sample after the screen redraws');
    await page.locator('#btnGuideNext').focus();
    await page.keyboard.press('Enter');
    assert.equal(await heading(page), 'Logo position');
    assert.equal(await page.evaluate(() => document.activeElement?.id), 'btnGuideNext', 'focus stays on Next so the keyboard flow continues');
    await page.waitForFunction(() => /Question \d+ of \d+: Logo position/.test(document.getElementById('liveRegion').textContent));
    await walkTo(page, 'Box layout');
    await page.locator('.guide-sample').first().focus();
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement.closest('.guide-thumb') === null && document.activeElement.matches('.guide-sample, #btnGuideBack, #btnGuideNext, #btnGuideSkip, #btnGuideExit')), true, 'Tab goes to the next control, never into a thumbnail');
  });
```

- [ ] **Step 2: Add the view-only guard test**

Append to `scripts/test-bespoke-guide.mjs`:

```js
test('a view-only session disables every guide control and never saves guide state', () => {
  const source = fs.readFileSync(new URL('../bespoke/builder-app.mjs', import.meta.url), 'utf8');
  const lock = source.slice(source.indexOf('function lockViewControls()'), source.indexOf('function renderTeam(panel)'));
  assert.match(lock, /if \(isLeadSession\(\)\) return;/);
  assert.doesNotMatch(lock, /btnGuide|guide-choice|guide-section/, 'guide controls are not exempt from the lock');
  assert.match(source, /setGuide:next=>\{ui\.guide=next;if\(isLeadSession\(\)\)saveDraft\(\);\}/, 'guide state is only saved by an editing session');
});
```

Run: `node --test scripts/test-bespoke-guide.mjs 2>&1 | grep -E "^# (pass|fail)"`
Expected: `# fail 0`.

- [ ] **Step 3: Run the browser scenarios**

Run: `node scripts/test-bespoke-guided-browser.mjs 2>&1 | tail -10`
Expected: pass. If one fails, read the failure:

- **Jargon:** the message prints the first 60 characters of the offending screen. Fix the copy in `bespoke/guide/copy.mjs`. If the word comes from a catalog label, add an override in `bespoke/guide/answers.mjs` and ledger it.
- **axe:** the message names the rule and the element. Fix the markup in `bespoke/guide/screens.mjs` (labels, names, contrast of `.guide-note` and `.guide-section`). Do not turn a rule off.
- **Phone:** fix the layout in `bespoke/guide.css`.

- [ ] **Step 4: Commit**

```bash
git add bespoke scripts/test-bespoke-guided-browser.mjs scripts/test-bespoke-guide.mjs
git commit -m "test: cover guided mode language, accessibility and small screens"
```

---

### Task 9: Team guide, README, quality gate

**Files:**
- Modify: `bespoke/team-guide.html`, `bespoke/README.md`, `scripts/quality.sh`

- [ ] **Step 1: Add the guide to the team guide**

The Codex work already rewrote `bespoke/team-guide.html` for the three-stage builder, so nothing about the old brief remains (review finding F4 is done). Make two additive edits:

- In the numbered Start item ("Start. Check your lesson and team details..."), after "Each starts with usable choices." add "Or choose **Guide me step by step** to be asked one question at a time."
- Before the heading "Shared theme or a custom slide choice?" add a new section "Let BeSpoke guide you". It says that Start offers the guide and describes the slide-by-slide order, the sample pictures with point-to-preview, the four suggested colors with More colors and the hard-to-read marker, Next to keep, Skip this slide type, Exit guide and Continue guide, the recap with Change links and sample lines, and that Undo returns to the question. It ends by saying the guide and the slide editors make the same design. Keep it in plain sentences with no em dashes.

- [ ] **Step 2: Check the guide text**

Run:
```bash
grep -niE "four quick questions|fits your brief|generated variant|seven main|describe the feel" bespoke/team-guide.html | head
grep -c $'\xe2\x80\x94' bespoke/team-guide.html
```
Expected: no matches, then `0`.

- [ ] **Step 3: Add a README section**

In `bespoke/README.md`, directly after the "Choose a design" section (the list of three stages and the paragraph about presets), add:

```markdown
## Guide me

The Start stage also offers **Guide me step by step**. The guide asks one question per
screen, slide by slide: a starting look, a shared look (fonts, pattern, sidebar, accent and
button colors), then the title slide, chapter divider, text boxes, video slide and activity.
Each question shows its choices as small pictures drawn from the real slide styles, and
pointing at one previews it without choosing it. Color questions suggest the four most
readable colors on the current background and keep all eleven one click away. Readability
stays advisory. Every question can be skipped with **Next**, a whole slide type can be
skipped, and the guide can be left and resumed. After each slide type a recap shows the
choices, with a link back to any question. The guide writes the same saved design the free
editor writes, so nothing about saving, opening or sending changes. Undo also returns the
guide to the question where the change was made. The guide's position is kept in the
browser draft only.
```

- [ ] **Step 4: Add the checks to quality.sh**

Run `grep -n "node --test\|test-bespoke-builder-browser" scripts/quality.sh` to find the two lines. Then:

- In the `node --test` line that lists `scripts/test-bespoke-dev-server.mjs scripts/test-bespoke-v2-contracts.mjs ...`, append ` scripts/test-bespoke-guide.mjs`.
- In the browser block, on the line after `node scripts/test-bespoke-builder-browser.mjs`, add `node scripts/test-bespoke-guided-browser.mjs` with the same indentation and any `||` or `run` wrapper the neighboring lines use.

- [ ] **Step 5: Run the whole gate**

Run: `bash scripts/quality.sh 2>&1 | tail -15`
Expected: ends with `quality.sh: all checks passed` and exit code 0. This runs all 14 existing browser scripts plus the new one. The guided sweep alone takes a few minutes (about 34 questions, each option a full redraw and two screenshots), so expect the whole gate to take 10 minutes or more. If an existing browser script fails, read whether the Start stage change broke a selector it pins (for example a button count on Start). Fix the guide's markup if so. Do not edit the existing test to accommodate the guide unless the assertion itself was about the exact number of buttons, and in that case record a ruling.

- [ ] **Step 6: Confirm nothing the spec freezes has changed**

Run:
```bash
git diff codex/bespoke-guided-builder --stat -- bespoke/selection-v2.schema.json bespoke/builder-model.mjs bespoke/builder-catalog.json netlify
git diff codex/bespoke-guided-builder --stat | tail -1
grep -c $'\xe2\x80\x94' docs/superpowers/plans/2026-09-30-bespoke-guided-mode.md
```
Expected: the first command prints nothing, the second lists only the files in this plan's File structure, and the third prints `0`.

- [ ] **Step 7: Commit**

```bash
git add bespoke/team-guide.html bespoke/README.md scripts/quality.sh
git commit -m "docs: rewrite the team guide for Guide me and add the guide to the gate"
```

---

### Task 10: Verification note

**Files:**
- Create: `docs/bespoke/verification-2026-09-30-guide.md`

- [ ] **Step 1: Try it by hand**

Start the local server (`node scripts/bespoke-dev-server.mjs`), open `/bespoke/`, and run the guide from Start to Review at 1440 wide, then once at 390 wide. Read every screen as a first-time teacher would. Note anything confusing, any thumbnail that is unclear, and any question that feels redundant. Stop the server.

- [ ] **Step 2: Write the note**

Write `docs/bespoke/verification-2026-09-30-guide.md` in the style of `docs/bespoke/verification-2026-09-22.md`. Include the commands you ran with their actual output (`node --test scripts/test-bespoke-guide.mjs`, `node scripts/test-bespoke-guided-browser.mjs`, `bash scripts/quality.sh`), the counts, what you looked at by hand and what you saw, and these limits stated plainly: the guide has not been used by a real teacher, hosted save and Send were not exercised with a guided design, and the Money Management pilot is the next check. Run the note through the `unslop` skill first and keep it free of em dashes.

- [ ] **Step 3: Check the note**

Run: `grep -c $'\xe2\x80\x94' docs/bespoke/verification-2026-09-30-guide.md`
Expected: `0`.

- [ ] **Step 4: Commit**

```bash
git add docs/bespoke/verification-2026-09-30-guide.md
git commit -m "docs: record guided mode verification"
```

---

## Self-review

**Spec coverage**

| Spec requirement | Task |
|---|---|
| Two ways in: Guide me and Edit freely (Build my own) | 4 |
| One question per screen, samples drawn from real CSS | 4 (screen), 5 (thumbnails) |
| Slide by slide, layout first, then background, then text | 1 (order tests), 4 |
| Four suggested colors ranked by readability, More colors shows all eleven | 2 (ranking), 5 (screen) |
| Advisory readability with the ratio, never blocks | 2 (hard-to-read stays valid), 5 (scenario) |
| Point to preview, click to choose | 5 |
| Recap per slide type, Text boxes recap edits sample lines, Change links | 6 |
| Skip a question (Next), skip a slide type, leave and resume | 4 (exit, continue), 6 (skip) |
| Jump to reached sections only | 1 (logic), 6 (scenario) |
| Undo returns the guide to the question | 7 |
| Plain words, no role names, hex or CSS terms | 3 (copy tests), 8 (every screen) |
| Saved design, schema, service unchanged | Global Constraints, 9 Step 6 |
| Six presets kept in the starting look | 2 (`preset` options map all presets), 4 |
| F2 already fixed, F4 team guide, F5 shared-scope note | 0 Step 4, 9 Step 1, 5 (scope note) |
| Guide position in the draft only | 4 Step 6 items 3 and 4, 4 scenario 3 |
| Team question only when the team is not filled in | 1 (`teamComplete`), 4 (`host.teamComplete`) |

**Rulings inside this plan, against the spec's wording**

1. The spec's "Text" question for each slide type is asked as two screens, a heading color and a text color, because the model colors them separately and one screen cannot rank both. The section table in the spec is otherwise followed.
2. The spec says Edit freely is today's builder. The plan keeps the existing **Build my own** control as Edit freely, unrenamed, so the ids and text that 14 existing browser scripts pin do not move.
3. Gradient finish, second color, size, alignment, visibility toggles and custom watermark text stay in the free editor.
4. The Video slide gets no body-text color question. The model hides video body text by default, so every answer would change nothing visible, which the spec's "every option changes the preview" rule forbids. The spec's Video list therefore ends at Background and Heading color.
5. Text boxes ask the number of boxes first, then Layout, Title bar, Text treatment and Box style. The spec's rule said layout first, but a box layout such as Balanced grid looks identical to Across at the default of three boxes, so the guided sweep flagged it as a dead option. Every other slide type asks Layout first.
7. The every-sample sweep runs at 1920 px wide. At 1440 px the preview is 752 px wide and the Across and Balanced grid box layouts both render as two columns, so they look identical. This is existing preview behavior, unchanged by this work, and is reported to Britt as a finding.
6. The guide's "hard to read" line uses the model's own thresholds: 3 to 1 for headings on title, divider and video slides, and 4.5 to 1 for everything else. A unit test checks the two agree for every color. The guide asks for background color, heading color, text color and, for the divider, whether to show the watermark. Teams can leave the guide at any point to use the rest.

**Placeholder scan.** No TBD or "handle edge cases" remain. Two steps are instructions, not code, because what they do depends on what a run finds: Task 5 Step 5 (dead options from the sweep) and Task 8 Step 3 (failures from the jargon, axe and phone checks). Both give the file to change and the rule for deciding. Task 9 Step 1 rewrites prose in an existing page and Task 10 Step 2 writes a verification note from real output, so neither can be scripted verbatim.

**Type consistency.** `Question` fields (`id, section, kind, view, group, decision, role, slide, field`) are produced in Task 1 and read in Tasks 2, 3, 5, 6 with the same names. `Guide` is `{ids, index, furthest, on, done}` everywhere. `optionsFor` returns `{options, more}` and option objects carry `{id, label, detail?, note?, hex?, ratio?, current?}` in Tasks 2, 5 and 6. `host` methods used by `guide.mjs` and `screens.mjs` (`getGuide, setGuide, change, requestPreset, preview, setView, rerender, openGuide, finish, exitToEditor, announce, renderTeam, renderBoxSamples, appendScope, slideOptions, teamComplete, design, catalog`) all exist in Task 4's `guideHost()`. History entries are `{label, design, guide?}` in Task 7 and the draft loader ignores the extra key.

**Risks to watch**
- Thumbnails rely on `cssForDesign`'s scope option and on `renderSlide`'s root class string. If `renderSlide` changes its root markup, the `.replace('class="bespoke-slide"', ...)` silently does nothing and every thumbnail would look like the current slide. Task 5's first scenario asserts each sample draws a slide but not that it differs from the others. The sweep (Task 5 Step 5) is what would catch it.
- The Start-stage change adds controls to a stage that several existing tests examine. Task 9 Step 5 runs them all.
- `builder-app.mjs` grows by about 50 lines and is not split. That is deliberate and recorded in Global Constraints.
