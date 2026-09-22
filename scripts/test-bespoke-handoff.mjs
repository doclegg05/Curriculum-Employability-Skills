import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  DRAFT_BRANCH,
  LESSON_IDS,
  REPO,
  WRONG_CODE,
  assertDraftWrite,
  createGitHub,
  handleAction,
  handleRequest,
  openBox
} from "../netlify/functions/bespoke-handoff.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const token = "test-token-not-a-real-secret";
const fixture = JSON.parse(fs.readFileSync(path.join(root, "scripts/test-fixtures/bespoke/selection-money-management.json"), "utf8"));

function memoryGitHub() {
  const files = new Map();
  const api = {
    writes: [],
    dispatches: [],
    async readDraft(lessonId) {
      assertDraftWrite(DRAFT_BRANCH, lessonId);
      return files.get(lessonId) || null;
    },
    async writeDraft(lessonId, envelope, sha) {
      assertDraftWrite(DRAFT_BRANCH, lessonId);
      api.writes.push({ lessonId, branch: DRAFT_BRANCH, sha: sha || null });
      const current = files.get(lessonId);
      if (sha && (!current || current.sha !== sha)) {
        const err = new Error("conflict");
        err.status = 409;
        throw err;
      }
      const next = { sha: `sha-${api.writes.length}`, envelope };
      files.set(lessonId, next);
      return next.sha;
    },
    async dispatchSpokeSignal(payloadJson) {
      api.dispatches.push(payloadJson);
    }
  };
  return { api, files };
}

test("lesson allowlist matches the wizard catalog", () => {
  const catalog = JSON.parse(fs.readFileSync(path.join(root, "bespoke/catalog.json"), "utf8"));
  assert.deepEqual(LESSON_IDS, catalog.lessons.map((lesson) => lesson.id));
});

test("save then open restores the design and keeps the edit code out of the stored file", async () => {
  const { api, files } = memoryGitHub();
  const saved = await handleAction({
    action: "save",
    lessonId: "money-management",
    editCode: "room-code",
    selection: fixture
  }, { github: api, token });
  assert.equal(saved.body.ok, true);
  const envelope = files.get("money-management").envelope;
  assert.equal(envelope.schema, "bespoke-cloud-draft/v1");
  const plain = openBox(token, envelope);
  assert.equal(JSON.stringify(plain).includes("room-code"), false);
  assert.equal(plain.selection.team.name, "Dogfood team");
  assert.equal(JSON.stringify({ lessonId: envelope.lessonId, nonce: envelope.nonce, box: envelope.box }).includes("Dogfood team"), false);
  const opened = await handleAction({
    action: "open",
    lessonId: "money-management",
    editCode: "room-code"
  }, { github: api, token });
  assert.equal(opened.status, 200);
  assert.deepEqual(opened.body.selection, fixture);
  assert.equal("editCode" in opened.body, false);
  assert.equal(api.writes.every((write) => write.branch === "bespoke-drafts"), true);
});

test("wrong edit code returns the wizard failure and no design", async () => {
  const { api } = memoryGitHub();
  await handleAction({ action: "save", lessonId: "money-management", editCode: "room-code", selection: fixture }, { github: api, token });
  const wrong = await handleAction({ action: "open", lessonId: "money-management", editCode: "nope" }, { github: api, token });
  assert.equal(wrong.status, 403);
  assert.deepEqual(wrong.body, { ok: false, error: "code", message: WRONG_CODE });
  assert.equal(JSON.stringify(wrong.body).includes("Dogfood"), false);
  const overwrite = await handleAction({
    action: "save",
    lessonId: "money-management",
    editCode: "other-code",
    selection: fixture
  }, { github: api, token });
  assert.equal(overwrite.body.message, WRONG_CODE);
  assert.equal(api.dispatches.length, 0);
});

test("unknown lesson, short code, and missing draft are refused", async () => {
  const { api } = memoryGitHub();
  const unknown = await handleAction({ action: "open", lessonId: "time-management", editCode: "room-code" }, { github: api, token });
  assert.equal(unknown.status, 400);
  const short = await handleAction({ action: "save", lessonId: "money-management", editCode: "abc", selection: fixture }, { github: api, token });
  assert.equal(short.status, 400);
  const missing = await handleAction({ action: "open", lessonId: "goal-setting", editCode: "room-code" }, { github: api, token });
  assert.equal(missing.status, 404);
  assert.equal(api.writes.length, 0);
});

test("send dispatches the saved design and does not include the edit code", async () => {
  const { api } = memoryGitHub();
  const sent = await handleAction({
    action: "send",
    lessonId: "money-management",
    editCode: "room-code",
    selection: fixture
  }, { github: api, token });
  assert.equal(sent.body.sent, true);
  assert.equal(api.dispatches.length, 1);
  const payload = JSON.parse(api.dispatches[0]);
  assert.equal(payload.lesson.id, "money-management");
  assert.equal(api.dispatches[0].includes("room-code"), false);
  const blocked = await handleAction({
    action: "send",
    lessonId: "money-management",
    editCode: "nope",
    selection: fixture
  }, { github: api, token });
  assert.equal(blocked.body.message, WRONG_CODE);
  assert.equal(api.dispatches.length, 1);
});

