#!/usr/bin/env node
// Checks the Cushion Challenge money model against its design:
// docs/superpowers/specs/2026-11-09-cushion-challenge-rebalance-design.md
// It runs the game's own model block, cut out of the HTML, so it tests the real code.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import assert from "node:assert/strict";

const GAME = fileURLToPath(new URL("../lesson-Money-Management/Part-2-Save-Money-Before-You-Spend-It-Britt/cushion-challenge.html", import.meta.url));

function loadModel(path) {
  const html = readFileSync(path, "utf8");
  const m = /\/\* cushion-model:start \*\/([\s\S]*?)\/\* cushion-model:end \*\//.exec(html);
  if (!m) return null;
  const ctx = vm.createContext({});
  vm.runInContext(m[1] + "\n;this.CushionModel = CushionModel;", ctx);
  return ctx.CushionModel;
}

const M = loadModel(GAME);
if (!M) {
  console.log("model block not found in GAME");
  process.exit(1);
}

// Plain copies so deep-equal ignores the vm realm's prototypes.
const plain = (x) => JSON.parse(JSON.stringify(x));
const ORDER = [["save1", 1], ["acct", 2], ["auto", 3], ["pics", 4], ["snap", 6], ["refund", 7]];

// Drive the game from Meet Jess to the given screen, answering in solo mode.
function playTo(answers, stop = 8, classMode = false) {
  let s = M.fresh();
  while (s.screen < stop) {
    s = M.next(s);
    const q = ORDER.find(([, screen]) => screen === s.screen);
    if (q && s.screen <= stop && answers[q[0]] !== undefined) {
      s = M.choose(s, q[0], answers[q[0]], classMode);
      if (classMode) s = M.reveal(s, q[0]);
    }
  }
  return s;
}
const sumOf = (answers) => M.summary(playTo(answers));
const beforeTire = (sum) => {
  const i = sum.rows.findIndex((r) => r.kind === "tire");
  return sum.rows.slice(0, i).reduce((t, r) => t + r.amt, 0);
};
const GOOD = { acct: "bankon", auto: "yes", pics: "planned", snap: "ask" };

const checks = [];
const check = (name, fn) => checks.push([name, fn]);

check("good10", () => {
  const a = sumOf({ ...GOOD, save1: 10, refund: 0 });
  assert.equal(a.shortfall, 0); assert.equal(a.habit, 40); assert.equal(a.cushion, 40);
  assert.equal(M.headline(a), "covered-short");
  for (const refund of [100, 300, 600]) assert.match(M.headline(sumOf({ ...GOOD, save1: 10, refund })), /^covered-/);
  assert.equal(M.headline(sumOf({ ...GOOD, save1: 10, refund: 300 })), "covered-refund");
});
check("good25", () => {
  const a = sumOf({ ...GOOD, save1: 25, refund: 0 });
  assert.equal(a.cushion, 280); assert.equal(M.headline(a), "habit");
});
check("feePath", () => assert.equal(sumOf({ ...GOOD, acct: "fee", save1: 25, refund: 0 }).cushion, 244));
check("jarPath", () => assert.equal(sumOf({ ...GOOD, acct: "jar", save1: 25, refund: 0 }).cushion, 240));
check("saveLeft", () => {
  for (const acct of ["jar", "fee", "bankon"]) for (const pics of ["emergency", "planned"]) {
    assert.equal(sumOf({ ...GOOD, acct, pics, save1: 0, auto: "no", refund: 0 }).shortfall, 120);
  }
});
check("defaultSplit", () => assert.equal(sumOf({ ...GOOD, save1: 0, auto: "yes", refund: 0 }).habit, 180));

check("allPaths", () => {
  const KEYS = ["habit", "covered-refund", "covered-short", "refund", "short"];
  let n = 0;
  for (const save1 of [10, 25, 50, 0]) for (const acct of ["jar", "fee", "bankon"])
    for (const auto of ["yes", "no"]) for (const pics of ["emergency", "planned"]) {
      const habits = new Set();
      for (const refund of [0, 100, 300, 600]) {
        const a = { save1, acct, auto, pics, snap: "ask", refund };
        const s = sumOf(a);
        n++;
        assert.equal(s.habit + s.refund, s.cushion, `sum ${JSON.stringify(a)}`);
        assert.equal(s.refund, refund);
        habits.add(s.habit);
        if (acct !== "bankon") assert.ok(s.cushion <= sumOf({ ...a, acct: "bankon" }).cushion, `account ${JSON.stringify(a)}`);
        assert.equal(s.shortfall, Math.max(0, 120 - beforeTire(s)), `tire ${JSON.stringify(a)}`);
        assert.ok(KEYS.includes(M.headline(s)), `headline ${JSON.stringify(a)}`);
      }
      assert.equal(habits.size, 1, `refund changed habit for ${save1}/${acct}/${auto}/${pics}`);
    }
  assert.equal(n, 192);
});

