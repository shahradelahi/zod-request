import type { URLSearchParamsInit } from '@/lib/global-fetch';
import type { SerializableRecord, ZodAnyObject } from '@/types';
import { removeUndefined } from '@/utils/object';
import { z } from 'zod';

type BodySchema = ZodAnyObject | z.ZodString;

export type RequestOption<ZSchema extends z.ZodType, E = unknown> =
  ZSchema extends z.ZodType<infer Z> ? Z : E;

export type RequestBody<ZSchema extends BodySchema> = RequestOption<ZSchema, RequestInit['body']>;

export type RequestFormData<ZSchema extends BodySchema> = RequestOption<
  ZSchema,
  SerializableRecord
>;

export type RequestSearchParams<ZSchema extends ZodAnyObject> = RequestOption<
  ZSchema,
  URLSearchParamsInit
>;

export type RequestHeaders<ZSchema extends ZodAnyObject> = RequestOption<
  ZSchema,
  RequestInit['headers']
>;

export type RequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

type MethodHasBody<M> = M extends 'POST' | 'PUT' | 'PATCH' ? true : false;

export type RequestSchema = {
  searchParams?: ZodAnyObject;
  headers?: ZodAnyObject;
  response?: z.ZodType;
  body?: BodySchema;
};

export type InnerRequestInit<RSchema extends RequestSchema, RMethod extends RequestMethod> = Omit<
  RequestInit,
  'url' | 'headers' | 'body' | 'method'
> & {
  schema?: RSchema;
  method?: RMethod;
} & (RSchema['searchParams'] extends z.ZodType // searchParams and will automatically append the given URL.
    ? { params: RequestSearchParams<RSchema['searchParams']> }
    : { params?: URLSearchParamsInit | undefined }) &
  (RSchema['headers'] extends z.ZodType
    ? { headers: RequestHeaders<RSchema['headers']> }
    : { headers?: RequestInit['headers'] | undefined }) &
  (MethodHasBody<RMethod> extends true
    ? RSchema['body'] extends BodySchema
      ?
          | {
              body: RequestBody<RSchema['body']>;
              form?: never;
            }
          | {
              body?: never;
              form: RequestFormData<RSchema['body']>;
            }
      : {
          body?: RequestInit['body'];
          form?: SerializableRecord;
        }
    : { body?: never; form?: never });

export function generateRequest<ZSchema extends RequestSchema, ZMethod extends RequestMethod>(
  url: URL | string,
  init: InnerRequestInit<ZSchema, ZMethod>
): { url: string; input: RequestInit } {
  const {
    schema,
    params: rawSearchParams,
    headers: rawHeaders,
    body: rawBody,
    form,
    ...restInit
  } = init;

  const newInit: RequestInit = restInit;
  const _url = toURL(url);

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
        formData.append(key, value);
      }

      newInit.body = formData;
    } else {
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
  }

  if (schema?.headers) {
    if (typeof rawHeaders === 'undefined') {
      throw new Error('Headers schema is defined but no headers were provided.');
    }

    newInit.headers = parseHeaders(rawHeaders, schema.headers);
  } else {
    // We are not suppose to strict headers if schema is not provided.
    // Just remove undefined headers.
    if (rawHeaders) {
      newInit.headers = removeUndefined(rawHeaders) as Record<string, any>;
    }
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
  rawSearchParams: InnerRequestInit<any, any>['params'],
  schema: ZodAnyObject
) {
  const searchParams = schema.parse(rawSearchParams);

  const outSearchParams: Record<string, string> = {};

  for (const [key, value] of Object.entries(searchParams)) {
    outSearchParams[key] = value;
  }

  return outSearchParams;
}

function parseHeaders(rawHeaders: InnerRequestInit<any, any>['headers'], schema: ZodAnyObject) {
  const headers = schema.parse(rawHeaders);

  const outHeaders: Record<string, string> = {};

  for (const [key, value] of Object.entries(headers)) {
    outHeaders[key] = value;
  }

  return outHeaders;
}
