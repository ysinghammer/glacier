import type { ICompiledValidator } from '../_interfaces/ICompiledValidator.js';

/** Combines several validators into one, concatenating all of their errors. */
export function combineValidators(validators: readonly ICompiledValidator[]): ICompiledValidator {
  return (value, path) => validators.flatMap((validator) => validator(value, path));
}
