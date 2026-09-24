import * as Model from './builder-model.mjs';
import { compareDesign } from './similarity.mjs';

// Keep the established SPOKES identity. A small decision panel operates a large
// cumulative slide preview; confirmed shared saves remain separate from drafts.
const STORAGE_KEY = 'bespoke-draft-v2';
const BACKUP_KEY = 'bespoke-previous-draft-v2';
const TEAM_SESSION_KEY = 'bespoke-team-session-v2';
// Tab-lifetime UI preference only; never part of a design, team record or export.
const PRESET_CONFIRM_KEY = 'bespoke-skip-preset-confirmation-session';
let skipPresetConfirmation = (()=>{try{return sessionStorage.getItem(PRESET_CONFIRM_KEY)==='1';}catch{return false;}})();
let pendingPreset = null;
const PENDING_SUBMISSION_STORAGE = 'bespoke-pending-submission-v2';
const MAX_FILE_BYTES = 256000;
const SHARE_URL_MAX = 8000;
const EDIT_CODE_MIN = 20;
const EDIT_CODE_MAX = 128;
const HANDOFF_TIMEOUT_MS = 20000;
const HANDOFF_CONFIG_URL = './handoff-config.json';
const VIEW_NAMES = {title:'Title slide',divider:'Chapter divider',cards:'Text boxes',video:'Video slide',activity:'Activity'};
const STEPS = [
 {id:'welcome',label:'Your starting point',view:'title'},
 {id:'team',label:'Lesson & team',view:'title'},
 {id:'colors',label:'Paint your elements',view:'cards'},
 {id:'fonts',label:'Fonts & background',view:'cards'},
 {id:'title',label:'Title slide',view:'title'},
 {id:'divider',label:'Chapter divider',view:'divider'},
 {id:'cards',label:'Text boxes',view:'cards'},
 {id:'video',label:'Video slide',view:'video'},
 {id:'activity',label:'Activity',view:'activity'},
 {id:'review',label:'Review & save',view:'title'}
];
const state = {step:0,stepId:'welcome',meta:null,library:null,lessonId:'money-management',teamName:'',spokespersonName:'',spokespersonEmail:'',lessonTitle:'',lessonSubtitle:'',unspoken:'',editCode:'',previewView:'title',design:null,legacySelection:null,changes:[],redo:[]};
const ui = {mode:'view',renderedStep:null,previewPinned:false,teamSession:null,cloudConflict:null,cloudBusy:false,autosavePaused:false,allowUnload:false,skipNextLocalSave:false,restoreNote:'',restoredFromLink:false,editCodeHash:'',activeRole:'sidebar',localPreview:false};
let catalog, fingerprints, selectionSchema, handoffApiBase='', handoffBusy=false, lastSavedRaw=null, storageConflict=false;
let autosaveTimer=null, autosaveReady=false, saveAnnounceTimer=null, saveAnnounceReady=false, submissionPollTimer=null;
const AUTOSAVE=Object.freeze({enabled:true,idleMs:30000,stepMs:1500,...(window.__bespokeAutosave||{})});
let startupTeamLink=(()=>{const v=location.hash.startsWith('#team=')?location.hash.slice(6):'';if(v)history.replaceState(null,'',location.pathname+location.search);return v;})();
const clone = value => structuredClone(value);
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const findOption=(family,slug)=>state.library?.families?.[family]?.options.find(o=>o.slug===slug);
  function byId(id) {
    return document.getElementById(id);
  }

  function findMeta(list, id) {
    return (list || []).find((item) => item.id === id);
  }

  function stepIndex(id) {
    const index = STEPS.findIndex((step) => step.id === id);
    return index < 0 ? 0 : index;
  }

  function setSaveStatus(text) {
    const el = byId("saveStatus");
    if (el) el.textContent = text;
  }

  function queueSaveAnnouncement() {
    if (!saveAnnounceReady) return;
    clearTimeout(saveAnnounceTimer);
    saveAnnounceTimer = setTimeout(() => {
      const live = byId("saveLive");
      if (!live) return;
      live.textContent = "";
      window.setTimeout(() => {
        live.textContent = "Browser draft saved";
      }, 30);
    }, 600);
  }

  function isLeadSession() {
    return ui.mode === "edit";
  }

  function newMutationId() {
    return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function selectionKey(payload) {
    const copy = JSON.parse(JSON.stringify(payload));
    delete copy.date;
    delete copy.submittedAt;
    return JSON.stringify(copy);
  }

  function currentSelectionKey() {
    try { return selectionKey(buildSelectionPayload()); }
    catch { return ""; }
  }

  function persistTeamSession() {
    if (!ui.teamSession) return;
    try { localStorage.setItem(TEAM_SESSION_KEY, JSON.stringify(ui.teamSession)); }
    catch { /* backups remain available when storage is blocked */ }
  }

  function forgetTeamSession() {
    resetPresetConfirmation();
    ui.teamSession = null;
    ui.cloudConflict = null;
    state.editCode = "";
    try {
      localStorage.removeItem(TEAM_SESSION_KEY);
      localStorage.removeItem(PENDING_SUBMISSION_STORAGE);
    } catch { /* private mode */ }
  }

  function restoreTeamSession() {
    try {
      const saved = JSON.parse(localStorage.getItem(TEAM_SESSION_KEY) || "null");
      if (!saved || typeof saved !== "object") return null;
      if (!findMeta(state.meta.lessons, saved.lessonId)) return null;
      if (typeof saved.editCode !== "string" || saved.editCode.length < EDIT_CODE_MIN) return null;
      ui.teamSession = saved;
      state.editCode = saved.editCode;
      return saved;
    } catch { return null; }
  }

  function installTeamSession(lessonId, editCode) {
    const same = ui.teamSession && ui.teamSession.lessonId === lessonId && ui.teamSession.editCode === editCode;
    if (!same) resetPresetConfirmation();
    ui.teamSession = same ? ui.teamSession : {
      lessonId,
      editCode,
      revision: null,
      savedAt: null,
      baseSelectionKey: null,
      pendingSave: null
    };
    state.editCode = editCode;
    persistTeamSession();
  }

  function parseTeamLink(value) {
    let decoded = "";
    try { decoded = decodeURIComponent(value); } catch { decoded = value; }
    const split = decoded.indexOf(".");
    if (split < 1) return null;
    const lessonId = decoded.slice(0, split);
    const editCode = decoded.slice(split + 1);
    if (!findMeta(state.meta.lessons, lessonId)) return null;
    if (editCode.length < EDIT_CODE_MIN || editCode.length > EDIT_CODE_MAX) return null;
    return { lessonId, editCode };
  }

  function hasUnsavedTeamWork() {
    if (!ui.teamSession) return false;
    const key = currentSelectionKey();
    return Boolean(key && key !== (ui.teamSession.baseSelectionKey || ""));
  }

  function canAutosave() {
    return AUTOSAVE.enabled && autosaveReady && isLeadSession() && Boolean(ui.teamSession) &&
      Boolean(handoffApiBase) && !ui.cloudConflict && !ui.autosavePaused && !storageConflict;
  }

  function scheduleAutosave(delay) {
    clearTimeout(autosaveTimer);
    autosaveTimer = null;
    if (!canAutosave() || !hasUnsavedTeamWork()) return;
    autosaveTimer = window.setTimeout(runAutosave, delay);
  }

  function runAutosave() {
    clearTimeout(autosaveTimer);
    autosaveTimer = null;
    if (!canAutosave() || !hasUnsavedTeamWork()) return;
    if (handoffBusy) {
      scheduleAutosave(AUTOSAVE.idleMs);
      return;
    }
    cloudSave({ auto: true });
  }

  function draftStatusText() {
    if (!ui.teamSession || !ui.teamSession.revision) return "Browser draft saved";
    if (ui.localPreview) return hasUnsavedTeamWork() ? "Browser draft saved · local test save pending" : "Local test design up to date";
    if (!hasUnsavedTeamWork()) return "Shared design up to date";
    if (ui.autosavePaused) return "Choose Save shared design to share";
    return canAutosave() ? "Sharing changes automatically" : "Browser draft saved";
  }

  function updateCloudChrome() {
    const session = ui.teamSession;
    const panel = byId("teamSessionBar");
    const status = byId("teamSessionStatus");
    if (panel) panel.hidden = !session;
    if (!status) return;
    if (!session) {
      status.textContent = "Browser draft only. Open your private team access to use shared saving.";
      return;
    }
    const lesson = findMeta(state.meta?.lessons, session.lessonId);
    const saved = session.savedAt ? ` Shared version saved ${new Date(session.savedAt).toLocaleString()}.` : " No shared version has been saved yet.";
    const dirty = hasUnsavedTeamWork() ? " This browser has changes that are not in the shared design." : " This browser matches the shared design.";
    status.textContent = ui.localPreview
      ? `${lesson?.title || session.lessonId} · Local test session. ${session.savedAt ? 'Saved '+new Date(session.savedAt).toLocaleString()+'.' : 'No test save yet.'} ${session.revision && hasUnsavedTeamWork() ? 'Browser changes are waiting to save.' : ''}`
      : `${lesson?.title || session.lessonId} team session.${saved}${dirty}`;
    byId("btnLoadLatest")?.toggleAttribute("hidden", !ui.cloudConflict);
    byId("btnKeepLocal")?.toggleAttribute("hidden", !ui.cloudConflict);
    byId("btnCheckStatus")?.toggleAttribute("hidden", !pendingSubmission());
  }

  function peekDraft() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const saved = JSON.parse(raw);
      return saved && typeof saved === "object" ? saved : null;
    } catch {
      return null;
    }
  }

  function syncAccessChrome() {
    const locked = !isLeadSession();
    document.body.classList.toggle("is-view-only", locked);
    document.body.dataset.access = locked ? "view" : "edit";
    const banner = byId("accessBanner");
    if (banner) {
      if (locked && banner.hidden) {
        banner.textContent = "This snapshot opens for viewing. The team lead can unlock an editing copy.";
        banner.hidden = false;
      } else if (!locked) {
        banner.hidden = true;
      }
    }
    const notice = byId("restoreNotice");
    if (notice) {
      notice.hidden = !ui.restoreNote;
      notice.textContent = ui.restoreNote || "";
    }
    const unlock = byId("leadUnlock");
    if (unlock) unlock.hidden = true;
    if (!locked) {
      const form = byId("leadCodeForm");
      const leadBtn = byId("btnLeadUnlock");
      if (form) form.hidden = true;
      if (leadBtn) leadBtn.setAttribute("aria-expanded", "false");
      const leadErr = byId("leadCodeError");
      if (leadErr) leadErr.textContent = "";
    }
    if (byId("btnSave")) byId("btnSave").disabled = locked;
    if (byId("btnOpen")) byId("btnOpen").disabled = false;
    if (byId("btnSend")) byId("btnSend").disabled = locked;
    if (byId("btnRecoverDraft")) {
      try { byId("btnRecoverDraft").hidden = locked || !localStorage.getItem(BACKUP_KEY); }
      catch { byId("btnRecoverDraft").hidden = true; }
    }
    const clearBtn = byId("btnClear");
    if (clearBtn) {
      clearBtn.disabled = locked;
      if (locked) clearBtn.setAttribute("aria-describedby", "accessBanner");
      else clearBtn.removeAttribute("aria-describedby");
    }
    if (locked) setSaveStatus("");
    updateCloudChrome();
  }

  function lockViewControls() {
    if (isLeadSession()) return;
    const panel = byId("stepPanel");
    if (!panel) return;
    panel.querySelectorAll("input, select, textarea, button").forEach((el) => {
      if (el.id === "btnBack" || el.id === "btnNext") return;
      el.disabled = true;
      el.setAttribute("aria-disabled", "true");
    });
  }

  function renderTeam(panel) {
    panel.innerHTML = `
      <h1>Lesson &amp; spokesperson</h1>
      <p class="panel-lead">One spokesperson saves the team’s decisions and prepares the file for Britt. Choose the lesson this file belongs to.</p>
      <div class="field-grid two">
        <label class="field">Lesson
          <select id="lessonSelect"></select>
        </label>
        <label class="field">Team name
          <input id="teamName" type="text" autocomplete="organization" placeholder="e.g. Money Management Team">
        </label>
        <label class="field">Spokesperson name
          <input id="spokespersonName" type="text" autocomplete="name" required placeholder="Your name">
        </label>
        <label class="field">Spokesperson email
          <input id="spokespersonEmail" type="email" autocomplete="email" placeholder="you@example.org">
        </label>
      </div>
    `;
    const select = byId("lessonSelect");
    state.meta.lessons.forEach((lesson) => {
      const opt = document.createElement("option");
      opt.value = lesson.id;
      opt.textContent = lesson.note ? `${lesson.title} (${lesson.note})` : lesson.title;
      if (lesson.id === state.lessonId) opt.selected = true;
      select.appendChild(opt);
    });
    if (ui.teamSession && !ui.localPreview) {
      state.lessonId = ui.teamSession.lessonId;
      select.value = ui.teamSession.lessonId;
      select.disabled = true;
      select.title = "This private team session is locked to its assigned lesson.";
    }
    select.addEventListener("change", () => {
      if (ui.teamSession && !ui.localPreview) return;
      if(ui.localPreview){installTeamSession(select.value,'bespoke-local-preview-synthetic');ui.autosavePaused=true;}
      state.lessonId = select.value;
      saveDraft();
      updatePreview();
    });
    const bind = (id, key) => {
      const input = byId(id);
      if (!input) return;
      input.value = state[key] || "";
      const sync = () => {
        state[key] = input.value;
        saveDraft();
        updatePreview();
      };
      input.addEventListener("input", sync);
      input.addEventListener("change", sync);
    };
    bind("teamName", "teamName");
    bind("spokespersonName", "spokespersonName");
    bind("spokespersonEmail", "spokespersonEmail");
  }

  function fileNotice(message) {
    const notice = byId("fileStatus");
    notice.hidden = false;
    notice.textContent = message;
  }

  function prepareDraftReplacement() {
    let raw;
    try { raw = localStorage.getItem(STORAGE_KEY); }
    catch {
      if (!confirm("Browser saving is unavailable. Open this copy? Choose Save first if you need the current design.")) return false;
      storageConflict = false;
      return true;
    }
    if (raw) {
      if (!confirm("Open this copy instead of the current browser draft? Choose Save first if you need to keep your current work. One previous browser draft will be kept for recovery.")) return false;
      try { localStorage.setItem(BACKUP_KEY, raw); }
      catch { fileNotice("Could not keep a recovery copy. Choose Save before clearing the browser draft and trying again."); return false; }
    }
    lastSavedRaw = raw;
    storageConflict = false;
    return true;
  }

  function saveTeamFile() {
    try {
      const payload = buildSelectionPayload();
      validateSelectionPayload(payload, {draft:true});
      const stamp = payload.submittedAt.replace(/[:.]/g, "-");
      const filename = `${payload.lesson.id}-${stamp}-selection.json`;
      downloadText(filename, JSON.stringify(payload, null, 2), "application/json");
      const status = byId("builderFileStatus");
      if (status) status.textContent = "Downloaded a backup file without the private access code.";
      fileNotice("Backup downloaded. Keep it in the team’s shared folder; it does not contain the private access code.");
      return true;
    } catch (err) { fileNotice(`Could not download the design file. ${err.message}`); return false; }
  }

  async function openTeamFile(file) {
    if (!file) return;
    try {
      if (file.size > MAX_FILE_BYTES) throw new Error("This file is too large. Select the small Bespoke design file, not a source document.");
      const payload = JSON.parse(await file.text());
      validateSelectionPayload(payload, {draft:true});
      if (ui.teamSession && payload.lesson.id !== ui.teamSession.lessonId) {
        throw new Error("This backup belongs to a different lesson than the open team session.");
      }
      if (!prepareDraftReplacement()) return;
      applySelectionPayload(payload);
      ui.autosavePaused = Boolean(ui.teamSession);
      if (!ui.teamSession) {
        ui.mode = "edit";
        state.editCode = "";
      }
      state.step = stepIndex("review");
      ui.restoredFromLink = false;
      ui.editCodeHash = "";
      if (!state.legacySelection) ui.restoreNote = "";
      history.replaceState(null, "", location.pathname + location.search);
      render();
      fileNotice(`Opened ${file.name}. Check the lesson and choices. This is your browser draft; choose Save shared design when team access is open.`);
    } catch (err) { fileNotice(`Could not open that team file. ${err.message} Your current draft has not changed.`); }
  }

  function bytesToBase64Url(bytes) {
    let bin = "";
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }

  function base64UrlToBytes(str) {
    const pad = "=".repeat((4 - (str.length % 4)) % 4);
    const b64 = str.replace(/-/g, "+").replace(/_/g, "/") + pad;
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }

  async function encodeCompressedHash(json) {
    if (typeof CompressionStream === "undefined") return null;
    const bytes = new TextEncoder().encode(json);
    const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream("deflate-raw"));
    const buf = new Uint8Array(await new Response(stream).arrayBuffer());
    return bytesToBase64Url(buf);
  }

  async function decodeCompressedHash(b64url) {
    if (typeof DecompressionStream === "undefined") {
      throw new Error("This browser cannot open a compressed link");
    }
    const bytes = base64UrlToBytes(b64url);
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
    const text = await new Response(stream).text();
    return JSON.parse(text);
  }

  function decodeLegacyBase64(b64) {
    return JSON.parse(decodeURIComponent(escape(atob(b64))));
  }

  function hashBody() {
    const raw = location.hash.startsWith("#") ? location.hash.slice(1) : location.hash;
    if (!raw) return "";
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }

  async function decodeViewPayload(value) {
    try {
      return await decodeCompressedHash(value);
    } catch {
      return decodeLegacyBase64(value);
    }
  }

  async function readShareLink() {
    const body = hashBody();
    if (!body) return { kind: "none" };
    const eq = body.indexOf("=");
    if (eq < 1) return { kind: "none" };
    const kind = body.slice(0, eq);
    const value = body.slice(eq + 1);
    if (!value) return { kind: "none" };
    if (kind === "v" || kind === "s" || kind === "c") {
      const payload = kind === "s" ? decodeLegacyBase64(value) : await decodeViewPayload(value);
      return { kind: "view", payload };
    }
    if (kind === "e") return { kind: "retired" };
    return { kind: "none" };
  }

  async function buildViewUrl() {
    const payload = buildSelectionPayload();
    const json = JSON.stringify(payload);
    const compressed = await encodeCompressedHash(json);
    if (!compressed) {
      return {
        url: "",
        message: "This browser cannot make a view link. Choose Save and open the design at the next meeting."
      };
    }
    const url = new URL(location.href);
    url.hash = `v=${compressed}`;
    const href = url.toString();
    if (href.length > SHARE_URL_MAX) {
      return {
        url: "",
        message: "This design is too long for a view link. Choose Save and keep the sample text shorter."
      };
    }
    return { url: href, message: "Snapshot link copied. Copy a new link after changes. Choose Save for the next meeting." };
  }

  async function openShareLink() {
    if (startupTeamLink) {
      loadDraft();
      const teamValue = startupTeamLink;
      startupTeamLink = "";
      const team = parseTeamLink(teamValue);
      if (!team) {
        ui.mode = "edit";
        ui.restoreNote = "This private team link is incomplete or out of date. Your browser draft was left unchanged.";
        return { team: false };
      }
      const previousLesson = state.lessonId;
      restoreTeamSession();
      installTeamSession(team.lessonId, team.editCode);
      ui.mode = "edit";
      if (lastSavedRaw && previousLesson !== team.lessonId) {
        keepRecoveryCopy();
        resetDesignForLesson(team.lessonId);
        lastSavedRaw = null;
      } else {
        state.lessonId = team.lessonId;
      }
      return { team: true };
    }
    let link;
    try {
      link = await readShareLink();
    } catch (err) {
      console.warn("Bespoke share link could not be opened", err);
      ui.mode = "view";
      ui.restoreNote = "This link could not be opened. The design saved on this computer was left as it was.";
      return { team: false, snapshot: true };
    }
    if (link.kind === "view") {
      ui.mode = "view";
      ui.editCodeHash = typeof link.payload?.editCodeHash === "string" ? link.payload.editCodeHash : "";
      try {
        applySelectionPayload(link.payload);
      } catch (err) {
        console.warn("Bespoke share link could not be opened", err);
        ui.restoreNote = "This link could not be opened. The design saved on this computer was left as it was.";
        return { team: false, snapshot: true };
      }
      state.editCode = "";
      state.step = stepIndex("review");
      ui.restoredFromLink = true;
      return { team: false, snapshot: true };
    }
    if (link.kind === "retired") {
      ui.mode = "view";
      ui.restoreNote = "This link is out of date. Ask the team lead for the view link.";
      return { team: false, snapshot: true };
    }
    loadDraft();
    ui.mode = "edit";
    const session = restoreTeamSession();
    if (session) state.lessonId = session.lessonId;
    return { team: Boolean(session) };
  }

  function downloadText(filename, text, type) {
    const blob = new Blob([text], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function handoffBase(value) {
    if (typeof value !== "string") return "";
    const trimmed = value.trim().replace(/\/$/, "");
    if (!trimmed) return "";
    try {
      const url = new URL(trimmed);
      const local = url.hostname === "localhost" || url.hostname === "127.0.0.1";
      if (url.protocol === "https:" || (url.protocol === "http:" && local)) return trimmed;
    } catch {
      /* ignore */
    }
    return "";
  }

  async function loadHandoffConfig() {
    ui.localPreview = ["localhost", "127.0.0.1"].includes(location.hostname);
    try {
      const res = await fetch(HANDOFF_CONFIG_URL, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      handoffApiBase = handoffBase(data && data.apiBase);
      const localHost = ['localhost', '127.0.0.1'].includes(location.hostname);
      if (localHost) {
        const target = handoffApiBase ? new URL(handoffApiBase) : null;
        if (!target || !['localhost', '127.0.0.1'].includes(target.hostname) || !data.localPreview) handoffApiBase = '';
        ui.localPreview = true;
      }
    } catch {
      handoffApiBase = "";
    }
  }

  async function handoffRequest(action, fields = {}) {
    if (!handoffApiBase) {
      return { ok: false, error: "setup", message: "Shared saving is not connected. Your browser draft and backup file still work." };
    }
    const body = { action };
    for (const key of ["lessonId", "editCode", "selection", "expectedRevision", "mutationId", "revision", "submissionId", "runId"]) {
      if (Object.hasOwn(fields, key)) body[key] = fields[key];
    }
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), HANDOFF_TIMEOUT_MS);
    try {
      const res = await fetch(handoffApiBase, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal
      });
      const data = await res.json().catch(() => null);
      if (!data || typeof data !== "object") {
        return { ok: false, error: "store", message: "The shared store returned an unreadable response. Your browser draft is safe.", httpStatus: res.status };
      }
      return { ...data, httpStatus: res.status };
    } catch (error) {
      if (controller.signal.aborted || error?.name === "AbortError") {
        return { ok: false, error: "timeout", message: "The shared store took too long to respond. Your browser draft is safe. Try again." };
      }
      return { ok: false, error: "network", message: "Could not reach the shared store. Your browser draft is safe. Try again when you are online." };
    } finally {
      window.clearTimeout(timeout);
    }
  }

  function requireTeamSession() {
    if (ui.teamSession) return ui.teamSession;
    fileNotice("Open your private team access before using shared Save or Send. Download backup still works.");
    openOpenDialog();
    return null;
  }

  function currentSelection() {
    const payload = buildSelectionPayload();
    validateSelectionPayload(payload);
    return payload;
  }

  function keepRecoveryCopy() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) localStorage.setItem(BACKUP_KEY, raw);
      return true;
    } catch {
      fileNotice("Could not keep a browser recovery copy. Download backup before loading another design.");
      return false;
    }
  }

  async function fetchSharedDesign({ replace = false, announce = true } = {}) {
    const session = requireTeamSession();
    if (!session || handoffBusy) return false;
    handoffBusy = true;
    ui.cloudBusy = true;
    if (announce) fileNotice("Checking the latest shared design…");
    try {
      const result = await handoffRequest("open", { lessonId: session.lessonId, editCode: session.editCode });
      if (!result.ok) {
        fileNotice(result.message || "Could not open the shared design. Your browser draft is unchanged.");
        return false;
      }
      if (result.selection) {
        try { validateSelectionPayload(result.selection,{draft:true}); }
        catch (error) {
          fileNotice("The shared design could not be opened. " + error.message + " Your browser draft is unchanged.");
          return false;
        }
      }
      const dirty = hasUnsavedTeamWork();
      const remoteChanged = result.revision !== session.revision;
      if (dirty && !replace) {
        if (remoteChanged) {
          ui.cloudConflict = { revision: result.revision, savedAt: result.savedAt };
          fileNotice("A newer shared version exists. This browser draft was kept. Download a backup, then load the latest shared design before recovering any local choices.");
        } else {
          fileNotice("This browser has unsaved changes, so the shared design was not loaded. Save them or download a backup first.");
        }
        updateCloudChrome();
        return false;
      }
      if (replace && !keepRecoveryCopy()) return false;
      if (result.selection && selectionKey(result.selection) !== currentSelectionKey()) applySelectionPayload(result.selection);
      else if (!result.selection) resetDesignForLesson(session.lessonId);
      state.lessonId = session.lessonId;
      session.revision = result.revision ?? null;
      session.savedAt = result.savedAt ?? null;
      session.pendingSave = null;
      session.baseSelectionKey = result.selection?.schema === "bespoke-selection/v1" ? selectionKey(result.selection) : currentSelectionKey();
      ui.cloudConflict = null;
      ui.autosavePaused = ui.autosavePaused || Boolean(state.legacySelection);
      persistTeamSession();
      storageConflict = false;
      try {
        lastSavedRaw = localStorage.getItem(STORAGE_KEY);
      } catch {
        lastSavedRaw = null;
        storageConflict = true;
        setSaveStatus("Browser storage unavailable");
      }
      render();
      if(result.selection)fileNotice("Opened the latest shared design.");
      else byId("fileStatus").hidden=true;
      return true;
    } finally {
      handoffBusy = false;
      ui.cloudBusy = false;
      updateCloudChrome();
    }
  }

  async function cloudSave({ auto = false } = {}) {
    if (!isLeadSession() || handoffBusy) return;
    const session = auto ? ui.teamSession : requireTeamSession();
    if (!session) return;
    if (ui.cloudConflict) {
      if (auto) return;
      fileNotice("A newer shared version exists. Download a backup and load the latest shared design before saving.");
      updateCloudChrome();
      return;
    }
    let payload;
    try { payload = currentSelection(); }
    catch (err) {
      if (!auto) fileNotice("Could not save. " + err.message);
      return;
    }
    if (payload.lesson.id !== session.lessonId) {
      if (!auto) fileNotice("This team access is locked to a different lesson. Your draft was not saved.");
      return;
    }
    const requestKey = selectionKey(payload);
    let pending = session.pendingSave;
    if (!pending || pending.selectionKey !== requestKey || pending.expectedRevision !== session.revision) {
      pending = {
        mutationId: newMutationId(),
        expectedRevision: session.revision ?? null,
        selectionKey: requestKey
      };
      session.pendingSave = pending;
      persistTeamSession();
    }
    clearTimeout(autosaveTimer);
    autosaveTimer = null;
    handoffBusy = true;
    if (auto) setSaveStatus("Saving to the shared design…");
    else fileNotice("Saving the shared design…");
    try {
      const result = await handoffRequest("save", {
        lessonId: session.lessonId,
        editCode: session.editCode,
        selection: payload,
        expectedRevision: pending.expectedRevision,
        mutationId: pending.mutationId
      });
      if (!result.ok) {
        if (result.httpStatus === 409 || result.error === "conflict") {
          ui.cloudConflict = { revision: result.revision, savedAt: result.savedAt };
          session.pendingSave = null;
          persistTeamSession();
          fileNotice("Someone saved a newer shared version. Your browser draft is safe. Download a backup, then load the latest shared design.");
          updateCloudChrome();
          return;
        }
        if (auto) setSaveStatus("Automatic save will retry");
        else fileNotice(result.message || "Shared Save did not finish. Your browser draft is safe; try Save again.");
        return;
      }
      session.revision = result.revision;
      session.savedAt = result.savedAt;
      session.baseSelectionKey = requestKey;
      session.pendingSave = null;
      ui.cloudConflict = null;
      ui.autosavePaused = false;
      persistTeamSession();
      const changedDuringSave = currentSelectionKey() !== requestKey;
      setSaveStatus(changedDuringSave
        ? "Newer browser changes not shared yet"
        : (auto ? "Saved to the shared design automatically" : "Shared design up to date"));
      if (!auto) {
        fileNotice(changedDuringSave
          ? "The version that started saving is shared. You made newer changes while it saved; choose Save shared design again."
          : (result.unchanged ? "The shared design was already up to date." : "Shared design saved."));
      }
    } finally {
      handoffBusy = false;
      updateCloudChrome();
      scheduleAutosave(AUTOSAVE.idleMs);
    }
  }

  function pendingSubmission() {
    try { return JSON.parse(localStorage.getItem(PENDING_SUBMISSION_STORAGE) || "null"); }
    catch { return null; }
  }

  function storePendingSubmission(value) {
    try {
      if (value) localStorage.setItem(PENDING_SUBMISSION_STORAGE, JSON.stringify(value));
      else localStorage.removeItem(PENDING_SUBMISSION_STORAGE);
    } catch { /* status stays visible for this page */ }
    updateCloudChrome();
  }

  function scheduleSubmissionPoll(receipt, delay = 10000) {
    clearTimeout(submissionPollTimer);
    submissionPollTimer = window.setTimeout(() => pollSubmission(receipt), delay);
  }

  async function pollSubmission(receipt) {
    const result = await handoffRequest("status", {
      lessonId: receipt.lessonId,
      editCode: receipt.editCode,
      submissionId: receipt.submissionId,
      runId: receipt.runId
    });
    if (!result.ok) {
      fileNotice(result.message || "Britt’s receipt could not be checked. We will check again when this page opens.");
      return;
    }
    if (result.status === "processing") {
      storePendingSubmission({ ...receipt, runId: result.runId || receipt.runId, stage: "receipt" });
      fileNotice("Britt’s review request is processing. You can close this page; this browser will check again when you return.");
      scheduleSubmissionPoll({ ...receipt, runId: result.runId || receipt.runId }, 10000);
      return;
    }
    if (result.status === "received") {
      storePendingSubmission(null);
      fileNotice(result.url ? "Britt received the review request. " + result.url : "Britt received the review request.");
      return;
    }
    storePendingSubmission({ ...receipt, stage: "failed" });
    fileNotice(result.message || "The review request failed. Your saved design is unchanged; try Send to Britt again.");
  }

  async function cloudSend() {
    if (!isLeadSession() || handoffBusy) return;
    if (ui.localPreview) { fileNotice("This local preview does not send review requests. Your test design and backups remain available."); return; }
    const session = requireTeamSession();
    if (!session) return;
    if (!state.spokespersonName.trim()) {
      fileNotice("Add the spokesperson's name on Lesson & team before sending.");
      return;
    }
    if (ui.cloudConflict || !session.revision || hasUnsavedTeamWork()) {
      fileNotice("Save the current shared design before sending it to Britt.");
      return;
    }
    const existing = pendingSubmission();
    let payload;
    if (existing?.stage === "request" && existing.expectedRevision === session.revision && existing.selection) {
      payload = existing.selection;
    } else {
      try { payload = currentSelection(); }
      catch (err) { fileNotice("Could not send. " + err.message); return; }
    }
    const mutationId = existing?.stage === "request" && existing.expectedRevision === session.revision
      ? existing.mutationId : newMutationId();
    const pending = {
      stage: "request",
      lessonId: session.lessonId,
      editCode: session.editCode,
      expectedRevision: session.revision,
      mutationId,
      selection: payload
    };
    storePendingSubmission(pending);
    handoffBusy = true;
    fileNotice("Requesting Britt’s review…");
    try {
      const result = await handoffRequest("send", pending);
      if (!result.ok) {
        fileNotice(result.message || "The review request did not finish. Your saved design is safe; choose Send to Britt to retry.");
        return;
      }
      const receipt = {
        stage: "receipt",
        lessonId: session.lessonId,
        editCode: session.editCode,
        expectedRevision: session.revision,
        submissionId: result.submissionId,
        runId: result.runId || null
      };
      storePendingSubmission(receipt);
      if (result.status === "received") {
        storePendingSubmission(null);
        fileNotice(result.url ? "Britt received the review request. " + result.url : "Britt received the review request.");
      } else {
        fileNotice("Britt’s review request is processing. This is not a receipt yet.");
        scheduleSubmissionPoll(receipt, 5000);
      }
    } finally {
      handoffBusy = false;
    }
  }

  async function resumePendingSubmission() {
    const pending = pendingSubmission();
    if (!pending || !ui.teamSession || pending.lessonId !== ui.teamSession.lessonId) return;
    if (pending.stage === "receipt" && pending.submissionId) {
      fileNotice("Checking Britt’s pending review receipt…");
      await pollSubmission(pending);
    } else if (pending.stage === "request") {
      fileNotice("A previous review request may not have returned a receipt. Choose Send to Britt to retry the exact saved revision.");
    } else if (pending.stage === "failed") {
      fileNotice("The previous review request failed. Your shared design is safe; choose Send to Britt to try again.");
    }
  }

  function fillOpenLessons() {
    const select = byId("openLesson");
    if (!select || !state.meta) return;
    select.replaceChildren();
    for (const lesson of state.meta.lessons) {
      const option = document.createElement("option");
      option.value = lesson.id;
      option.textContent = lesson.title;
      if ((ui.teamSession?.lessonId || state.lessonId) === lesson.id) option.selected = true;
      select.appendChild(option);
    }
  }

  function openOpenDialog() {
    fillOpenLessons();
    const err = byId("openError");
    if (err) err.textContent = "";
    const input = byId("openEditCode");
    if (input) input.value = "";
    const dialog = byId("openDialog");
    if (typeof dialog.showModal === "function" && !dialog.open) dialog.showModal();
    input?.focus();
  }

  async function cloudOpen() {
    if (handoffBusy) return;
    const lessonId = byId("openLesson")?.value || "";
    const editCode = (byId("openEditCode")?.value || "").trim();
    const err = byId("openError");
    if (editCode.length < EDIT_CODE_MIN) {
      if (err) err.textContent = "Enter the administrator-provided private access code. It needs at least " + EDIT_CODE_MIN + " characters.";
      return;
    }
    handoffBusy = true;
    ui.cloudBusy = true;
    if (err) err.textContent = "Checking private team access…";
    try {
      const result = await handoffRequest("open", { lessonId, editCode });
      if (!result.ok) {
        if (err) err.textContent = result.message || "That private team access could not be opened. Check the lesson and code, then try again.";
        byId("openEditCode")?.focus();
        return;
      }
      if (result.selection) {
        try { validateSelectionPayload(result.selection,{draft:true}); }
        catch (error) {
          if (err) err.textContent = "The shared design could not be opened. " + error.message;
          return;
        }
      }
      if (!keepRecoveryCopy()) {
        if (err) err.textContent = "Could not keep a browser recovery copy. Download backup before opening another team.";
        return;
      }

      installTeamSession(lessonId, editCode);
      ui.mode = "edit";
      if (result.selection) applySelectionPayload(result.selection);
      else resetDesignForLesson(lessonId);
      state.lessonId = lessonId;
      ui.teamSession.revision = result.revision ?? null;
      ui.teamSession.savedAt = result.savedAt ?? null;
      ui.teamSession.pendingSave = null;
      ui.teamSession.baseSelectionKey = result.selection?.schema === "bespoke-selection/v1" ? selectionKey(result.selection) : currentSelectionKey();
      ui.autosavePaused = Boolean(state.legacySelection);
      ui.cloudConflict = null;
      persistTeamSession();
      storageConflict = false;
      try {
        lastSavedRaw = localStorage.getItem(STORAGE_KEY);
      } catch {
        lastSavedRaw = null;
        storageConflict = true;
        setSaveStatus("Browser storage unavailable");
      }
      if (err) err.textContent = "";
      byId("openDialog").close();
      render();
      if(result.selection)fileNotice("Opened the latest shared design.");
      else byId("fileStatus").hidden=true;
    } finally {
      handoffBusy = false;
      ui.cloudBusy = false;
      updateCloudChrome();
    }
  }

  async function loadHistory() {
    const session = requireTeamSession();
    if (!session || handoffBusy) return;
    const panel = byId("historyPanel");
    const trigger = byId("btnHistory");
    if (!panel.hidden) {
      panel.hidden = true;
      trigger?.setAttribute("aria-expanded", "false");
      if (trigger) trigger.textContent = "Previous versions";
      trigger?.focus();
      return;
    }
    panel.hidden = false;
    trigger?.setAttribute("aria-expanded", "true");
    if (trigger) trigger.textContent = "Hide previous versions";
    panel.textContent = "Loading previous versions…";
    const [result, latest] = await Promise.all([
      handoffRequest("history", { lessonId: session.lessonId, editCode: session.editCode }),
      handoffRequest("open", { lessonId: session.lessonId, editCode: session.editCode })
    ]);
    if (!result.ok) {
      panel.textContent = result.message || "Previous versions could not be loaded.";
      return;
    }
    const list = document.createElement("ul");
    list.className = "history-list";
    for (const item of result.history || []) {
      const li = document.createElement("li");
      const text = document.createElement("span");
      text.textContent = item.savedAt ? new Date(item.savedAt).toLocaleString() : item.revision;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "btn btn-secondary";
      button.textContent = "Use these choices";
      button.addEventListener("click", async () => {
        if (!latest.ok) {
          fileNotice("The latest shared version could not be checked. Previous choices were not loaded.");
          return;
        }
        const latestRevision = latest.revision ?? null;
        const latestKey = latest.selection ? selectionKey(latest.selection) : session.baseSelectionKey;
        const opened = await handoffRequest("openRevision", {
          lessonId: session.lessonId,
          editCode: session.editCode,
          revision: item.revision
        });
        if (!opened.ok || !opened.selection) {
          fileNotice(opened.message || "That previous version could not be opened.");
          return;
        }
        if (!keepRecoveryCopy()) return;
        applySelectionPayload(opened.selection);
        state.lessonId = session.lessonId;
        session.revision = latestRevision;
        session.baseSelectionKey = latestKey;
        session.pendingSave = null;
        ui.cloudConflict = null;
        ui.autosavePaused = true;
        persistTeamSession();
        state.step = stepIndex("review");
        panel.hidden = true;
        trigger?.setAttribute("aria-expanded", "false");
        if (trigger) trigger.textContent = "Previous versions";
        render();
        fileNotice("Previous choices loaded into this browser draft. Review them, then Save shared design to create a new revision. Later history is preserved.");
        window.requestAnimationFrame(() => byId("stepPanel")?.focus({ preventScroll: true }));
      });
      li.append(text, button);
      list.appendChild(li);
    }
    panel.replaceChildren(list);
  }

  function bindTablistKeys(tablist) {
    const tabs = Array.from(tablist.querySelectorAll('[role="tab"]'));
    tabs.forEach((tab, i) => {
      tab.addEventListener("keydown", (e) => {
        let target = null;
        if (e.key === "Enter" || e.key === " ") target = tab;
        else if (e.key === "ArrowRight") target = tabs[(i + 1) % tabs.length];
        else if (e.key === "ArrowLeft") target = tabs[(i - 1 + tabs.length) % tabs.length];
        else if (e.key === "Home") target = tabs[0];
        else if (e.key === "End") target = tabs[tabs.length - 1];
        if (!target) return;
        e.preventDefault();
        target.focus();
        target.click();
      });
    });
  }
  function validateV1(payload) {
    const object = (value) => value && typeof value === "object" && !Array.isArray(value);
    if (!object(payload) || payload.schema !== "bespoke-selection/v1") throw new Error("Choose a Bespoke design file.");
    if (!object(payload.lesson) || !findMeta(state.meta.lessons, payload.lesson.id)) throw new Error("This file does not name one of the six new lessons.");
    if (!object(payload.theme) || !object(payload.theme.cards) || !object(payload.team) || !object(payload.team.spokesperson)) throw new Error("The design or team details are incomplete.");
    const theme = payload.theme;
    for (const [field, family] of Object.entries({colorLead: "colorLeads", sidebarColor: "sidebarColors", backgroundTexture: "backgroundTextures", titleSlide: "titleSlides", dividerStyle: "dividers"})) {
      const option = findOption(family, theme[field]);
      if (!option || option.blocked) throw new Error(`The ${field} choice is not available. Ask Britt to check this file.`);
    }
    if (!findMeta(state.meta.fontPairings, theme.fontPairing) || !findMeta(state.meta.presets, payload.presetId)) throw new Error("The font or starter theme is not available.");
    const legalCard = (slug) => { const option = findOption("cards", slug); return option && !option.blocked; };
    if (!legalCard(theme.cards.lessonWide) || typeof theme.cards.varyByChapter !== "boolean") throw new Error("The card style is not available.");
    if (theme.cards.varyByChapter) {
      if (!object(theme.cards.chapterStyles)) throw new Error("Chapter card choices are missing.");
      let previous;
      for (const chapter of state.meta.chapterKeys) {
        const slug = theme.cards.chapterStyles[chapter];
        if (!legalCard(slug) || slug === previous) throw new Error("Each chapter needs an available card style different from the chapter before it.");
        previous = slug;
      }
    }
    for (const value of [payload.lesson.title, payload.lesson.displayTitle, payload.lesson.subtitle, payload.team.name, payload.team.spokesperson.name, payload.team.spokesperson.email, payload.unspoken, payload.sampleContent?.bullets, payload.sampleContent?.mythReality]) {
      if (value !== undefined && typeof value !== "string") throw new Error("This file has invalid text fields. Your current draft has not changed.");
    }
    if (payload.sampleContent !== undefined && !object(payload.sampleContent)) throw new Error("The sample text is invalid.");
    if (payload.brief !== undefined) {
      const brief = payload.brief;
      const answers = state.meta.briefAnswers || {};
      const valid = object(brief) &&
        ["feel", "room", "fresh", "light"].every((key) => (answers[key] || []).includes(brief[key])) &&
        typeof brief.variant === "string" && /^[0-9]{1,4}$/.test(brief.variant);
      if (!valid) throw new Error("The design brief in this file is not valid. Your current draft has not changed.");
    }
    if (JSON.stringify(payload).length > MAX_FILE_BYTES) throw new Error("This file is too large. Keep source documents and media in the shared folder.");
  }
