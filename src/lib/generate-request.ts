import { URLSearchParamsInit } from '@/lib/global-fetch';
import { SerializableRecord, ZodAnyObject, ZodSerializable } from '@/types';
import { z } from 'zod';

type BodySchema = ZodAnyObject | z.ZodString;

// export type RequestBody<ZSchema extends BodySchema> =
//   ZSchema extends z.ZodType<infer ZSchema> ? ZSchema : RequestInit['body'];
//
// export type RequestFormData<ZSchema extends BodySchema> =
//   ZSchema extends z.ZodType<infer ZSchema> ? ZSchema : SerializableRecord;
//
// export type RequestSearchParams<ZSchema extends ZodAnyObject> =
//   ZSchema extends z.ZodType<infer ZSchema> ? ZSchema : URLSearchParamsInit;
//
// export type RequestHeaders<ZSchema extends ZodAnyObject> =
//   ZSchema extends z.ZodType<infer ZSchema> ? ZSchema : RequestInit['headers'];

export type RequestOption<Z extends z.ZodType, E = unknown> = Z extends z.ZodType<infer Z> ? Z : E;

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
  response?: ZodSerializable;
  body?: BodySchema;
};

export interface InnerRequestInit<RSchema extends RequestSchema, RMethod extends RequestMethod>
  extends Omit<RequestInit, 'url' | 'headers' | 'body' | 'method'> {
  schema?: RSchema;
  method?: RMethod;
  body?: MethodHasBody<RMethod> extends false // If method doesn't have body, then body must be undefined.
    ? never
    : RSchema['body'] extends BodySchema
      ? RequestBody<RSchema['body']>
      : any; // Because of there is a body but not a schema, we can't infer the type of body.
  // This option will convert the given object to a FormData instance and uses it as the request body.
  form?: MethodHasBody<RMethod> extends false // If method doesn't have body, then form must be undefined.
    ? never
    : RSchema['body'] extends BodySchema
      ? RequestFormData<RSchema['body']>
      : SerializableRecord; // Because of there is a body but not a schema, form can be any serializable type.
  // This option is searchParams and will automatically append the given URL.
  params?: RSchema['searchParams'] extends z.ZodType
    ? RequestSearchParams<RSchema['searchParams']>
    : URLSearchParamsInit;
  headers?: RSchema['headers'] extends z.ZodType
    ? RequestHeaders<RSchema['headers']>
    : RequestInit['headers'];
}

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
