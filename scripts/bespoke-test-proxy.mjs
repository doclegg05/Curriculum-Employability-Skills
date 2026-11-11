// Serves a routed request for a page file from the local test server.
//
// A scenario can end while the page still has a request in flight. Closing the
// browser context under that request makes route.fetch reject (the static
// server resets the connection) or route.fulfill reject ("Fetch response has
// been disposed"). Playwright does not await a route handler, so either
// rejection, left alone, is an uncaught error that exits Node and fails a test
// whose assertions had all passed.
//
// That one request is aborted instead. A page file that fails while the
// scenario is still running is reported through onFailure, so a real loading
// failure is never hidden. With no onFailure it is written to stderr.

const CONTEXT_CLOSED = /has been disposed|has been closed|context disposed/i;

const warn = (message) => console.warn('page file failed: ' + message);

export async function proxyPageFile(route, server, { finished = () => false, onFailure = warn, headers } = {}) {
  const request = route.request();
  const url = new URL(request.url());
  const forwarded = headers ?? { ...request.headers(), origin: server.baseUrl };
  try {
    const response = await route.fetch({ url: server.baseUrl + url.pathname + url.search, headers: forwarded });
    await route.fulfill({ response });
  } catch (error) {
    const message = String(error?.message ?? error).split('\n')[0];
    if (!finished() && !CONTEXT_CLOSED.test(message)) onFailure(`${url.pathname}: ${message}`);
    await route.abort().catch(() => { /* The page or context is already closed. */ });
  }
}
