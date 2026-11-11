// Writing lines for SPOKES handouts. Each <div class="lines" style="--n: 3">
// (or class="ruled" inside a box) gets one empty row per line, and the CSS
// draws each row's rule as a border. Borders print as crisp vector lines;
// the background gradients used before were flattened into images in the
// PDF and printed at uneven weights.
//
// packet.js calls fillWritingLines on each handout it places in a packet.
window.fillWritingLines = (root) => {
  for (const el of root.querySelectorAll('.lines, .ruled')) {
    const n = parseInt(getComputedStyle(el).getPropertyValue('--n'), 10) || 3;
    el.replaceChildren(...Array.from({ length: n }, () => document.createElement('i')));
  }
};
window.fillWritingLines(document);
