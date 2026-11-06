/** Plain-English rows describing a saved BeSpoke design. No DOM or storage; never prints an id. */
import { CHARACTERISTICS } from './similarity.mjs';
import { effectiveRoleStyle } from './builder-model.mjs';

const OWN_DESIGN = 'Your own design';
const labelFor = key => CHARACTERISTICS.find(item => item.key === key)?.label;
const colorOf = (catalog, id) => catalog.colors.find(color => color.id === id);
const fontLabel = (catalog, id) => catalog.fonts.find(font => font.id === id)?.label;
const asText = value => (typeof value === 'string' ? value.trim() : '');

function optionLabel(catalog, group, decision, value) {
  const found = catalog.slideGroups.find(item => item.id === group)?.decisions.find(item => item.id === decision);
  return found?.options.find(option => String(option.id) === String(value))?.label;
}

function colorRow(catalog, key, id) {
  const color = colorOf(catalog, id);
  const label = labelFor(key);
  return color && label ? { label, value: color.name, hex: color.hex } : null;
}

/** The card's three headline facts: the look, three swatches and the font pair. */
export function cardHighlights(catalog, design) {
  const preset = catalog.presets.find(item => item.id === design.startingPoint);
  const colors = ['titleBackground', 'titleText', 'accent']
    .map(role => colorOf(catalog, design.roles[role]))
    .filter(Boolean)
    .map(({ name, hex }) => ({ name, hex }));
  const fonts = [design.fonts.heading, design.fonts.body].map(id => fontLabel(catalog, id) ?? 'Custom font').join(' + ');
  return { look: preset?.label ?? OWN_DESIGN, colors, fonts };
}

function slideRows(catalog, design, kind) {
  const group = catalog.slideGroups.find(item => item.id === kind);
  return (group?.decisions ?? []).flatMap(decision => {
    const value = optionLabel(catalog, kind, decision.id, design.slides?.[kind]?.[decision.id]);
    const label = labelFor(`slides.${kind}.${decision.id}`);
    return value && label ? [{ label, value }] : [];
  });
}

const word = (label, value, shown) => (shown && asText(value) ? [{ label, value: asText(value) }] : []);

function wordRows(style, labels) {
  return [
    ...word(labels.heading, style.headingText, style.headingVisible),
    ...word(labels.body, style.bodyText, style.bodyVisible),
    ...word(labels.label, style.labelText, style.labelVisible),
  ];
}

function dividerColorRows(catalog, style) {
  return [
    style.headingVisible && colorRow(catalog, 'dividerText.heading', style.headingColor),
    style.bodyVisible && colorRow(catalog, 'dividerText.supporting', style.bodyColor),
  ].filter(Boolean);
}

function colorsSection(catalog, design) {
  const rows = catalog.roles.flatMap(role => colorRow(catalog, `roles.${role.id}`, design.roles[role.id]) ?? []);
  const detail = catalog.backgrounds.find(item => item.id === design.background)?.label;
  return { section: 'Colors', rows: detail ? [...rows, { label: labelFor('background'), value: detail }] : rows };
}

function fontsSection(catalog, design) {
  const rows = [['fonts.heading', design.fonts.heading], ['fonts.body', design.fonts.body]]
    .flatMap(([key, id]) => (fontLabel(catalog, id) ? [{ label: labelFor(key), value: fontLabel(catalog, id) }] : []));
  return { section: 'Fonts', rows };
}

function boxRows(design, style) {
  const count = Number(design.slides.cards.count) || 0;
  const boxes = (design.samples?.boxes ?? []).slice(0, count);
  return [
    ...word('Shared content heading words', style.headingText, style.headingVisible),
    ...boxes.flatMap((text, index) => word(`Text box ${index + 1} words`, text, true)),
  ];
}

/** Every choice a design makes, grouped the way the builder asks for them. */
export function designSummary(catalog, design) {
  const style = kind => effectiveRoleStyle(catalog, design, kind);
  const title = style('title'), divider = style('divider'), cards = style('cards'), video = style('video'), activity = style('activity');
  return [
    { section: 'Starting look', rows: [{ label: 'Starting look', value: cardHighlights(catalog, design).look }] },
    colorsSection(catalog, design),
    fontsSection(catalog, design),
    { section: 'Title slide', rows: [...slideRows(catalog, design, 'title'), ...wordRows(title, { heading: 'Title words', body: 'Subtitle words' })] },
    { section: 'Divider', rows: [...slideRows(catalog, design, 'divider'), ...dividerColorRows(catalog, divider), ...wordRows(divider, { heading: 'Heading words', body: 'Supporting words', label: 'Label words' })] },
    { section: 'Text boxes', rows: [...slideRows(catalog, design, 'cards'), ...boxRows(design, cards)] },
    { section: 'Video', rows: [...slideRows(catalog, design, 'video'), ...wordRows(video, { heading: 'Heading words', body: 'Supporting words' })] },
    { section: 'Activity', rows: [...slideRows(catalog, design, 'activity'), ...wordRows(activity, { heading: 'Heading words', body: 'Supporting words', label: 'Label words' })] },
  ];
}
