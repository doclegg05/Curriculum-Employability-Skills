// Draws the saved-design card, the top-bar status badge and the "See all choices" dialog.
// Pure DOM helpers: nothing here touches `document` at import time, and no state is kept
// outside the elements. Wiring lives in builder-app.mjs.

const BUTTONS = {
  retry: { id: 'savedRetry', label: 'Try again', handler: 'retry' },
  choices: { id: 'savedChoices', label: 'See all choices', handler: 'choices' },
  ok: { id: 'savedOk', label: 'OK', handler: 'ok' },
  useSaved: { id: 'savedUseSaved', label: "Use the team's saved design", handler: 'useSaved' },
  keepChanges: { id: 'savedKeepChanges', label: 'Keep these changes', handler: 'keepChanges' }
};
const HIGHLIGHT_KINDS = ['saved', 'converted'];

function el(doc, tag, className, text) {
  const node = doc.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function drawnActions(card, on) {
  return card.actions.filter(name => BUTTONS[name] && typeof on?.[BUTTONS[name].handler] === 'function');
}

// One string that changes whenever anything the card shows changes.
function cardKey(card, highlights, actions) {
  const shown = HIGHLIGHT_KINDS.includes(card.kind) ? highlights : null;
  return JSON.stringify([card.kind, card.heading, card.lines, actions, shown]);
}

function highlightsNode(doc, highlights) {
  const wrap = el(doc, 'div', 'saved-card-highlights');
  wrap.append(el(doc, 'p', 'saved-card-look', highlights.look));
  const swatches = el(doc, 'ul', 'saved-card-swatches');
  swatches.setAttribute('aria-label', 'Colors');
  for (const color of highlights.colors) {
    const item = el(doc, 'li');
    const chip = el(doc, 'span', 'saved-card-chip');
    chip.style.background = color.hex;
    chip.setAttribute('aria-hidden', 'true');
    item.append(chip, el(doc, 'span', '', color.name));
    swatches.append(item);
  }
  if (highlights.colors.length) wrap.append(swatches);
  wrap.append(el(doc, 'p', 'saved-card-fonts', highlights.fonts));
  return wrap;
}

/** Draws the card into `section`, or hides it when `card` is null. */
export function renderSavedCard(section, card, highlights, on) {
  const doc = section.ownerDocument;
  if (!card) {
    section.hidden = true;
    delete section.dataset.key;
    delete section.dataset.kind;
    return;
  }
  const actions = drawnActions(card, on);
  const key = cardKey(card, highlights, actions);
  section.hidden = false;
  if (section.dataset.key === key) return;
  section.dataset.key = key;
  section.dataset.kind = card.kind;
  const body = el(doc, 'div', 'saved-card-body');
  body.append(el(doc, 'p', 'saved-card-heading', card.heading));
  for (const line of card.lines) body.append(el(doc, 'p', 'saved-card-line', line));
  if (highlights && HIGHLIGHT_KINDS.includes(card.kind)) body.append(highlightsNode(doc, highlights));
  const row = el(doc, 'div', 'saved-card-actions');
  for (const name of actions) {
    const spec = BUTTONS[name];
    const button = el(doc, 'button', name === 'ok' ? 'btn btn-secondary' : 'btn btn-primary', spec.label);
    button.type = 'button';
    button.id = spec.id;
    button.addEventListener('click', () => on[spec.handler]());
    row.append(button);
  }
  section.replaceChildren(...(actions.length ? [body, row] : [body]));
}

/** Shows the top-bar badge as a button that opens the choices, or hides it when `badge` is null. */
export function renderBadge(button, badge, onClick) {
  if (!badge) {
    button.hidden = true;
    return;
  }
  button.hidden = false;
  if (button.dataset.tone !== badge.tone) button.dataset.tone = badge.tone;
  if (button.textContent !== badge.text) button.textContent = badge.text;
  if (button.onclick !== onClick) button.onclick = onClick;
}

function summaryList(doc, { title, summary }) {
  const block = el(doc, 'section', 'choices-block');
  block.append(el(doc, 'h3', '', title));
  for (const group of summary) {
    if (!group.rows.length) continue;
    block.append(el(doc, 'h4', '', group.section));
    const list = el(doc, 'dl', 'choices-list');
    for (const row of group.rows) {
      const term = el(doc, 'dt', '', row.label);
      const value = el(doc, 'dd');
      if (row.hex) {
        const chip = el(doc, 'span', 'saved-card-chip');
        chip.style.background = row.hex;
        chip.setAttribute('aria-hidden', 'true');
        value.append(chip);
      }
      value.append(row.value);
      list.append(term, value);
    }
    block.append(list);
  }
  return block;
}

/** Fills the dialog's lists (saved design first) and opens it. */
export function openChoices(dialog, lists) {
  const doc = dialog.ownerDocument;
  dialog.querySelector('#choicesLists').replaceChildren(...lists.map(list => summaryList(doc, list)));
  if (!dialog.open) dialog.showModal();
}
