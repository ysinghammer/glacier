import type { ICompiledValidator } from '../_interfaces/ICompiledValidator.js';

/** Builds a validator that reports a single `type` error when `predicate` fails. */
export function compileTypeCheck(
  typeName: string,
  predicate: (value: unknown) => boolean
): ICompiledValidator {
  return (value, path) => {
    if (predicate(value)) {
      return [];
    }
    return [
      {
        path: [...path],
        keyword: 'type',
        message: `must be ${typeName}`,
        params: { type: typeName }
      }
    ];
  };
}
