import { z, ZodError } from 'zod';

export class SchemaError implements Error {
  readonly name = 'SchemaError';

  constructor(
    public readonly message: string,
    public readonly stack?: string
  ) {}
}

export class ResponseValidationError extends ZodError {
  readonly name = 'ResponseValidationError';

  constructor(errors: ZodError['errors']) {
    super(errors);
  }
}