function schemaErrors(value,rule,path='$') {
 const errors=[], object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
 const types=Array.isArray(rule.type)?rule.type:[rule.type];
 if(!types.some(t=>!t||(t==='object'?object(value):t==='array'?Array.isArray(value):t==='null'?value===null:typeof value===t)))return [path+': invalid field type'];
 if('const' in rule&&value!==rule.const)errors.push(path+': unsupported version');
 if(rule.enum&&!rule.enum.includes(value))errors.push(path+': unavailable choice');
 if(value===null)return errors;
 if(typeof value==='string'){
  if(rule.maxLength&&[...value].length>rule.maxLength)errors.push(path+': text is too long');
  if(rule.minLength&&[...value].length<rule.minLength&&!path.endsWith('.team.spokesperson.name'))errors.push(path+': text is missing');
  if(rule.pattern&&!new RegExp(rule.pattern).test(value))errors.push(path+': invalid format');
 }
 if(Array.isArray(value)){
  if(rule.minItems!==undefined&&value.length<rule.minItems||rule.maxItems!==undefined&&value.length>rule.maxItems)errors.push(path+': invalid item count');
  if(rule.items)value.forEach((v,i)=>errors.push(...schemaErrors(v,rule.items,path+'['+i+']')));
 }
 if(object(value)){
  for(const k of rule.required||[])if(!Object.hasOwn(value,k))errors.push(path+'.'+k+': missing');
  for(const [k,v] of Object.entries(value)){
   if(rule.properties?.[k])errors.push(...schemaErrors(v,rule.properties[k],path+'.'+k));
   else if(rule.additionalProperties===false)errors.push(path+'.'+k+': unrecognized field');
  }
 }
 return errors;
}
function validateSelectionPayload(payload,{draft=false}={}){
 if(payload?.schema==='bespoke-selection/v1'){validateV1(payload);return;}
 const errors=schemaErrors(payload,selectionSchema);
 if(errors.length)throw new Error(errors[0]);
 if(!state.meta.lessons.some(l=>l.id===payload.lesson.id))throw new Error('Choose one of the six planned lessons.');
 if(payload.legacySelection)validateV1(payload.legacySelection);
 if(!draft){const issues=Model.validateDesign(catalog,payload.design);if(issues.length)throw new Error(issues[0]);}
 if(JSON.stringify(payload).length>MAX_FILE_BYTES)throw new Error('This design is too large. Keep source material in the team folder.');
}
function buildSelectionPayload(){
 const lesson=findMeta(state.meta.lessons,state.lessonId);
 return {schema:'bespoke-selection/v2',submittedAt:new Date().toISOString(),date:new Date().toISOString().slice(0,10),lesson:{id:state.lessonId,title:lesson.title,displayTitle:state.design.samples.title||lesson.title,subtitle:state.design.samples.subtitle},team:{name:state.teamName.trim(),spokesperson:{name:state.spokespersonName.trim(),email:state.spokespersonEmail.trim()}},design:clone(state.design),unspoken:state.unspoken,...(state.legacySelection?{legacySelection:clone(state.legacySelection)}:{})};
}
function restoreStep(saved){
 state.step=stepIndex(saved.stepId||'welcome');
 state.previewView=Object.hasOwn(VIEW_NAMES,saved.previewView)?saved.previewView:STEPS[state.step].view;
 if(catalog.roles.some(role=>role.id===saved.activeRole))ui.activeRole=saved.activeRole;
 // Initial render must keep the stored preview context, just as later edits do.
 ui.renderedStep=state.step;
}
function loadDraft(){
 try{
  const raw=localStorage.getItem(STORAGE_KEY);
  if(!raw){
   if(localStorage.getItem('bespoke-draft-v1'))ui.restoreNote='An earlier wizard draft is still available in the original wizard. Open its backup here to migrate a copy; the original is kept.';
   return;
  }
  const saved=JSON.parse(raw);
  if(!saved||typeof saved!=='object'||Array.isArray(saved)||!saved.design)throw new Error('Invalid draft');
  const before={...state};
  try{
   for(const key of ['design','legacySelection','lessonId','teamName','spokespersonName','spokespersonEmail','unspoken','changes','redo'])if(Object.hasOwn(saved,key))state[key]=saved[key];
   validateSelectionPayload(buildSelectionPayload(),{draft:true});
   if(!Array.isArray(state.changes)||!Array.isArray(state.redo))throw new Error('Invalid history');
   // Undo snapshots are data boundaries too; reject corrupted history before it can reach preview.
   for(const entry of [...state.changes,...state.redo])if(!entry||typeof entry.label!=='string'||schemaErrors({...buildSelectionPayload(),design:entry.design},selectionSchema).length)throw new Error('Invalid history');
   restoreStep(saved);ui.autosavePaused=saved.autosavePaused===true;lastSavedRaw=raw;
  }catch(e){Object.assign(state,before);throw e;}
 }catch{storageConflict=true;ui.restoreNote='This browser draft needs recovery. It has not been replaced. Download a backup from the other tab, or open a known backup here.';}
}
function saveDraft(){
 if(!isLeadSession()||!state.design)return false;
 if(storageConflict){setSaveStatus('Draft needs recovery');return false;}
 try{
  if(localStorage.getItem(STORAGE_KEY)!==lastSavedRaw){storageConflict=true;fileNotice('Another tab changed this draft. Download your backup before reopening the newest browser draft.');return false;}
  state.stepId=STEPS[state.step].id;
  const {meta,library,editCode,...saved}=state;
  lastSavedRaw=JSON.stringify({...saved,activeRole:ui.activeRole,autosavePaused:ui.autosavePaused});localStorage.setItem(STORAGE_KEY,lastSavedRaw);
  setSaveStatus(draftStatusText());queueSaveAnnouncement();scheduleAutosave(AUTOSAVE.idleMs);updateCloudChrome();return true;
 }catch{setSaveStatus('Browser storage unavailable. Download a backup.');return false;}
}
function resetDesignForLesson(lessonId){
 Object.assign(state,{step:0,lessonId,teamName:'',spokespersonName:'',spokespersonEmail:'',unspoken:'',design:Model.defaultDesign(catalog),legacySelection:null,changes:[],redo:[]});
}
function applySelectionPayload(payload){
 validateSelectionPayload(payload,{draft:true});
 const team=payload.team||{};
 Object.assign(state,{lessonId:payload.lesson.id,teamName:team.name||'',spokespersonName:team.spokesperson?.name||'',spokespersonEmail:team.spokesperson?.email||'',unspoken:payload.unspoken||'',changes:[],redo:[]});
 if(payload.schema==='bespoke-selection/v1'){
  const migrated=Model.migrateV1(payload,catalog,state.meta);
  state.design=migrated.design;state.legacySelection=clone(payload);ui.autosavePaused=true;
  ui.restoreNote='Converted a copy of the older design. '+migrated.warnings.join(' ')+' The original is included in every backup and can be downloaded on Review. Review this conversion before saving.';
 }else{state.design=clone(payload.design);state.legacySelection=payload.legacySelection?clone(payload.legacySelection):null;ui.restoreNote='';}
}
function changeDesign(label,edit,{redraw=true}={}){
 if(!isLeadSession())return;
 const before=clone(state.design), next=clone(state.design);edit(next);
 if(JSON.stringify(before)===JSON.stringify(next))return;
 next.startingPoint='custom';
 state.changes.push({label,design:before});state.changes=state.changes.slice(-40);state.redo=[];state.design=next;
 saveDraft();if(redraw)render(false);else{updatePreview();updateUndo();}
 byId('saveLive').textContent=label+'. Browser draft updated.';
}
function undoChange(redo=false){
 if(!isLeadSession())return;
 const source=redo?state.redo:state.changes,target=redo?state.changes:state.redo;
 const entry=source.pop();if(!entry)return;
 target.push({label:entry.label,design:clone(state.design)});state.design=entry.design;saveDraft();render(false);
 fileNotice((redo?'Redid: ':'Undid: ')+entry.label);
}
function updateUndo(){
 byId('btnUndo').disabled=!isLeadSession()||!state.changes.length;byId('btnRedo').disabled=!isLeadSession()||!state.redo.length;
 byId('changeList').innerHTML=state.changes.length?state.changes.slice(-8).reverse().map(c=>'<li>'+escapeHtml(c.label)+'</li>').join(''):'<li>Your next choice will appear here.</li>';
}
function choiceGroup(label,options,selected,pick,{mini}={}){
 const fieldset=document.createElement('fieldset');fieldset.className='decision';
 const legend=document.createElement('legend');legend.textContent=label;fieldset.append(legend);
 const group=document.createElement('div');group.className='choice-grid';
 for(const option of options){
  const b=document.createElement('button');b.type='button';b.className='choice';b.id='choice-'+label.toLowerCase().replace(/[^a-z0-9]+/g,'-')+'-'+String(option.id);b.dataset.choice=String(option.id);b.setAttribute('aria-pressed',String(selected===option.id));
  b.innerHTML=(mini?mini(option):'')+'<span>'+escapeHtml(option.label)+'</span>'+(selected===option.id?'<span class="selected-check" aria-hidden="true">✓</span>':'');
  b.addEventListener('click',()=>pick(option.id));group.append(b);
 }
 fieldset.append(group);return fieldset;
}
function miniArrangement(option){return '<span class="layout-mini layout-'+escapeHtml(option.id)+'" aria-hidden="true"><i></i><i></i><i></i></span>';}
function heading(panel,title,description){panel.innerHTML='<h1>'+escapeHtml(title)+'</h1><p class="panel-lead">'+escapeHtml(description)+'</p>';}
function resetPresetConfirmation(){
 skipPresetConfirmation=false;
 try{sessionStorage.removeItem(PRESET_CONFIRM_KEY);}catch{/* Private mode: in-memory preference is already cleared. */}
 if(pendingPreset)finishPresetConfirmation(false);
}
function applyPresetChoice(id){
 if(!isLeadSession())return false;
 const preset=catalog.presets.find(item=>item.id===id);if(!preset)return false;
 const samples=clone(state.design.samples);state.changes.push({label:'Applied '+preset.label,design:clone(state.design)});state.changes=state.changes.slice(-40);state.redo=[];state.design=Model.applyPreset(catalog,preset.id);state.design.samples=samples;
 render(false);fileNotice(preset.label+' applied. Every choice remains editable.');return true;
}
function requestPreset(id){
 if(!isLeadSession())return;
 if(!state.changes.length||skipPresetConfirmation){applyPresetChoice(id);return;}
 const preset=catalog.presets.find(item=>item.id===id);if(!preset)return;
 pendingPreset=id;
 byId('presetDialogTitle').textContent='Apply '+preset.label+' preset?';
 byId('presetSkipConfirmation').checked=false;
 byId('presetDialog').showModal();byId('presetCancel').focus();
}
function finishPresetConfirmation(apply){
 const id=pendingPreset;if(!id)return;
 const skip=apply&&byId('presetSkipConfirmation').checked;
 pendingPreset=null;byId('presetDialog').close();
 if(apply&&applyPresetChoice(id)&&skip){
  skipPresetConfirmation=true;
  try{sessionStorage.setItem(PRESET_CONFIRM_KEY,'1');}catch{/* Keep the opt-out only in this page when tab storage is unavailable. */}
 }
 byId('preset-'+id)?.focus({preventScroll:true});
}
function renderWelcome(panel){
 heading(panel,'Make it your own','Build a lesson’s look one choice at a time, or start with an editable preset. Your choices stay together as you move.');
 const custom=document.createElement('button');custom.className='custom-path';custom.type='button';custom.innerHTML='<strong>Guide me through</strong><span>Colors → fonts → title → divider → text boxes</span><span class="path-action">Start choosing <span aria-hidden="true">→</span></span>';
 custom.onclick=()=>{state.step=state.teamName?2:1;render();};panel.append(custom);
 const h=document.createElement('h2');h.textContent='Or choose a starting look';panel.append(h);
 const note=document.createElement('p');note.className='helper';note.textContent='Every preset fills the same controls. Change any choice afterward.';panel.append(note);
 const grid=document.createElement('div');grid.className='preset-grid';
 for(const preset of catalog.presets){
  const b=document.createElement('button');b.type='button';b.className='preset-choice';b.id='preset-'+preset.id;b.dataset.preset=preset.id;b.setAttribute('aria-pressed',String(state.design.startingPoint===preset.id));
  const d=preset.design, color=id=>catalog.palette.find(c=>c.id===id)?.hex;
  const closest=compareDesign(fingerprints,d)[0];
  const previewFont=catalog.fonts.find(f=>f.id===d.fonts.heading);
  b.innerHTML='<span class="preset-sample" style="--ps-font:'+escapeHtml(previewFont.family)+';--ps-bg:'+color(d.roles.titleBackground)+';--ps-sidebar:'+color(d.roles.sidebar)+';--ps-ink:'+color(d.roles.titleText)+';--ps-accent:'+color(d.roles.accent)+'"><i></i><span>Aa</span><b></b></span><strong>'+escapeHtml(preset.label)+'</strong><span>'+escapeHtml(preset.blurb)+'</span><small>'+escapeHtml(closest?`${closest.shared} of ${closest.total} comparable choices match ${closest.title}`:'Comparison available in preview')+'</small>';
  b.onclick=()=>requestPreset(preset.id);grid.append(b);
 }panel.append(grid);
}
function renderColors(panel){
 heading(panel,'Paint your elements','Choose an element, then a brand color. A new swatch replaces only that element’s color.');
 addColorControls(panel,catalog.roles.map(r=>r.id));
}
function addColorControls(panel,roleIds){
 if(!roleIds.includes(ui.activeRole))ui.activeRole=roleIds[0];
 const label=document.createElement('label');label.className='field';label.textContent='Element to paint';
 const select=document.createElement('select');select.id='colorRole';
 for(const id of roleIds){const role=catalog.roles.find(r=>r.id===id);const o=document.createElement('option');o.value=id;o.textContent=role.label;o.selected=id===ui.activeRole;select.append(o);}
 select.onchange=()=>{
  ui.activeRole=select.value;const role=ui.activeRole;
  const sharedDividerRole=['titleText','subtitle','titleBackgroundEnd'].includes(role)&&state.previewView==='divider';
  if(role!=='button'&&!sharedDividerRole)state.previewView=role.startsWith('title')||role==='subtitle'?'title':role.startsWith('divider')?'divider':'cards';
  render(false);
 };label.append(select);panel.append(label);
 const role=catalog.roles.find(r=>r.id===ui.activeRole);
 const hint=document.createElement('p');hint.className='helper';hint.textContent=role.note;panel.append(hint);
 if(role.id==='button')panel.insertAdjacentHTML('beforeend',buttonColorSample('buttonColorInline'));
 if(role.id==='dividerBackground'){
  const links=document.createElement('div');links.className='color-edit-links';panel.append(links);
  for(const [id,label] of [['titleText','Edit divider heading'],['subtitle','Edit divider supporting text']]){
   const edit=document.createElement('button');edit.type='button';edit.className='text-link';edit.id='edit-divider-'+id;
   edit.textContent=label+': '+catalog.palette.find(c=>c.id===state.design.roles[id]).name;
   edit.onclick=()=>{ui.activeRole=id;state.previewView='divider';render(false);byId('colorRole').focus();};links.append(edit);
  }
 }

 const palette=document.createElement('div');palette.className='paint-palette';palette.setAttribute('role','group');palette.setAttribute('aria-label',role.label+' colors');
 for(const color of catalog.palette){
  const available=Model.colorAvailability(catalog,state.design,role.id,color.id);
  const b=document.createElement('button');b.type='button';b.className='paint-chip';b.id='paint-'+role.id+'-'+color.id;b.dataset.color=color.id;b.setAttribute('aria-pressed',String(state.design.roles[role.id]===color.id));
  b.setAttribute('aria-label',color.name+(state.design.roles[role.id]===color.id?' selected':'')+(available.warnings.length?'. Contrast advisory; selectable.':''));
  b.innerHTML='<span class="paint-swatch" style="background:'+color.hex+'">'+(state.design.roles[role.id]===color.id?'<span class="paint-check">✓</span>':'')+'</span><span>'+escapeHtml(color.name)+'</span>';
  b.title='Use '+color.name+' for '+role.label.toLowerCase()+(available.warnings.length?'. Contrast advisory: '+available.warnings.join(' '):'');
  b.onclick=()=>{if(!available.ok){byId('colorHelp').textContent=available.reason;return;}changeDesign(role.label+': '+color.name,d=>{d.roles[role.id]=color.id;});};palette.append(b);
 }
 panel.append(palette);
 const help=document.createElement('div');help.id='colorHelp';help.className='helper';help.setAttribute('role','status');help.setAttribute('aria-atomic','true');
 const issues=Model.contrastIssues(catalog,state.design).filter(issue=>issue.related.includes(role.id));
 help.innerHTML=issues.length?contrastAdvisory(issues):'All 11 brand colors are selectable. Contrast guidance appears here when a choice may be harder to read.';panel.append(help);
}
function renderFonts(panel){
 heading(panel,'Choose your type','Headings and body text are independent. Keep the same two choices across the lesson for a consistent reading experience.');
 for(const [key,label] of [['heading','Title & heading font'],['body','Body font']]){
  const field=document.createElement('label');field.className='field';field.textContent=label;
  const select=document.createElement('select');select.id='font-'+key;
  for(const font of catalog.fonts){const o=document.createElement('option');o.value=font.id;o.textContent=font.label;o.selected=state.design.fonts[key]===font.id;select.append(o);}
  select.onchange=()=>changeDesign(label+': '+catalog.fonts.find(f=>f.id===select.value).label,d=>{d.fonts[key]=select.value;});field.append(select);panel.append(field);
 }
 const note=document.createElement('p');note.className='font-sample';const bodyFont=catalog.fonts.find(f=>f.id===state.design.fonts.body);note.style.fontFamily='"'+bodyFont.family+'", '+bodyFont.fallback;note.textContent='A clear next step makes a big idea feel possible.';panel.append(note);
 const patternSurface=state.previewView==='title'?'titleBackground':state.previewView==='divider'?'dividerBackground':'contentBackground';
 const mini=option=>'<span class="pattern-mini" aria-hidden="true" style="background-color:'+catalog.palette.find(c=>c.id===state.design.roles[patternSurface]).hex+';'+Model.patternBackground(catalog,{...state.design,background:option.id},patternSurface)+'"></span>';
 panel.append(choiceGroup('Background pattern',catalog.backgrounds,state.design.background,id=>changeDesign('Background: '+id,d=>{d.background=id;}),{mini}));
 const patternNote=document.createElement('p');patternNote.className='helper';patternNote.textContent='Applies to every slide background. Your chosen colors stay the same; content text boxes keep a clear reading surface.';panel.append(patternNote);
 const jump=document.createElement('button');jump.type='button';jump.className='text-link';jump.textContent='Change heading or body color';jump.onclick=()=>{ui.activeRole='body';state.step=2;render();};panel.append(jump);
}
function renderSlideChoices(panel,kind){
 const group=catalog.slideGroups.find(g=>g.id===kind);
 const intro={title:'Set the opening arrangement, place the logo, then choose the title colors.',divider:'Give each chapter a clear beginning. This design carries through all chapter dividers.',cards:'Build a reusable content layout. Text stays in your draft when you show fewer boxes.',video:'Frame a video consistently with the rest of your design. This is a sample, not a selected video.',activity:'Give practice a recognizable place in the lesson. Your fonts and colors carry through.'};
 heading(panel,group.label,intro[kind]);
 group.decisions.forEach((decision,index)=>{
  const label=(index+1)+'. '+decision.label;
  panel.append(choiceGroup(label,decision.options,state.design.slides[kind][decision.id],value=>changeDesign(group.label+': '+decision.label,d=>{d.slides[kind][decision.id]=value;}),{mini:decision.id==='layout'?miniArrangement:undefined}));
 });
 if(kind==='title'){
  const details=document.createElement('details');details.className='inline-details';details.innerHTML='<summary>Title colors & sample words</summary>';
  const colors=document.createElement('div');details.append(colors);addColorControls(colors,['titleBackground','titleBackgroundEnd','titleText','subtitle']);
  for(const [key,label] of [['title','Sample title'],['subtitle','Sample subtitle']])addSampleField(details,key,label,state.design.samples[key]);panel.append(details);
 }else if(kind==='divider'){
  const colors=document.createElement('section');colors.innerHTML='<h2>Divider colors</h2><p class="helper">Heading and supporting-text colors are shared with the title slide. Content headings and body text stay independent.</p>';addColorControls(colors,['dividerBackground','titleText','subtitle','titleBackgroundEnd']);panel.append(colors);
 }else if(kind==='cards'){
  const details=document.createElement('details');details.className='inline-details';details.innerHTML='<summary>Try your own sample text</summary><p class="helper">These examples test the design. They are not your approved lesson content. Hidden boxes remain recoverable here.</p>';
  state.design.samples.boxes.forEach((text,i)=>addSampleField(details,'box-'+i,'Box '+(i+1)+(i>=Number(state.design.slides.cards.count)?' (kept in draft)':''),text));panel.append(details);
 }
}
function addSampleField(host,key,label,value){
 const field=document.createElement('label');field.className='field';field.textContent=label;
 const input=document.createElement(key.startsWith('box-')?'textarea':'input');input.id='sample-'+key;input.value=value;input.maxLength=key==='title'?catalog.sampleLimits.title:key==='subtitle'?catalog.sampleLimits.subtitle:catalog.sampleLimits.box;if(input.tagName==='TEXTAREA')input.rows=3;
 let checkpoint=false;
 input.addEventListener('focus',()=>{checkpoint=false;});
 input.addEventListener('input',()=>{
  if(!isLeadSession())return;
  if(!checkpoint){state.changes.push({label:label+' edited',design:clone(state.design)});state.changes=state.changes.slice(-40);checkpoint=true;}
  state.redo=[];state.design.startingPoint='custom';
  if(key.startsWith('box-'))state.design.samples.boxes[Number(key.slice(4))]=input.value;else state.design.samples[key]=input.value;
  saveDraft();updatePreview();updateUndo();
 });field.append(input);host.append(field);
}
function contrastAdvisory(issues){
 return '<strong>Contrast advisory</strong><p>Contrast is the difference between text and its background. Low contrast can make text harder to read.</p><ul>'+issues.map(issue=>'<li>'+escapeHtml(issue.message)+'</li>').join('')+'</ul><p>Consider a different text or background color. The team leader can keep this choice and save the design.</p>';
}
function renderReview(panel){
 heading(panel,'Your design, together','Review each slide type in the preview. Save the agreed design before requesting a review. Building a lesson is a separate step.');
 const errors=Model.validateDesign(catalog,state.design);
 const issues=Model.contrastIssues(catalog,state.design);
 const summary=document.createElement('div');summary.className='review-summary';summary.innerHTML='<strong>'+escapeHtml(state.meta.lessons.find(l=>l.id===state.lessonId).title)+'</strong><p>'+escapeHtml(catalog.fonts.find(f=>f.id===state.design.fonts.heading).label)+' headings · '+escapeHtml(catalog.fonts.find(f=>f.id===state.design.fonts.body).label)+' body</p><p>'+state.design.slides.cards.count+' text boxes · '+(state.design.slides.cards.titleBar?'shared title bar':'no title bar')+' · '+escapeHtml(state.design.slides.cards.treatment)+'</p>';panel.append(summary);
 const valid=document.createElement('div');valid.className=errors.length||issues.length?'readability-warning':'review-ready';valid.innerHTML=errors.length?escapeHtml(errors.join(' ')):issues.length?contrastAdvisory(issues):'Contrast guidance is met for the modeled text/background pairs. This is not a whole-design accessibility assessment.';panel.append(valid);
 const label=document.createElement('label');label.className='field';label.innerHTML='Notes for the design review';const notes=document.createElement('textarea');notes.id='reviewNotes';notes.rows=3;notes.value=state.unspoken;notes.oninput=()=>{state.unspoken=notes.value;saveDraft();};label.append(notes);panel.append(label);
 const disclosure=document.createElement('p');disclosure.className='helper';disclosure.textContent=ui.localPreview?'This review preview saves only to the local test service. Nothing is sent to Britt or published.':'A review proposal is stored in a public repository. Use work contact details and non-sensitive sample text. A saved design does not authorize a lesson build.';panel.append(disclosure);
 const save=document.createElement('button');save.className='btn btn-primary';save.textContent=ui.localPreview?'Save test design':'Save shared design';save.onclick=()=>cloudSave();panel.append(save);
 const backup=document.createElement('button');backup.className='btn btn-secondary';backup.textContent='Download design backup';backup.onclick=saveTeamFile;panel.append(backup);
 if(state.legacySelection){const p=document.createElement('p');p.className='helper';p.textContent='This design began as an older selection. Its complete original is retained for recovery; the new layout is a conversion to review.';panel.append(p);const b=document.createElement('button');b.className='btn btn-secondary';b.textContent='Download original v1 design';b.onclick=()=>downloadText('original-v1-selection.json',JSON.stringify(state.legacySelection,null,2),'application/json');panel.append(b);}
}
function buildStepper(){
 const list=byId('stepList');list.replaceChildren();
 STEPS.forEach((step,i)=>{const li=document.createElement('li'),b=document.createElement('button');b.type='button';b.innerHTML='<span class="step-num">'+(i+1)+'</span><span>'+escapeHtml(step.label)+'</span>';b.setAttribute('aria-label',`Step ${i+1} of ${STEPS.length}: ${step.label}`);if(i===state.step)b.setAttribute('aria-current','step');b.onclick=()=>{state.step=i;render();};li.append(b);list.append(li);});
 byId('stepCount').textContent='Step '+(state.step+1)+' of '+STEPS.length;
}
function renderPanel(){
 const panel=byId('stepPanel'),id=STEPS[state.step].id;
 if(id==='welcome')renderWelcome(panel);else if(id==='team')renderTeam(panel);else if(id==='colors')renderColors(panel);else if(id==='fonts')renderFonts(panel);else if(id==='review')renderReview(panel);else renderSlideChoices(panel,id);
 const nav=document.createElement('div');nav.className='panel-nav';nav.innerHTML='<button class="btn btn-secondary" id="btnBack"'+(state.step===0?' disabled':'')+'>Back</button>'+(state.step<STEPS.length-1?'<button class="btn btn-primary" id="btnNext">Next: '+escapeHtml(STEPS[state.step+1].label)+'</button>':'');panel.append(nav);
 byId('btnBack').onclick=()=>{state.step=Math.max(0,state.step-1);render();};if(byId('btnNext'))byId('btnNext').onclick=()=>{state.step++;render();};
}
function updateSimilarity(design){
 const comparisons=compareDesign(fingerprints,design),near=comparisons[0];
 if(!near){byId('distinctMeter').textContent='Reference comparison unavailable';return;}
 byId('distinctMeter').innerHTML='<span class="meter-count">'+near.shared+' <span>of '+near.total+'</span></span><span><strong>'+escapeHtml(near.title)+'</strong><span>Closest reference · exact comparable choices</span></span>';
 const labelOf=e=>typeof e==='string'?e:(e.label||e.key);
 const details=byId('similarityDetails');
 details.innerHTML='<p>This counts matching visual choices, not a perceptual percentage. Unknown features do not count. The six released lessons are the comparison library.</p><h3>Matches</h3><p>'+escapeHtml(near.matches?.length?near.matches.map(labelOf).join(', '):'No measured choices match.')+'</p><h3>Different</h3><p>'+escapeHtml(near.differences?.length?near.differences.map(labelOf).join(', '):'No measured differences.')+'</p><h3>Not comparable</h3><p>'+escapeHtml(near.unknown?.length?near.unknown.map(e=>labelOf(e)+(e.reason?': '+e.reason:'')).join('; '):'All supported characteristics were measured.')+'</p><ul>'+comparisons.map(c=>'<li>'+escapeHtml(c.title)+': '+c.shared+' of '+c.total+'</li>').join('')+'</ul>';
}
function buttonColorSample(id){
 return `<section id="${id}" class="bespoke-slide button-color-sample" aria-label="Button color sample"><div><strong>Button color sample</strong><p>Style preview only; no file opens.</p></div>${Model.renderSampleButton()}</section>`;
}
function updatePreview(design=state.design){
 if(!design)return;
 byId('designStyle').textContent=Model.cssForDesign(catalog,design,{scope:'.bespoke-slide',fontBase:'../fonts',canonical:false});
 byId('modelStage').innerHTML=Model.renderSlide(catalog,design,state.previewView,{title:design.samples.title,subtitle:design.samples.subtitle,lessonTitle:state.meta.lessons.find(l=>l.id===state.lessonId)?.title,logoUrl:'../SPOKES-Logo.png'});
 // Contextual sample sits outside the slide; cards/title/dividers keep their real structure.
 const buttonSample=byId('buttonColorSample');
 const needsSample=STEPS[state.step].id==='colors'&&ui.activeRole==='button'&&!['video','activity'].includes(state.previewView);
 if(buttonSample)buttonSample.remove();
 if(needsSample)byId('modelStage').insertAdjacentHTML('afterend',buttonColorSample('buttonColorSample'));
 byId('previewName').textContent=VIEW_NAMES[state.previewView];
 document.querySelectorAll('#previewTabs [role=tab]').forEach(t=>{t.setAttribute('aria-selected',String(t.dataset.view===state.previewView));t.tabIndex=t.dataset.view===state.previewView?0:-1;});
 updateSimilarity(design);
 const errors=Model.validateDesign(catalog,design),issues=Model.contrastIssues(catalog,design);const warn=byId('readabilityNotes');warn.hidden=!errors.length&&!issues.length;warn.innerHTML=errors.length?'<strong>Design needs attention</strong><p>'+escapeHtml(errors.join(' '))+'</p>':issues.length?contrastAdvisory(issues):'';
 const dividerIssues=issues.some(issue=>issue.surface==='dividerBackground');
 const repairs=document.createElement('div');repairs.className='readability-actions';if(issues.length)warn.append(repairs);
 if(dividerIssues){
  const dividerRepair=document.createElement('button');dividerRepair.type='button';dividerRepair.className='text-link';dividerRepair.textContent='Change divider colors';
  dividerRepair.onclick=()=>{ui.activeRole='dividerBackground';state.step=5;byId('workspace').dataset.activeSurface='design';render();byId('colorRole').focus();};repairs.append(dividerRepair);
  // Offer only explicit background repairs; the user's text colors never change here.
  const alternatives=['dark','royal','mauve','light'].filter(id=>id!==design.roles.dividerBackground&&!Model.colorAvailability(catalog,design,'dividerBackground',id).warnings.length).slice(0,2);
  for(const id of alternatives){const color=catalog.palette.find(c=>c.id===id),repair=document.createElement('button');repair.type='button';repair.className='text-link';repair.id='repair-divider-'+id;repair.textContent='Use '+color.name+' divider background';repair.onclick=()=>{changeDesign('Chapter divider background: '+color.name,d=>{d.roles.dividerBackground=id;});document.querySelector('#previewTabs [aria-selected="true"]').focus({preventScroll:true});};repairs.append(repair);}
 }
 if(issues.length&&!dividerIssues){const repair=document.createElement('button');repair.className='text-link';repair.textContent='Explore color options';repair.onclick=()=>{state.step=2;byId('workspace').dataset.activeSurface='design';render();};repairs.append(repair);}
 byId('liveRegion').textContent=VIEW_NAMES[state.previewView]+' preview updated.'+(issues.length?' Contrast advisory: '+issues.map(issue=>issue.message).join(' ')+' The team leader can keep this choice and save the design.':'');
}
function showView(view){state.previewView=view;ui.previewPinned=true;if(STEPS[state.step].id==='fonts')render(false);else{updatePreview();saveDraft();}}
function render(focus=true){
 const changed=ui.renderedStep!==state.step;if(changed){ui.renderedStep=state.step;state.previewView=STEPS[state.step].view;ui.previewPinned=false;}
 const active=document.activeElement,activeId=active?.id;
 const openDetails=!changed?Array.from(byId('stepPanel').querySelectorAll('details')).map(d=>d.open):[];
 buildStepper();renderPanel();byId('stepPanel').querySelectorAll('details').forEach((d,i)=>{d.open=Boolean(openDetails[i]);});syncAccessChrome();lockViewControls();updatePreview();updateUndo();
 if(isLeadSession()){if(ui.skipNextLocalSave)ui.skipNextLocalSave=false;else saveDraft();if(changed)scheduleAutosave(AUTOSAVE.stepMs);}
 if(focus&&changed)byId('stepPanel').focus({preventScroll:true});else if(activeId)byId(activeId)?.focus({preventScroll:true});
}
async function init(){
 const paths=['./catalog.json','../SPOKES%20Builder/bespoke-library-catalog.json','./builder-catalog.json','./lesson-fingerprints.json','./selection-v2.schema.json'];
 const data=await Promise.all(paths.map(async url=>{const r=await fetch(url);if(!r.ok)throw new Error('Could not load '+url);return r.json();}));
 [state.meta,state.library,catalog,fingerprints,selectionSchema]=data;state.design=Model.defaultDesign(catalog);
 await loadHandoffConfig();const startup=await openShareLink();
 if(ui.localPreview&&!ui.teamSession&&!startup?.snapshot){installTeamSession(state.lessonId,'bespoke-local-preview-synthetic');ui.mode='edit';}
 const mayReplace=Boolean(ui.teamSession)&&(!lastSavedRaw||Boolean(ui.teamSession.baseSelectionKey&&currentSelectionKey()===ui.teamSession.baseSelectionKey));
 byId('btnSave').onclick=()=>cloudSave();byId('btnOpen').onclick=()=>ui.teamSession?fetchSharedDesign():openOpenDialog();byId('btnSend').onclick=()=>cloudSend();
 byId('btnDownloadBackup').onclick=saveTeamFile;byId('btnOpenBackup').onclick=()=>byId('teamFileInput').click();byId('teamFileInput').onchange=async e=>{await openTeamFile(e.target.files?.[0]);e.target.value='';};
 byId('btnLoadLatest').onclick=()=>fetchSharedDesign({replace:true});byId('btnKeepLocal').onclick=()=>fileNotice('Browser draft kept. Download a backup before loading the latest shared version.');
 byId('btnHistory').onclick=loadHistory;byId('btnCheckStatus').onclick=()=>{const pending=pendingSubmission();if(pending?.stage==='receipt')pollSubmission(pending);else if(pending?.stage==='request')cloudSend();};
 byId('btnUndo').onclick=()=>undoChange();byId('btnRedo').onclick=()=>undoChange(true);
 byId('openCancel').onclick=()=>byId('openDialog').close();byId('openForm').onsubmit=e=>{e.preventDefault();cloudOpen();};
 byId('presetCancel').onclick=()=>finishPresetConfirmation(false);byId('presetDialog').oncancel=e=>{e.preventDefault();finishPresetConfirmation(false);};byId('presetForm').onsubmit=e=>{e.preventDefault();finishPresetConfirmation(true);};
 byId('presetDialog').onkeydown=e=>{if(e.key!=='Tab')return;const first=byId('presetSkipConfirmation'),last=byId('presetApply');if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}};
 byId('btnRecoverDraft').onclick=()=>{try{const previous=localStorage.getItem(BACKUP_KEY);if(!previous||!confirm('Restore the previous browser draft? Download a backup first if you need this version.'))return;const current=localStorage.getItem(STORAGE_KEY);localStorage.setItem(STORAGE_KEY,previous);if(current)localStorage.setItem(BACKUP_KEY,current);ui.allowUnload=true;location.reload();}catch{fileNotice('Recovery is unavailable. Open a downloaded backup.');}};
 byId('btnLeaveSession').onclick=()=>{if(!confirm('Leave this session on this browser? Download a backup or save first.'))return;forgetTeamSession();try{localStorage.removeItem(STORAGE_KEY);localStorage.removeItem(BACKUP_KEY);}catch{}ui.allowUnload=true;location.reload();};
 byId('btnClear').onclick=()=>{if(!isLeadSession()||!confirm('Start a new browser draft? A recovery copy will be kept. Shared designs remain unchanged.'))return;if(!keepRecoveryCopy())return;resetPresetConfirmation();lastSavedRaw=localStorage.getItem(STORAGE_KEY);storageConflict=false;resetDesignForLesson(state.lessonId);ui.autosavePaused=true;render();};
 document.querySelectorAll('#previewTabs [role=tab]').forEach(tab=>tab.onclick=()=>showView(tab.dataset.view));bindTablistKeys(byId('previewTabs'));
 document.querySelectorAll('#surfaceSwitcher [role=tab]').forEach(tab=>tab.onclick=()=>{byId('workspace').dataset.activeSurface=tab.dataset.surface;document.querySelectorAll('#surfaceSwitcher [role=tab]').forEach(t=>t.setAttribute('aria-selected',String(t===tab)));});bindTablistKeys(byId('surfaceSwitcher'));
 window.addEventListener('storage',event=>{if((event.key===STORAGE_KEY||event.key===null)&&isLeadSession()){storageConflict=true;setSaveStatus('Another tab changed this draft');fileNotice('This tab’s draft is kept. Download a backup before reopening the latest version.');}});
 window.addEventListener('beforeunload',event=>{if(ui.allowUnload||!isLeadSession()||!hasUnsavedTeamWork())return;runAutosave();event.preventDefault();event.returnValue='';});
 window.addEventListener('hashchange',()=>openShareLink().then(()=>render()).catch(e=>fileNotice(e.message)));
 render();saveAnnounceReady=true;
 if(ui.teamSession&&!startup?.snapshot){await fetchSharedDesign({replace:mayReplace});await resumePendingSubmission();}
 autosaveReady=true;scheduleAutosave(AUTOSAVE.idleMs);
 if(ui.localPreview){byId('localPreviewNotice').hidden=false;byId('btnSave').textContent='Save test design';byId('btnOpen').textContent='Open test design';byId('btnSend').hidden=true;}
}
init().catch(error=>{byId('stepPanel').innerHTML='<h1>Could not open the builder</h1><p>'+escapeHtml(error.message)+'</p><p>Your saved draft has not been replaced. Reload once the local server is available.</p>';console.error(error);});
