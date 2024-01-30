import { URLSearchParamsInit } from '@/lib/global-fetch';
import { ZodAnyObject } from '@/types';
import { z } from 'zod';

type BodySchema = ZodAnyObject | z.ZodString;

export type RequestBody<ZSchema extends BodySchema> =
  ZSchema extends z.ZodType<infer T> ? T : RequestInit['body'];

export type RequestSearchParams<ZSchema extends ZodAnyObject> =
  ZSchema extends z.ZodType<infer T> ? T : URLSearchParamsInit;

export type RequestHeaders<ZSchema extends ZodAnyObject> =
  ZSchema extends z.ZodType<infer T> ? T : RequestInit['headers'];

export type RequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

type HasBodyMethod<M> = M extends 'POST' | 'PUT' | 'PATCH' ? true : false;

export type RequestSchema = {
  searchParams?: ZodAnyObject;
  headers?: ZodAnyObject;
  response?: ZodAnyObject;
  body?: BodySchema;
};

export interface InnerRequestInit<
  RSchema extends RequestSchema,
  RMethod extends RequestMethod = 'GET'
> extends Omit<RequestInit, 'url' | 'header' | 'body' | 'method'> {
  schema?: RSchema;
  method?: RMethod;
  body?: HasBodyMethod<RMethod> extends true
    ? RSchema['body'] extends BodySchema
      ? RequestBody<RSchema['body']>
      : never
    : never;
  // This option will convert the given object to a FormData instance and uses it as the request body.
  form?: HasBodyMethod<RMethod> extends true ? RequestBody<ZodAnyObject> : never;
  searchParams?: RequestSearchParams<
    RSchema['searchParams'] extends z.ZodType ? RSchema['searchParams'] : never
  >;
  headers?: RequestHeaders<RSchema['headers'] extends z.ZodType ? RSchema['headers'] : never>;
  skipResponseValidation?: boolean;
}

export function generateRequest<ZSchema extends RequestSchema>(
  url: URL | string,
  init: InnerRequestInit<ZSchema>
): { url: string; input: RequestInit } {
  const {
    schema,
    searchParams: rawSearchParams,
    headers: rawHeaders,
    body: rawBody,
    form,
    ...restInit
  } = init;

  let newInit: RequestInit = restInit;
  let _url = toURL(url);

  if (schema?.searchParams) {
    const parsedSearchParams = parseSearchParams(rawSearchParams, schema.searchParams);

    for (const [key, value] of Object.entries(parsedSearchParams)) {
      _url.searchParams.set(key, value);
    }
  }

  if (schema?.body) {
    if (['GET', 'HEAD', 'OPTIONS'].includes(init.method || 'GET')) {
      throw new Error('Request with GET/HEAD/OPTIONS method cannot have body.');
    }

    if (typeof rawBody === 'undefined' && typeof form === 'undefined') {
      throw new Error('Request body is required.');
    }

    if (form) {
      if (typeof form !== 'object') {
        throw new Error('Form must be an serializable object. Got ' + typeof form);
      }

      const formData = new FormData();

      for (const [key, value] of Object.entries(form)) {
        formData.set(key, value);
      }

      newInit.body = formData;
    }

    if (schema.body instanceof z.ZodString) {
      if (typeof rawBody !== 'string') {
        throw new Error('Body must be a string. Got ' + typeof rawBody);
      }

      newInit.body = schema.body.parse(rawBody);
    }

    if (schema.body instanceof z.ZodObject) {
      if (typeof rawBody !== 'object') {
        throw new Error('Body must be an object. Got ' + typeof rawBody);
      }

      const parsedBody = schema.body.parse(rawBody);

      newInit.body = JSON.stringify(parsedBody);
    }
  }

  if (schema?.headers) {
    newInit.headers = parseHeaders(rawHeaders, schema.headers);
  }

  return {
    url: _url.toString(),
    input: newInit
  };
}

function toURL(url: URL | string): URL {
  return url instanceof URL ? url : new URL(url);
}

function parseSearchParams(
  rawSearchParams: InnerRequestInit<any>['searchParams'],
  schema: ZodAnyObject
) {
  const searchParams = schema.parse(rawSearchParams);

  const outSearchParams: Record<string, string> = {};

  for (const [key, value] of Object.entries(searchParams)) {
    outSearchParams[key] = value;
  }

  return outSearchParams;
}

function parseHeaders(rawHeaders: InnerRequestInit<any>['headers'], schema: ZodAnyObject) {
  const headers = schema.parse(rawHeaders);

  const outHeaders: Record<string, string> = {};

  for (const [key, value] of Object.entries(headers)) {
    outHeaders[key] = value;
  }

  return outHeaders;
}
