// Bounded waits for the BeSpoke browser tests. A wait that cannot end hangs CI for hours with no
// output, so every wait here races a timer and fails with a message that names what it waited for.
export const WAIT_MS = 10000;

/** Settles like `promise`, or rejects after `ms` with "Timed out after N s waiting for <what>". */
export function within(promise, what, ms = WAIT_MS) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Timed out after ${ms / 1000} s waiting for ${what}`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/**
 * A request the fake service holds. Pass it as a hook: the route handler calls `wait()`, which marks
 * the request arrived and resolves on `release()`. Each read of `arrived` is a bounded wait.
 */
export function hold(what, ms = WAIT_MS) {
  let arrive, release;
  const arrivedPromise = new Promise(resolve => { arrive = resolve; });
  const gate = new Promise(resolve => { release = resolve; });
  return {
    get arrived() { return within(arrivedPromise, `${what} to reach the fake service`, ms); },
    release,
    wait: () => { arrive(); return gate; }
  };
}

/** Releases every held request in a scenario's hooks, so no route handler is left waiting at teardown. */
export function releaseHeld(hooks) {
  for (const hook of Object.values(hooks).flat()) hook?.release?.();
}
