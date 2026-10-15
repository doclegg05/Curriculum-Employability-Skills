import * as Model from '../builder-model.mjs';
import { questionCopy } from './copy.mjs';
import { advance, back, buildQuestions, byIdMap, jumpToQuestion, jumpToSection, normalizeGuide, questionAt, skipSection, startGuide } from './questions.mjs';
import { applyAnswer } from './answers.mjs';
import { renderGuide } from './screens.mjs';

export function createGuide(host) {
  const catalog = host.catalog;
  const all = buildQuestions(catalog);
  const byId = byIdMap(all);
  let lastIndex = -1;
  let moreFor = null;
  let focusHeading = false;

  const set = (guide) => { host.setGuide(guide); };
  const get = () => host.getGuide();

  const afterMove = (guide) => {
    set(guide);
    if (guide.done) host.finish();
    else host.rerender();
  };

  const actions = {
    next: () => afterMove(advance(get())),
    toggleMore: () => { const q = questionAt(get(), byId); moreFor = moreFor === q.id ? null : q.id; host.rerender(); },
    back: () => { focusHeading = get().index === 1; afterMove(back(get())); },
    skipSection: () => afterMove(skipSection(get(), byId)),
    jumpSection: (id) => { focusHeading = true; afterMove(jumpToSection(get(), id, byId)); },
    jumpQuestion: (id) => { focusHeading = true; afterMove(jumpToQuestion(get(), id)); },
    exit: () => {
      const g = get();
      const q = questionAt(g, byId);
      set({ ...g, on: false });
      host.exitToEditor(['start', 'shared'].includes(q.section) ? 'title' : q.section);
    },
    choose: (option) => {
      const q = questionAt(get(), byId);
      if (q.kind === 'preset') { host.requestPreset(option.id); return; }
      const label = `${questionCopy(q).title}: ${option.label}`;
      host.change(label, (d) => Object.assign(d, applyAnswer(catalog, host.design, q, option.id)));
    }
  };

  return {
    allQuestions: all,
    normalize: (raw) => normalizeGuide(raw, all),
    start() { set(startGuide(buildQuestions(catalog, { teamComplete: host.teamComplete() }))); host.openGuide(); },
    resume() { set({ ...get(), on: true }); host.openGuide(); },
    render(panel) {
      const guide = get();
      const q = byId.get(guide.ids[guide.index]);
      host.setView(q.view);
      const moved = lastIndex !== guide.index;
      lastIndex = guide.index;
      renderGuide(panel, { guide, q, byId, catalog, host, actions, Model, moreOpen: moreFor === q.id });
      // The preview writes its own live text during render, so announce the question just after it.
      if (focusHeading) { focusHeading = false; panel.querySelector('h1')?.focus({ preventScroll: true }); }
      if (moved) setTimeout(() => host.announce(`Question ${guide.index + 1} of ${guide.ids.length}: ${questionCopy(q).title}`), 60);
    }
  };
}
