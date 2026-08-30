import { describe, expect, it } from 'vitest';
import { AppError, SchemaValidationError } from '../index.js';

/** Minimal concrete `AppError` subclass used solely to exercise the shared base-class behavior. */
class TestAppError extends AppError {
  public constructor(message: string, cause?: unknown) {
    super(message, 'test-error', cause);
  }
}

describe('AppError', () => {
  it('MUST expose the stable `code` passed by the concrete subclass', () => {
    const error = new TestAppError('boom');
    expect(error.code).toBe('test-error');
    expect(error).toBeInstanceOf(Error);
  });

  it('MUST forward `cause` to the underlying Error when provided', () => {
    const cause = new Error('root cause');
    const error = new TestAppError('boom', cause);
    expect(error.cause).toBe(cause);
  });

  it('MUST leave `cause` undefined when none is provided', () => {
    const error = new TestAppError('boom');
    expect(error.cause).toBeUndefined();
  });
});

describe('SchemaValidationError.isValidationError', () => {
  it('MUST return false for null', () => {
    expect(SchemaValidationError.isValidationError(null)).toBe(false);
  });

  it('MUST return false for a non-object primitive', () => {
    expect(SchemaValidationError.isValidationError('not an error')).toBe(false);
  });
});
