// Decides what one status check for a sent design leads to.
// Pure: the check's result in, the next step out. builder-app.mjs schedules and announces it.

export const POLL_MS = 10000;
export const POLL_MAX_MS = 60000;
export const SLOW_AFTER_MS = 5 * 60000;

export const CHECKING_NOTICE = 'Still checking that your design reached Britt. You can keep working or close this page.';
export const SLOW_NOTICE = 'Sending is taking longer than usual. Your saved design is safe. If this page does not say Sent to Britt soon, tell Britt.';

// A refusal that asking again will not change: a wrong code, a view code, a request the service rejects.
const refused = result => !result.ok && result.httpStatus >= 400 && result.httpStatus < 500 && result.httpStatus !== 429;

/**
 * @param {object} check
 * @param {{ok: boolean, status?: string, error?: string, httpStatus?: number}} check.result the status answer
 * @param {number} [check.failures] failed checks in a row before this one
 * @param {number} [check.elapsedMs] time since the design was sent
 * @returns {{kind: 'received'|'failed'|'stopped'} | {kind: 'wait', retryIn: number, failures: number, notice: string|null}}
 *   `notice` is null when the usual "processing" wording applies.
 */
export function pollStep({ result, failures = 0, elapsedMs = 0 }) {
  if (result.ok && result.status === 'received') return { kind: 'received' };
  if (result.ok && result.status !== 'processing') return { kind: 'failed' };
  if (refused(result)) return { kind: 'stopped' };
  const slow = elapsedMs >= SLOW_AFTER_MS;
  if (result.ok) return { kind: 'wait', retryIn: POLL_MS, failures: 0, notice: slow ? SLOW_NOTICE : null };
  // One missed check is not an answer. Keep checking, more slowly each time.
  const missed = failures + 1;
  return { kind: 'wait', retryIn: Math.min(POLL_MAX_MS, POLL_MS * 2 ** missed), failures: missed, notice: slow ? SLOW_NOTICE : CHECKING_NOTICE };
}
