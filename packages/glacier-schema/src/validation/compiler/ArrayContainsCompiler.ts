import { deepEqual } from './_functions/deepEqual.js';
import { isArrayValue } from './_functions/isArrayValue.js';
import type { ICompiledValidator } from './_interfaces/ICompiledValidator.js';
import type { TSchemaLike } from '../../definition/TSchemaLike.js';

/**
 * Compiles the `contains`/`minContains`/`maxContains` and `uniqueItems`
 * array keywords. Delegates nested schema compilation back through
 * `compileNested` to avoid a circular import with `SchemaCompiler`.
 */
export class ArrayContainsCompiler {
  /** Compiles `contains`, requiring between `minContains` and `maxContains` matching elements. */
  public static compileContains(
    contains: TSchemaLike,
    minContains: number | undefined,
    maxContains: number | undefined,
    compileNested: (schema: TSchemaLike) => ICompiledValidator
  ): ICompiledValidator {
    const validator = compileNested(contains);
    const min = minContains ?? 1;
    return (value, path) => {
      if (!isArrayValue(value)) return [];
      const matchCount = value.filter((item) => validator(item, []).length === 0).length;
      if (matchCount >= min && (maxContains === undefined || matchCount <= maxContains)) return [];
      return [
        {
          path: [...path],
          keyword: 'contains',
          message: 'does not contain the required number of matching items',
          params: { matchCount, minContains: min, maxContains }
        }
      ];
    };
  }

  /** Compiles `uniqueItems`, rejecting the first structurally-duplicate element found. */
  public static compileUniqueItems(): ICompiledValidator {
    return (value, path) => {
      if (!isArrayValue(value)) return [];
      for (let i = 0; i < value.length; i += 1) {
        for (let j = i + 1; j < value.length; j += 1) {
          if (deepEqual(value[i], value[j])) {
            return [
              {
                path: [...path],
                keyword: 'uniqueItems',
                message: 'must not contain duplicate items',
                params: { duplicateIndex: j }
              }
            ];
          }
        }
      }
      return [];
    };
  }
}
