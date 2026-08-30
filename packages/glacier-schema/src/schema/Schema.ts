import { SchemaCompiler } from '../validation/compiler/SchemaCompiler.js';
import { RecursiveSchemaBuilder } from './RecursiveSchemaBuilder.js';
import { SchemaValidationError } from '../validation/_exceptions/SchemaValidationError.js';
import { extractSchemaMeta } from './_functions/extractSchemaMeta.js';
import { COMPILED_VALIDATOR } from './_constants/COMPILED_VALIDATOR.js';
import type { ICompiledValidator } from '../validation/compiler/_interfaces/ICompiledValidator.js';
import type { IRecursiveOptions } from './_interfaces/IRecursiveOptions.js';
import type { InferNode } from '../definition/InferNode.js';
import type { ISchemaMeta } from '../definition/_interfaces/ISchemaMeta.js';
import type { TSchemaNode } from '../definition/TSchemaNode.js';
import type { ValidationResult } from '../validation/ValidationResult.js';

/**
 * A compiled, immutable JSON-Schema-shaped validator that also carries its
 * own static TypeScript type. See the package README for the full
 * supported keyword set and design philosophy.
 */
export class Schema<D extends TSchemaNode, T = InferNode<D>> {
  /** Mutable only to support `Schema.recursive`'s lazy self-reference binding. */
  private [COMPILED_VALIDATOR]: ICompiledValidator;
  private readonly rawDefinition: unknown;

  /** Metadata keywords captured from the schema definition (not used for validation). */
  public readonly meta: ISchemaMeta;

  /**
   * Compiles `definition` immediately: the schema tree is walked once, up
   * front, into a tree of composed validator closures.
   *
   * @param definition A JSON-Schema-shaped object literal, authored with `as const`.
   * @throws {UnsupportedSchemaError} If `definition` uses an unsupported keyword
   * or keyword combination that bypassed the compile-time type check.
   */
  public constructor(definition: D) {
    this.rawDefinition = definition;
    this.meta = extractSchemaMeta(definition);
    this[COMPILED_VALIDATOR] = SchemaCompiler.compile(definition);
  }

  /**
   * Validates `data`, collecting every error in the document rather than
   * stopping at the first failure. Never throws.
   *
   * @param data The unknown value to validate.
   * @returns A discriminated result: `{ valid: true; data: T }` or `{ valid: false; errors }`.
   */
  public validate(data: unknown): ValidationResult<T> {
    const errors = this[COMPILED_VALIDATOR](data, []);
    if (errors.length === 0) {
      // Runtime-validated coercion: `errors.length === 0` is exactly the
      // proof that `data` conforms to the schema's inferred type `T`.
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- this cast is the library's core validated-coercion primitive
      return { valid: true, data: data as T };
    }
    return { valid: false, errors };
  }

  /**
   * Builds a self-referential schema. See `RecursiveSchemaBuilder` for how
   * mutual recursion and lazy binding are implemented.
   *
   * @param build Receives the schema's own placeholder and returns its definition.
   * @param options.maxDepth Caps recursion depth during validation (default: 50).
   */
  public static recursive<T>(
    build: (self: Schema<TSchemaNode, T>) => TSchemaNode,
    options?: IRecursiveOptions
  ): Schema<TSchemaNode, T> {
    return RecursiveSchemaBuilder.build(build, options);
  }

  /**
   * Assertion-style validation: validates `value` against `schema` and, on
   * success, narrows `value`'s type in place. On failure, throws instead
   * of returning a result.
   *
   * @throws {SchemaValidationError} If `value` fails validation against `schema`.
   */
  public static assertValid<D2 extends TSchemaNode, T2>(
    schema: Schema<D2, T2>,
    value: unknown
  ): asserts value is T2 {
    const result = schema.validate(value);
    if (!result.valid) {
      throw new SchemaValidationError(schema.rawDefinition, value, result.errors);
    }
  }

  /** Type guard for `catch` blocks, mirroring Axios's `isAxiosError`. */
  public static isValidationError(error: unknown): error is SchemaValidationError {
    return SchemaValidationError.isValidationError(error);
  }
}
