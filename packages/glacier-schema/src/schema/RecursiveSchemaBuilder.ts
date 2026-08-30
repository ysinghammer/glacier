import { Schema } from './Schema.js';
import { COMPILED_VALIDATOR } from './_constants/COMPILED_VALIDATOR.js';
import { SchemaCompiler } from '../validation/compiler/SchemaCompiler.js';
import { MaxRecursionDepthExceededError } from '../validation/_exceptions/MaxRecursionDepthExceededError.js';
import type { IRecursiveOptions } from './_interfaces/IRecursiveOptions.js';
import type { ICompiledValidator } from '../validation/compiler/_interfaces/ICompiledValidator.js';
import type { TSchemaNode } from '../definition/TSchemaNode.js';

const DEFAULT_MAX_RECURSION_DEPTH = 50;

/**
 * Builds self-referential `Schema` instances for `Schema.recursive`.
 * Supports mutual recursion: two or more recursive schemas can close over
 * each other's `self` placeholder regardless of construction order,
 * because `build` is only invoked lazily, on first validation.
 */
export class RecursiveSchemaBuilder {
  /**
   * @param build Receives the schema's own placeholder and returns its definition.
   * @param options.maxDepth Caps recursion depth during validation (default: 50).
   */
  public static build<T>(
    build: (self: Schema<TSchemaNode, T>) => TSchemaNode,
    options?: IRecursiveOptions
  ): Schema<TSchemaNode, T> {
    const maxDepth = options?.maxDepth ?? DEFAULT_MAX_RECURSION_DEPTH;
    const placeholder = new Schema<TSchemaNode, T>({ type: 'boolean' } as const);
    let compiledDefinition: ICompiledValidator | undefined;
    let depth = 0;
    placeholder[COMPILED_VALIDATOR] = (value, path) => {
      compiledDefinition ??= SchemaCompiler.compile(build(placeholder));
      depth += 1;
      try {
        if (depth > maxDepth) {
          throw new MaxRecursionDepthExceededError(maxDepth);
        }
        return compiledDefinition(value, path);
      } finally {
        depth -= 1;
      }
    };
    return placeholder;
  }
}
