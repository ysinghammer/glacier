import type { IValidationError } from './_interfaces/IValidationError.js';

/**
 * The outcome of validating a value against a `Schema<T>`.
 *
 * Narrow on `.valid` to access a fully-typed `.data` (or `.errors`).
 */
export type ValidationResult<T> =
  | { readonly valid: true; readonly data: T }
  | { readonly valid: false; readonly errors: IValidationError[] };
