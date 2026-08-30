import { compileConst } from './_functions/compileConst.js';
import { compileEnum } from './_functions/compileEnum.js';
import { combineValidators } from './_functions/combineValidators.js';
import { compileFormatCheck } from './_functions/compileFormatCheck.js';
import { compileTypeCheck } from './_functions/compileTypeCheck.js';
import type { ICompiledValidator } from './_interfaces/ICompiledValidator.js';
import type { IStringSchemaNode } from '../../definition/_interfaces/IStringSchemaNode.js';

/** Compiles every keyword that applies to a `{ type: "string" }` schema node. */
export class StringKeywordCompiler {
  /** Compiles an `IStringSchemaNode` into a single combined validator. */
  public static compile(node: IStringSchemaNode): ICompiledValidator {
    const checks: ICompiledValidator[] = [
      compileTypeCheck('string', (value) => typeof value === 'string')
    ];
    if (node.minLength !== undefined)
      checks.push(StringKeywordCompiler.compileMinLength(node.minLength));
    if (node.maxLength !== undefined)
      checks.push(StringKeywordCompiler.compileMaxLength(node.maxLength));
    if (node.pattern !== undefined) checks.push(StringKeywordCompiler.compilePattern(node.pattern));
    if (node.format !== undefined) checks.push(compileFormatCheck(node.format));
    if (node.enum !== undefined) checks.push(compileEnum(node.enum));
    if (node.const !== undefined) checks.push(compileConst(node.const));
    return combineValidators(checks);
  }

  private static compileMinLength(limit: number): ICompiledValidator {
    return (value, path) => {
      if (typeof value !== 'string' || value.length >= limit) return [];
      return [
        {
          path: [...path],
          keyword: 'minLength',
          message: `must be at least ${String(limit)} characters long`,
          params: { limit }
        }
      ];
    };
  }

  private static compileMaxLength(limit: number): ICompiledValidator {
    return (value, path) => {
      if (typeof value !== 'string' || value.length <= limit) return [];
      return [
        {
          path: [...path],
          keyword: 'maxLength',
          message: `must be at most ${String(limit)} characters long`,
          params: { limit }
        }
      ];
    };
  }

  private static compilePattern(pattern: string): ICompiledValidator {
    const regex = new RegExp(pattern, 'u');
    return (value, path) => {
      if (typeof value !== 'string' || regex.test(value)) return [];
      return [
        {
          path: [...path],
          keyword: 'pattern',
          message: `must match pattern "${pattern}"`,
          params: { pattern }
        }
      ];
    };
  }
}
