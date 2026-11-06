// A team view opens the team's latest saved design read-only, from a #view= link or a
// view code typed into the Open dialog. It never reads or writes the browser draft:
// the only thing it stores is the link, in this tab's session storage, so a reload
// stays in the view.
import { savedStatus } from './saved-status.mjs';
import { cardHighlights } from './choices-summary.mjs';
import { renderSavedCard, renderBadge } from './saved-card.mjs';
import { convertToStandard } from './standard-conversion.mjs';

export const VIEW_SESSION_KEY = 'bespoke-view-session';
// v, s and c carry a snapshot design; e is a retired edit link that opens read-only.
const SNAPSHOT_KINDS = ['v', 's', 'c', 'e'];
const NOTES = {
  incomplete: 'This team view link is incomplete or out of date. Ask your spokesperson for the current one.',
  retry: 'Could not open the team design. Try Refresh in a moment.',
  unreadable: 'The team design could not be opened. Ask your spokesperson to save it again.',
  nothingSaved: "Your team has not saved a design yet. Check back after the builder's first save."
};

function shareKind(hash) {
  const body = String(hash || '').replace(/^#/, '');
  const eq = body.indexOf('=');
  return eq > 0 ? body.slice(0, eq) : '';
}

export function isSnapshotHash(hash) {
  return SNAPSHOT_KINDS.includes(shareKind(hash));
}

export function isShareHash(hash) {
  return isSnapshotHash(hash) || ['team', 'view'].includes(shareKind(hash));
}

// A builder link or a snapshot in the address bar wins; otherwise a fresh view link,
// then the one this tab already holds.
export function viewLinkToOpen({ hash, startupTeam, startupView, stored }) {
  if (startupTeam || isSnapshotHash(hash)) return '';
  return startupView || stored || '';
}

// Says only what the page learned: the team when the link named one, and the save and
// builder only after an open that answered.
export function viewBannerText({ lesson, savedAt, builder, opened }) {
  const head = lesson ? `${lesson} team · View only` : 'View only';
  if (!opened) return head;
  if (!savedAt) return `${head} · Nothing saved yet`;
  const saved = new Date(savedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
  return `${head} · Saved ${saved} · Built by ${builder}`;
}

// True when the page shows the stored design with updates: a v1 save, or a v2 save that conversion changes.
export function viewConverted(catalog, stored) {
  if (!stored) return false;
  if (stored.schema === 'bespoke-selection/v1') return true;
  return Boolean(stored.design) && convertToStandard(catalog, stored.design).changes.length > 0;
}

/**
 * host: { request(action, fields), apply(selection), parseLink(value), generation(),
 *   lessonTitle(id), builder(), enter(lessonId), land(), note(text), render(), storage,
 *   catalog(), design(), choices() }
 */
export function createTeamView(host) {
  let session = null, label = null, button = null, dismissed = false;
  // Read at click time: renderSavedCard keeps the first draw's handlers.
  const cardHandlers = {
    retry: () => refresh(),
    choices: () => host.choices?.(),
    ok: () => { dismissed = true; host.render(); }
  };

  function stored() {
    try { return host.storage.getItem(VIEW_SESSION_KEY) || ''; }
    catch { return ''; }
  }

  function end() {
    session = null;
    try { host.storage.removeItem(VIEW_SESSION_KEY); }
    catch { /* Tab storage is blocked, so nothing was kept. */ }
  }

  async function load(firstOpen, answer) {
    const current = session, generation = host.generation();
    const result = answer || await host.request('open', { lessonId: current.lessonId, editCode: current.code });
    // A later open, a builder link or a snapshot replaced what this answer was for.
    if (session !== current || host.generation() !== generation) return false;
    if (!result.ok) {
      if (!current.opened) session = { ...current, phase: 'failed' };
      host.note(result.error === 'code' && result.message ? result.message : NOTES.retry);
      return false;
    }
    if (result.selection) {
      try { host.apply(result.selection); }
      catch (error) {
        console.warn('Team view could not be opened', error);
        if (!current.opened) session = { ...current, phase: 'failed' };
        host.note(NOTES.unreadable);
        return false;
      }
    }
    let converted = false;
    try { converted = viewConverted(host.catalog?.(), result.selection); }
    catch (error) { console.warn('Team view could not check for updates', error); }
    session = { ...current, savedAt: result.selection ? result.savedAt || null : null, opened: true, phase: 'ready', hasSave: Boolean(result.selection), converted };
    host.note(result.selection ? '' : NOTES.nothingSaved);
    if (firstOpen && result.selection) host.land();
    return true;
  }

  async function open(value, answer) {
    const link = host.parseLink(value);
    session = { lessonId: link?.lessonId || String(value).split('.')[0], code: link?.editCode || '', savedAt: null, opened: false, phase: 'checking', hasSave: false, converted: false };
    dismissed = false;
    host.enter(link?.lessonId || '');
    if (!link) {
      session = { ...session, phase: 'none' };
      host.note(NOTES.incomplete);
      return false;
    }
    try { host.storage.setItem(VIEW_SESSION_KEY, value); }
    catch { /* The view still works for this page load. */ }
    return load(true, answer);
  }

  async function refresh() {
    if (!session?.code) return;
    await load(!session.opened);
    host.render();
  }

  // The banner is a live region: build it once, then change its text only when it differs.
  function draw(banner) {
    if (!button) {
      label = document.createTextNode('');
      button = document.createElement('button');
      Object.assign(button, { type: 'button', id: 'btnViewRefresh', className: 'text-link', textContent: 'Refresh' });
      button.addEventListener('click', refresh);
    }
    if (banner.dataset.kind !== 'view') {
      banner.replaceChildren(label, button);
      banner.dataset.kind = 'view';
      delete banner.dataset.viewText;
    }
    const text = viewBannerText({ lesson: host.lessonTitle(session.lessonId), savedAt: session.savedAt, builder: host.builder(), opened: session.opened });
    if (banner.dataset.viewText !== text) {
      label.data = text + ' ';
      banner.dataset.viewText = text;
    }
    button.hidden = !session.code;
    banner.hidden = false;
  }

  // The saved-design card for a view: the same card as the edit page, with no badge and nothing that saves.
  function status() {
    if (!session || session.phase === 'none') return { card: null, badge: null };
    return savedStatus({
      access: 'view', phase: session.phase, hasSave: session.hasSave, savedAt: session.savedAt, matchesSave: true,
      saving: false, saveFailed: false, conflict: null, keptChanges: false, converted: session.converted,
      untouchedPresets: true, aheadSaving: false, priorWork: false, dismissed, draftChangedAt: null
    });
  }

  function drawCard({ section, badgeButton }) {
    const { card } = status();
    const highlights = card && session.hasSave ? cardHighlights(host.catalog(), host.design()) : null;
    if (section) renderSavedCard(section, card, highlights, cardHandlers);
    if (badgeButton) renderBadge(badgeButton, null, null);
  }

  return { status, drawCard, converted: () => Boolean(session?.converted), active: () => Boolean(session), stored, end, open, refresh, draw };
}
