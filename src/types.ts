import type { z } from 'zod';

// ---------------------

export type ZodAnyObject = z.ZodObject<any>;

export type ZodFormData = z.ZodType<FormData, z.ZodTypeDef, FormData>;

// ---------------------

export type SerializableValue = string | number | boolean | null;

export type SerializableArray = SerializableValue[];

export type SerializableRecord = Record<string, SerializableValue>;

export type Serializable = SerializableValue | SerializableArray | SerializableRecord;
