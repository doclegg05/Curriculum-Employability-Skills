// Page-only glue for the saved-design card on the edit page: turns the page's session and
// save state into SavedFacts, and draws the card and badge from them. builder-app.mjs wires it.
import { savedStatus, formatSavedTime } from './saved-status.mjs';
import { cardHighlights, designSummary } from './choices-summary.mjs';
import { renderSavedCard, renderBadge } from './saved-card.mjs';

// A malformed time from the service is skipped rather than allowed to break the card.
export const validTime = iso => (typeof iso === 'string' && !Number.isNaN(Date.parse(iso)) ? iso : null);

/** The competing save's time for the Replace it question. */
export const conflictSavedText = conflict => (validTime(conflict?.savedAt) ? formatSavedTime(conflict.savedAt) : 'most recently');

/** SavedFacts for an edit session. `unsaved` is the page's hasUnsavedTeamWork(). */
export function editFacts(session, ui, unsaved) {
  const hasSave = Boolean(session?.revision);
  return {
    access: 'edit', phase: ui.openPhase, hasSave, savedAt: validTime(session?.savedAt), matchesSave: hasSave && !unsaved,
    saving: Boolean(session) && ui.savingFor === session, saveFailed: ui.saveFailed,
    conflict: ui.cloudConflict ? { revision: ui.cloudConflict.revision, savedAt: validTime(ui.cloudConflict.savedAt) } : null,
    keptChanges: Boolean(ui.keptChanges), converted: Boolean(ui.convertedUnsaved),
    untouchedPresets: !hasSave && !ui.meaningfulDesign, aheadSaving: ui.aheadSaving, priorWork: ui.priorWork,
    dismissed: ui.cardDismissed, draftChangedAt: null,
  };
}

/**
 * The card and badge to show. The local test page is a developer mode: badge only, no card (ledger R6),
 * except the competing-versions choice, which nothing else on the page offers any more.
 */
export function savedView(facts, { localPreview = false } = {}) {
  if (!facts) return { card: null, badge: null };
  const { card, badge } = savedStatus(facts);
  return { card: localPreview && card?.kind !== 'conflict' ? null : card, badge };
}

/** Draws the card and badge from `facts`, or hides both when `facts` is null. */
export function drawSavedStatus({ section, button, facts, localPreview, catalog, snapshot, handlers, onBadge = null }) {
  const { card, badge } = savedView(facts, { localPreview });
  const highlights = card && snapshot ? cardHighlights(catalog, snapshot) : null;
  if (section) renderSavedCard(section, card, highlights, handlers);
  if (button) renderBadge(button, badge, onBadge);
}

/**
 * The lists "See all choices" shows, saved design first. `saved` is the design as rebuilt on open or just
 * saved (null before any save); `editing` is the current design, passed only when it differs from the save.
 */
export function choiceLists({ saved, editing, converted, catalog }) {
  const lists = [];
  if (saved) lists.push({ title: converted ? 'Choices in the saved design, with updates' : 'Choices in the saved design', summary: designSummary(catalog, saved) });
  if (editing) lists.push({ title: "Choices you're editing", summary: designSummary(catalog, editing) });
  return lists;
}
