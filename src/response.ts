import { z } from 'zod';

import { ZodRequestError, ZodValidationError } from '@/error';
import type { GlobalResponse } from '@/lib/global-fetch';

export type ResponseSchema = z.ZodType | undefined;

export class ZodResponse<ZSchema extends ResponseSchema> extends globalThis.Response {
  constructor(
    public rawRes: GlobalResponse,
    public schema: ZSchema
  ) {
    super();
  }

  async unsafeJson(): Promise<any> {
    return this.rawRes.json();
  }

  override async json(): Promise<
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
    return this.rawRes.text();
  }

  override async text(): Promise<string> {
    const data = await this.unsafeText();

    if (this.schema) {
      // Text can only be a string. If it's not, we can't validate it.
      if (!(this.schema instanceof z.ZodString)) {
        throw new ZodRequestError('Response schema must be a string.');
      }

      const parsedData = this.schema.safeParse(data);
      if (!parsedData.success) {
        throw ZodValidationError.fromZodError(parsedData.error);
      }
    }

    return data;
  }

  override clone(): ZodResponse<ZSchema> {
    return new ZodResponse<ZSchema>(this.rawRes.clone(), this.schema);
  }
}
