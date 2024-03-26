import { ZodRequestError, ZodValidationError } from '@/error';
import type { GlobalResponse } from '@/lib/global-fetch';
import { z } from 'zod';

export type ResponseSchema = z.ZodType | undefined;

export class Response<ZSchema extends ResponseSchema> implements globalThis.Response {
  readonly headers: Headers;
  readonly ok: boolean;
  readonly status: number;
  readonly statusText: string;
  readonly type: ResponseType;
  readonly url: string;
  readonly redirected: boolean;

  readonly body: ReadableStream | null;
  readonly bodyUsed: boolean;

  readonly arrayBuffer: () => Promise<ArrayBuffer>;
  readonly blob: () => Promise<Blob>;
  readonly formData: () => Promise<FormData>;

  constructor(
    private resp: GlobalResponse,
    private schema: ZSchema
  ) {
    this.headers = resp.headers;
    this.ok = resp.ok;
    this.status = resp.status;
    this.statusText = resp.statusText;
    this.type = resp.type;
    this.url = resp.url;
    this.redirected = resp.redirected;
    this.body = resp.body;
    this.bodyUsed = resp.bodyUsed;
    this.arrayBuffer = resp.arrayBuffer;
    this.blob = resp.blob;
    this.formData = resp.formData;
  }

  async unsafeJson(): Promise<any> {
    return this.resp.json();
  }

  async json(): Promise<
    ZSchema extends undefined ? any : ZSchema extends z.ZodType<infer T> ? T : unknown
  > {
    const data = await this.unsafeJson();

    if (this.schema) {
      const parsedData = this.schema.safeParse(data);
      if (!parsedData.success) {
        throw ZodValidationError.fromZodError(parsedData.error);
      }

      return parsedData.data as any;
    }

    return data;
  }

  async unsafeText(): Promise<string> {
    return this.resp.text();
  }

  async text(): Promise<string> {
    const data = await this.unsafeText();

    if (this.schema) {
      // Text can only be a string. If it's not, we can't validate it.
      if (!((this.schema as z.ZodType) instanceof z.ZodString)) {
        throw new ZodRequestError('Response schema must be a string.');
      }

      const parsedData = this.schema.safeParse(data);
      if (!parsedData.success) {
        throw ZodValidationError.fromZodError(parsedData.error);
      }
    }

    return data;
  }

  clone(): Response<ZSchema> {
    return new Response(this.resp.clone(), this.schema);
  }
}
