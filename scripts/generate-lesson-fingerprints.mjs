// Re-measure the six actual released decks. No registry preset aliases, nearest
// colors, remote requests, persistent browser state, or application server.
// Usage: node scripts/generate-lesson-fingerprints.mjs [--check]
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import { CHARACTERISTICS } from '../bespoke/similarity.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (name) => JSON.parse(fs.readFileSync(path.join(root, name), 'utf8'));
const hash = (name) => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, name))).digest('hex');
const catalog = read('bespoke/builder-catalog.json');
const decks = read('lesson-registry.json').lessons.filter((d) => d.path && fs.existsSync(path.join(root, d.path))).sort((a, b) => a.id.localeCompare(b.id));
if (decks.length !== 6) throw new Error(`Expected six existing reference lessons; found ${decks.length}. Review the comparison library before regenerating.`);
const browser = await chromium.launch();
const result = {
  version: 2,
  generatedBy: 'scripts/generate-lesson-fingerprints.mjs',
  method: 'Exact catalog choices from rendered computed styles and geometry at 1280 x 720. Standard text-box measurements require agreement across every .cards-grid > .card group. Mixed, custom, translucent, photo-backed and off-palette values remain unknown. No nearest-color or pixel-similarity approximation.',
  ranking: 'Most shared measured characteristics; comparable counts vary by reference. Advisory only.',
  limits: 'This library contains six released local lessons, not other teams\' private designs. Custom remix cards, video/activity variants, and operating-system font fallbacks are not mapped. A shared content heading means a heading above the boxes, not an identical decorated title bar.',
  viewport: { width: 1280, height: 720 },
  lessons: [],
};

