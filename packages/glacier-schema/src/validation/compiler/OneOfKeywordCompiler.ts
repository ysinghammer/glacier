import type { ICompiledValidator } from './_interfaces/ICompiledValidator.js';
import type { IOneOfSchemaNode } from '../../definition/_interfaces/IOneOfSchemaNode.js';
import type { TSchemaLike } from '../../definition/TSchemaLike.js';

/**
 * Compiles the `oneOf` keyword. Delegates nested schema compilation back
 * through `compileNested` to avoid a circular import with `SchemaCompiler`.
 */
export class OneOfKeywordCompiler {
  /** Compiles an `IOneOfSchemaNode` into a single combined validator. */
  public static compile(
    node: IOneOfSchemaNode,
    compileNested: (schema: TSchemaLike) => ICompiledValidator
  ): ICompiledValidator {
    const validators = node.oneOf.map((schema) => compileNested(schema));
    return (value, path) => {
      const matchCount = validators.filter(
        (validator) => validator(value, path).length === 0
      ).length;
      if (matchCount === 1) return [];
      return [
        {
          path: [...path],
          keyword: 'oneOf',
          message: `must match exactly one schema, but matched ${String(matchCount)}`,
          params: { matchCount }
        }
      ];
    };
  }
}
