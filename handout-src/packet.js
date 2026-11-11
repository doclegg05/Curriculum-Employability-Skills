// Builds an "all handouts" packet from a lesson's separate handout pages, so
// each activity has one source and the packet can never drift from it.
//
// Usage, in a page that sits in the same folder as the handouts:
//   <main id="packet" data-parts="first.html second.html ..."></main>
//   <script src="../lines.js"></script>
//   <script src="../packet.js"></script>
//
// Each part goes into its own shadow root, so one handout's page styles
// cannot leak into another's. The packet page itself declares the lesson's
// @font-face rules (fonts are not loaded from inside a shadow root).
// <html data-packet> reads "loading", then "ready", or "error: <reason>";
// scripts/build-handouts.mjs waits for it before printing.
// Reads a sibling page as text. fetch() refuses file:// URLs even with
// --allow-file-access-from-files; XMLHttpRequest honors that switch. A file://
// read that succeeds reports status 0, so only a missing body counts as failure.
const readPart = (part) => new Promise((resolve, reject) => {
  const xhr = new XMLHttpRequest();
  xhr.open('GET', part);
  xhr.onload = () => {
    const ok = xhr.status === 200 || (xhr.status === 0 && xhr.responseText);
    if (ok) resolve(xhr.responseText);
    else reject(new Error(`${part} could not be loaded (${xhr.status})`));
  };
  xhr.onerror = () => reject(new Error(`${part} could not be loaded`));
  xhr.send();
});

(async () => {
  const html = document.documentElement;
  const host = document.getElementById('packet');
  html.dataset.packet = 'loading';
  try {
    const parts = (host.dataset.parts || '').split(/\s+/).filter(Boolean);
    if (!parts.length) throw new Error('data-parts lists no handouts');
    for (const [index, part] of parts.entries()) {
      const doc = new DOMParser().parseFromString(await readPart(part), 'text/html');
      const box = document.createElement('div');
      box.className = 'packet-part';
      box.dataset.part = part;
      const shadow = box.attachShadow({ mode: 'open' });
      for (const el of doc.head.querySelectorAll('link[rel="stylesheet"], style')) shadow.append(el.cloneNode(true));
      // A handout's last sheet does not force a page break; in a packet the
      // next handout must still start on a new page.
      if (index < parts.length - 1) {
        const breakAfter = document.createElement('style');
        breakAfter.textContent = '.sheet:last-child { page-break-after: always; break-after: page; }';
        shadow.append(breakAfter);
      }
      const main = doc.querySelector('main');
      if (!main) throw new Error(`${part} has no <main>`);
      shadow.append(document.importNode(main, true));
      host.append(box);
      await Promise.all([...shadow.querySelectorAll('link[rel="stylesheet"]')].map((link) => (
        link.sheet ? null : new Promise((resolve) => { link.onload = resolve; link.onerror = resolve; })
      )));
      window.fillWritingLines(shadow);
    }
    html.dataset.packet = 'ready';
  } catch (error) {
    html.dataset.packet = `error: ${error.message}`;
  }
})();
