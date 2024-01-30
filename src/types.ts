import { z } from 'zod';

export type ZodAnyObject = z.ZodObject<any>;

export type ZodSerializable =
  | z.ZodObject<any>
  | z.ZodArray<any>
  | z.ZodString
  | z.ZodNumber
  | z.ZodBoolean;

export type ZodJsonLike = z.ZodObject<any> | z.ZodArray<any>;

export type SerializableValue = string | number | boolean | null;

export type SerializableArray = SerializableValue[];

export type SerializableRecord = Record<string, SerializableValue>;

export type Serializable = SerializableValue | SerializableArray | SerializableRecord;
