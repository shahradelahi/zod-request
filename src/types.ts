import type { GlobalResponse } from '@/lib/global-fetch';
import { z, ZodObject } from 'zod';

export type ZodAnyObject = ZodObject<any>;

type ResponseSchema = ZodAnyObject | undefined;

export interface Response<ZSchema extends ResponseSchema>
  extends Omit<GlobalResponse, 'json' | 'text'> {
  json(): Promise<
    ZSchema extends undefined ? any : ZSchema extends z.ZodType<infer T> ? T : unknown
  >;
  text(): Promise<string>;
}
