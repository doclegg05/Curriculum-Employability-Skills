import { ROLE_STYLE_KINDS } from '../builder-model.mjs';

export const SECTIONS = [
  { id: 'start', label: 'Starting look' },
  { id: 'shared', label: 'Shared look' },
  { id: 'title', label: 'Title slide' },
  { id: 'divider', label: 'Chapter divider' },
  { id: 'cards', label: 'Text boxes' },
  { id: 'video', label: 'Video slide' },
  { id: 'activity', label: 'Activity' }
];

const SHARED_VIEW = { fontPairing: 'title', pattern: 'cards', sidebar: 'cards', accent: 'cards', button: 'video' };
const NOT_ASKED = ['colors', 'watermark'];

export function buildQuestions(catalog, { teamComplete = false } = {}) {
  const out = [];
  const add = (q) => out.push(Object.freeze(q));
  if (!teamComplete) add({ id: 'team', section: 'start', kind: 'team', view: 'title' });
  add({ id: 'preset', section: 'start', kind: 'preset', view: 'title' });
  add({ id: 'shared.fonts', section: 'shared', kind: 'fontPairing', view: SHARED_VIEW.fontPairing });
  add({ id: 'shared.pattern', section: 'shared', kind: 'pattern', view: SHARED_VIEW.pattern });
  for (const role of ['sidebar', 'accent', 'button']) {
    add({ id: `shared.${role}`, section: 'shared', kind: 'sharedColor', role, view: SHARED_VIEW[role] });
  }
  for (const kind of ROLE_STYLE_KINDS) {
    const group = catalog.slideGroups.find((g) => g.id === kind);
    const decisions = group.decisions.filter((x) => !NOT_ASKED.includes(x.id));
    // Layout is asked first, except for Text boxes: a box layout only looks different once the number of boxes is set.
    const first = kind === 'cards' ? ['count', 'layout'] : ['layout'];
    const ordered = [...first.map((id) => decisions.find((d) => d.id === id)), ...decisions.filter((d) => !first.includes(d.id))];
    for (const d of ordered) {
      add({ id: `${kind}.${d.id}`, section: kind, kind: 'decision', group: kind, decision: d.id, view: kind });
    }
    add({ id: `${kind}.background`, section: kind, kind: 'background', slide: kind, view: kind });
    add({ id: `${kind}.heading`, section: kind, kind: 'textColor', slide: kind, field: 'headingColor', view: kind });
    // The model hides video body text by default (roleStyleDefaults), so a color for it would change nothing visible.
    if (kind !== 'video') add({ id: `${kind}.text`, section: kind, kind: 'textColor', slide: kind, field: 'bodyColor', view: kind });
    if (kind === 'divider') add({ id: 'divider.watermark', section: 'divider', kind: 'watermark', slide: 'divider', view: 'divider' });
    add({ id: `${kind}.recap`, section: kind, kind: 'recap', slide: kind, view: kind });
  }
  return Object.freeze(out);
}

export const byIdMap = (questions) => new Map(questions.map((q) => [q.id, q]));

export const startGuide = (questions) => ({ ids: questions.map((q) => q.id), index: 0, furthest: 0, on: true, done: false });

export function normalizeGuide(raw, allQuestions) {
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.ids)) return null;
  const known = new Set(allQuestions.map((q) => q.id));
  const ids = raw.ids.filter((id) => typeof id === 'string' && known.has(id));
  if (!ids.length) return null;
  const clamp = (n) => (Number.isInteger(n) ? Math.min(Math.max(n, 0), ids.length - 1) : 0);
  const index = clamp(raw.index);
  return { ids, index, furthest: Math.max(index, clamp(raw.furthest)), on: raw.on === true, done: raw.done === true };
}

export const questionAt = (guide, byId) => byId.get(guide.ids[guide.index]);

export function advance(guide) {
  if (guide.index >= guide.ids.length - 1) return { ...guide, on: false, done: true };
  const index = guide.index + 1;
  return { ...guide, index, furthest: Math.max(guide.furthest, index) };
}

export const back = (guide) => ({ ...guide, index: Math.max(0, guide.index - 1) });

export function sectionsOf(guide, byId) {
  const list = [];
  guide.ids.forEach((id, i) => {
    const section = byId.get(id).section;
    if (!list.some((s) => s.id === section)) {
      list.push({ id: section, label: SECTIONS.find((s) => s.id === section).label, firstIndex: i });
    }
  });
  const current = questionAt(guide, byId).section;
  return list.map((s) => ({ ...s, reached: s.firstIndex <= guide.furthest, current: s.id === current }));
}

export function jumpToSection(guide, sectionId, byId) {
  const target = sectionsOf(guide, byId).find((s) => s.id === sectionId);
  return target && target.reached ? { ...guide, index: target.firstIndex } : guide;
}

export function jumpToQuestion(guide, id) {
  const i = guide.ids.indexOf(id);
  return i < 0 || i > guide.furthest ? guide : { ...guide, index: i };
}

export function skipSection(guide, byId) {
  const current = questionAt(guide, byId).section;
  const next = guide.ids.findIndex((id, i) => i > guide.index && byId.get(id).section !== current);
  if (next < 0) return { ...guide, on: false, done: true };
  return { ...guide, index: next, furthest: Math.max(guide.furthest, next) };
}
