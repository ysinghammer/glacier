import type { IValidationError } from '../../_interfaces/IValidationError.js';

/**
 * A pre-built, composable validator closure produced by compiling a schema
 * node. Returns an empty array when `value` is valid; composing validators
 * is then just concatenating error arrays.
 */
export interface ICompiledValidator {
  (value: unknown, path: readonly (string | number)[]): IValidationError[];
}
