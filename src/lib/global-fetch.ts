let GLOBAL_FETCH: Fetch = fetch ?? globalThis?.fetch;

export type Fetch = (typeof globalThis)['fetch'] | typeof fetch;

export function getGlobalFetch() {
  return GLOBAL_FETCH;
}

/**
 * Sets the global fetch function to the specified fetcher.
 *
 * NOTE: This only affects the `zod-request` package, and it won't actually be used anywhere else.
 *
 * Example:
 *
 * ```javascript
 * import { setGlobalFetch } from 'zod-request';
 * import fetch from 'node-fetch';
 *
 * setGlobalFetch(fetch);
 * ```
 */
export function setGlobalFetch(fetcher: any) {
  GLOBAL_FETCH = fetcher;
}

export type URLSearchParamsInit =
  | URLSearchParams
  | string
  | Record<string, string | readonly string[]>
  | Iterable<[string, string]>
  | ReadonlyArray<[string, string]>;

export type GlobalRequestInit = RequestInit;

export type GlobalResponse = Response;
