const GLOBAL_FETCH = globalThis?.fetch ?? fetch;

export function getGlobalFetch() {
  return GLOBAL_FETCH;
}

export type URLSearchParamsInit =
  | URLSearchParams
  | string
  | Record<string, string | readonly string[]>
  | Iterable<[string, string]>
  | ReadonlyArray<[string, string]>;

export type GlobalRequestInit = RequestInit;

export type GlobalResponse = Response;
