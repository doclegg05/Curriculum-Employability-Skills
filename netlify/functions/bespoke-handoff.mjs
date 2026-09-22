/**
 * Secret-holding endpoint for Bespoke Save, Open, and Send.
 * The GitHub token is read from BESPOKE_GITHUB_TOKEN only. Never from the request.
 * Drafts are encrypted and stored on branch bespoke-drafts. This file never writes main.
 * Send starts the existing Spoke Signals workflow. It does not build a lesson
 * and it does not apply the selection registry.
 */
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  timingSafeEqual
} from "node:crypto";

export const DRAFT_BRANCH = "bespoke-drafts";
export const WORKFLOW_FILE = "spoke-signals.yml";
export const REPO = "doclegg05/Curriculum-Employability-Skills";
export const LESSON_IDS = [
  "goal-setting",
  "money-management",
  "professionalism-and-diversity",
  "knowing-your-rights",
  "communicating-assertively",
  "workplace-ethics"
];
export const WRONG_CODE = "That code is not right. Try again.";
export const SETUP_MESSAGE = "Saving is not connected yet.";
const MAX_BODY_CHARS = 80000;
const MAX_SELECTION_CHARS = 60000;
const EDIT_CODE_MIN = 4;
const EDIT_CODE_MAX = 40;

export const config = {
  path: "/api/bespoke"
};

function fail(status, error, message) {
  return { status, body: { ok: false, error, message } };
}

function ok(body) {
  return { status: 200, body };
}

export function hashEditCode(code) {
  return createHash("sha256").update(String(code).trim(), "utf8").digest("base64url");
}

