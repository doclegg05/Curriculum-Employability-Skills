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

let thumbSerial = 0;
export const THUMB_WIDTH = 720;

// A thumbnail is the real slide drawn at a fixed 720 px width and scaled down to its cell, so the
// slide's own container queries and minimum heights behave as they do in the preview. It is inert:
// the slide markup holds buttons and a disclosure that must never become tab stops.
function thumbnail(ctx, design) {
  const { host, q, catalog } = ctx;
  const id = `gt${(thumbSerial += 1)}`;
  const inner = el('span', { class: 'guide-thumb-inner' });
  const style = document.createElement('style');
  style.textContent = ctx.Model.cssForDesign(catalog, design, { scope: `.${id}`, fontBase: '../fonts', canonical: false });
  inner.innerHTML = ctx.Model.renderSlide(catalog, design, q.view, host.slideOptions(design)).replace('class="bespoke-slide"', `class="bespoke-slide ${id}"`);
  inner.prepend(style);
  return el('span', { class: 'guide-thumb', 'aria-hidden': 'true', inert: true }, inner);
}

export function fitThumbnails(panel) {
  requestAnimationFrame(() => {
    panel.querySelectorAll('.guide-thumb').forEach((t) => t.style.setProperty('--s', String(t.clientWidth / THUMB_WIDTH)));
  });
}

function trialFor(ctx, option) {
  return applyAnswer(ctx.catalog, ctx.host.design, ctx.q, option.id);
}

function sampleButton(ctx, option, current, { chip = false } = {}) {
  const { host, actions } = ctx;
  const trial = trialFor(ctx, option);
  const swatch = chip ? el('span', { class: 'guide-swatch', style: `background:${option.hex}`, 'aria-hidden': 'true' }) : null;
  const b = el('button', { type: 'button', id: `guide-choice-${option.id}`, class: 'guide-sample' + (chip ? ' guide-chip' : ''), 'data-choice': option.id, 'aria-pressed': String(option.id === current) },
    chip ? swatch : thumbnail(ctx, trial),
    el('strong', {}, option.label),
    option.detail ? el('small', {}, option.detail) : null,
    option.note ? el('small', { class: 'guide-note' }, option.note) : null);
  b.addEventListener('click', () => actions.choose(option));
  b.addEventListener('pointerenter', () => host.preview(trial));
  b.addEventListener('focus', () => host.preview(trial));
  b.addEventListener('pointerleave', () => host.preview(null));
  b.addEventListener('blur', () => host.preview(null));
  return b;
}

const SCOPE_KEY = { fontPairing: 'headingFont', pattern: 'pattern', sharedColor: null };

function questionBody(ctx) {
  const { host, q, catalog, actions } = ctx;
  const copy = questionCopy(q);
  const head = [el('h1', { tabindex: '-1' }, copy.title), el('p', { class: 'panel-lead' }, copy.prompt)];
  if (q.kind === 'team') {
    const team = el('section', { class: 'start-team' });
    host.renderTeam(team);
    return [...head, team];
  }
  const current = currentValue(catalog, host.design, q);
  const { options, more } = optionsFor(catalog, host.design, q);
  const grid = el('div', { class: 'guide-samples', role: 'group', 'aria-label': `${copy.title} choices` });
  for (const option of options) grid.append(sampleButton(ctx, option, current));
  const body = [...head, grid];
  if (more.length) {
    const open = ctx.moreOpen;
    const toggle = el('button', { type: 'button', id: 'btnGuideMore', class: 'text-link', 'aria-expanded': String(open) }, open ? 'Fewer colors' : 'More colors');
    toggle.addEventListener('click', actions.toggleMore);
    body.push(toggle);
    if (open) {
      const extra = el('div', { class: 'guide-samples guide-more', role: 'group', 'aria-label': 'More colors' });
      for (const option of more) extra.append(sampleButton(ctx, option, current, { chip: true }));
      body.push(extra);
    }
  }
  const scopeKey = q.kind === 'sharedColor' ? q.role : SCOPE_KEY[q.kind];
  if (scopeKey) {
    const scope = el('div', { class: 'guide-scope' });
    host.appendScope(scope, scopeKey);
    body.push(scope);
  }
  return body;
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
  fitThumbnails(panel);
}
