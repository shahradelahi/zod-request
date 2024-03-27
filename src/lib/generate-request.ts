import { ZodRequestError } from '@/error';
import type { URLSearchParamsInit } from '@/lib/global-fetch';
import type { SerializableRecord, ZodAnyObject, ZodFormData } from '@/types';
import { removeUndefined } from '@/utils/object';
import Mustache from 'mustache';
import { z } from 'zod';

type BodySchema = ZodFormData | ZodAnyObject | z.ZodString;

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
  path?: z.ZodObject<any>;
  searchParams?: ZodAnyObject;
  headers?: ZodAnyObject;
  response?: z.ZodType;
  body?: BodySchema;
};

export type ZodRequestInit<RSchema extends RequestSchema, RMethod extends RequestMethod> = Omit<
  RequestInit,
  'url' | 'headers' | 'body' | 'method'
> & {
  schema?: RSchema;
  method?: RMethod;
  refine?: (
    url: URL,
    input: RequestInit
  ) => Partial<{
    url: URL;
    input: RequestInit;
  }>;
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
    : { body?: never; form?: never }) &
  (RSchema['path'] extends z.ZodType
    ? { path: RequestOption<RSchema['path'], Record<string, string | number>> }
    : { path?: Record<string, string | number> });

export function generateRequest<ZSchema extends RequestSchema, ZMethod extends RequestMethod>(
  url: URL | string,
  init: ZodRequestInit<ZSchema, ZMethod>
): { url: URL; input: RequestInit } {
  const {
    schema,
    path: rawPath,
    params: rawSearchParams,
    headers: rawHeaders,
    body: rawBody,
    form: rawForm,
    refine,
    ...restInit
  } = init;

  const newInit: RequestInit = restInit;
  let _url = toURL(url);

  ////
  // Path
  ////

  if (schema?.path && typeof rawPath !== 'object') {
    throw new ZodRequestError('Path schema is defined but no path was provided.');
  }

  if (typeof rawPath === 'object') {
    let pathData: object = rawPath;

    // Validate path
    if (schema?.path) {
      const parsedPath = schema.path.safeParse(rawPath);
      if (!parsedPath.success) {
        throw ZodRequestError.fromZodError(parsedPath.error);
      }

      pathData = parsedPath.data;
    }

    // Decode the url to use mustache to parse it.
    // /posts/%7B%7Bid%7D%7D => /posts/{{id}}
    const href = decodeURI(_url.toString());

    // Use mustache to parse the path.
    _url = toURL(Mustache.render(href, pathData));
  }

  ////
  // Search Params
  ////

  if (schema?.searchParams) {
    const parsedSearchParams = parseSearchParams(rawSearchParams, schema.searchParams);

    for (const [key, value] of Object.entries(parsedSearchParams)) {
      _url.searchParams.set(key, value);
    }
  }

  ////
  // Headers
  ////

  if (schema?.headers) {
    if (typeof rawHeaders === 'undefined') {
      throw new ZodRequestError('Headers schema is defined but no headers were provided.');
    }

    newInit.headers = parseHeaders(rawHeaders, schema.headers);
  } else {
    // We are not suppose to strict headers if schema is not provided.
    // Just remove undefined headers.
    if (rawHeaders) {
      newInit.headers = removeUndefined(rawHeaders) as Record<string, any>;
    }
  }

  ////
  // Body
  ////

  const RequestHasBody = rawBody || rawForm;

  if (RequestHasBody && init.method && !requestMethodCanHaveBody(init.method)) {
    throw new ZodRequestError('Request with ' + init.method + ' method cannot have body.');
  }

  if (schema?.body && !RequestHasBody) {
    throw new ZodRequestError('Body schema is defined but no body was provided.');
  }

  if (RequestHasBody) {
    // If there was schema provided, we need to validate the body.

    let finalizedBody;

    if (rawForm) {
      const formInit = schema?.body ? schema.body.parse(rawForm) : rawForm;
      finalizedBody = generateFormDataFromInit(formInit);
    }

    if (rawBody) {
      const bodyInit = schema?.body ? schema.body.parse(rawBody) : rawBody;
      finalizedBody = bodyInit;
    }

    // If header content-type is "application/json" and body is an object, then stringify the body.
    const contentType = Object.keys(newInit.headers || {}).find(
      (header) => header.toLowerCase() === 'content-type'
    );

    if (
      contentType &&
      contentType.includes('application/json') &&
      typeof finalizedBody === 'object'
    ) {
      finalizedBody = JSON.stringify(finalizedBody);
    }

    newInit.body = finalizedBody as RequestInit['body'];
  }

  if (refine) {
    const refined = refine(_url, newInit);
    return {
      url: refined?.url ?? _url,
      input: refined?.input ?? newInit
    };
  }

  return {
    url: _url,
    input: newInit
  };
}

function toURL(url: URL | string): URL {
  return url instanceof URL ? url : new URL(url);
}

function requestMethodCanHaveBody(method: RequestMethod) {
  return ['POST', 'PUT', 'PATCH'].includes(method);
}

function generateFormDataFromInit(init: Omit<ZodRequestInit<any, any>['form'], never>) {
  if (typeof init === 'undefined') {
    throw new ZodRequestError('Form is required.');
  }

  if (init instanceof FormData) return init;

  if (typeof init !== 'object') {
    throw new ZodRequestError('Form must be an serializable object. Got ' + typeof init);
  }

  // Removing the undefined values from the form because it will automatically cast to string.
  const noUndefined = removeUndefined(init);
  const out = new FormData();

  for (const [key, value] of Object.entries(noUndefined)) {
    if (!(value instanceof Blob) && !['string', 'number'].includes(typeof value)) {
      throw new ZodRequestError('Form data must be a string, number or Blob.');
    }
    out.set(key, value instanceof Blob ? value : String(value));
  }

  return out;
}

function parseSearchParams(
  rawSearchParams: ZodRequestInit<any, any>['params'],
  schema: ZodAnyObject
) {
  const searchParams = schema.parse(rawSearchParams);

  const outSearchParams: Record<string, string> = {};

  for (const [key, value] of Object.entries(searchParams)) {
    outSearchParams[key] = value;
  }

  return outSearchParams;
}

function parseHeaders(
  rawHeaders: Omit<ZodRequestInit<any, any>['headers'], never>,
  schema: ZodAnyObject
) {
  const noUndefined = removeUndefined(rawHeaders);
  const headersInit = schema.parse(noUndefined);
  const out: Record<string, string> = {};

  for (const [key, value] of Object.entries(headersInit)) {
    out[key] = value;
  }

  return out;
}