export function hashesMatch(left, right) {
  if (typeof left !== "string" || typeof right !== "string") return false;
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function draftKey(token) {
  return createHash("sha256").update(String(token), "utf8").digest();
}

export function seal(token, payload, lessonId) {
  const nonce = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", draftKey(token), nonce);
  const inner = Buffer.from(JSON.stringify({
    editCodeHash: payload.editCodeHash,
    selection: payload.selection
  }), "utf8");
  const enc = Buffer.concat([cipher.update(inner), cipher.final()]);
  const savedAt = new Date().toISOString();
  return {
    schema: "bespoke-cloud-draft/v1",
    lessonId,
    savedAt,
    nonce: nonce.toString("base64url"),
    box: Buffer.concat([enc, cipher.getAuthTag()]).toString("base64url")
  };
}

export function openBox(token, envelope) {
  if (!envelope || envelope.schema !== "bespoke-cloud-draft/v1" || typeof envelope.box !== "string") return null;
  try {
    const box = Buffer.from(envelope.box, "base64url");
    if (box.length < 17) return null;
    const decipher = createDecipheriv("aes-256-gcm", draftKey(token), Buffer.from(envelope.nonce, "base64url"));
    decipher.setAuthTag(box.subarray(box.length - 16));
    const plain = Buffer.concat([decipher.update(box.subarray(0, box.length - 16)), decipher.final()]);
    const parsed = JSON.parse(plain.toString("utf8"));
    if (!parsed || typeof parsed.editCodeHash !== "string" || !parsed.selection || typeof parsed.selection !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function assertDraftWrite(branch, lessonId) {
  if (branch !== DRAFT_BRANCH || branch === "main" || branch === "master") {
    throw new Error("refusing to write outside bespoke-drafts");
  }
  if (!LESSON_IDS.includes(lessonId)) throw new Error("refusing an unknown lesson");
}

function selectionProblem(selection, lessonId, forSend) {
  if (!selection || typeof selection !== "object" || Array.isArray(selection)) {
    return fail(400, "selection", "The design could not be read.");
  }
  let raw;
  try {
    raw = JSON.stringify(selection);
  } catch {
    return fail(400, "selection", "The design could not be read.");
  }
  if (raw.length > MAX_SELECTION_CHARS) {
    return fail(400, "size", "This design is too long to save. Shorten the sample text.");
  }
  if (selection.schema !== "bespoke-selection/v1" || !selection.lesson || selection.lesson.id !== lessonId) {
    return fail(400, "lesson", "Choose one of the six lessons.");
  }
  if (forSend) {
    const name = selection.team && selection.team.spokesperson ? selection.team.spokesperson.name : "";
    if (typeof name !== "string" || !name.trim()) {
      return fail(400, "spokesperson", "Add the spokesperson's name on Lesson & team before sending.");
    }
  }
  return null;
}

async function storeDraft(github, token, lessonId, hash, selection) {
  const existing = await github.readDraft(lessonId);
  if (existing) {
    const opened = openBox(token, existing.envelope);
    if (!opened || !hashesMatch(opened.editCodeHash, hash)) return { denied: fail(403, "code", WRONG_CODE) };
  }
  const write = async (sha) => github.writeDraft(lessonId, seal(token, { editCodeHash: hash, selection }, lessonId), sha);
  try {
    await write(existing ? existing.sha : undefined);
  } catch (err) {
    if (err.status !== 409 && err.status !== 422) throw err;
    const again = await github.readDraft(lessonId);
    if (again) {
      const opened = openBox(token, again.envelope);
      if (!opened || !hashesMatch(opened.editCodeHash, hash)) return { denied: fail(403, "code", WRONG_CODE) };
    }
    await write(again ? again.sha : undefined);
  }
  return { denied: null };
}

export async function handleAction(body, { github, token }) {
  if (!token) return fail(503, "setup", SETUP_MESSAGE);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return fail(400, "body", "The request could not be read.");
  }
  const action = body.action;
  if (action !== "save" && action !== "open" && action !== "send") {
    return fail(400, "action", "Use Save, Open, or Send to Britt.");
  }
  if (typeof body.lessonId !== "string" || !LESSON_IDS.includes(body.lessonId)) {
    return fail(400, "lesson", "Choose one of the six lessons.");
  }
  const code = typeof body.editCode === "string" ? body.editCode.trim() : "";
  if (code.length < EDIT_CODE_MIN || code.length > EDIT_CODE_MAX) {
    return fail(400, "length", `Enter your edit code. It needs at least ${EDIT_CODE_MIN} characters.`);
  }
  const hash = hashEditCode(code);
  const lessonId = body.lessonId;

  if (action === "open") {
    const existing = await github.readDraft(lessonId);
    if (!existing) return fail(404, "missing", "There is no saved design for that lesson yet. Choose Save first.");
    const opened = openBox(token, existing.envelope);
    if (!opened || opened.selection.lesson?.id !== lessonId) {
      return fail(502, "store", "That saved design could not be read. Ask Britt to check the connection.");
    }
    if (!hashesMatch(opened.editCodeHash, hash)) return fail(403, "code", WRONG_CODE);
    return ok({ ok: true, selection: opened.selection });
  }

  const problem = selectionProblem(body.selection, lessonId, action === "send");
  if (problem) return problem;
  const stored = await storeDraft(github, token, lessonId, hash, body.selection);
  if (stored.denied) return stored.denied;
  if (action === "save") return ok({ ok: true, savedAt: new Date().toISOString() });

  await github.dispatchSpokeSignal(JSON.stringify(body.selection));
  return ok({ ok: true, sent: true });
}

export function createGitHub(token, repository = REPO, fetchImpl = globalThis.fetch) {
  const slash = repository.indexOf("/");
  const owner = repository.slice(0, slash);
  const repo = repository.slice(slash + 1);
  async function request(method, path, body) {
    const response = await fetchImpl(`https://api.github.com${path}`, {
      method,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "User-Agent": "bespoke-handoff",
        "X-GitHub-Api-Version": "2022-11-28",
        ...(body ? { "Content-Type": "application/json" } : {})
      },
      body: body ? JSON.stringify(body) : undefined
    });
    const text = await response.text();
    let data = null;
    if (text) {
      try { data = JSON.parse(text); } catch { data = null; }
    }
    return { status: response.status, data };
  }

  return {
    async readDraft(lessonId) {
      assertDraftWrite(DRAFT_BRANCH, lessonId);
      const path = `/repos/${owner}/${repo}/contents/drafts/${encodeURIComponent(lessonId)}.json?ref=${encodeURIComponent(DRAFT_BRANCH)}`;
      const res = await request("GET", path);
      if (res.status === 404) return null;
      if (res.status !== 200 || !res.data || typeof res.data.content !== "string") {
        const err = new Error("read failed");
        err.status = res.status;
        throw err;
      }
      const encoded = res.data.content.replace(/\n/g, "");
      return {
        sha: res.data.sha,
        envelope: JSON.parse(Buffer.from(encoded, "base64").toString("utf8"))
      };
    },
    async ensureDraftBranch() {
      const found = await request("GET", `/repos/${owner}/${repo}/git/ref/heads/${DRAFT_BRANCH}`);
      if (found.status === 200) return;
      if (found.status !== 404) {
        const err = new Error("branch lookup failed");
        err.status = found.status;
        throw err;
      }
      const base = await request("GET", `/repos/${owner}/${repo}/git/ref/heads/main`);
      if (base.status !== 200 || !base.data || !base.data.object || !base.data.object.sha) {
        const err = new Error("default branch lookup failed");
        err.status = base.status;
        throw err;
      }
      const created = await request("POST", `/repos/${owner}/${repo}/git/refs`, {
        ref: `refs/heads/${DRAFT_BRANCH}`,
        sha: base.data.object.sha
      });
      if (created.status !== 201 && created.status !== 422) {
        const err = new Error("branch create failed");
        err.status = created.status;
        throw err;
      }
    },
    async writeDraft(lessonId, envelope, sha) {
      assertDraftWrite(DRAFT_BRANCH, lessonId);
      await this.ensureDraftBranch();
      const body = {
        message: `chore(bespoke): save draft for ${lessonId}`,
        content: Buffer.from(JSON.stringify(envelope), "utf8").toString("base64"),
        branch: DRAFT_BRANCH
      };
      if (sha) body.sha = sha;
      if (body.branch === "main" || body.branch === "master") throw new Error("refusing to write the default branch");
      const res = await request("PUT", `/repos/${owner}/${repo}/contents/drafts/${encodeURIComponent(lessonId)}.json`, body);
      if (res.status !== 200 && res.status !== 201) {
        const err = new Error("write failed");
        err.status = res.status;
        throw err;
      }
      return res.data && res.data.content ? res.data.content.sha : sha;
    },
    async dispatchSpokeSignal(payloadJson) {
      if (typeof payloadJson !== "string" || payloadJson.length > MAX_SELECTION_CHARS) {
        const err = new Error("payload too large");
        err.status = 400;
        throw err;
      }
      // ref chooses the workflow file on the default branch. It is not a commit to main.
      const res = await request("POST", `/repos/${owner}/${repo}/actions/workflows/${WORKFLOW_FILE}/dispatches`, {
        ref: "main",
        inputs: { payload_json: payloadJson }
      });
      if (res.status !== 204) {
        const err = new Error("dispatch failed");
        err.status = res.status;
        throw err;
      }
    }
  };
}

function jsonResponse(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "X-Content-Type-Options": "nosniff"
    }
  });
}