test("a different token cannot read the stored design", async () => {
  const { api, files } = memoryGitHub();
  await handleAction({ action: "save", lessonId: "money-management", editCode: "room-code", selection: fixture }, { github: api, token });
  assert.equal(openBox("another-token", files.get("money-management").envelope), null);
  const opened = await handleAction({ action: "open", lessonId: "money-management", editCode: "room-code" }, { github: api, token: "another-token" });
  assert.equal(opened.body.selection, undefined);
});

test("writes stay off main and dispatch only starts the workflow", async () => {
  assert.throws(() => assertDraftWrite("main", "money-management"), /bespoke-drafts/);
  const calls = [];
  const blobs = new Map();
  let draftBranch = false;
  const fetchImpl = async (url, opts) => {
    calls.push({ url, method: opts.method, body: opts.body ? JSON.parse(opts.body) : null, auth: opts.headers.Authorization });
    const pathname = new URL(url).pathname;
    if (pathname.endsWith("/git/ref/heads/bespoke-drafts")) {
      return new Response(JSON.stringify(draftBranch ? { object: { sha: "mainsha" } } : { message: "Not Found" }), { status: draftBranch ? 200 : 404 });
    }
    if (pathname.endsWith("/git/ref/heads/main")) {
      return new Response(JSON.stringify({ object: { sha: "mainsha" } }), { status: 200 });
    }
    if (opts.method === "POST" && pathname.endsWith("/git/refs")) {
      assert.equal(calls.at(-1).body.ref, "refs/heads/bespoke-drafts");
      draftBranch = true;
      return new Response(JSON.stringify({ ref: calls.at(-1).body.ref }), { status: 201 });
    }
    if (opts.method === "PUT") {
      assert.equal(draftBranch, true);
      assert.equal(calls.at(-1).body.branch, "bespoke-drafts");
      blobs.set(pathname, { sha: "sha-1", content: calls.at(-1).body.content });
      return new Response(JSON.stringify({ content: { sha: "sha-1" } }), { status: 201 });
    }
    if (pathname.endsWith("/dispatches")) {
      assert.equal(calls.at(-1).body.ref, "main");
      assert.equal(calls.at(-1).body.inputs.payload_json.includes("room-code"), false);
      return new Response(null, { status: 204 });
    }
    const hit = blobs.get(pathname);
    if (!hit) return new Response(JSON.stringify({ message: "Not Found" }), { status: 404 });
    return new Response(JSON.stringify(hit), { status: 200 });
  };
  const github = createGitHub(token, REPO, fetchImpl);
  const sent = await handleAction({ action: "send", lessonId: "money-management", editCode: "room-code", selection: fixture }, { github, token });
  assert.equal(sent.body.sent, true);
  assert.equal(calls.some((call) => call.method === "PUT" && call.body.branch === "main"), false);
  assert.equal(calls.some((call) => call.method === "POST" && call.body && call.body.ref === "refs/heads/main"), false);
  assert.equal(calls.some((call) => call.url.includes("bespoke-apply-selection")), false);
  const opened = await handleAction({ action: "open", lessonId: "money-management", editCode: "room-code" }, { github, token });
  assert.equal(opened.body.selection.team.name, "Dogfood team");
});

test("http gate refuses anonymous setup and hides the token", async () => {
  const missing = await handleRequest(new Request("http://local/api/bespoke", {
    method: "POST",
    body: JSON.stringify({ action: "save", lessonId: "money-management", editCode: "room-code", selection: fixture })
  }), {});
  assert.equal(missing.status, 503);
  const text = await missing.text();
  assert.equal(text.includes("BESPOKE_GITHUB_TOKEN"), false);
  assert.equal(text.includes(token), false);
  assert.equal(JSON.parse(text).message, "Saving is not connected yet.");

  const { api } = memoryGitHub();
  const response = await handleRequest(new Request("http://local/api/bespoke", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "open", lessonId: "money-management", editCode: "nope", branch: "main" })
  }), { BESPOKE_GITHUB_TOKEN: token }, { github: api });
  assert.equal(response.status, 404);
  assert.equal(api.writes.length, 0);
});

test("source and wizard files do not embed a token", () => {
  const source = fs.readFileSync(path.join(root, "netlify/functions/bespoke-handoff.mjs"), "utf8");
  assert.equal(source.includes("bespoke-apply-selection"), false);
  assert.equal(source.includes("ghp_"), false);
  assert.equal(source.includes("github_pat_"), false);
  for (const rel of ["bespoke/app.js", "bespoke/index.html", "bespoke/styles.css", "bespoke/handoff-config.json", "bespoke/team-guide.html"]) {
    const text = fs.readFileSync(path.join(root, rel), "utf8");
    assert.equal(text.includes("ghp_"), false, rel);
    assert.equal(text.includes("github_pat_"), false, rel);
    assert.equal(text.includes("BESPOKE_GITHUB_TOKEN"), false, rel);
  }
  const guide = fs.readFileSync(path.join(root, "bespoke/team-guide.html"), "utf8");
  assert.equal(/json/i.test(guide), false);
});
