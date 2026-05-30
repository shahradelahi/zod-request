import { ZodError, ZodIssue } from 'zod';

export class ZodValidationError extends ZodError {
  override readonly name = 'ZodValidationError';

  constructor(errors: ZodIssue | ZodIssue[]) {
    super(Array.isArray(errors) ? errors : [errors]);
  }

  static fromZodError(error: ZodError): ZodValidationError {
    return new ZodValidationError(error.issues);
  }
}

export class ZodRequestError extends Error {
  override readonly name = 'ZodRequestError';

  constructor(message: string) {
    super(message);
  }

  static fromZodError(error: ZodError): ZodRequestError {
    return new ZodRequestError(error.message);
  }
}
