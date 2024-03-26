import {
  generateRequest,
  type InnerRequestInit as RequestInit,
  RequestMethod,
  RequestSchema
} from '@/lib/generate-request';
import { Response } from '@/response';
import { getGlobalFetch } from './lib/global-fetch';

// ------------------------------

export async function fetch<ZSchema extends RequestSchema, RMethod extends RequestMethod>(
  url: URL | string,
  init: RequestInit<ZSchema, RMethod>
): Promise<Response<ZSchema['response']>> {
  const { url: newUrl, input } = generateRequest(url, init);

  const resp = await getGlobalFetch()(newUrl, input);

  return new Response(resp, init.schema?.response);
}

// ------------------------------

export type { RequestInit, RequestSchema };
export { Response };
export type { URLSearchParamsInit } from '@/lib/global-fetch';

// ------------------------------

export { SchemaError, ZodValidationError } from '@/error';

// ------------------------------

export default fetch;