export async function handleRequest(req, env = process.env, deps = {}) {
  if (req.method === "OPTIONS") return jsonResponse({ ok: true }, 204);
  if (req.method !== "POST") return jsonResponse({ ok: false, error: "method", message: "Use Save, Open, or Send to Britt." }, 405);
  const token = env.BESPOKE_GITHUB_TOKEN || "";
  if (!token) return jsonResponse({ ok: false, error: "setup", message: SETUP_MESSAGE }, 503);
  let raw = "";
  try {
    raw = await req.text();
  } catch {
    return jsonResponse({ ok: false, error: "body", message: "The request could not be read." }, 400);
  }
  if (raw.length > MAX_BODY_CHARS) {
    return jsonResponse({ ok: false, error: "size", message: "This design is too long to save. Shorten the sample text." }, 400);
  }
  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    return jsonResponse({ ok: false, error: "body", message: "The request could not be read." }, 400);
  }
  try {
    const github = deps.github || createGitHub(token, env.BESPOKE_GITHUB_REPOSITORY || REPO, deps.fetchImpl);
    const result = await handleAction(body, { github, token });
    return jsonResponse(result.body, result.status);
  } catch (err) {
    console.error("bespoke-handoff", err && err.status ? err.status : "failed");
    return jsonResponse({ ok: false, error: "store", message: "Saving could not reach the connected store. Try again." }, 502);
  }
}

export default async function handler(req) {
  return handleRequest(req);
}
