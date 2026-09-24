// User-facing navigation for the current three-stage builder. No state injection.
// Keep preview selection explicit in tests: inspecting a preview is not editing it.
const roles = {
  'Title slide':'title', 'Chapter divider':'divider', 'Text boxes':'cards',
  'Video slide':'video', Activity:'activity'
};

export const EDITOR_DESTINATIONS = [
  'Start', 'Shared colors', 'Shared typography', ...Object.keys(roles), 'Review & save'
];

export async function builderDestination(page, destination) {
  const designSurface = page.locator('#surface-design');
  if (await designSurface.isVisible()) await designSurface.click();
  if (destination === 'Shared colors' || destination === 'Shared typography') {
    const theme = page.locator('#sharedTheme');
    if (!await theme.evaluate(el => el.open)) await theme.locator(':scope > summary').click();
    await page.locator(destination === 'Shared colors' ? '#colorRole' : '#font-heading').waitFor({state:'visible'});
    return;
  }
  if (roles[destination]) {
    await page.locator('#stage-slides').click();
    await page.locator('#editor-'+roles[destination]).click();
    return;
  }
  if (destination === 'Start' || destination === 'Starting look') {
    await page.locator('#stage-start').click();
    if (destination === 'Starting look' && !await page.locator('[data-preset]').first().isVisible()) {
      await page.locator('#btnChangeStartingLook').click();
    }
    return;
  }
  if (destination === 'Review & save') {
    await page.locator('#stage-review').click();
    return;
  }
  throw new Error('Unknown builder destination: '+destination);
}

export async function recoveryMenu(page, open) {
  const menu = page.locator('.more-menu');
  if (await menu.evaluate(el => el.open) !== open) await menu.locator(':scope > summary').click();
}
