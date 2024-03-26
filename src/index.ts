import { generateRequest, RequestMethod, RequestSchema } from '@/lib/generate-request';
import { ZodResponse } from '@/response';
import type { ZodRequestInit } from '@/types';
import { getGlobalFetch } from './lib/global-fetch';

// ------------------------------

/**
 * Fetches data from the specified URL using the provided request configuration.
 *
 * @param {URL | string} url - The URL to fetch data from.
 * @param {ZodRequestInit} init - The request configuration including the schema and method.
 * @return {Promise<ZodResponse>} A promise that resolves to the response data with the specified schema.
 */
export async function fetch<ZSchema extends RequestSchema, RMethod extends RequestMethod>(
  url: URL | string,
  init: ZodRequestInit<ZSchema, RMethod>
): Promise<ZodResponse<ZSchema['response']>> {
  const { url: newUrl, input } = generateRequest(url, init);

  const resp = await getGlobalFetch()(newUrl, input);

  return new ZodResponse(resp, init.schema?.response);
}

// ------------------------------

export type { ZodRequestInit, RequestSchema, RequestMethod };
export type { RequestInit } from '@/types';

export { ZodResponse, ZodResponse as Response };
export type { URLSearchParamsInit } from '@/lib/global-fetch';

export { generateRequest };

// ------------------------------

export { ZodRequestError, ZodValidationError } from '@/error';

// ------------------------------

export default fetch;
