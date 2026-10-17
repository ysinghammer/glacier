import type { IClass, IConstructableClass } from "@glacier/reflection";
import { SchemaCompiler } from "../domain/schema/SchemaCompiler.js";
import type { ISchemaParseOptions } from "../domain/schema/ISchemaParseOptions.js";
import type { IResult } from "../domain/failures/IResult.js";
import { SchemaError } from "../domain/failures/SchemaError.error.js";
import { SCHEMA_ERROR_BRAND } from "../domain/failures/SchemaErrorBrand.js";
import type { IJsonSchema } from "../domain/json-schema/IJsonSchema.js";
import type { IJsonSchemaOptions } from "../domain/json-schema/IJsonSchemaOptions.js";
import { JsonSchemaGenerator } from "../domain/json-schema/JsonSchemaGenerator.js";

/** Entry point for validating input against decorated classes and generating their JSON Schema. */
export class Schema {
  /**
   * Validates `input` against the decorated class and returns an instance or every issue found, without
   * throwing for invalid input. The instance is created without calling the constructor, only declared
   * fields are copied and unknown keys are stripped. The first call freezes the class's schema; decorating
   * it later throws `SchemaDefinitionError`. Pass `{ coerce: true }` to convert
   * strings and similar input toward the declared types first; coercion is off by default.
   */
  static safeParse<T extends object>(
    target: IConstructableClass<T>,
    input: unknown,
    options: ISchemaParseOptions = {},
  ): IResult<T> {
    return SchemaCompiler.compile<T>(target)(input, { options, depth: 0 });
  }

  /**
   * Like `safeParse` but returns the instance directly and throws `SchemaError` carrying every issue when
   * the input is invalid. Throws `SchemaDefinitionError` for incorrectly declared classes.
   */
  static parse<T extends object>(
    target: IConstructableClass<T>,
    input: unknown,
    options?: ISchemaParseOptions,
  ): T {
    const result = Schema.safeParse(target, input, options);
    if (!result.ok) throw new SchemaError(result.issues);
    return result.value;
  }

  /**
   * Generates the JSON Schema of one decorated class and every class it references. `draft-2020-12` returns
   * `{ $schema, $ref, $defs }`; `openapi-3.1` returns `{ $ref, components: { schemas } }`. Definitions are keyed by
   * class name or `Describe({ name })`; properties use `Rename` aliases, and optional or defaulted fields are not
   * `required`. `Refine` and `Transform` are not expressible and are skipped, as are string flags other than none
   * and `u`. A discriminated union becomes `oneOf` with a `discriminator` mapping and `IsOneOf` becomes `oneOf`.
   * Pure: it does not freeze or compile the class. Throws `SchemaDefinitionError` for an unknown target, colliding
   * or empty definition names, or fields with modifiers but no type.
   */
  static toJsonSchema<T extends object>(
    target: abstract new (...arguments_: never[]) => T,
    options: IJsonSchemaOptions,
  ): IJsonSchema {
    return new JsonSchemaGenerator(options.target).generate(target as unknown as IClass);
  }

  /**
   * Type guard recognising a `SchemaError` by its registered-symbol brand, so errors created by a duplicate
   * copy of this package are still recognised. Never throws; any non-error value yields `false`.
   */
  static isError(error: unknown): error is SchemaError {
    return (
      typeof error === "object" && error !== null && Reflect.get(error, SCHEMA_ERROR_BRAND) === true
    );
  }
}
