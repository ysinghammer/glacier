import type { IClass, IConstructableClass } from "@glacier/reflection";
import { SchemaCompiler } from "../../domain/schemaProcessing/schema/SchemaCompiler.js";
import type { ISchemaParseOptions } from "../../domain/schemaProcessing/schema/types/ISchemaParseOptions.js";
import type { IResult } from "../../domain/schemaProcessing/failures/IResult.js";
import { SchemaError } from "../../domain/schemaProcessing/failures/SchemaError.error.js";
import { SCHEMA_ERROR_BRAND } from "../../domain/schemaProcessing/failures/SchemaErrorBrand.js";
import type { IJsonSchema } from "../../domain/schemaProcessing/jsonSchema/types/IJsonSchema.js";
import type { IJsonSchemaOptions } from "../../domain/schemaProcessing/jsonSchema/types/IJsonSchemaOptions.js";
import { JsonSchemaGenerator } from "../../domain/schemaProcessing/jsonSchema/JsonSchemaGenerator.js";
import { OutboundCompiler } from "../../domain/schemaProcessing/serialization/OutboundCompiler.js";
import { JsonProjection } from "../../domain/schemaProcessing/serialization/JsonProjection.js";
import type { IJsonValue } from "../../domain/schemaProcessing/serialization/types/IJsonValue.js";
import type { IJsonSchemaCompatibilityOptions } from "../../domain/schemaProcessing/jsonSchema/types/IJsonSchemaCompatibilityOptions.js";
import { JsonSchemaCompatibility } from "../../domain/schemaProcessing/jsonSchema/JsonSchemaCompatibility.js";
import { PropertyMappings } from "../../domain/schemaProcessing/schema/PropertyMappings.js";
import type { IPropertyMapping } from "../../domain/schemaProcessing/schema/types/IPropertyMapping.js";

/** Provides static operations to prepare DTO schemas, validate and project values, and generate JSON Schema. */
export class Schema {
  /**
   * Reads effective direct and inherited object fields without freezing metadata or executing consumer callbacks.
   * @template T Instance type described by the decorated class.
   * @param target Object schema class to inspect; abstract classes are supported.
   * @returns Frozen snapshot of property and wire names in effective declaration order.
   * @remarks Later decorators can change subsequent snapshots until parsing or preparation freezes the schema.
   * @remarks This is not a full schema compatibility check and does not resolve nested types.
   * @remarks Invalid targets, incomplete fields, duplicate wire names and root unions are rejected.
   */
  public static propertyMappings<T extends object>(
    target: IConstructableClass<T>,
  ): readonly IPropertyMapping[] {
    return PropertyMappings.read(target);
  }

  /**
   * Checks reachable DTO metadata for wire-type and annotation contradictions without constructing values, running
   * defaults, transforms, or refinements, or freezing metadata.
   * @template T - Object instance type described by the decorated class.
   * @param target Decorated DTO class whose reachable schema is checked.
   * @param options Wire context and coercion policy; output requires JSON and no coercion.
   * @returns Returns no value; completes after compatibility checks pass.
   * @remarks This bounded check does not prove callback equivalence or full specification validity.
   */
  public static assertJsonSchemaCompatibility<T extends object>(
    target: IConstructableClass<T>,
    options: IJsonSchemaCompatibilityOptions,
  ): void {
    JsonSchemaCompatibility.options(options);
    new JsonSchemaGenerator("openapi-3.1", options.direction, options).generate(target);
  }
  /**
   * Prepares parsing and projection by resolving reachable metadata and synchronously freezing the DTO class and
   * ancestors. Idempotent; it runs no constructors, defaults, transforms, or refinements.
   * @template T - Object instance type described by the decorated class.
   * @param target Decorated DTO class to prepare, including its reachable schema metadata.
   * @returns Returns no value; freezes the class metadata for later parsing and projection.
   */
  public static prepare<T extends object>(target: IConstructableClass<T>): void {
    OutboundCompiler.prepare(target);
  }

