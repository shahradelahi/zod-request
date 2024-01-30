export function getGlobalFetch() {
  return fetch as unknown as FetchFn;
}

export type FetchFn = typeof fetch;

export type URLSearchParamsInit =
  | URLSearchParams
  | string
  | Record<string, string | readonly string[]>
  | Iterable<[string, string]>
  | ReadonlyArray<[string, string]>;

export type GlobalRequestInit = RequestInit;

export type GlobalResponse = Response;
