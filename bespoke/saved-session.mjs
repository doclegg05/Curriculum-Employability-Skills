// Page-only glue for the saved-design card on the edit page: turns the page's session and
// save state into SavedFacts, and draws the card and badge from them. builder-app.mjs wires it.
import { savedStatus } from './saved-status.mjs';
import { cardHighlights } from './choices-summary.mjs';
import { renderSavedCard, renderBadge } from './saved-card.mjs';

// A malformed time from the service is skipped rather than allowed to break the card.
export const validTime = iso => (typeof iso === 'string' && !Number.isNaN(Date.parse(iso)) ? iso : null);

/** SavedFacts for an edit session. `unsaved` is the page's hasUnsavedTeamWork(). */
export function editFacts(session, ui, unsaved) {
  const hasSave = Boolean(session?.revision);
  return {
    access: 'edit', phase: ui.openPhase, hasSave, savedAt: validTime(session?.savedAt), matchesSave: hasSave && !unsaved,
    saving: Boolean(session) && ui.savingFor === session, saveFailed: ui.saveFailed,
    // State 5 (competing versions) is wired separately.
    conflict: null, keptChanges: false, converted: Boolean(ui.convertedUnsaved),
    untouchedPresets: !hasSave && !ui.meaningfulDesign, aheadSaving: ui.aheadSaving, priorWork: ui.priorWork,
    dismissed: ui.cardDismissed, draftChangedAt: null,
  };
}

/** Draws the card and badge from `facts`, or hides both when `facts` is null. */
export function drawSavedStatus({ section, button, facts, catalog, snapshot, handlers }) {
  const { card, badge } = facts ? savedStatus(facts) : { card: null, badge: null };
  const highlights = card && snapshot ? cardHighlights(catalog, snapshot) : null;
  if (section) renderSavedCard(section, card, highlights, handlers);
  if (button) renderBadge(button, badge, null);
}