  /**
   * Validates unknown DTO data and projects successful values to detached, renamed JSON; invalid values return typed issues.
   * @template T - Object instance type described by the decorated DTO class.
   * @param target Decorated DTO class defining the logical fields and outbound validation rules.
   * @param value Untrusted logical DTO value to validate and project.
   * @returns Detached JSON on success, or every validation and projection issue on failure.
   * @remarks Reads declared properties, strips extras, and invokes no getters or consumer `toJSON`.
   * @remarks Runs refinements on constructor-free DTOs; skips defaults, coercion, and transforms.
   * @remarks Dates/collections become JSON; accessors, cycles, and non-JSON values yield issues.
   * @remarks Prepares and freezes reachable schema metadata on first use.
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
   * Validates unknown input and returns a constructor-free DTO instance or every issue found.
   * Copies declared fields, strips extras, and freezes class schema on first use.
   * @template T - Object instance type returned for the decorated DTO class.
   * @param target Decorated DTO class whose schema validates the input.
   * @param input Untrusted value to validate and copy into a constructor-free instance.
   * @param options Per-call coercion, singleton-array, and maximum-depth settings; defaults to `{}`.
   * @returns The DTO instance on success, or all validation issues on failure.
   */
  public static safeParse<T extends object>(
    target: IConstructableClass<T>,
    input: unknown,
    options: ISchemaParseOptions = {},
  ): IResult<T> {
    return SchemaCompiler.compile<T>(target)(input, { options, depth: 0 });
  }

  /**
   * Parses unknown input and returns the DTO instance; unlike `safeParse`, invalid input is reported by an exception.
   * @template T - Object instance type returned for the decorated DTO class.
   * @param target Decorated DTO class whose schema validates the input.
   * @param input Untrusted value to validate and copy into a constructor-free instance.
   * @param options Per-call parsing settings; omission uses the defaults from `safeParse`.
   * @returns The constructor-free DTO instance after successful validation.
   * @throws {SchemaError} When input validation returns one or more issues.
   */
  public static parse<T extends object>(
    target: IConstructableClass<T>,
    input: unknown,
    options?: ISchemaParseOptions,
  ): T {
    const result = Schema.safeParse(target, input, options);
    if (!result.ok) throw new SchemaError(result.issues);
    return result.value;
  }

  /**
   * Generates JSON Schema for a decorated class and all referenced classes without freezing metadata.
   * Input is the default direction; output describes projected DTO values.
   * @template T - Object instance type represented by the decorated class.
   * @param target Abstract decorated class used as the document root.
   * @param options Required dialect and optional direction; see `IJsonSchemaOptions`.
   * @returns Draft 2020-12 (`$schema`, `$ref`, `$defs`) or OpenAPI 3.1 (`$ref`, `components.schemas`).
   * @remarks Names use class names or `Describe` names; `Rename` sets wire property names.
   * @remarks Input omits optional/defaulted fields; output omits optional fields and closes DTOs.
   * @remarks `Refine` and `Transform` are skipped; string flags except none and `u` are ignored.
   * @remarks `IsOneOf` and discriminated unions yield `oneOf`; discriminators include mappings.
   * @remarks Output bigint and nonfinite literals have unsatisfiable schemas.
   */
  public static toJsonSchema<T extends object>(
    target: abstract new (...arguments_: never[]) => T,
    options: IJsonSchemaOptions,
  ): IJsonSchema {
    return new JsonSchemaGenerator(options.target, options.direction).generate(
      target as unknown as IClass,
    );
  }

  /**
   * Recognizes branded schema errors, including errors from duplicate package copies, without relying on class identity.
   * @param error Unknown value to check for the registered schema-error brand.
   * @returns True when the brand lookup is `true`; otherwise false.
   */
  public static isError(error: unknown): error is SchemaError {
    return (
      typeof error === "object" && error !== null && Reflect.get(error, SCHEMA_ERROR_BRAND) === true
    );
  }
}
