/**
 * Make it yours: the band above the slide holds the toolbar and the shared-color line. Both change height with
 * the selection (a second toolbar row for text, a line that comes and goes), which used to move and resize the
 * slide under the pointer. The band now keeps the tallest height it has needed at the current width, so the
 * slide stays where it is. A different width starts again, because the toolbar wraps differently there.
 */

/**
 * The height to hold. Pure: no DOM.
 * @param {object} facts
 * @param {{width: number, height: number}|null} facts.held what the band holds now
 * @param {number} facts.width the band's width in px
 * @param {number} facts.content the height its contents need in px (0 when the toolbar is elsewhere)
 * @returns {{width: number, height: number}}
 */
export function heldBand({ held, width, content }) {
  if (!content || !held || held.width !== width) return { width, height: content };
  return { width, height: Math.max(held.height, content) };
}

// The height the band's visible children take, from its top edge to the bottom of the last one.
function contentHeight(band) {
  const shown = [...band.children].filter(child => !child.hidden && child.getClientRects().length);
  if (!shown.length) return 0;
  // Not rounded: a band held even a fraction taller than its contents would nudge the slide by a pixel.
  return shown.at(-1).getBoundingClientRect().bottom - band.getBoundingClientRect().top;
}

/** Holds `band` at its tallest content height for the current width. Call once. */
export function holdBand(band) {
  if (!band) return;
  let held = null;
  const update = () => {
    held = heldBand({ held, width: band.clientWidth, content: contentHeight(band) });
    const wanted = held.height ? `${held.height}px` : '';
    if (band.style.minHeight !== wanted) band.style.minHeight = wanted;
  };
  // The toolbar is rebuilt in place and the line is shown or hidden, so watch each child's size and the list itself.
  const sizes = new ResizeObserver(update);
  const watchChildren = () => { sizes.disconnect(); for (const child of band.children) sizes.observe(child); update(); };
  new MutationObserver(watchChildren).observe(band, { childList: true });
  addEventListener('resize', update);
  watchChildren();
}
