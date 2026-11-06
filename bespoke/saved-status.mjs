// Decides which saved-design card and status badge BeSpoke shows.
// Pure: facts in, { card, badge } out. Drawing and wiring live elsewhere.

export const EDIT_LINE = 'Choose Make it yours, then select text on a slide to change it.';

const PRIOR_WORK_LINE = 'Work from this browser before you entered the code is in ⋯ > Recover previous draft.';

export function formatSavedTime(iso, locale) {
  const date = new Date(iso);
  const day = new Intl.DateTimeFormat(locale, { weekday: 'long', month: 'long', day: 'numeric' }).format(date);
  const time = new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' }).format(date);
  return `${day} at ${time}`;
}

const card = (kind, heading, lines, actions) => ({ kind, heading, lines, actions });
const badge = (text, tone) => ({ text, tone });

function savedLine(facts) {
  return facts.savedAt ? [`Saved ${formatSavedTime(facts.savedAt)}`] : [];
}

function conflictCard(facts) {
  const lines = [];
  if (facts.draftChangedAt) lines.push(`The browser changes are from ${formatSavedTime(facts.draftChangedAt)}.`);
  lines.push(facts.conflict.savedAt
    ? `The team's design was saved again ${formatSavedTime(facts.conflict.savedAt)}.`
    : "The team's design was saved again.");
  return card('conflict', "This browser has changes that aren't in the team's saved design.", lines, ['useSaved', 'keepChanges']);
}

function aheadCard(facts) {
  if (facts.saveFailed) {
    return card('ahead', 'Your latest changes are only in this browser.', ['Choose Save for the team to try again.'], ['ok']);
  }
  return card('ahead', 'Your latest changes are being saved for the team', [], []);
}

function convertedCard(facts) {
  if (facts.access === 'view') {
    return card('saved',
      "You're looking at this team's saved design, shown with updates to the current design standard",
      savedLine(facts), ['choices', 'ok']);
  }
  return card('converted', "Opened your team's saved design with updates.",
    ["These updates haven't been saved yet.", ...savedLine(facts)], ['choices', 'ok']);
}

function emptyCard(facts) {
  const edit = facts.access === 'edit';
  const first = facts.untouchedPresets
    ? "You're looking at the starting presets."
    : 'The changes on screen are only in this browser until you choose Save for the team.';
  const lines = edit ? [first, EDIT_LINE] : [first];
  return card('empty', "Your team hasn't saved a design yet.", lines, ['ok']);
}

function savedCard(facts) {
  if (facts.access === 'view') {
    return card('saved', "You're looking at this team's saved design", savedLine(facts), ['choices', 'ok']);
  }
  const lines = [...savedLine(facts), EDIT_LINE];
  if (facts.priorWork) lines.push(PRIOR_WORK_LINE);
  return card('saved', "You're looking at your team's saved design", lines, ['choices', 'ok']);
}

function chooseCard(facts) {
  if (facts.phase === 'checking') {
    return card('checking', "Checking your team's saved design…", [], []);
  }
  if (facts.phase === 'failed') {
    return facts.access === 'edit'
      ? card('failed', "We couldn't check your team's saved design.", ['Your browser work is still here.'], ['retry'])
      : card('failed', "We couldn't check this team's saved design.", [], ['retry']);
  }
  if (facts.conflict && !facts.keptChanges) return conflictCard(facts);
  if (facts.aheadSaving) return aheadCard(facts);
  if (facts.converted) return convertedCard(facts);
  if (!facts.hasSave) return emptyCard(facts);
  if (facts.matchesSave) return savedCard(facts);
  return null;
}

function chooseBadge(facts) {
  if (facts.access !== 'edit') return null;
  if (facts.phase === 'checking') return badge('Checking…', 'busy');
  if (facts.phase === 'failed') return badge("Couldn't check", 'error');
  if (facts.saving) return badge('Saving…', 'busy');
  if (facts.saveFailed) return badge('Save failed', 'error');
  if (facts.matchesSave && facts.hasSave && !facts.converted) return badge('Saved', 'ok');
  if (!facts.hasSave && facts.untouchedPresets) return null;
  return badge('Changes not saved', 'warn');
}

export function savedStatus(facts) {
  const shown = chooseCard(facts);
  return {
    card: facts.dismissed ? null : shown,
    badge: chooseBadge(facts),
  };
}
