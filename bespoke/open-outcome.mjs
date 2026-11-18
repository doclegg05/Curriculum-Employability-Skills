// Decides what opening the team's saved design does to the design in this browser.
// Pure: facts in, { action, keepCopy } out. builder-app.mjs carries it out.

/**
 * @param {object} facts
 * @param {boolean} facts.dirty the browser has changes that are not in the save it last knew of
 * @param {boolean} facts.replace the saved design may replace the browser's (a clean page load, or Use the team's saved design)
 * @param {boolean} facts.editedWhileOpening the design changed between asking the service and its answer
 * @param {boolean} facts.remoteChanged the service's save is not the one this browser last knew of
 * @param {string|null} facts.incomingKey key of the saved design, or null when the team has no save
 * @param {string} facts.currentKey key of the design on screen
 * @param {boolean} facts.hasWork the browser holds work worth a recovery copy
 * @returns {{action: 'adopt'|'conflict'|'blocked'|'apply'|'reset', keepCopy: boolean}}
 */
export function openOutcome({ dirty, replace, editedWhileOpening, remoteChanged, incomingKey, currentKey, hasWork }) {
  // The save already is what is on screen, so there is nothing to choose between and nothing to keep. Two ways
  // to know: the designs match (a save that reached the service when its reply never reached this page), or
  // it is the version this browser already opened and nothing here has changed since. The second holds even
  // when the service's wording of the design differs from the page's (an older save, a design updated on open).
  const sameDesign = incomingKey === currentKey;
  const sameVersion = !dirty && !remoteChanged;
  if (incomingKey !== null && (sameDesign || sameVersion)) return { action: 'adopt', keepCopy: false };
  if (dirty && (!replace || editedWhileOpening)) return { action: remoteChanged ? 'conflict' : 'blocked', keepCopy: false };
  // The one recovery copy is written only when the design on screen is about to be replaced.
  if (incomingKey === null) return { action: 'reset', keepCopy: replace && hasWork };
  return { action: 'apply', keepCopy: replace };
}
