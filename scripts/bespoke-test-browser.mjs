// Optional isolated engine coverage; the ordinary quality gate keeps Chromium.
import { chromium, webkit } from 'playwright';

export const browserName = process.env.BESPOKE_BROWSER || 'chromium';
const engines = { chromium, webkit };
if (!Object.hasOwn(engines, browserName)) {
  throw new Error('BESPOKE_BROWSER must be chromium or webkit.');
}
export const browserType = engines[browserName];
// macOS WebKit follows the system's Tab preference. Option-Tab traverses all
// controls without changing Safari or system settings (Apple Safari shortcuts).
export const tabKey = browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab';
export const reverseTabKey = browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Shift+Tab' : 'Shift+Tab';
