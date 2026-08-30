import { Schema } from '../../schema/Schema.js';
import { COMPILED_VALIDATOR } from '../../schema/_constants/COMPILED_VALIDATOR.js';
import { UnsupportedSchemaError } from '../_exceptions/UnsupportedSchemaError.js';
import { ArrayKeywordCompiler } from './ArrayKeywordCompiler.js';
import { NumberKeywordCompiler } from './NumberKeywordCompiler.js';
import { ObjectKeywordCompiler } from './ObjectKeywordCompiler.js';
import { OneOfKeywordCompiler } from './OneOfKeywordCompiler.js';
import { StringKeywordCompiler } from './StringKeywordCompiler.js';
import { compileTypeCheck } from './_functions/compileTypeCheck.js';
import type { ICompiledValidator } from './_interfaces/ICompiledValidator.js';
import type { TSchemaLike } from '../../definition/TSchemaLike.js';
import type { TSchemaNode } from '../../definition/TSchemaNode.js';

/**
 * Walks a schema node once, up front, and turns it into a tree of composed
 * validator closures. There is no separate compile step at validation time
 * — validation is a plain interpreter invoking these pre-built closures.
 *
 * Dispatches to a dedicated per-keyword compiler (string/number/object/
 * array/oneOf); each of those receives `SchemaCompiler.compile` itself as
 * their "compile a nested schema" callback, so this class is the single
 * recursive entry point into schema compilation.
 */
export class SchemaCompiler {
  /**
   * Compiles `node` into a validator closure.
   *
   * @throws {UnsupportedSchemaError} If `node` uses an unsupported keyword
   * or keyword combination, as defense-in-depth against bypassing the type
   * system (e.g. via `as any`).
   */
  public static compile(node: TSchemaLike): ICompiledValidator {
    if (node instanceof Schema) {
      return (value, path) => node[COMPILED_VALIDATOR](value, path);
    }
    if ('oneOf' in node && node.oneOf !== undefined) {
      if ('type' in node && node.type !== undefined) {
        throw new UnsupportedSchemaError(
          '`type` and `oneOf` cannot be combined on the same schema node'
        );
      }
      return OneOfKeywordCompiler.compile(node, (schema) => SchemaCompiler.compile(schema));
    }
    return SchemaCompiler.compileTypedNode(node);
  }

  private static compileTypedNode(node: TSchemaNode): ICompiledValidator {
    switch (node.type) {
      case 'string':
        return StringKeywordCompiler.compile(node);
      case 'number':
      case 'integer':
        return NumberKeywordCompiler.compile(node);
      case 'boolean':
        return compileTypeCheck('boolean', (v) => typeof v === 'boolean');
      case 'object':
        return ObjectKeywordCompiler.compile(node, (schema) => SchemaCompiler.compile(schema));
      case 'array':
        return ArrayKeywordCompiler.compile(node, (schema) => SchemaCompiler.compile(schema));
      default:
        throw new UnsupportedSchemaError(`Unsupported schema node: ${JSON.stringify(node)}`);
    }
  }
}
