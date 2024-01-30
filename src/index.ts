import {
  generateRequest,
  type InnerRequestInit as RequestInit,
  RequestSchema
} from '@/lib/generate-request';
import type { Response } from '@/types';
import { getGlobalFetch } from './lib/global-fetch';

// ------------------------------

export async function fetch<ZSchema extends RequestSchema>(
  url: URL | string,
  init: RequestInit<ZSchema>
): Promise<Response<ZSchema['response']>> {
  const { url: newUrl, input } = generateRequest(url, init);
  return getGlobalFetch()(newUrl, input) as any;
}

// ------------------------------

export type { RequestInit, RequestSchema };
export type { Response };
export type { URLSearchParamsInit } from '@/lib/global-fetch';
