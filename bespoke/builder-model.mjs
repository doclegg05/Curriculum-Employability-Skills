/** Shared, deterministic BeSpoke model. No DOM, storage, network or hidden defaults. */
const clone = value => JSON.parse(JSON.stringify(value));
const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const kebab = value => value.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
const findColor = (catalog, id) => catalog.palette.find(color => color.id === id);
const rgb = hex => [1, 3, 5].map(index => parseInt(hex.slice(index, index + 2), 16));
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
// Keep the existing UTF-16 length limits without cutting a Unicode surrogate pair.
const truncateSample = (value, limit) => {
  const text = value.slice(0, limit);
  return /[\uD800-\uDBFF]$/.test(text) && /[\uDC00-\uDFFF]/.test(value.charAt(text.length)) ? text.slice(0, -1) : text;
};

export function contrast(first, second) {
  const luminance = hex => rgb(hex).map(v => v / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4).reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0);
  const values = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (values[0] + .05) / (values[1] + .05);
}

export function inkFor(catalog, id) {
  const surface = findColor(catalog, id);
  if (!surface) throw new Error(`Unknown brand color: ${id}`);
  return contrast(findColor(catalog, 'light').hex, surface.hex) >= contrast(findColor(catalog, 'royal').hex, surface.hex) ? 'light' : 'royal';
}

const blend = (base, ink, alpha) => '#' + rgb(base).map((v, channel) => Math.round(v * (1 - alpha) + rgb(ink)[channel] * alpha).toString(16).padStart(2, '0')).join('');

/** Decorative ink adapts to the surface; saved base/text colors are never modified. */
export function patternFor(catalog, design, surface) {
  const id = design.background;
  if (!catalog.backgrounds.some(item => item.id === id)) throw new Error('Unknown background pattern.');
  const peaks = { plain: 0, 'dot-grid': .2, diagonal: .18, crosshatch: 1 - (1 - .14) ** 2, 'soft-gradient': .24 };
  const base = findColor(catalog, design.roles[surface]).hex;
  const gradient = surface === 'titleBackground' ? design.slides.title.colors === 'gradient' || design.slides.title.layout === 'split' : surface === 'dividerBackground' && design.slides.divider.colors === 'gradient';
  const bases = gradient ? gradientSamples(base, findColor(catalog, design.roles.titleBackgroundEnd).hex) : [base];
  const foregrounds = surface === 'contentBackground' ? [] : [['titleText', 3], ['subtitle', 4.5]].map(([role, minimum]) => ({ hex: findColor(catalog, design.roles[role]).hex, minimum }));
  let ink = findColor(catalog, inkFor(catalog, design.roles[surface])).hex;
  // Prefer visible ink, but choose its opposite when that keeps already-readable
  // title/divider text readable (especially White lettering over a Blue gradient).
  const preservesReadability = candidate => foregrounds.every(({ hex, minimum }) => bases.every(bg => contrast(hex, bg) < minimum || Array.from({ length: 9 }, (_, i) => contrast(hex, blend(bg, candidate, peaks[id] * i / 8))).every(ratio => ratio >= minimum)));
  const opposite = findColor(catalog, ink === findColor(catalog, 'light').hex ? 'royal' : 'light').hex;
  if (!preservesReadability(ink) && preservesReadability(opposite)) ink = opposite;
  const tint = alpha => `rgba(${rgb(ink).join(', ')}, ${alpha})`;
  const patterns = {
    plain: { images: [], sizes: [] },
    'dot-grid': { images: [`radial-gradient(circle, ${tint(.2)} 2.5px, transparent 3px)`], sizes: ['24px 24px'] },
    diagonal: { images: [`repeating-linear-gradient(135deg, ${tint(.18)} 0 2px, transparent 2px 22px)`], sizes: ['auto'] },
    crosshatch: { images: [`linear-gradient(${tint(.14)} 1.5px, transparent 1.5px)`, `linear-gradient(90deg, ${tint(.14)} 1.5px, transparent 1.5px)`], sizes: ['32px 32px', '32px 32px'] },
    'soft-gradient': { images: [`linear-gradient(135deg, ${tint(.24)}, ${tint(0)} 75%)`], sizes: ['100% 100%'] },
  };
  return { ...patterns[id], peakAlpha: peaks[id], ink };
}

function patternedSurfaces(catalog, design, surface, bases) {
  const pattern = patternFor(catalog, design, surface);
  if (!pattern.peakAlpha) return bases;
  // Include the full opacity range and overlapping grid lines, not only the base.
  return bases.flatMap(hex => Array.from({ length: 9 }, (_, index) => blend(hex, pattern.ink, pattern.peakAlpha * index / 8)));
}

/** Same layer recipe in the editor, miniatures, reusable artifacts and canonical CSS. */
export function patternBackground(catalog, design, surface, baseImage, baseSize = '100% 100%') {
  const pattern = patternFor(catalog, design, surface);
  const images = [...pattern.images, ...(baseImage ? [baseImage] : [])];
  const sizes = [...pattern.sizes, ...(baseImage ? [baseSize] : [])];
  const positions = [...pattern.images.map(() => 'left top'), ...(baseImage ? ['center'] : [])];
  const repeats = [...pattern.images.map(() => 'repeat'), ...(baseImage ? ['no-repeat'] : [])];
  return `background-image:${images.join(', ') || 'none'}; background-size:${sizes.join(', ') || 'auto'}; background-position:${positions.join(', ') || 'left top'}; background-repeat:${repeats.join(', ') || 'no-repeat'};`;
}

export const defaultDesign = catalog => clone(catalog.defaults);
export function applyPreset(catalog, id, currentDesign) {
  const preset = catalog.presets.find(item => item.id === id);
  if (!preset) throw new Error(`Unknown starting point: ${id}`);
  const design = clone(preset.design);
  if (currentDesign?.samples && !structuralErrors(catalog, currentDesign).length) design.samples = clone(currentDesign.samples);
  return design;
}

