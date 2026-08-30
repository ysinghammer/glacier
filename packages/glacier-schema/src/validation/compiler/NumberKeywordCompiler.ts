import { compileConst } from './_functions/compileConst.js';
import { compileEnum } from './_functions/compileEnum.js';
import { combineValidators } from './_functions/combineValidators.js';
import { compileMultipleOf } from './_functions/compileMultipleOf.js';
import { compileTypeCheck } from './_functions/compileTypeCheck.js';
import type { ICompiledValidator } from './_interfaces/ICompiledValidator.js';
import type { INumberSchemaNode } from '../../definition/_interfaces/INumberSchemaNode.js';

/** Compiles every keyword that applies to a `{ type: "number" | "integer" }` schema node. */
export class NumberKeywordCompiler {
  /** Compiles an `INumberSchemaNode` into a single combined validator. */
  public static compile(node: INumberSchemaNode): ICompiledValidator {
    const checks: ICompiledValidator[] = [
      node.type === 'integer'
        ? compileTypeCheck(
            'integer',
            (value) => typeof value === 'number' && Number.isInteger(value)
          )
        : compileTypeCheck('number', (value) => typeof value === 'number' && Number.isFinite(value))
    ];
    if (node.minimum !== undefined) checks.push(NumberKeywordCompiler.compileMinimum(node.minimum));
    if (node.maximum !== undefined) checks.push(NumberKeywordCompiler.compileMaximum(node.maximum));
    if (node.exclusiveMinimum !== undefined) {
      checks.push(NumberKeywordCompiler.compileExclusiveMinimum(node.exclusiveMinimum));
    }
    if (node.exclusiveMaximum !== undefined) {
      checks.push(NumberKeywordCompiler.compileExclusiveMaximum(node.exclusiveMaximum));
    }
    if (node.multipleOf !== undefined) {
      checks.push(compileMultipleOf(node.multipleOf));
    }
    if (node.enum !== undefined) checks.push(compileEnum(node.enum));
    if (node.const !== undefined) checks.push(compileConst(node.const));
    return combineValidators(checks);
  }

  private static compileMinimum(limit: number): ICompiledValidator {
    return (value, path) => {
      if (typeof value !== 'number' || value >= limit) return [];
      return [
        {
          path: [...path],
          keyword: 'minimum',
          message: `must be >= ${String(limit)}`,
          params: { limit }
        }
      ];
    };
  }

  private static compileMaximum(limit: number): ICompiledValidator {
    return (value, path) => {
      if (typeof value !== 'number' || value <= limit) return [];
      return [
        {
          path: [...path],
          keyword: 'maximum',
          message: `must be <= ${String(limit)}`,
          params: { limit }
        }
      ];
    };
  }

  private static compileExclusiveMinimum(limit: number): ICompiledValidator {
    return (value, path) => {
      if (typeof value !== 'number' || value > limit) return [];
      return [
        {
          path: [...path],
          keyword: 'exclusiveMinimum',
          message: `must be > ${String(limit)}`,
          params: { limit }
        }
      ];
    };
  }

  private static compileExclusiveMaximum(limit: number): ICompiledValidator {
    return (value, path) => {
      if (typeof value !== 'number' || value < limit) return [];
      return [
        {
          path: [...path],
          keyword: 'exclusiveMaximum',
          message: `must be < ${String(limit)}`,
          params: { limit }
        }
      ];
    };
  }
}
