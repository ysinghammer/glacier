import { deepEqual } from './deepEqual.js';
import type { ICompiledValidator } from '../_interfaces/ICompiledValidator.js';

/** Compiles the `const` keyword: `value` must deep-equal `expected`. */
export function compileConst(expected: unknown): ICompiledValidator {
  return (value, path) => {
    if (deepEqual(expected, value)) return [];
    return [
      {
        path: [...path],
        keyword: 'const',
        message: 'must equal the expected constant value',
        params: { expected }
      }
    ];
  };
}