/** JSON-schema mirrors structural validation. Contrast is advisory, not validity. */
export function designSchema(catalog) {
  const record = properties => ({ type: 'object', additionalProperties: false, required: Object.keys(properties), properties });
  const enumeration = values => ({ enum: values });
  return record({
    version: { const: '2' },
    roles: record(Object.fromEntries(catalog.roles.map(role => [role.id, enumeration(catalog.palette.map(color => color.id))]))),
    fonts: record(Object.fromEntries(['heading', 'body'].map(role => [role, enumeration(catalog.fonts.map(font => font.id))]))),
    slides: record(Object.fromEntries(catalog.slideGroups.map(group => [group.id, record(Object.fromEntries(group.decisions.map(decision => [decision.id, enumeration(decision.options.map(option => option.id))])))]))),
    background: enumeration(catalog.backgrounds.map(item => item.id)),
    samples: record({ title: { type: 'string', maxLength: catalog.sampleLimits.title }, subtitle: { type: 'string', maxLength: catalog.sampleLimits.subtitle }, boxes: { type: 'array', minItems: 4, maxItems: 4, items: { type: 'string', maxLength: catalog.sampleLimits.box } } }),
    startingPoint: enumeration(['custom', ...catalog.presets.map(item => item.id)])
  });
}

/** Structural validity is separate from the team's visual/readability decisions. */
export function structuralErrors(catalog, design) {
  const errors = [];
  const keys = (value, allowed, label) => {
    if (!object(value)) { errors.push(`${label} must be an object.`); return false; }
    for (const key of Object.keys(value)) if (!allowed.includes(key)) errors.push(`${label}: unknown field ${key}.`);
    for (const key of allowed) if (!own(value, key)) errors.push(`${label}: missing ${key}.`);
    return true;
  };
  if (!keys(design, ['version', 'roles', 'fonts', 'slides', 'background', 'samples', 'startingPoint'], 'Design')) return errors;
  if (design.version !== '2') errors.push('Design version must be 2.');
  if (keys(design.roles, catalog.roles.map(role => role.id), 'Colors')) {
    for (const role of catalog.roles) if (!findColor(catalog, design.roles[role.id])) errors.push(`${role.label}: choose a brand color.`);
  }
  if (keys(design.fonts, ['heading', 'body'], 'Fonts')) for (const role of ['heading', 'body']) if (!catalog.fonts.some(font => font.id === design.fonts[role])) errors.push(`${role} font is not in the existing font library.`);
  if (keys(design.slides, catalog.slideGroups.map(group => group.id), 'Slides')) {
    for (const group of catalog.slideGroups) {
      if (!keys(design.slides[group.id], group.decisions.map(d => d.id), group.label)) continue;
      for (const decision of group.decisions) if (!decision.options.some(option => option.id === design.slides[group.id][decision.id])) errors.push(`${group.label}, ${decision.label}: choose an available option.`);
    }
  }
  if (!catalog.backgrounds.some(item => item.id === design.background)) errors.push('Choose an available background finish.');
  if (!['custom', ...catalog.presets.map(item => item.id)].includes(design.startingPoint)) errors.push('Unknown starting point.');
  if (keys(design.samples, ['title', 'subtitle', 'boxes'], 'Sample text')) {
    for (const key of ['title', 'subtitle']) if (typeof design.samples[key] !== 'string' || design.samples[key].length > catalog.sampleLimits[key]) errors.push(`Sample ${key} must be text with at most ${catalog.sampleLimits[key]} characters.`);
    if (!Array.isArray(design.samples.boxes) || design.samples.boxes.length !== 4 || design.samples.boxes.some(text => typeof text !== 'string' || text.length > catalog.sampleLimits.box)) errors.push(`Keep four sample text boxes, each with at most ${catalog.sampleLimits.box} characters. Hidden boxes remain recoverable.`);
  }
  return errors;
}

function gradientSamples(first, second) {
  const a = rgb(first), b = rgb(second);
  return Array.from({ length: 33 }, (_, index) => `#${a.map((v, channel) => Math.round(v + (b[channel] - v) * index / 32).toString(16).padStart(2, '0')).join('')}`);
}

/** Nonblocking contrast guidance, including gradient and decorative pattern ink. */
export function contrastIssues(catalog, design) {
  if (structuralErrors(catalog, design).length) return [];
  const issues = [];
  const color = role => findColor(catalog, design.roles[role]);
  const textPair = (role, surface, minimum, gradientEnd, patterned = false) => {
    const fg = color(role), bg = color(surface);
    const bases = gradientEnd ? gradientSamples(bg.hex, color(gradientEnd).hex) : [bg.hex];
    const surfaces = patterned ? patternedSurfaces(catalog, design, surface, bases) : bases;
    const ratio = Math.min(...surfaces.map(hex => contrast(fg.hex, hex)));
    if (ratio + 1e-9 < minimum) issues.push({ role, surface, ratio, minimum, related: [role, surface, ...(gradientEnd ? [gradientEnd] : []), ...(patterned ? ['background'] : [])], message: `${catalog.roles.find(r => r.id === role).label}: ${fg.name} on ${catalog.roles.find(r => r.id === surface).label.toLowerCase()} (${bg.name}${gradientEnd ? ` to ${color(gradientEnd).name}` : ''}${patterned && design.background !== 'plain' ? `, ${catalog.backgrounds.find(item => item.id === design.background).label}` : ''}) measures ${ratio.toFixed(2)}:1, below the ${minimum}:1 guideline for ${minimum === 3 ? 'headings' : 'supporting and body text'}.` });
  };
  const end = design.slides.title.colors === 'gradient' || design.slides.title.layout === 'split' ? 'titleBackgroundEnd' : undefined;
  textPair('titleText', 'titleBackground', 3, end, true);
  textPair('subtitle', 'titleBackground', 4.5, end, true);
  textPair('heading', 'contentBackground', 3);
  textPair('body', 'contentBackground', 4.5);
  const dividerEnd = design.slides.divider.colors === 'gradient' ? 'titleBackgroundEnd' : undefined;
  textPair('titleText', 'dividerBackground', 3, dividerEnd, true);
  textPair('subtitle', 'dividerBackground', 4.5, dividerEnd, true);
  return issues;
}