try {
  const context = await browser.newContext({ viewport: result.viewport, reducedMotion: 'reduce', serviceWorkers: 'block' });
  // file:// loads are local. Any embedded external media or telemetry is denied.
  await context.route(/^https?:\/\//, (route) => route.abort());
  const page = await context.newPage();
  for (const deck of decks) {
    await page.goto(pathToFileURL(path.join(root, deck.path)).href, { waitUntil: 'load' });
    await page.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important;}' });
    await page.evaluate(() => document.fonts.ready);
    const measured = await page.evaluate(({ palette, fonts, keys, rootUrl }) => {
      const values = {}, evidence = {};
      const selectors = (selector, within = document) => [...within.querySelectorAll(selector)];
      const css = (element, pseudo) => getComputedStyle(element, pseudo);
      const clean = (value) => typeof value === 'string' ? value.replaceAll(rootUrl, '') : value;
      const unique = (items) => [...new Set(items.map((v) => JSON.stringify(v)))].map((v) => JSON.parse(v));
      const record = (key, value, selector, observed, reason = null) => {
        values[key] = value;
        evidence[key] = { selector, observed: unique(observed.map(clean)), ...(reason ? { reason } : {}) };
      };
      const paletteByRgb = new Map(palette.map((p) => [p.hex.toLowerCase(), p.id]));
      const colorId = (color) => {
        const match = color.match(/^rgba?\(([^)]+)\)$/);
        if (!match) return null;
        const [r, g, b, a = 1] = match[1].split(',').map(Number);
        if (a !== 1) return null;
        return paletteByRgb.get('#' + [r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')) || null;
      };
      const consensus = (key, selector, items, reason = 'The reference uses mixed or unsupported values for this characteristic.') => {
        const defined = unique(items.map((item) => item.value));
        const value = items.length && defined.length === 1 && defined[0] != null ? defined[0] : null;
        record(key, value, selector, items.map((item) => item.observed), value == null ? (items.length ? reason : 'No comparable element exists in this reference lesson.') : null);
      };
      const color = (key, selector, property = 'color') => consensus(key, selector,
        selectors(selector).map((el) => ({ value: colorId(css(el)[property]), observed: css(el)[property] })),
        'The colors vary, use transparency, or are outside the eleven exact brand swatches.');
      const surface = (key, selector) => consensus(key, selector, selectors(selector).map((el) => ({
        value: css(el).backgroundImage === 'none' ? colorId(css(el).backgroundColor) : null,
        observed: `${css(el).backgroundColor}; ${clean(css(el).backgroundImage)}`,
      })), 'A gradient, photo, overlay, transparent surface, off-palette color, or mixed surfaces has no single exact swatch.');
      const firstFont = (el) => css(el).fontFamily.split(',')[0].replace(/["']/g, '').trim();
      const font = (key, selector) => consensus(key, selector, selectors(selector).map((el) => {
        const family = firstFont(el), found = fonts.find((f) => f.family === family);
        return { value: found && document.fonts.check(`16px "${family}"`) ? found.id : null, observed: css(el).fontFamily };
      }), 'Font declarations differ or begin with a family outside the catalog. Platform fallback is not treated as a known catalog font.');
      const title = document.querySelector('.slide-title');
      const contentSelector = '.slide:not(.slide-title):not(.slide-section):not(.slide-closing):not(.slide-video):not(.big-statement)';
      const slides = selectors('.slide');
      const show = (slide) => { for (const s of slides) s.classList.toggle('active', s === slide); };
      color('roles.titleText', '.slide-title h1');
      color('roles.subtitle', '.slide-title .subtitle');
      color('dividerText.heading', '.slide-section h2');
      color('dividerText.supporting', '.slide-section .chapter-label, .slide-section p');
      color('roles.heading', `${contentSelector} h2`);
      color('roles.body', `${contentSelector} p, ${contentSelector} li`);
      surface('roles.sidebar', '.sidebar');
      surface('roles.button', '.slide .download-btn');
      font('fonts.heading', '.slide-title h1');
      font('fonts.body', `${contentSelector} p, ${contentSelector} li`);

      // Ignore texture layers when the solid content base is an exact color;
      // the texture is measured separately. A gradient has no exact solid base.
      const main = document.querySelector('.main');
      const mainStyle = main ? css(main) : null;
      record('roles.contentBackground', mainStyle ? colorId(mainStyle.backgroundColor) : null, '.main background-color', mainStyle ? [mainStyle.backgroundColor] : [], 'No exact opaque brand base color when null.');
      if (values['roles.contentBackground'] != null) delete evidence['roles.contentBackground'].reason;
      const bg = mainStyle?.backgroundImage || 'none';
      let pattern = null;
      if (bg === 'none') pattern = 'plain';
      else if (bg.includes('repeating-linear-gradient(45deg')) pattern = 'diagonal';
      else if (bg.includes('radial-gradient') && !bg.includes('url(')) pattern = 'dot-grid';
      else if ((bg.match(/linear-gradient/g) || []).length === 2 && bg.includes('1px') && bg.includes('90deg')) pattern = 'crosshatch';
      else if ((bg.match(/linear-gradient/g) || []).length === 1 && !bg.includes('url(') && !bg.includes('repeating-') && !bg.includes('1px')) pattern = 'soft-gradient';
      record('background', pattern, '.main background-image', [clean(bg)], pattern == null ? 'Custom or layered background does not match a supported single pattern.' : null);

      if (title) {
        show(title);
        const ts = css(title), tr = title.getBoundingClientRect();
        const h = title.querySelector('h1'), hr = h?.getBoundingClientRect();
        const before = css(title, '::before'), after = css(title, '::after');
        const split = [before, after].every((p) => p.position === 'absolute' && parseFloat(p.height) > tr.height * .9 && parseFloat(p.width) > tr.width * .25 && parseFloat(p.width) < tr.width * .75);
        const layout = split ? 'split' : css(h).textAlign === 'center' ? 'center' : hr.top > tr.top + tr.height * .55 ? 'bottom' : 'left';
        record('slides.title.layout', layout, '.slide-title h1 and ::before/::after geometry', [`text-align:${css(h).textAlign}; split-panels:${split}; title-in-lower-half:${hr.top > tr.top + tr.height * .55}`]);
        const logo = title.querySelector('.logo');
        const lr = logo?.getBoundingClientRect();
        const logoValue = !logo || !lr.width || !lr.height ? null : css(logo).position === 'absolute' && lr.top < tr.top + tr.height * .3 && (lr.left < tr.left + tr.width * .3 || lr.right > tr.right - tr.width * .3) ? 'corner' : lr.bottom <= hr.top + 4 ? 'above' : null;
        record('slides.title.logo', logoValue, '.slide-title .logo geometry relative to h1', [logo ? `position:${css(logo).position}; above-title:${lr.bottom <= hr.top + 4}` : 'absent'], logoValue == null ? 'Logo placement is absent or has no equivalent supported position.' : null);
        const image = split ? `${before.backgroundImage}, ${after.backgroundImage}` : ts.backgroundImage;
        const colors = /url\(/.test(image) ? null : image.includes('gradient') ? 'gradient' : colorId(ts.backgroundColor) ? 'solid' : null;
        record('slides.title.colors', colors, '.slide-title background and split panels', [clean(image)], colors == null ? 'Photo/composite title has no equivalent one-color or two-color finish.' : null);
        const stops = image.match(/rgba?\([^)]+\)/g) || [];
        // A split right panel with its own gradient has three colors, not the
        // builder's single right color. Keep that second role unknown.
        record('roles.titleBackground', split ? colorId(before.backgroundColor) : colors === 'solid' ? colorId(ts.backgroundColor) : colors === 'gradient' && unique(stops).length === 2 ? colorId(stops[0]) : null,
          '.slide-title background / first gradient stop / left split panel', [clean(split ? before.backgroundColor : ts.backgroundImage === 'none' ? ts.backgroundColor : ts.backgroundImage)], 'No single exact first color when null (photo, transparency or more than two stops).');
        record('roles.titleBackgroundEnd', !split && colors === 'gradient' && unique(stops).length === 2 ? colorId(stops.at(-1)) : null,
          '.slide-title last gradient stop', [clean(image)], 'No comparable second color: solid, photo, multi-color split panel, or unsupported gradient.');
        for (const key of ['roles.titleBackground', 'roles.titleBackgroundEnd']) if (values[key] != null) delete evidence[key].reason;
      }

      const dividers = selectors('.slide-section');
      const dividerMeasurements = dividers.map((slide) => {
        show(slide);
        const s = css(slide), h = slide.querySelector('h2'), r = slide.getBoundingClientRect();
        const mark = css(slide, '::after');
        const markShown = !['none', 'normal', '""'].includes(mark.content) && mark.display !== 'none' && Number(mark.opacity) > 0;
        const image = s.backgroundImage;
        // Several remixed decks reserve roughly half the slide for a separate
        // illustrated panel. They are not the builder's ordinary left/center
        // arrangements even when their heading text uses that alignment.
        const customPanel = parseFloat(s.paddingLeft) > r.width * .3;
        return {
          layout: h && !customPanel ? (css(h).textAlign === 'center' ? 'center' : 'left') : null,
          watermark: markShown ? 'show' : 'hide',
          colors: image.includes('url(') ? null : image.includes('gradient') ? 'gradient' : colorId(s.backgroundColor) ? 'solid' : null,
          background: image === 'none' ? colorId(s.backgroundColor) : null,
          observed: `${clean(image)}; ${s.backgroundColor}; text-align:${h ? css(h).textAlign : 'missing'}; custom-side-panel:${customPanel}; watermark:${markShown}; frame:${Math.round(r.width)}x${Math.round(r.height)}`,
        };
      });
      for (const field of ['layout', 'watermark', 'colors']) consensus(`slides.divider.${field}`, '.slide-section (every chapter)', dividerMeasurements.map((m) => ({ value: m[field], observed: m.observed })));
      consensus('roles.dividerBackground', '.slide-section background (every chapter)', dividerMeasurements.map((m) => ({ value: m.background, observed: m.observed })), 'Chapter backgrounds vary or are gradients, photos, overlays or off-palette colors.');

      // Measure actual standard card groups across every slide. Never infer a
      // current style from the historic chapterStyles registry.
      const groups = selectors('.cards-grid').filter((g) => g.querySelector(':scope > .card'));
      const measuredGroups = groups.map((group) => {
        const slide = group.closest('.slide'); show(slide);
        const cards = selectors(':scope > .card', group), boxes = cards.map((c) => c.getBoundingClientRect());
        const columns = unique(boxes.map((r) => Math.round(r.left))), rows = unique(boxes.map((r) => Math.round(r.top)));
        const layout = columns.length === 1 ? 'rows' : rows.length === 1 ? 'columns' : 'grid';
        const look = cards.map((card) => {
          const c = css(card), widths = ['Left', 'Top', 'Right', 'Bottom'].map((side) => parseFloat(c[`border${side}Width`]));
          if (widths[0] >= 3 && widths[0] > Math.max(...widths.slice(1))) return 'rail';
          if (widths[1] >= 3 && widths[1] > Math.max(widths[0], widths[2], widths[3])) return 'band';
          if (widths.every((w) => w > 0 && w === widths[0]) && c.backgroundImage === 'none') return 'outline';
          // Filled cards require an exact opaque color, not a glass/photo/tint.
          if (widths.every((w) => w === 0) && colorId(c.backgroundColor) && c.backgroundImage === 'none') return 'filled';
          return null;
        });
        const treatment = cards.map((c) => c.querySelector('ol') ? 'numbered' : c.querySelector('ul') ? 'bullets' : c.querySelector('p') ? 'paragraph' : null);
        const heading = [...slide.querySelectorAll('h2')].find((h) => !group.contains(h) && h.getBoundingClientRect().bottom <= group.getBoundingClientRect().top + 2);
        const accents = cards.map((c) => { const st = css(c); const side = parseFloat(st.borderLeftWidth) >= 3 ? 'Left' : parseFloat(st.borderTopWidth) >= 3 ? 'Top' : null; return side ? colorId(st[`border${side}Color`]) : null; });
        return { count: cards.length <= 4 ? String(cards.length) : null, titleBar: Boolean(heading), layout,
          treatment: unique(treatment).length === 1 ? treatment[0] : null,
          look: unique(look).length === 1 ? look[0] : null,
          accent: unique(accents).length === 1 ? accents[0] : null,
          observed: `slide ${slides.indexOf(slide) + 1}: count=${cards.length}, arrangement=${layout}, shared-heading=${Boolean(heading)}, edges=${look.join('/')}, text=${treatment.join('/')}, accents=${accents.join('/')}`,
        };
      });
      for (const field of ['count', 'titleBar', 'treatment', 'look', 'layout']) consensus(`slides.cards.${field}`, '.cards-grid > .card (every standard group)', measuredGroups.map((m) => ({ value: m[field], observed: m.observed })), 'Standard text-box groups vary across the lesson or use an unsupported style. Custom remix components are not counted.');
      consensus('roles.accent', '.cards-grid > .card dominant left/top border', measuredGroups.map((m) => ({ value: m.accent, observed: m.observed })), 'Card accents vary or have no single comparable exact accent color.');
      for (const key of keys) if (!(key in values)) record(key, null, 'Not mapped', [], 'This slide role uses custom reference markup; no reliable mapping to the builder option has been measured.');
      return { values, evidence };
    }, { palette: catalog.palette, fonts: catalog.fonts, keys: CHARACTERISTICS.map((c) => c.key), rootUrl: pathToFileURL(root + '/').href });
    const lesson = { id: deck.id.replace(/^lesson-/, ''), title: deck.title, source: { path: deck.path, sha256: hash(deck.path), status: deck.status }, roles: {}, fonts: {}, background: null, slides: {}, evidence: measured.evidence };
    for (const [key, value] of Object.entries(measured.values)) {
      const parts = key.split('.'); let object = lesson;
      for (const part of parts.slice(0, -1)) object = object[part] ||= {};
      object[parts.at(-1)] = value;
    }
    result.lessons.push(lesson);
  }
  await context.close();
} finally { await browser.close(); }

const output = path.join(root, 'bespoke/lesson-fingerprints.json');
const text = JSON.stringify(result, null, 2) + '\n';
if (process.argv.includes('--check')) {
  if (!fs.existsSync(output) || fs.readFileSync(output, 'utf8') !== text) {
    console.error('Lesson fingerprints differ from the rendered references. Run node scripts/generate-lesson-fingerprints.mjs and review the changes.');
    process.exitCode = 1;
  } else console.log('Lesson fingerprints match all six current reference decks.');
} else {
  fs.writeFileSync(output, text);
  console.log(`Measured ${result.lessons.length} reference lessons without remote network access.`);
}
