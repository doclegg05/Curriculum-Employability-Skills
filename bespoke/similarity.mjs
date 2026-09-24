/** Advisory exact-choice comparison. Unknown measurements never count as matches. */
export const CHARACTERISTICS = Object.freeze([
  ['roles.sidebar', 'Sidebar color'],
  ['roles.titleBackground', 'Title background color'],
  ['roles.titleBackgroundEnd', 'Title second color'],
  ['roles.titleText', 'Title text color'],
  ['roles.subtitle', 'Subtitle color'],
  ['roles.contentBackground', 'Content background color'],
  ['roles.heading', 'Content heading color'],
  ['roles.body', 'Body text color'],
  ['roles.accent', 'Card accent color'],
  ['roles.button', 'Button color'],
  ['roles.dividerBackground', 'Divider background color'],
  ['fonts.heading', 'Title font'],
  ['fonts.body', 'Body font'],
  ['background', 'Content background pattern'],
  ['slides.title.layout', 'Title arrangement'],
  ['slides.title.logo', 'Title logo position'],
  ['slides.title.colors', 'Title background finish'],
  ['slides.divider.layout', 'Divider arrangement'],
  ['slides.divider.watermark', 'Divider watermark'],
  ['slides.divider.colors', 'Divider background finish'],
  ['slides.cards.count', 'Text box count'],
  ['slides.cards.titleBar', 'Shared content heading'],
  ['slides.cards.treatment', 'Text box text treatment'],
  ['slides.cards.look', 'Text box edge style'],
  ['slides.cards.layout', 'Text box arrangement'],
  ['slides.video.layout', 'Video arrangement'],
  ['slides.video.frame', 'Video frame'],
  ['slides.video.titleStyle', 'Video title style'],
  ['slides.activity.layout', 'Activity arrangement'],
  ['slides.activity.labelStyle', 'Activity label style'],
].map(([key, label]) => Object.freeze({ key, label })));

function get(object, key) {
  return key.split('.').reduce((value, part) => value?.[part], object);
}

/**
 * Compares supported visual characteristics, not pixels or perceptual likeness.
 * Ranked by number of shared measured characteristics, then coverage, then id.
 * A reference with few known measurements cannot win merely by matching 1 of 1.
 * No suggestion, restriction, or design mutation is performed here.
 */
export function compareDesign(fingerprints, design) {
  return (fingerprints?.lessons || []).map((lesson) => {
    const matches = [], differences = [], unknown = [];
    for (const { key, label } of CHARACTERISTICS) {
      const referenceValue = get(lesson, key);
      const designValue = get(design, key);
      const source = lesson.evidence?.[key] || null;
      if (referenceValue == null || designValue == null) {
        unknown.push({ key, label, reason: referenceValue == null
          ? source?.reason || 'This characteristic is not measured in the reference lesson.'
          : 'This characteristic is not set in the current design.', source });
        continue;
      }
      const detail = { key, label, referenceValue, designValue, source };
      (referenceValue === designValue ? matches : differences).push(detail);
    }
    return {
      id: lesson.id, title: lesson.title,
      shared: matches.length, total: matches.length + differences.length,
      matches, differences, unknown,
      source: lesson.source || null,
      advisory: true, rankBasis: 'shared-count',
    };
  }).sort((a, b) => b.shared - a.shared || b.total - a.total || a.id.localeCompare(b.id));
}
