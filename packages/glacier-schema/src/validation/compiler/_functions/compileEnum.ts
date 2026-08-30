import { deepEqual } from './deepEqual.js';
import type { ICompiledValidator } from '../_interfaces/ICompiledValidator.js';

/** Compiles the `enum` keyword: `value` must deep-equal one of `values`. */
export function compileEnum(values: readonly unknown[]): ICompiledValidator {
  return (value, path) => {
    if (values.some((candidate) => deepEqual(candidate, value))) return [];
    return [
      {
        path: [...path],
        keyword: 'enum',
        message: 'must be one of the allowed values',
        params: { allowed: values }
      }
    ];
  };
}
