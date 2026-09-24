/** Shared, deterministic BeSpoke model. No DOM, storage, network or hidden defaults. */
const clone = value => JSON.parse(JSON.stringify(value));
const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const kebab = value => value.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
const findColor = (catalog, id) => catalog.palette.find(color => color.id === id);
const rgb = hex => [1, 3, 5].map(index => parseInt(hex.slice(index, index + 2), 16));
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

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

export const defaultDesign = catalog => clone(catalog.defaults);
export function applyPreset(catalog, id, currentDesign) {
  const preset = catalog.presets.find(item => item.id === id);
  if (!preset) throw new Error(`Unknown starting point: ${id}`);
  const design = clone(preset.design);
  if (currentDesign?.samples && !structuralErrors(catalog, currentDesign).length) design.samples = clone(currentDesign.samples);
  return design;
}

/** JSON-schema mirrors shape validation; the model additionally enforces brand contrast. */
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

/** Structural validity is separate from readability: a draft may need repair without losing its choices. */
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

/** Detailed rules power both save validation and per-swatch explanations. Accent edges are decorative. */
export function contrastIssues(catalog, design) {
  if (structuralErrors(catalog, design).length) return [];
  const issues = [];
  const color = role => findColor(catalog, design.roles[role]);
  const textPair = (role, surface, minimum, gradientEnd) => {
    const fg = color(role), bg = color(surface);
    const surfaces = gradientEnd ? gradientSamples(bg.hex, color(gradientEnd).hex) : [bg.hex];
    const ratio = Math.min(...surfaces.map(hex => contrast(fg.hex, hex)));
    if (ratio + 1e-9 < minimum) issues.push({ role, surface, ratio, minimum, related: [role, surface, ...(gradientEnd ? [gradientEnd] : [])], message: `${catalog.roles.find(r => r.id === role).label}: ${fg.name} on ${bg.name}${gradientEnd ? ` to ${color(gradientEnd).name}` : ''} is ${ratio.toFixed(2)}:1; needs ${minimum}:1. Choose a different text color or background.` });
  };
  for (const role of catalog.roles.filter(r => r.kind === 'text')) {
    if (catalog.notText.includes(design.roles[role.id])) issues.push({ role: role.id, related: [role.id], message: `${role.label}: ${color(role.id).name} is reserved for shapes and backgrounds, not text, in the SPOKES brand.` });
  }
  const end = design.slides.title.colors === 'gradient' || design.slides.title.layout === 'split' ? 'titleBackgroundEnd' : undefined;
  textPair('titleText', 'titleBackground', 3, end);
  textPair('subtitle', 'titleBackground', 4.5, end);
  textPair('heading', 'contentBackground', 3);
  textPair('body', 'contentBackground', 4.5);
  if (design.slides.divider.colors === 'gradient') {
    const ink = findColor(catalog, inkFor(catalog, design.roles.dividerBackground));
    const ratio = Math.min(...gradientSamples(color('dividerBackground').hex, color('titleBackgroundEnd').hex).map(hex => contrast(ink.hex, hex)));
    if (ratio < 4.5) issues.push({ role: 'dividerBackground', related: ['dividerBackground', 'titleBackgroundEnd'], ratio, minimum: 4.5, message: `Chapter divider: its automatic ${ink.name} text needs 4.5:1 across the gradient; currently ${ratio.toFixed(2)}:1. Choose a one-color divider or a compatible second title color.` });
  }
  return issues;
}

export const validateDesign = (catalog, design) => [...structuralErrors(catalog, design), ...contrastIssues(catalog, design).map(issue => issue.message)];

