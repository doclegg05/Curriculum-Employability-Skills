import { applyAnswer, currentValue, optionsFor } from './answers.mjs';
import { questionCopy, sectionLabel } from './copy.mjs';
import { sectionsOf } from './questions.mjs';

export function el(tag, attrs = {}, ...kids) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === false || value == null) continue;
    node.setAttribute(key, value === true ? '' : String(value));
  }
  for (const kid of kids.flat()) {
    if (kid == null || kid === false) continue;
    node.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  }
  return node;
}

function progress(ctx) {
  const { guide, q, byId, actions } = ctx;
  const list = el('ol', { class: 'guide-sections', 'aria-label': 'Guide sections' });
  for (const s of sectionsOf(guide, byId)) {
    const b = el('button', { type: 'button', class: 'guide-section', 'data-section': s.id, disabled: !s.reached, 'aria-current': s.current ? 'step' : false }, s.label);
    b.addEventListener('click', () => actions.jumpSection(s.id));
    list.append(el('li', {}, b));
  }
  return el('div', { class: 'guide-head' },
    el('p', { class: 'guide-count' }, `Question ${guide.index + 1} of ${guide.ids.length} · ${sectionLabel(q.section)}`), list);
}

function sampleButton(ctx, option, current) {
  const { host, q, actions } = ctx;
  const b = el('button', { type: 'button', class: 'guide-sample', 'data-choice': option.id, 'aria-pressed': String(option.id === current) },
    el('strong', {}, option.label), option.detail ? el('small', {}, option.detail) : null, option.note ? el('small', { class: 'guide-note' }, option.note) : null);
  b.addEventListener('click', () => actions.choose(option));
  void host; void q;
  return b;
}

function questionBody(ctx) {
  const { host, q, catalog } = ctx;
  const copy = questionCopy(q);
  const head = [el('h1', { tabindex: '-1' }, copy.title), el('p', { class: 'panel-lead' }, copy.prompt)];
  if (q.kind === 'team') {
    const team = el('section', { class: 'start-team' });
    host.renderTeam(team);
    return [...head, team];
  }
  const current = currentValue(catalog, host.design, q);
  const { options } = optionsFor(catalog, host.design, q);
  const grid = el('div', { class: 'guide-samples', role: 'group', 'aria-label': `${copy.title} choices` });
  for (const option of options) grid.append(sampleButton(ctx, option, current));
  return [...head, grid];
}

function nav(ctx) {
  const { guide, actions } = ctx;
  const last = guide.index === guide.ids.length - 1;
  const button = (id, cls, text, fn, disabled = false) => {
    const b = el('button', { type: 'button', id, class: cls, disabled }, text);
    b.addEventListener('click', fn);
    return b;
  };
  return el('div', { class: 'panel-nav guide-nav' },
    button('btnGuideBack', 'btn btn-secondary', 'Back', actions.back, guide.index === 0),
    button('btnGuideNext', 'btn btn-primary', last ? 'Finish and review' : 'Next', actions.next),
    button('btnGuideExit', 'text-link', 'Exit guide', actions.exit));
}

export function renderGuide(panel, ctx) {
  panel.replaceChildren(progress(ctx), ...questionBody(ctx), nav(ctx));
  void applyAnswer;
}
