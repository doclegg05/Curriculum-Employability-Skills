#!/usr/bin/env node
/** One model authority for Python intake, service validation and browser preview. */
import fs from 'node:fs';
import catalog from '../bespoke/builder-catalog.json' with { type: 'json' };
import { contrastIssues, cssForDesign, renderSlide } from '../bespoke/builder-model.mjs';
import { selectionErrors } from '../netlify/functions/_shared/selection.mjs';

const selection = JSON.parse(fs.readFileSync(0, 'utf8'));
const errors = selectionErrors(selection, selection?.lesson?.id, true);
const warnings = !errors.length && selection.schema === 'bespoke-selection/v2' ? contrastIssues(catalog, selection.design).map(issue => issue.message) : [];
if (process.argv[2] === 'validate' || errors.length) {
  process.stdout.write(JSON.stringify({ errors, warnings }));
} else if (process.argv[2] === 'design') {
  const design = selection.design;
  const fontIds = [...new Set(Object.values(design.fonts))];
  const fonts = catalog.fonts.filter(font => fontIds.includes(font.id));
  const markup = Object.fromEntries(['title', 'divider', 'cards', 'video', 'activity'].map(kind => [kind, renderSlide(catalog, design, kind)]));
  process.stdout.write(JSON.stringify({ errors, warnings, css: cssForDesign(catalog, design), fonts, markup }));
} else {
  throw new Error('Expected validate or design operation.');
}