/** All eleven remain visible. Unsafe text is unavailable; surface choices retain other values and expose repair warnings. */
export function colorAvailability(catalog, design, roleId, colorId) {
  const role = catalog.roles.find(item => item.id === roleId);
  if (!role || !findColor(catalog, colorId)) return { ok: false, reason: 'Choose an existing role and brand color.', warnings: [] };
  const trial = { ...design, roles: { ...design.roles, [roleId]: colorId } };
  const shapeErrors = structuralErrors(catalog, trial);
  if (shapeErrors.length) return { ok: false, reason: shapeErrors[0], warnings: shapeErrors };
  const warnings = contrastIssues(catalog, trial).filter(issue => issue.related.includes(roleId)).map(issue => issue.message);
  return { ok: role.kind !== 'text' || !warnings.length, reason: role.kind === 'text' ? warnings.join(' ') : '', warnings };
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
  rule(selector('.slide-sidebar'), '.sidebar, .sidebar-toggle', 'background: var(--role-sidebar); color: var(--role-sidebar-ink);');
  if (canonical) blocks.push('.sidebar .sidebar-title, .sidebar .resources-title, .sidebar .chapter-header, .sidebar .slide-item, .sidebar .resource-link { color: var(--role-sidebar-ink); }\n.sidebar .chapter-header:hover, .sidebar .slide-item:hover, .sidebar .resource-link:hover { color: var(--role-sidebar-ink); background: transparent; text-decoration: underline; }\n.sidebar .slide-item.active, .sidebar .chapter-item.active > .chapter-header { color: var(--role-sidebar-ink); background: transparent; border-left-color: var(--role-accent); box-shadow: inset 3px 0 0 var(--role-accent); }');
  rule(selector('.slide-sidebar'), '', 'padding: .75rem 1rem; margin: -1rem -1rem 1.75rem; font-size: .8rem; display:flex; flex-wrap:wrap; gap:1rem;');
  rule(selector('.slide-heading'), '.slide:not(.slide-title):not(.slide-section) h2, .card h4', 'color: var(--role-heading);');
  rule(selector('.slide-body'), '.slide:not(.slide-title):not(.slide-section) p, .content-list li, .card p', 'color: var(--role-body); line-height: 1.55;');
  rule(selector('.slide-accent'), '.divider', 'background: var(--role-accent);');
  rule(selector('.slide-button'), '.download-btn, .video-btn', 'background: var(--role-button); color: var(--role-button-ink); border: 0; border-radius: .4rem; padding: .65rem 1.1rem; font-family: var(--font-body);');
  rule(selector('.slide-logo'), '', 'font-family: var(--font-body); font-weight: 600; letter-spacing: .14em; font-size: .85rem; margin-bottom: 2rem;');
  rule(selector('img.slide-logo'), '', 'display:block; width:5rem; height:5rem; object-fit:contain; background:var(--light); border-radius:.4rem; padding:.4rem;');
  const titleBackground = title.layout === 'split' ? (title.colors === 'gradient' ? 'linear-gradient(90deg, var(--role-title-background) 30%, var(--role-title-background-end) 75%)' : 'linear-gradient(90deg, var(--role-title-background) 40%, var(--role-title-background-end) 40%)') : title.colors === 'gradient' ? 'linear-gradient(135deg, var(--role-title-background), var(--role-title-background-end))' : 'var(--role-title-background)';
  rule(kind('title'), '.slide-title', `background: ${titleBackground}; text-align: ${title.layout === 'center' ? 'center' : 'left'}; align-items: ${title.layout === 'center' ? 'center' : 'flex-start'}; justify-content: ${title.layout === 'bottom' ? 'flex-end' : 'center'}; flex-direction:column; position:relative;`);
  rule(kind('title'), '', 'display: flex; padding-block: 3rem;');
  rule(selector('.slide-title-text'), '.slide-title h1', 'color: var(--role-title-text); font-size: clamp(2rem, 4vw, 3.7rem); line-height: 1.12; margin: 0 0 1rem; max-width: 18ch;');
  rule(selector('.slide-subtitle'), '.slide-title .subtitle, .slide-title .copyright', 'color: var(--role-subtitle); font-family:var(--font-body); line-height:1.5;');
  rule(selector('.slide-logo'), '.slide-title .logo', title.logo === 'corner' ? 'align-self: flex-end; margin: 0 0 2rem;' : `align-self: ${title.layout === 'center' ? 'center' : 'flex-start'}; margin:0 0 2rem;`);
  rule(`${kind('title')} .slide-logo`, '', 'color: var(--role-title-text);');
  rule(`${kind('title')} .slide-accent`, '', 'width: 5rem; height: .25rem; margin-bottom: 1rem;');
  const dividerBackground = divider.colors === 'gradient' ? 'linear-gradient(135deg,var(--role-divider-background),var(--role-title-background-end))' : 'var(--role-divider-background)';
  rule(kind('divider'), '.slide-section, .slide-section[data-chapter-num]', `background:${dividerBackground}; color:var(--role-divider-background-ink); text-align:${divider.layout === 'center' || divider.layout === 'band' ? 'center' : 'left'}; align-items:${divider.layout === 'center' || divider.layout === 'band' ? 'center' : 'flex-start'}; position:relative;`);
  rule(kind('divider'), '', 'display:flex; flex-direction:column; justify-content:center;');
  rule(`${kind('divider')} .slide-heading, ${kind('divider')} .slide-body`, '.slide-section h2, .slide-section .chapter-label', 'color:var(--role-divider-background-ink); position:relative; z-index:1;');
  if (divider.layout === 'band') rule(kind('divider'), '.slide-section, .slide-section[data-chapter-num]', `background-color:var(--role-content-background); background-image:${divider.colors === 'gradient' ? dividerBackground : 'linear-gradient(var(--role-divider-background),var(--role-divider-background))'}; background-size:100% 70%; background-position:center; background-repeat:no-repeat;`);
  rule(selector('.slide-watermark'), '.slide-section::after', `display:${divider.watermark === 'hide' ? 'none' : 'block'}; position:absolute; right:6%; top:5%; font-size:${divider.layout === 'number' ? '12rem' : '9rem'}; line-height:1; color:var(--role-divider-background-ink); opacity:.12; pointer-events:none;`);
  const patterns = { plain: 'none', 'dot-grid': 'radial-gradient(rgba(var(--role-accent-rgb),.09) 1px,transparent 1px)', diagonal: 'repeating-linear-gradient(45deg,rgba(var(--role-accent-rgb),.06) 0 1px,transparent 1px 18px)', crosshatch: 'linear-gradient(rgba(var(--role-accent-rgb),.04) 1px,transparent 1px),linear-gradient(90deg,rgba(var(--role-accent-rgb),.04) 1px,transparent 1px)', 'soft-gradient': 'linear-gradient(135deg,rgba(var(--role-accent-rgb),.04),transparent 60%)' };
  rule(`${kind('cards')}, ${kind('video')}, ${kind('activity')}`, '.main', `background-color:var(--role-content-background); background-image:${patterns[design.background]}; background-size:${design.background === 'dot-grid' ? '18px 18px' : design.background === 'crosshatch' ? '28px 28px' : 'auto'};`);
  // Text has an opaque chosen surface: decorative texture never reduces its contrast.
  rule(`${selector('.slide-card')}, ${selector('.slide-title-bar')}, ${selector('.slide-activity')}, ${selector('.slide-heading')}`, '', 'background-color:var(--role-content-background);');
  rule(`${kind('divider')} .slide-heading`, '', 'background:transparent;');
  const columns = cards.layout === 'rows' ? 1 : cards.layout === 'grid' ? Math.min(2, Number(cards.count)) : Number(cards.count);
  rule(selector('.slide-cards'), '.cards-grid', `display:grid; grid-template-columns:repeat(${columns},minmax(0,1fr)); gap:1rem; align-items:stretch;`);
  rule(selector('.slide-card'), '.card', `background:var(--role-content-background); color:var(--role-body); padding:1.1rem; border-radius:${cards.look === 'filled' ? '1rem' : '.3rem'}; border:${cards.look === 'outline' ? '2px solid var(--role-accent)' : '0'}; box-shadow:${cards.look === 'filled' ? 'inset 0 0 0 2px var(--role-accent)' : 'none'};`);
  if (cards.look === 'rail') rule(selector('.slide-card'), '.card', 'border-left:5px solid var(--role-accent);');
  if (cards.look === 'band') rule(selector('.slide-card'), '.card', 'border-top:8px solid var(--role-accent);');
  rule(selector('.slide-card h3'), '.card h4', 'color:var(--role-heading); margin:0 0 .6rem; font-size:1.25rem;');
  rule(selector('.slide-card .slide-body'), '', 'margin:0; font-size:.92rem;');
  rule(selector('.slide-card li'), '.content-list li', 'color:var(--role-body);');
  rule(`${selector('.slide-card ul')}, ${selector('.slide-card ol')}`, '', 'padding-left:1.2rem;');
  rule(selector('.slide-title-bar'), '', 'padding: .8rem 0; margin:0 0 1rem; border-bottom:3px solid var(--role-accent);');
  rule(`${selector('.slide-title-bar')} .slide-heading`, '', 'margin:0;');
  rule(selector('.slide-heading'), '', 'font-size:clamp(1.55rem,3vw,2.25rem); margin:0 0 1rem; line-height:1.2;');
  rule(selector('.slide-video-frame'), '.video-container', `aspect-ratio:16/9; min-width:0; background:var(--role-sidebar); color:var(--role-sidebar-ink); border:${video.frame === 'accent' ? '4px solid var(--role-accent)' : '0'}; display:grid; place-items:center; border-radius:.5rem;`);
  rule(`${kind('video')} .slide-heading`, '.slide-video h2', `font-size:${video.titleStyle === 'large' ? '2.6rem' : video.titleStyle === 'caps' ? '1.2rem' : '2rem'}; text-transform:${video.titleStyle === 'caps' ? 'uppercase' : 'none'}; letter-spacing:${video.titleStyle === 'caps' ? '.08em' : 'normal'};`);
  if (video.layout === 'side') rule(`${kind('video')} .slide-video-layout`, '.slide-video.active', 'display:grid; grid-template-columns:minmax(0,1fr) minmax(0,2fr); gap:1.5rem; align-items:center;');
  if (video.layout === 'banner') rule(`${kind('video')} .slide-heading`, '.slide-video h2', 'padding:.8rem; border-bottom:4px solid var(--role-accent);');
  rule(selector('.slide-activity'), '.activity-box', `padding:1.5rem; border:2px solid var(--role-accent); border-radius:.5rem; background:var(--role-content-background);`);
  if (activity.layout === 'callout') rule(selector('.slide-activity'), '.activity-box', 'border:0; border-left:6px solid var(--role-accent); border-radius:0;');
  if (activity.layout === 'side') rule(selector('.slide-activity'), '.activity-box', 'display:grid; grid-template-columns:minmax(0,1fr) minmax(0,2fr); gap:1.5rem; align-items:start;');
  rule(selector('.slide-activity-label'), '.activity-label', `font-family:var(--font-${activity.labelStyle === 'heading' ? 'heading' : 'body'}); color:var(--role-heading); font-size:${activity.labelStyle === 'heading' ? '1.5rem' : '.95rem'}; text-transform:${activity.labelStyle === 'caps' ? 'uppercase' : 'none'};`);
  if (activity.labelStyle === 'pill' || activity.layout === 'banner') rule(selector('.slide-activity-label'), '.activity-label', `display:${activity.layout === 'banner' ? 'block' : 'inline-block'}; border:2px solid var(--role-accent); padding:.5rem .8rem; border-radius:${activity.layout === 'banner' ? '0' : '2rem'};`);
  blocks.push(`@media(max-width:600px) { ${scope} {padding:1.25rem;min-height:300px;} ${selector('.slide-cards')} {grid-template-columns:repeat(${cards.layout === 'rows' || cards.count === '1' ? 1 : 2},minmax(0,1fr));gap:.7rem;} ${selector('.slide-card')} {padding:.8rem;} ${selector('.slide-video-layout')},${selector('.slide-activity')} {grid-template-columns:1fr;} }`);
  return `${blocks.join('\n')}\n`;
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
  const sidebar = '<div class="slide-sidebar" aria-label="Sample chapter navigation"><strong>SPOKES</strong><span>Welcome</span><span>Practice</span><span>Next step</span></div>';
  const boxes = design.samples.boxes.slice(0, Number(design.slides.cards.count)).map((text, index) => {
    const lines = text.split(/\n+/).filter(Boolean);
    const treatment = design.slides.cards.treatment;
    const copy = treatment === 'paragraph' ? `<p class="slide-body">${escape(text).replace(/\n/g, '<br>')}</p>` : `<${treatment === 'bullets' ? 'ul' : 'ol'} class="slide-body">${lines.map(line => `<li>${escape(line)}</li>`).join('')}</${treatment === 'bullets' ? 'ul' : 'ol'}>`;
    return `<section class="slide-card bespoke-box"><h3>Step ${index + 1}</h3>${copy}</section>`;
  }).join('');
  const views = {
    title: `${logo}<h2 class="slide-title-text">${title}</h2><div class="slide-accent" aria-hidden="true"></div><p class="slide-subtitle">${subtitle}</p>`,
    divider: `<span class="slide-watermark" aria-hidden="true">02</span><p class="slide-body">CHAPTER TWO</p><h2 class="slide-heading">Put it into practice</h2><p class="slide-body">One clear step at a time</p>`,
    cards: `${sidebar}${design.slides.cards.titleBar ? '<header class="slide-title-bar bespoke-title-bar"><h2 class="slide-heading">Build a useful habit</h2></header>' : ''}<div class="slide-cards bespoke-boxes">${boxes}</div>`,
    video: `${sidebar}<div class="slide-video-layout"><h2 class="slide-heading">See a skill in action</h2><div class="slide-video-frame" role="img" aria-label="Sample video placeholder; no video is loaded"><span>▶ &nbsp; Sample video</span></div></div>`,
    activity: `${sidebar}<h2 class="slide-heading">Try it together</h2><div class="slide-activity"><span class="slide-activity-label">Partner practice</span><p class="slide-body">Choose one next step. Tell a partner what you will try, and ask what could make it easier.</p></div><p><span class="slide-button">Sample handout button</span></p>`
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
  if (typeof sampleTitle === 'string') design.samples.title = sampleTitle.slice(0, catalog.sampleLimits.title);
  const sampleSubtitle = oldSamples.subtitle ?? payload.lesson?.subtitle;
  if (typeof sampleSubtitle === 'string') design.samples.subtitle = sampleSubtitle.slice(0, catalog.sampleLimits.subtitle);
  if (typeof payload.sampleContent?.bullets === 'string') { design.samples.boxes[0] = payload.sampleContent.bullets.slice(0, catalog.sampleLimits.box); design.slides.cards.treatment = 'bullets'; }
  if (typeof payload.sampleContent?.mythReality === 'string') design.samples.boxes[1] = payload.sampleContent.mythReality.slice(0, catalog.sampleLimits.box);
  warnings.push(...validateDesign(catalog, design).map(error => `Readability needs review: ${error}`));
  return { design, warnings };
}
