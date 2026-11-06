// The question asked before a kept browser draft replaces a newer team save (spec state 5).
// Nothing here touches `document` at import time. builder-app.mjs decides when to ask.

const DIALOG_ID = 'replaceDialog';

// Strip notices for state 5. Existing suites match the opening sentence of the conflict notices.
const CHOOSE = "Choose Use the team's saved design or Keep these changes.";
export const OPEN_CONFLICT_NOTICE = `A newer shared version exists. ${CHOOSE}`;
export const CHOOSE_VERSION_NOTICE = `A newer shared version exists. ${CHOOSE} Then you can save.`;
export const SAVE_CONFLICT_NOTICE = `Someone saved a newer shared version. Your browser draft is safe. ${CHOOSE}`;
export const REPLACE_CONFLICT_NOTICE = 'Someone saved a newer shared version before yours arrived. Your browser draft is safe.';
export const REPLACE_STALE_NOTICE = 'The team saved a newer version while you were deciding. Your browser draft is safe.';
export const KEPT_CHANGES_NOTICE = 'Your browser changes are kept. Saving them asks first, because it replaces the newer saved design.';
export const RECOVERY_FULL_NOTICE = "Your browser changes couldn't be kept as a recovery copy, so the saved design was not loaded. Download a backup first.";

/** The exact question, naming the save that would be replaced. */
export function replaceQuestion(savedAtText) {
  return `This will replace the design saved ${savedAtText}. Replace it?`;
}

function button(doc, id, className, label, value) {
  const node = doc.createElement('button');
  node.id = id;
  node.className = className;
  node.value = value;
  node.textContent = label;
  return node;
}

function buildDialog(doc) {
  const dialog = doc.createElement('dialog');
  dialog.id = DIALOG_ID;
  dialog.setAttribute('aria-labelledby', 'replaceDialogText');
  const text = doc.createElement('p');
  text.id = 'replaceDialogText';
  const form = doc.createElement('form');
  form.method = 'dialog';
  form.className = 'dialog-actions';
  const cancel = button(doc, 'replaceCancel', 'btn btn-secondary', 'Cancel', 'cancel');
  // Replacing someone's save is the careful choice, so the safe one has focus.
  cancel.autofocus = true;
  form.append(button(doc, 'replaceConfirm', 'btn btn-primary', 'Replace it', 'replace'), cancel);
  dialog.append(text, form);
  return dialog;
}

/**
 * Asks whether to replace the save made at `savedAtText`. Resolves true only for Replace it;
 * Cancel, Escape or any other close resolves false. A question already open answers false.
 */
export function askReplace(dialogHost, savedAtText) {
  let dialog = dialogHost.querySelector(`#${DIALOG_ID}`);
  if (!dialog) {
    dialog = buildDialog(dialogHost.ownerDocument);
    dialogHost.append(dialog);
  }
  if (dialog.open) return Promise.resolve(false);
  dialog.querySelector('#replaceDialogText').textContent = replaceQuestion(savedAtText);
  dialog.returnValue = '';
  return new Promise(resolve => {
    dialog.addEventListener('close', () => resolve(dialog.returnValue === 'replace'), { once: true });
    dialog.showModal();
  });
}

/**
 * After Keep these changes, each yes replaces exactly the save it named. `current()` is the competing
 * save (null once there is nothing to replace), `ask(named)` resolves true for Replace it, and
 * `save(named)` sends the save naming `named.revision`. A newer save that lands while the question is
 * open, or a 409 that names one, brings the question back with the newer time. An earlier yes is never reused.
 */
export async function replaceEachNamed({ current, ask, save, onStale }) {
  for (let named = current(); named; named = current()) {
    if (!await ask(named)) return;
    if (named !== current()) {
      if (current()) onStale();
      continue;
    }
    await save(named);
    // Unchanged after the save: it failed without naming a newer version, so stop asking.
    if (current() === named) return;
  }
}
