import { AppError } from './AppError.js';
import type { IValidationError } from '../_interfaces/IValidationError.js';

/**
 * Marker property used to identify a `SchemaValidationError` without
 * relying solely on `instanceof`, which produces false negatives when
 * multiple copies of this package end up in the dependency tree. Mirrors
 * the pattern used by Axios's `isAxiosError`.
 */
const VALIDATION_ERROR_MARKER = '__isSchemaValidationError';

/**
 * Thrown by `Schema.assertValid` when a value fails validation. Carries
 * everything needed to diagnose the failure without re-running validation.
 */
export class SchemaValidationError extends AppError {
  /** The schema definition the value was checked against. */
  public readonly schema: unknown;
  /** The actual value that failed validation. */
  public readonly value: unknown;
  /** Every collected validation error, same shape as `ValidationResult`'s `errors`. */
  public readonly errors: IValidationError[];

  /**
   * @param schema The raw schema definition the value was checked against.
   * @param value The value that failed validation.
   * @param errors Every validation error collected while checking `value`.
   */
  public constructor(schema: unknown, value: unknown, errors: IValidationError[]) {
    super('Value failed schema validation', 'schema-validation-failed');
    this.schema = schema;
    this.value = value;
    this.errors = errors;
    Object.defineProperty(this, VALIDATION_ERROR_MARKER, {
      value: true,
      enumerable: false
    });
  }

  /**
   * Type guard for `catch` blocks, mirroring Axios's `isAxiosError`. Checks
   * for a stable marker property instead of relying solely on
   * `instanceof`, so it still works when multiple copies of this package
   * end up in the dependency tree.
   *
   * @param error The unknown value caught in a `catch` block.
   * @returns Whether `error` is a `SchemaValidationError`.
   */
  public static isValidationError(error: unknown): error is SchemaValidationError {
    if (typeof error !== 'object' || error === null) {
      return false;
    }
    return Reflect.get(error, VALIDATION_ERROR_MARKER) === true;
  }
}