export const validateDesign = (catalog, design) => structuralErrors(catalog, design);

/** Every brand color is selectable for every role; warnings never veto a choice. */
export function colorAvailability(catalog, design, roleId, colorId) {
  const role = catalog.roles.find(item => item.id === roleId);
  if (!role || !findColor(catalog, colorId)) return { ok: false, reason: 'Choose an existing role and brand color.', warnings: [] };
  const trial = { ...design, roles: { ...design.roles, [roleId]: colorId } };
  const shapeErrors = structuralErrors(catalog, trial);
  if (shapeErrors.length) return { ok: false, reason: shapeErrors[0], warnings: shapeErrors };
  const warnings = contrastIssues(catalog, trial).filter(issue => issue.related.includes(roleId)).map(issue => issue.message);
  return { ok: true, reason: '', warnings };
}

export function roleOptions(catalog, design, roleId) {
  return catalog.palette.map(item => ({ ...item, ...colorAvailability(catalog, design, roleId, item.id) }));
}

/** Generated styles are shared by the wizard, reusable-role artifact, and canonical template override. */
export function cssForDesign(catalog, design, { scope = '.bespoke-slide', fontBase = '../fonts', canonical = true } = {}) {
  const errors = structuralErrors(catalog, design);
  if (errors.length) throw new Error(errors.join(' '));
  if (!/^[.#][a-zA-Z][\w-]*$/.test(scope) || !/^[./\w-]+$/.test(fontBase)) throw new Error('Unsafe CSS scope or font path.');
  const fonts = ['heading', 'body'].map(role => catalog.fonts.find(font => font.id === design.fonts[role]));
  const blocks = [...new Map(fonts.map(font => [font.id, font])).values()].flatMap(font => font.sources.map(source => `@font-face { font-family: "${font.family}"; src: url("${fontBase}/${source.file}") format("woff2"); font-weight: ${source.weight}; font-style: normal; font-display: swap; }`));
  const vars = catalog.palette.map(color => `--${color.id}: ${color.hex};`);
  for (const role of catalog.roles) {
    const id = design.roles[role.id];
    vars.push(`--role-${kebab(role.id)}: var(--${id});`, `--role-${kebab(role.id)}-rgb: ${rgb(findColor(catalog, id).hex).join(', ')};`);
    if (role.ink) vars.push(`--role-${kebab(role.id)}-ink: var(--${inkFor(catalog, id)});`);
  }
  fonts.forEach((font, index) => vars.push(`--font-${['heading', 'body'][index]}: "${font.family}", ${font.fallback};`));
  const title = design.slides.title, divider = design.slides.divider, cards = design.slides.cards, video = design.slides.video, activity = design.slides.activity;
  vars.push(`--bespoke-box-count: ${cards.count};`);
  blocks.push(`${scope}${canonical ? ', body' : ''} { ${vars.join(' ')} }`);
  const rule = (preview, lesson, declarations) => blocks.push(`${preview}${canonical && lesson ? `, ${lesson}` : ''} { ${declarations} }`);
  const kind = type => `${scope}[data-kind="${type}"]`;
  const selector = className => `${scope} ${className}`;
  blocks.push(`${scope}, ${scope} * { box-sizing: border-box; }`);
  rule(scope, '', 'position: relative; isolation: isolate; min-height: 360px; padding: clamp(1.35rem, 4vw, 3.5rem); color: var(--role-body); background-color: var(--role-content-background); font-family: var(--font-body); overflow-wrap: anywhere;');
  rule(selector('.slide-body'), 'body, .slide p, .card p, .content-list li, .chapter-label', 'font-family: var(--font-body);');
  rule(`${selector('.slide-heading')}, ${selector('.slide-title-text')}, ${selector('.slide-card h3')}`, '.slide-title h1, .slide h2, .slide h3, .card h4, .smart-content h4, .matrix-action, .slide-section h2', 'font-family: var(--font-heading); font-weight: 400;');
  rule(selector(':is(.slide-sidebar, .slide-sidebar-drawer, .slide-sidebar-disclosure > summary)'), '.sidebar, .sidebar-toggle', 'background: var(--role-sidebar); color: var(--role-sidebar-ink);');
  if (canonical) blocks.push('.sidebar .sidebar-title, .sidebar .resources-title, .sidebar .chapter-header, .sidebar .slide-item, .sidebar .resource-link { color: var(--role-sidebar-ink); }\n.sidebar .chapter-header:hover, .sidebar .slide-item:hover, .sidebar .resource-link:hover { color: var(--role-sidebar-ink); background: transparent; text-decoration: underline; }\n.sidebar .slide-item.active, .sidebar .chapter-item.active > .chapter-header { color: var(--role-sidebar-ink); background: transparent; border-left-color: var(--role-accent); box-shadow: inset 3px 0 0 var(--role-accent); }');
  // Represent the lesson shell: a 280px left chapter column, never a top header.
  // Only sample markup uses this grid; the actual template owns its navigation.
  const contentSlides = ['cards','video','activity'].map(kind).join(', ');
  rule(contentSlides, '', 'container-type:inline-size; display:grid; grid-template-columns:min(280px,100%) minmax(0,1fr); padding:0; min-height:480px; align-items:stretch; align-content:start;');
  rule(selector('.slide-content'), '', 'min-width:0; container-type:inline-size; padding:clamp(1.25rem,3cqw,3rem);');
  rule(selector(':is(.slide-sidebar, .slide-sidebar-drawer)'), '', 'padding:2rem min(1.5rem,24px); font-family:var(--font-body); font-size:.85rem; line-height:1.45; display:flex; flex-direction:column; gap:1rem; min-width:0;');
  rule(selector('.sample-sidebar-title'), '', 'margin:0; font-size:.875rem; font-weight:600; text-transform:uppercase; letter-spacing:.08em; padding-bottom:1rem; border-bottom:1px solid currentColor;');
  rule(selector('.sample-sidebar-note'), '', 'font-size:.75rem;');
  rule(selector('.sample-chapters'), '', 'display:flex; flex-direction:column; gap:.25rem; list-style:none; padding:0; margin:0;');
  rule(selector('.sample-chapter'), '', 'display:flex; align-items:center; gap:.5rem; padding:.65rem .5rem; border-left:3px solid transparent; border-radius:.5rem; font-size:.85rem;');
  rule(selector('.sample-chapter[data-current]'), '', 'border-left-color:var(--role-accent); font-weight:700;');
  rule(selector('.sample-chapter svg'), '', 'width:.6rem; height:.6rem; flex-shrink:0;');
  rule(selector('.sample-badge'), '', 'font-size:.65rem; font-weight:700; border-radius:.25rem; padding:.15rem .4rem; flex-shrink:0;');
  for (const [badge, color] of [['w','gold'],['i','primary'],['p','accent'],['e','gold'],['a','dark']]) {
    rule(selector('.sample-badge[data-badge="'+badge+'"]'), '', 'background:var(--'+color+');color:var(--'+inkFor(catalog,color)+');');
  }
  rule(selector('.sample-slide-name'), '', 'display:block; margin:.15rem 0 .5rem 1rem; padding:.4rem .65rem; border-left:3px solid var(--role-accent); font-size:.8rem;');
  rule(selector('.sample-resources'), '', 'margin-top:auto; padding-top:1rem; border-top:1px solid currentColor; display:grid; gap:.5rem; font-size:.8rem;');
  rule(selector('.sample-resources strong'), '', 'font-size:.75rem; text-transform:uppercase; letter-spacing:.08em;');
  rule(selector('.sample-slide-counter'), '', 'padding-top:1rem; border-top:1px solid currentColor; font-size:.75rem;');
  rule(selector('.slide-sidebar-disclosure'), '', 'display:none; min-width:0;');
  rule(selector('.slide-sidebar-disclosure > summary'), '', 'list-style:none; display:flex; align-items:center; gap:.5rem; width:fit-content; max-width:100%; min-height:44px; padding:.65rem .8rem; border-radius:.35rem; cursor:pointer; font-size:.85rem;');
  rule(selector('.slide-sidebar-disclosure > summary::-webkit-details-marker'), '', 'display:none;');
  rule(selector('.slide-sidebar-disclosure > summary svg'), '', 'width:20px; height:20px; flex-shrink:0;');
  rule(selector('.slide-sidebar-disclosure > summary:focus-visible'), '', 'outline:3px solid var(--role-sidebar-ink); outline-offset:-5px;');
  rule(selector('.slide-sidebar-drawer'), '', 'position:absolute; z-index:3; top:3.75rem; left:0; width:min(17.5rem,100%); max-height:calc(100% - 3.75rem); overflow-y:auto; box-shadow:4px 6px 14px rgba(0,0,0,.2);');
  rule(selector('.slide-sidebar-drawer:focus-visible'), '', 'outline:3px solid var(--role-sidebar-ink); outline-offset:-5px;');
  rule(selector('.slide-heading'), '.slide:not(.slide-title):not(.slide-section) h2, .card h4', 'color: var(--role-heading);');
  rule(selector('.slide-body'), '.slide:not(.slide-title):not(.slide-section) p, .content-list li, .card p', 'color: var(--role-body); line-height: 1.55;');
  rule(selector('.slide-accent'), '.divider', 'background: var(--role-accent);');
  rule(selector('.slide-button'), '.download-btn, .video-btn', 'background: var(--role-button); color: var(--role-button-ink); border: 0; border-radius: .4rem; padding: .65rem 1.1rem; font-family: var(--font-body); font-size: 1rem; line-height: 1.4; min-height: 44px;');
  rule(selector('.slide-logo'), '', 'font-family: var(--font-body); font-weight: 600; letter-spacing: .14em; font-size: .85rem; margin-bottom: 2rem;');
  rule(selector('img.slide-logo'), '', 'display:block; width:5rem; height:5rem; object-fit:contain; background:var(--light); border-radius:.4rem; padding:.4rem;');
  // A real slide canvas supplies free space for vertical placement. Type responds
  // to this canvas, not the browser width; long copy can grow it without clipping.
  const split = title.layout === 'split', centered = title.layout === 'center';
  const splitMid = blend(findColor(catalog, design.roles.titleBackground).hex, findColor(catalog, design.roles.titleBackgroundEnd).hex, .35);
  const titleBackground = split ? (title.colors === 'gradient' ? `linear-gradient(90deg, var(--role-title-background) 38%, ${splitMid} 38%, var(--role-title-background-end) 100%)` : 'linear-gradient(90deg, var(--role-title-background) 38%, var(--role-title-background-end) 38%)') : title.colors === 'gradient' ? 'linear-gradient(135deg, var(--role-title-background), var(--role-title-background-end))' : 'var(--role-title-background)';
  rule(kind('title'), '.slide-title', `container-type:inline-size; box-sizing:border-box; width:100%; min-width:0; max-width:100%; min-height:420px; height:auto; overflow:visible; position:relative; padding: ${title.logo === 'corner' ? '112px' : '32px'} 6% 32px; grid-template-columns:${split ? '36% minmax(0,1fr)' : 'minmax(0,1fr)'}; column-gap:${split ? '6%' : '0'}; grid-template-rows:minmax(0,1fr) repeat(5,auto) ${title.layout === 'bottom' ? '0' : 'minmax(0,1fr)'}; justify-items:${centered ? 'center' : 'start'}; align-items:start; align-content:stretch; text-align:${centered ? 'center' : 'left'}; background-color:var(--role-title-background); ${patternBackground(catalog, design, 'titleBackground', titleBackground.startsWith('linear-gradient') ? titleBackground : undefined)}`);
  rule(kind('title'), '.slide-title.active', 'display:grid;');
  // Invisible grid sizer supplies a 16:9 minimum (content is 88% of the canvas).
  // Real text rows can exceed it, unlike a fixed aspect-ratio height.
  rule(`${kind('title')}::before`, '.slide-title.active::before', `content:'';display:block;grid-column:1 / -1;grid-row:1 / 8;height:max(${title.logo === 'corner' ? 276 : 356}px,calc(100cqw / .88 * 9 / 16 - ${title.logo === 'corner' ? 144 : 64}px));min-width:0;justify-self:stretch;pointer-events:none;visibility:hidden;`);
  if (canonical) blocks.push('.slide-title.active::after{content:none;display:none;}');
  const titleColumn = split ? 2 : 1;
  rule(`${kind('title')} .slide-title-text`, '.slide-title h1', `grid-column:${titleColumn}; grid-row:3; min-width:0; max-width:20ch; color:var(--role-title-text); font-size:clamp(1.5rem,4.8cqw,3.7rem); line-height:1.12; margin:0 0 16px; overflow-wrap:anywhere;`);
  rule(`${kind('title')} .slide-subtitle`, '.slide-title .subtitle', `grid-column:${titleColumn}; grid-row:5; min-width:0; max-width:42ch; color:var(--role-subtitle); font-family:var(--font-body); font-size:clamp(1rem,1.8cqw,1.25rem); line-height:1.5; margin:0; overflow-wrap:anywhere;`);
  rule(`${kind('title')} .slide-logo`, '.slide-title .logo', `grid-column:${titleColumn}; grid-row:2; width:clamp(48px,7cqw,80px); height:clamp(48px,7cqw,80px); max-width:100%; box-sizing:border-box; object-fit:contain; background:var(--light); color:var(--royal); border-radius:.4rem; padding:.4rem; font-size:.7rem; letter-spacing:0; display:grid; place-items:center; ${title.logo === 'corner' ? 'position:absolute;top:24px;right:6%;margin:0;grid-area:auto;' : 'position:static;margin:0 0 20px;'}`);
  rule(`${kind('title')} .slide-accent`, '.slide-title .divider', `grid-column:${titleColumn}; grid-row:4; width:clamp(40px,8cqw,80px); height:4px; margin:0 0 16px; background:var(--role-accent);`);
  if (canonical) blocks.push(`.slide-title .copyright{grid-column:${titleColumn};grid-row:6;color:var(--role-subtitle);font-family:var(--font-body);font-size:.85rem;line-height:1.5;margin:16px 0 0;}`);
  const dividerBackground = divider.colors === 'gradient' ? 'linear-gradient(135deg,var(--role-divider-background),var(--role-title-background-end))' : 'var(--role-divider-background)';
  rule(kind('divider'), '.slide-section, .slide-section[data-chapter-num]', `container-type:inline-size; background-color:var(--role-divider-background); ${patternBackground(catalog, design, 'dividerBackground', divider.colors === 'gradient' ? dividerBackground : undefined)} color:var(--role-subtitle); text-align:${divider.layout === 'center' || divider.layout === 'band' ? 'center' : 'left'}; align-items:${divider.layout === 'center' || divider.layout === 'band' ? 'center' : 'flex-start'}; position:relative;`);
  rule(kind('divider'), '', 'display:flex; flex-direction:column; justify-content:center;');
  rule(`${kind('divider')} .slide-heading`, '.slide-section h2', 'color:var(--role-title-text); position:relative; z-index:1;');
  rule(`${kind('divider')} .slide-body`, '.slide-section p, .slide-section .chapter-label', 'color:var(--role-subtitle); position:relative; z-index:1;');
  if (divider.layout === 'band') rule(kind('divider'), '.slide-section, .slide-section[data-chapter-num]', `background-color:var(--role-content-background); ${patternBackground(catalog, design, 'dividerBackground', divider.colors === 'gradient' ? dividerBackground : 'linear-gradient(var(--role-divider-background),var(--role-divider-background))', '100% 70%')}`);
  // Keep the decorative chapter mark in one bounded line. Enlarging text must not
  // wrap its digits into a second line beyond the slide or clip meaningful copy.
  rule(selector('.slide-watermark'), '.slide-section::after', `display:${divider.watermark === 'hide' ? 'none' : 'block'}; position:absolute; right:6%; top:5%; max-width:88%; max-height:90%; overflow:hidden; white-space:nowrap; transform:none; font-size:min(${divider.layout === 'number' ? '12rem,56cqw' : '9rem,42cqw'}); line-height:1; color:var(--role-title-text); opacity:.12; pointer-events:none;`);
  rule(`${kind('cards')}, ${kind('video')}, ${kind('activity')}`, '.slide:not(.slide-title):not(.slide-section)', `background-color:var(--role-content-background); ${patternBackground(catalog, design, 'contentBackground')}`);
  if (canonical) blocks.push('.main {background-color:var(--role-content-background);background-image:none;}');
  // Content text stays on its chosen opaque surface. Title/divider contrast includes pattern ink.
  rule(`${selector('.slide-card')}, ${selector('.slide-title-bar')}, ${selector('.slide-activity')}, ${selector('.slide-heading')}`, '.slide:not(.slide-title):not(.slide-section) h2, .slide:not(.slide-title):not(.slide-section) h3, .slide:not(.slide-title):not(.slide-section) p, .slide:not(.slide-title):not(.slide-section) li', 'background-color:var(--role-content-background);');
  rule(`${kind('divider')} .slide-heading`, '', 'background:transparent;');
  const columns = cards.layout === 'rows' ? 1 : cards.layout === 'grid' ? Math.min(2, Number(cards.count)) : Number(cards.count);
  rule(kind('cards'), '.slide', 'container-type:inline-size;');
  // The template centers fixed-height slides. Safe centering keeps the beginning
  // of long generated content reachable when the slide needs vertical scrolling.
  if (canonical) blocks.push('.slide.active{justify-content:safe center;}');
  rule(selector('.slide-cards'), '.cards-grid', `display:grid; grid-template-columns:repeat(${columns},minmax(0,1fr)); gap:1rem; align-items:stretch;`);
  rule(selector('.slide-card'), '.card', `min-width:0; overflow-wrap:anywhere; background:var(--role-content-background); color:var(--role-body); padding:1.1rem; border-radius:${cards.look === 'filled' ? '1rem' : '.3rem'}; border:${cards.look === 'outline' ? '2px solid var(--role-accent)' : '0'}; box-shadow:${cards.look === 'filled' ? 'inset 0 0 0 2px var(--role-accent)' : 'none'};`);
  if (cards.look === 'rail') rule(selector('.slide-card'), '.card', 'border-left:5px solid var(--role-accent);');
  if (cards.look === 'band') rule(selector('.slide-card'), '.card', 'border-top:8px solid var(--role-accent);');
  rule(selector('.slide-card h3'), '.card h4', 'color:var(--role-heading); margin:0 0 .6rem; font-size:1.25rem;');
  rule(selector('.slide-card .slide-body'), '', 'margin:0; font-size:.92rem;');
  rule(selector('.slide-card li'), '.content-list li', 'color:var(--role-body);');
  rule(`${selector('.slide-card ul')}, ${selector('.slide-card ol')}`, '', 'padding-left:1.2rem;');
  rule(selector('.slide-title-bar'), '', 'padding: .8rem 0; margin:0 0 1rem; border-bottom:3px solid var(--role-accent);');
  rule(`${selector('.slide-title-bar')} .slide-heading`, '', 'margin:0;');
  rule(selector('.slide-heading'), '', 'font-size:clamp(1.55rem,3vw,2.25rem); margin:0 0 1rem; line-height:1.2;');
  // Reserve the frame inside the box so it cannot be clipped or covered by media.
  // Decorative keylines separate the exact chosen accent from matching surfaces.
  const videoKeyline = `var(--${inkFor(catalog, design.roles.accent)})`;
  rule(selector('.slide-video-frame'), '.video-container', `box-sizing:border-box; width:100%; max-width:100%; aspect-ratio:16/9; min-width:0; min-height:0; overflow:hidden; background:${video.frame === 'accent' ? videoKeyline : 'var(--role-sidebar)'}; color:var(--role-sidebar-ink); border:${video.frame === 'accent' ? '6px solid var(--role-accent)' : '0'}; padding:${video.frame === 'accent' ? '2px' : '0'}; outline:${video.frame === 'accent' ? `2px solid ${videoKeyline}` : '0'}; outline-offset:-2px; box-shadow:none; display:grid; grid-template: minmax(0,1fr) / minmax(0,1fr); place-items:stretch; border-radius:.5rem;`);
  rule(selector('.slide-video-frame > span'), '.video-container > video, .video-container > iframe', 'position:static; display:block; box-sizing:border-box; width:100%; height:100%; min-width:0; min-height:0; max-width:100%; background:var(--role-sidebar); object-fit:contain; border:0; border-radius:0!important; box-shadow:none!important;');
  rule(selector('.slide-video-frame > span'), '', 'display:grid; place-items:center;');
  rule(`${kind('video')} .slide-heading`, '.slide-video h2', `font-size:${video.titleStyle === 'large' ? '2.6rem' : video.titleStyle === 'caps' ? '1.2rem' : '2rem'}; text-transform:${video.titleStyle === 'caps' ? 'uppercase' : 'none'}; letter-spacing:${video.titleStyle === 'caps' ? '.08em' : 'normal'};`);
  if (video.layout === 'side') rule(`${kind('video')} .slide-video-layout`, '.slide-video.active', 'display:grid; grid-template-columns:minmax(0,1fr) minmax(0,2fr); gap:1.5rem; align-items:center;');
  if (video.layout === 'banner') rule(`${kind('video')} .slide-heading`, '.slide-video h2', 'padding:.8rem; border-bottom:4px solid var(--role-accent);');
  rule(selector('.slide-activity'), '.activity-box', `padding:1.5rem; border:2px solid var(--role-accent); border-radius:.5rem; background:var(--role-content-background);`);
  if (activity.layout === 'callout') rule(selector('.slide-activity'), '.activity-box', 'border:0; border-left:6px solid var(--role-accent); border-radius:0;');
  if (activity.layout === 'side') rule(selector('.slide-activity'), '.activity-box', 'display:grid; grid-template-columns:minmax(0,1fr) minmax(0,2fr); gap:1.5rem; align-items:start;');
  rule(selector('.slide-activity-label'), '.activity-label', `font-family:var(--font-${activity.labelStyle === 'heading' ? 'heading' : 'body'}); color:var(--role-heading); font-size:${activity.labelStyle === 'heading' ? '1.5rem' : '.95rem'}; text-transform:${activity.labelStyle === 'caps' ? 'uppercase' : 'none'};`);
  if (activity.labelStyle === 'pill' || activity.layout === 'banner') rule(selector('.slide-activity-label'), '.activity-label', `display:${activity.layout === 'banner' ? 'block' : 'inline-block'}; border:2px solid var(--role-accent); padding:.5rem .8rem; border-radius:${activity.layout === 'banner' ? '0' : '2rem'};`);
  blocks.push(`@media(max-width:600px) { ${scope} {padding:1.25rem;min-height:300px;} ${selector('.slide-cards')} {grid-template-columns:repeat(${cards.layout === 'rows' || cards.count === '1' ? 1 : 2},minmax(0,1fr));gap:.7rem;} ${selector('.slide-card')} {padding:.8rem;} ${selector('.slide-video-layout')},${selector('.slide-activity')} {grid-template-columns:1fr;} }`);
  // The editor's preview can be narrow even on a desktop-sized viewport. Reflow
  // boxes against their actual slide width, including enlarged text in rem units.
  const cardGrids = `${selector('.slide-cards')}${canonical ? ', .cards-grid' : ''}`;
  blocks.push(`@container(max-width:38rem){${cardGrids}{grid-template-columns:repeat(${Math.min(columns,2)},minmax(0,1fr));}}`);
  blocks.push(`@container(max-width:22rem){${cardGrids}{grid-template-columns:minmax(0,1fr);}}`);
  // A narrow preview behaves like collapsed lesson navigation. The native sample
  // disclosure shows the vertical panel without taking width from the main copy.
  blocks.push(`@container(max-width:40rem){${selector('.slide-sidebar')}{display:none;}${selector('.slide-sidebar-disclosure')}{display:block;grid-column:1 / -1;margin:1rem 1.25rem 0;}${selector('.slide-content')}{grid-column:1 / -1;}}`);
  blocks.push(`@container(max-width:30rem){${selector('.slide-video-layout')},${selector('.slide-activity')}{grid-template-columns:minmax(0,1fr);}}`);
  if (canonical && video.layout === 'side') blocks.push('@media(max-width:600px){.slide-video.active{grid-template-columns:minmax(0,1fr);}}');
  return `${blocks.join('\n')}\n`;
}

/** Inert by design: preview actions have no navigation, download, or submit behavior. */
export function renderSampleButton(label = 'Sample handout') {
  return `<button type="button" class="slide-button" aria-label="${escape(label)} (preview only)">${escape(label)}</button>`;
}

/** Sample copy demonstrates reusable visual roles only; it never becomes instructor lesson content. */
export function renderSlide(catalog, design, kind, options = {}) {
  const errors = structuralErrors(catalog, design);
  if (errors.length) throw new Error(errors.join(' '));
  if (!catalog.slideGroups.some(group => group.id === kind)) throw new Error(`Unknown slide role: ${kind}`);
  const title = escape(options.title ?? design.samples.title);
  const subtitle = escape(options.subtitle ?? design.samples.subtitle);
  if (options.logoUrl && (!/^(?:\.\.?\/)*(?:[\w -]+\/)*[\w -]+\.(?:png|svg|webp)$/.test(options.logoUrl))) throw new Error('Use an existing relative local logo asset.');
  const logo = options.logoUrl ? `<img class="slide-logo" src="${escape(options.logoUrl)}" alt="SPOKES" width="80" height="80">` : '<div class="slide-logo" aria-label="SPOKES sample brand">SPOKES</div>';
  const attributes = Object.entries(design.slides[kind]).map(([key, value]) => `data-${kebab(key)}="${escape(value)}"`).join(' ');
  const currentChapter = kind === 'activity' ? 6 : 2;
  const currentSlide = {cards:'Build a useful habit',video:'See a skill in action',activity:'Try it together'}[kind];
  const chapters = [['w','Warm-Up'],['i','Introduction'],['p','Sample chapter 1'],['p','Sample chapter 2'],['p','Sample chapter 3'],['e','Evaluation'],['a','Application']];
  const arrow = '<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M3 1 7 5 3 9" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>';
  const navigation = '<div class="sample-sidebar-note">Sample sidebar</div><div class="sample-sidebar-title">'+escape(options.lessonTitle || 'Sample lesson')+'</div><ul class="sample-chapters">'+chapters.map(([badge,label],index)=>'<li><div class="sample-chapter"'+(index===currentChapter?' data-current="true"':'')+'>'+arrow+'<span class="sample-badge" data-badge="'+badge+'">'+badge.toUpperCase()+'</span><span>'+label+'</span></div>'+(index===currentChapter?'<span class="sample-slide-name" aria-current="page">'+currentSlide+'</span>':'')+'</li>').join('')+'</ul><div class="sample-resources"><strong>Resources</strong><span>Sample handout</span></div><div class="sample-slide-counter">Sample slide · preview only</div>';
  const sidebar = '<aside class="slide-sidebar" aria-label="Sample chapter navigation">'+navigation+'</aside><details class="slide-sidebar-disclosure"><summary aria-label="Open or close the sample sidebar"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" stroke-width="2"/></svg><span>Sidebar · sample</span></summary><aside class="slide-sidebar-drawer" aria-label="Sample chapter navigation" tabindex="0">'+navigation+'</aside></details>';
  const boxes = design.samples.boxes.slice(0, Number(design.slides.cards.count)).map((text, index) => {
    const lines = text.split(/\n+/).filter(Boolean);
    const treatment = design.slides.cards.treatment;
    const copy = treatment === 'paragraph' ? `<p class="slide-body">${escape(text).replace(/\n/g, '<br>')}</p>` : `<${treatment === 'bullets' ? 'ul' : 'ol'} class="slide-body">${lines.map(line => `<li>${escape(line)}</li>`).join('')}</${treatment === 'bullets' ? 'ul' : 'ol'}>`;
    return `<section class="slide-card bespoke-box"><h3>Step ${index + 1}</h3>${copy}</section>`;
  }).join('');
  const views = {
    title: `${logo}<h2 class="slide-title-text">${title}</h2><div class="slide-accent" aria-hidden="true"></div><p class="slide-subtitle">${subtitle}</p>`,
    divider: `<span class="slide-watermark" aria-hidden="true">02</span><p class="slide-body">CHAPTER TWO</p><h2 class="slide-heading">Put it into practice</h2><p class="slide-body">One clear step at a time</p>`,
    cards: `${sidebar}<div class="slide-content">${design.slides.cards.titleBar ? '<header class="slide-title-bar bespoke-title-bar"><h2 class="slide-heading">Build a useful habit</h2></header>' : ''}<div class="slide-cards bespoke-boxes">${boxes}</div></div>`,
    video: `${sidebar}<div class="slide-content"><div class="slide-video-layout"><h2 class="slide-heading">See a skill in action</h2><div class="slide-video-frame" role="img" aria-label="Sample video placeholder; no video is loaded"><span>▶ &nbsp; Sample video</span></div></div><p>${renderSampleButton('Sample video action')}</p></div>`,
    activity: `${sidebar}<div class="slide-content"><h2 class="slide-heading">Try it together</h2><div class="slide-activity"><span class="slide-activity-label">Partner practice</span><p class="slide-body">Choose one next step. Tell a partner what you will try, and ask what could make it easier.</p></div><p>${renderSampleButton()}</p></div>`
  };
  return `<article class="bespoke-slide" data-kind="${kind}" ${attributes} aria-label="${escape(catalog.slideGroups.find(group => group.id === kind).label)} sample">${views[kind]}</article>`;
}

/** v1 stays available in its original backup. Mapping is deliberately disclosed, never described as lossless. */
export function migrateV1(payload, catalog, meta = {}) {
  const theme = payload?.theme;
  if (!object(theme)) throw new Error('The older design has no theme to recover.');
  const design = defaultDesign(catalog);
  const warnings = ['This is a new editable version of the older design. Keep the original v1 backup to reopen its exact chapter-specific styling.'];
  const colorLeads = { blue: ['primary', 'dark', 'primary'], royal: ['royal', 'dark', 'royal'], green: ['accent', 'primary', 'primary'], mauve: ['mauve', 'royal', 'mauve'], gold: ['muted-gold', 'primary', 'muted-gold'], 'dual-blue-green': ['primary', 'accent', 'primary'], 'dual-gold-green': ['muted-gold', 'accent', 'muted-gold'], 'dual-mauve-blue': ['mauve', 'primary', 'mauve'], 'dual-mauve-gold': ['mauve', 'muted-gold', 'mauve'] };
  const lead = colorLeads[theme.colorLead];
  if (lead) {
    [design.roles.titleBackground, design.roles.titleBackgroundEnd, design.roles.heading] = lead;
    design.roles.accent = lead[2]; design.roles.button = lead[2]; design.roles.dividerBackground = lead[0];
  } else warnings.push(`The old color lead ${theme.colorLead || '(missing)'} is unavailable; review every color.`);
  if (findColor(catalog, theme.sidebarColor)) design.roles.sidebar = theme.sidebarColor;
  const pair = (meta.fontPairings || catalog.fontPairings || []).find(item => item.id === theme.fontPairing);
  if (pair) for (const role of ['heading', 'body']) { const font = catalog.fonts.find(item => item.family === pair[role]); if (font) design.fonts[role] = font.id; }
  else warnings.push('The old font pairing could not be resolved; review the independent font choices.');
  if (catalog.backgrounds.some(item => item.id === theme.backgroundTexture)) design.background = theme.backgroundTexture;
  else if (theme.backgroundTexture === 'dark-royal') { design.background = 'plain'; design.roles.contentBackground = 'royal'; design.roles.heading = 'light'; design.roles.body = 'light'; warnings.push('Dark Royal was converted to a plain Royal surface with White text. Review the new component styling.'); }
  const titles = { 'centered-gradient': 'center', 'split-hero': 'split', 'offset-left': 'left', 'bottom-anchored': 'bottom' };
  design.slides.title.layout = titles[theme.titleSlide] || 'center';
  if (!titles[theme.titleSlide]) warnings.push(`Title style ${theme.titleSlide || '(missing)'} has no exact new equivalent; a centered layout is shown.`);
  const dividers = { 'gradient-sweep': 'center', 'centered-badge': 'center', 'bold-full-bleed': 'center', 'gold-rail': 'left', 'framed-gold': 'center' };
  design.slides.divider.layout = dividers[theme.dividerStyle] || 'center';
  warnings.push(`Divider ${theme.dividerStyle || '(missing)'} is approximated by the new divider controls; compare the original before accepting.`);
  const cards = { 'left-border': 'rail', outlined: 'outline', 'sharp-border': 'outline', pill: 'filled', layered: 'filled', 'stamp-frame': 'outline' };
  const oldCard = theme.cards?.lessonWide;
  design.slides.cards.look = cards[oldCard] || 'rail';
  warnings.push(`Cards (${oldCard || 'older styling'}) use the closest new reusable box style. Box count, title bar and text treatment need review.`);
  if (theme.cards?.varyByChapter) warnings.push('Different card styles by chapter are retained only in the original backup; this builder edits one reusable content design.');
  const oldSamples = payload.previewSamples || payload.samples || {};
  const sampleTitle = oldSamples.title || payload.lesson?.displayTitle || payload.lesson?.title;
  if (typeof sampleTitle === 'string') design.samples.title = truncateSample(sampleTitle, catalog.sampleLimits.title);
  const sampleSubtitle = oldSamples.subtitle ?? payload.lesson?.subtitle;
  if (typeof sampleSubtitle === 'string') design.samples.subtitle = truncateSample(sampleSubtitle, catalog.sampleLimits.subtitle);
  if (typeof payload.sampleContent?.bullets === 'string') { design.samples.boxes[0] = truncateSample(payload.sampleContent.bullets, catalog.sampleLimits.box); design.slides.cards.treatment = 'bullets'; }
  if (typeof payload.sampleContent?.mythReality === 'string') design.samples.boxes[1] = truncateSample(payload.sampleContent.mythReality, catalog.sampleLimits.box);
  warnings.push(...contrastIssues(catalog, design).map(issue => `Contrast advisory: ${issue.message}`));
  return { design, warnings };
}
