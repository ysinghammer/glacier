import { ArrayContainsCompiler } from './ArrayContainsCompiler.js';
import { ArrayItemsCompiler } from './ArrayItemsCompiler.js';
import { combineValidators } from './_functions/combineValidators.js';
import { compileTypeCheck } from './_functions/compileTypeCheck.js';
import { isArrayValue } from './_functions/isArrayValue.js';
import type { ICompiledValidator } from './_interfaces/ICompiledValidator.js';
import type { IArraySchemaNode } from '../../definition/_interfaces/IArraySchemaNode.js';
import type { TSchemaLike } from '../../definition/TSchemaLike.js';

/**
 * Compiles every keyword that applies to a `{ type: "array" }` schema
 * node, dispatching to `ArrayItemsCompiler`/`ArrayContainsCompiler`.
 * Delegates nested schema compilation back through `compileNested` to
 * avoid a circular import with `SchemaCompiler`.
 */
export class ArrayKeywordCompiler {
  /** Compiles an `IArraySchemaNode` into a single combined validator. */
  public static compile(
    node: IArraySchemaNode,
    compileNested: (schema: TSchemaLike) => ICompiledValidator
  ): ICompiledValidator {
    const checks: ICompiledValidator[] = [compileTypeCheck('array', isArrayValue)];
    if (node.prefixItems !== undefined) {
      checks.push(
        ArrayItemsCompiler.compilePrefixItems(node.prefixItems, node.items, compileNested)
      );
    } else if (node.items !== undefined) {
      checks.push(ArrayItemsCompiler.compileItems(node.items, compileNested));
    }
    if (node.contains !== undefined) {
      checks.push(
        ArrayContainsCompiler.compileContains(
          node.contains,
          node.minContains,
          node.maxContains,
          compileNested
        )
      );
    }
    if (node.uniqueItems === true) {
      checks.push(ArrayContainsCompiler.compileUniqueItems());
    }
    return combineValidators(checks);
  }
}
