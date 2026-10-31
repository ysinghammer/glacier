import type { IClass, IConstructableClass } from "@glacier/reflection";
import { SchemaCompiler } from "../domain/schema/SchemaCompiler.js";
import type { ISchemaParseOptions } from "../domain/schema/ISchemaParseOptions.js";
import type { IResult } from "../domain/failures/IResult.js";
import { SchemaError } from "../domain/failures/SchemaError.error.js";
import { SCHEMA_ERROR_BRAND } from "../domain/failures/SchemaErrorBrand.js";
import type { IJsonSchema } from "../domain/json-schema/IJsonSchema.js";
import type { IJsonSchemaOptions } from "../domain/json-schema/IJsonSchemaOptions.js";
import { JsonSchemaGenerator } from "../domain/json-schema/JsonSchemaGenerator.js";
import { OutboundCompiler } from "../domain/serialization/OutboundCompiler.js";
import { JsonProjection } from "../domain/serialization/JsonProjection.js";
import type { IJsonValue } from "../domain/serialization/IJsonValue.js";
import type { IJsonSchemaCompatibilityOptions } from "../domain/json-schema/IJsonSchemaCompatibilityOptions.js";
import { JsonSchemaCompatibility } from "../domain/json-schema/JsonSchemaCompatibility.js";

/** Public preparation, input validation, outbound JSON projection and directional schema generation. */
export class Schema {
  /**
   * Checks all reachable metadata for known wire-type and structural annotation contradictions.
   * Resolves lazy metadata references only; never constructs values or runs defaults/transforms/refinements,
   * freezes metadata, or changes ordinary parsing/generation. Throws SchemaDefinitionError on disagreement.
   * Output uses JSON without coercion. Bounded checks do not prove arbitrary callback equivalence or validate
   * the complete external JSON Schema/OpenAPI specification.
   */
  public static assertJsonSchemaCompatibility<T extends object>(
    target: IConstructableClass<T>,
    options: IJsonSchemaCompatibilityOptions,
  ): void {
    JsonSchemaCompatibility.options(options);
    new JsonSchemaGenerator("openapi-3.1", options.direction, options).generate(target);
  }
  /**
   * Synchronously prepares input/output processing and freezes reachable schema metadata and ancestors.
   * Resolves lazy metadata references but never runs constructors, defaults, transforms or refinements.
   * Idempotent; malformed definitions throw SchemaDefinitionError. Failed preparation does not unfreeze
   * metadata: recover with corrected, fresh class declarations, not registry reset operations.
   */
  public static prepare<T extends object>(target: IConstructableClass<T>): void {
    OutboundCompiler.prepare(target);
  }

  /**
   * Validates unknown logical DTO data and returns detached renamed JSON or typed issues. Reads only
   * declared data descriptors, strips extras and runs field/class refinements on constructor-free DTOs.
   * No defaults, coercion, transforms or string normalization run. Dates/collections project to JSON;
   * unsafe descriptors, cycles and non-JSON values fail without calling getters or consumer toJSON.
   * Definition failures throw; diagnostic messages/params are private detail for transport redaction.
   */
  public static safeSerialize<T extends object>(
    target: IConstructableClass<T>,
    value: unknown,
  ): IResult<IJsonValue> {
    Schema.prepare(target);
    const names = new WeakMap<object, ReadonlyMap<string, string>>();
    const result = OutboundCompiler.compile(target)(value, {
      options: {},
      depth: 0,
      active: new Set(),
      names,
    });
    if (!result.ok) return result;
    return JsonProjection.copy(result.value, names, true);
  }
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
   * class name or `Describe({ name })`; properties use `Rename` aliases. Input (default) excludes optional/defaulted
   * fields from `required`; output excludes only optional fields and closes projected DTO objects. Output bigint
   * and nonfinite literals have an unsatisfiable schema. `Refine` and `Transform` are skipped, as are string flags other than none
   * and `u`. A discriminated union becomes `oneOf` with a `discriminator` mapping and `IsOneOf` becomes `oneOf`.
   * Pure: it does not freeze or compile the class. Throws `SchemaDefinitionError` for an unknown target, colliding
   * or empty definition names, or fields with modifiers but no type.
   */
  static toJsonSchema<T extends object>(
    target: abstract new (...arguments_: never[]) => T,
    options: IJsonSchemaOptions,
  ): IJsonSchema {
    return new JsonSchemaGenerator(options.target, options.direction).generate(
      target as unknown as IClass,
    );
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
