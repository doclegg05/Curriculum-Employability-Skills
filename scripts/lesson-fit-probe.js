// Runs inside a lesson page. Measures whether each slide fits its screen and
// stays clear of the corner logo and the navigation hint. Loaded by
// scripts/check-lesson-fit.mjs; attaches window.spokesFit.
//
// Everything after prepare() is synchronous: the lesson's cross-fade and
// entrance animations are switched off first, so a slide can be measured the
// moment it is shown.
(() => {
  const CONTENT = 'img,video,canvas,svg,button,input,select,textarea,iframe';
  const PRESS = 'button, [role="tab"], [role="button"], [onclick], summary';
  const slides = () => [...document.querySelectorAll('.slide')];
  const current = () => slides().findIndex((s) => s.classList.contains('active'));
  const key = (k) => document.body.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
  // getAttribute, not className: on an SVG element className is an object.
  const name = (el) => (el.getAttribute('class') || '').split(' ')[0] || el.tagName.toLowerCase();

  // Hidden slides never fetch their lazy images, and an image with no size yet
  // measures as zero tall, so everything is loaded before anything is measured.
  async function prepare({ sidebar = 'open' } = {}) {
    document.startViewTransition = undefined;
    const style = document.createElement('style');
    style.textContent = '*,*::before,*::after{animation:none!important;transition:none!important}';
    document.head.appendChild(style);
    const images = [...document.querySelectorAll('img')];
    images.forEach((image) => { image.loading = 'eager'; });
    await Promise.all(images.map((image) => (image.complete ? null : new Promise((done) => { image.onload = image.onerror = done; }))));
    await Promise.all([...document.fonts].map((face) => face.load().catch(() => null)));
    const toggle = document.getElementById('sidebarToggle');
    if (sidebar === 'closed' && toggle && toggle.getAttribute('aria-expanded') === 'true') toggle.click();
    window.print = () => {};
    window.open = () => null;
    window.alert = () => {};
    return slides().length;
  }

  function goTo(number) {
    const total = slides().length;
    for (let i = 0; i < total + 2 && current() > number - 1; i++) key('ArrowLeft');
    for (let i = 0; i < total + 2 && current() < number - 1; i++) key('ArrowRight');
    return current() === number - 1;
  }

  // The part of an element a person can see: its box cut down by every
  // ancestor that clips or scrolls (a closed accordion panel, a scroll area).
  function visibleRect(el, slide) {
    const box = el.getBoundingClientRect();
    let { left, top, right, bottom } = box;
    for (let p = el.parentElement; p && p !== slide; p = p.parentElement) {
      const cs = getComputedStyle(p);
      if (cs.overflowX === 'visible' && cs.overflowY === 'visible') continue;
      const q = p.getBoundingClientRect();
      if (cs.overflowX !== 'visible') { left = Math.max(left, q.left); right = Math.min(right, q.right); }
      if (cs.overflowY !== 'visible') { top = Math.max(top, q.top); bottom = Math.min(bottom, q.bottom); }
    }
    if (right - left < 1 || bottom - top < 1) return null;
    // How much of the element an ancestor hides. Wholly hidden is by design
    // (returned as null above); partly hidden is text cut off in its box.
    const cut = Math.max(box.bottom - bottom, top - box.top, box.right - right, left - box.left);
    return { left, top, right, bottom, cut };
  }

  // Elements that carry something a person reads or uses.
  function contentRects(slide) {
    const out = [];
    const walker = document.createTreeWalker(slide, NodeFilter.SHOW_ELEMENT);
    for (let el = walker.nextNode(); el; el = walker.nextNode()) {
      if (!el.getClientRects().length) continue;
      const ownText = [...el.childNodes].some((n) => n.nodeType === 3 && n.nodeValue.trim().length > 1);
      if (!ownText && !el.matches(CONTENT)) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.opacity === '0') continue;
      if (el.closest('.sr-only,.skip-link,[aria-hidden="true"]') && !el.matches('img,video,canvas')) continue;
      const rect = visibleRect(el, slide);
      if (rect) out.push({ el, rect, ownText });
    }
    return out;
  }

  // What is wrong with one slide as it stands, as a short phrase, or ''.
  // A slide that scrolls is over when it has something to scroll. A slide that
  // clips is over when content is cut by its edge (a clipped decorative layer
  // does not count). Text partly hidden by a box inside the slide, such as a
  // card too short for its words, is reported too.
  function problem(slide) {
    const cs = getComputedStyle(slide);
    const frame = slide.getBoundingClientRect();
    const rects = contentRects(slide);
    const clips = /hidden|clip/.test(cs.overflowY);
    let down = 0, across = 0, worst = '';
    for (const { el, rect } of rects) {
      const dy = Math.max(rect.bottom - frame.bottom, frame.top - rect.top);
      if (dy > down) { down = dy; worst = name(el); }
      across = Math.max(across, rect.right - frame.right, frame.left - rect.left);
    }
    if (!clips) {
      down = Math.max(down, slide.scrollHeight - slide.clientHeight);
      across = Math.max(across, slide.scrollWidth - slide.clientWidth);
    }
    let cut = 0, cutIn = '';
    for (const { el, rect, ownText } of rects) {
      if (ownText && rect.cut > cut) { cut = rect.cut; cutIn = name(el); }
    }
    const parts = [];
    if (cut > 3) parts.push(`${Math.round(cut)}px of text cut off inside its box (${cutIn})`);
    if (down > 2) parts.push(`${Math.round(down)}px past the bottom (${worst || 'content'})`);
    if (across > 2) parts.push(`${Math.round(across)}px past the side`);
    for (const [selector, label] of [['.branding-logo', 'corner logo'], ['.nav-hint', 'navigation hint']]) {
      const piece = document.querySelector(selector);
      if (!piece || !piece.getClientRects().length) continue;
      const p = piece.getBoundingClientRect();
      let under = 0, what = '';
      for (const { el, rect } of rects) {
        const w = Math.min(rect.right, p.right) - Math.max(rect.left, p.left);
        const h = Math.min(rect.bottom, p.bottom) - Math.max(rect.top, p.top);
        if (w > 2 && h > 2 && h > under) { under = h; what = name(el); }
      }
      if (under) parts.push(`${Math.round(under)}px under the ${label} (${what})`);
    }
    return parts.join(', ');
  }

  const pressable = (slide) => [...slide.querySelectorAll(PRESS)].filter((el) => el.getClientRects().length
    && !el.matches('a[href], .cc-toggle, .download-btn') && !el.closest('.video-toolbar')
    && !/print|window\.open|location/i.test(el.getAttribute('onclick') || ''));

  // Every slide at rest. Returns [{ slide, problem }] and the slides that
  // have something to press.
  function checkRest() {
    const all = slides(), problems = [], interactive = [];
    goTo(1);
    for (let i = 0; i < all.length; i++) {
      if (current() !== i) problems.push({ slide: i + 1, problem: 'the arrow keys did not reach this slide' });
      const found = problem(all[i]);
      if (found) problems.push({ slide: i + 1, problem: found });
      if (pressable(all[i]).length) interactive.push(i + 1);
      if (i < all.length - 1) key('ArrowRight');
    }
    return { total: all.length, problems, interactive };
  }

  // One slide's controls, for the caller to press with real clicks.
  function controls(number) {
    goTo(number);
    const found = pressable(slides()[number - 1]);
    found.forEach((el, i) => el.setAttribute('data-fit-control', String(i + 1)));
    return found.length;
  }

  const slideProblem = (number) => (current() === number - 1 ? problem(slides()[number - 1]) : 'pressing a control left the slide');

  window.spokesFit = { prepare, checkRest, controls, slideProblem };
})();