check("pendingPickAddsNothing", () => {
  let s = M.next(M.fresh());
  s = M.choose(s, "save1", 50, true);
  assert.equal(M.summary(s).cushion, 0);
  s = M.choose(s, "save1", 25, true);
  s = M.reveal(s, "save1");
  assert.equal(M.summary(s).cushion, 100);
  s = M.choose(s, "save1", 50, true);
  assert.equal(M.summary(s).cushion, 100);
});
check("backIsPointInTime", () => {
  const a = { ...GOOD, save1: 25, refund: 0 };
  let s = playTo(a);
  for (let i = 0; i < 5; i++) s = M.back(s);
  assert.equal(s.screen, 3);
  assert.equal(M.summary(s).cushion, M.summary(playTo(a, 3)).cushion);
  for (let i = 0; i < 5; i++) s = M.next(s);
  assert.equal(M.summary(s).cushion, 280);
  for (let i = 0; i < 7; i++) s = M.back(s);
  for (let i = 0; i < 7; i++) s = M.next(s);
  assert.equal(M.summary(s).cushion, 280);
});
check("changeClearsLater", () => {
  let s = playTo({ ...GOOD, save1: 25, refund: 300 });
  for (let i = 0; i < 7; i++) s = M.back(s);
  assert.equal(s.screen, 1);
  s = M.changeAnswer(s, "save1");
  for (const q of ["save1", "acct", "auto", "pics", "snap", "refund"]) {
    assert.equal(q in s.answers, false, q); assert.equal(Boolean(s.revealed[q]), false, q);
  }
  assert.equal(s.furthest, 1);
  assert.equal(M.summary(s).cushion, 0);
});
check("noMutation", () => {
  const s = playTo({ ...GOOD, save1: 25, refund: 0 }, 4);
  const before = JSON.stringify(s);
  M.next(s); M.back(s); M.changeAnswer(s, "acct"); M.choose(s, "pics", "planned", false); M.summary(s);
  assert.equal(JSON.stringify(s), before);
});
check("serializeRoundTrip", () => {
  for (const stop of [1, 3, 5, 7, 8]) {
    let s = playTo({ ...GOOD, acct: "jar", save1: 10, refund: 100 }, stop);
    if (stop > 3) s = M.back(M.back(s));
    assert.deepEqual(plain(M.summary(M.load(JSON.parse(JSON.stringify(s))))), plain(M.summary(s)));
  }
});
check("loadRejectsV1", () => {
  assert.deepEqual(plain(M.load({ screen: 4, cushion: 90 })), plain(M.fresh()));
  assert.deepEqual(plain(M.load(null)), plain(M.fresh()));
  assert.deepEqual(plain(M.load({ v: 2, screen: 42, answers: {}, revealed: {} })), plain(M.fresh()));
});
check("modeSwitchNoMoney", () => {
  let s = playTo({ ...GOOD, save1: 25 }, 3, true);
  s = M.next(s);
  s = M.choose(s, "pics", "emergency", true);
  const pending = M.summary(s).cushion;
  assert.equal(pending, M.summary(M.back(M.next(M.back(s)))).cushion + 0);
  assert.equal(s.revealed.pics, undefined);
  assert.equal(M.summary(M.reveal(s, "pics")).cushion, pending - 30);
});

let failed = 0;
for (const [name, fn] of checks) {
  try { fn(); console.log(`ok ${name}`); }
  catch (e) { failed++; console.log(`FAIL ${name}: ${e.message.split("\n")[0]}`); }
}
console.log(failed ? `${failed} of ${checks.length} checks failed` : `all ${checks.length} checks passed`);
process.exit(failed ? 1 : 0);
