import type { InnerRequestInit, RequestMethod, RequestSchema } from '@/lib/generate-request';
import type { z } from 'zod';

// ---------------------

export type ZodAnyObject = z.ZodObject<any>;

export type ZodFormData = z.ZodType<FormData, z.ZodTypeDef, FormData>;

// ---------------------

export type SerializableValue = string | number | boolean | null;

export type SerializableArray = SerializableValue[];

export type SerializableRecord = Record<string, SerializableValue>;

export type Serializable = SerializableValue | SerializableArray | SerializableRecord;

// ---------------------

export type ZodRequestInit<
  ZSchema extends RequestSchema,
  RMethod extends RequestMethod
> = InnerRequestInit<ZSchema, RMethod>;

/**
 * Alias for Zod Request Init
 */
export type RequestInit = ZodRequestInit<any, any>;
