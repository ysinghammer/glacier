import { SchemaDefinitionError } from "../failures/SchemaDefinition.error.js";
import { JsonProjection } from "../serialization/JsonProjection.js";
import type { ITypeSpec } from "../schema/types/ITypeSpec.js";
import type { IJsonSchemaCompatibilityOptions } from "./types/IJsonSchemaCompatibilityOptions.js";
import type { IJsonSchema } from "./types/IJsonSchema.js";
import type { IJsonSchemaFragment } from "./types/IJsonSchemaFragment.js";

const DESCRIPTIVE_KEYWORDS = new Set([
  "title",
  "description",
  "examples",
  "example",
  "deprecated",
  "$comment",
  "readOnly",
  "writeOnly",
]);
const SCHEMA_MAP_KEYWORDS = new Set([
  "properties",
  "patternProperties",
  "$defs",
  "definitions",
  "dependentSchemas",
]);
const SCHEMA_VALUE_KEYWORDS = new Set([
  "items",
  "prefixItems",
  "allOf",
  "anyOf",
  "oneOf",
  "not",
  "additionalProperties",
  "propertyNames",
  "contains",
  "if",
  "then",
  "else",
  "unevaluatedProperties",
  "unevaluatedItems",
]);

/** Checks known wire types and structural overrides without processing consumer values or changing legacy generation. */
export class JsonSchemaCompatibility {
  /**
   * Validates the explicit serialization and coercion context.
   * @param options Direction, wire format and coercion setting to validate.
   * @returns No value; permits supported contexts to proceed.
   * @throws {SchemaDefinitionError} If any option is invalid or output contradicts JSON restrictions.
   */
  public static options(options: IJsonSchemaCompatibilityOptions): void {
    if (
      options === null ||
      typeof options !== "object" ||
      (options.direction !== "input" && options.direction !== "output") ||
      (options.wire !== "json" && options.wire !== "text") ||
      typeof options.coerce !== "boolean" ||
      (options.direction === "output" && (options.wire !== "json" || options.coerce))
    )
      throw new SchemaDefinitionError("Invalid schema compatibility wire context");
  }

  /**
   * Checks a declared type against the configured wire representation.
   * @param spec Field type to inspect recursively.
   * @param options Validated wire direction and coercion context.
   * @returns No value; output schemas bypass input-only checks.
   */
  public static wire(spec: ITypeSpec, options: IJsonSchemaCompatibilityOptions): void {
    if (options.direction === "output") return;
    JsonSchemaCompatibility.wireInput(spec, options);
  }

  /**
   * Rejects input types that cannot be represented by the configured wire format.
   * @param spec Field type being checked.
   * @param options Validated input wire and coercion context.
   * @returns No value when the type is wire-compatible.
   * @throws {SchemaDefinitionError} For map/set, strict Date/bigint, or non-finite enum input.
   */
  private static wireInput(spec: ITypeSpec, options: IJsonSchemaCompatibilityOptions): void {
    if (spec.kind === "map" || spec.kind === "set")
      throw new SchemaDefinitionError("Map and Set inputs require non-wire instances");
    if (!options.coerce && (spec.kind === "date" || spec.kind === "bigint"))
      throw new SchemaDefinitionError("Strict wire input cannot supply Date or bigint instances");
    if (spec.kind === "literal") JsonSchemaCompatibility.literalWire(spec.value, options);
    if (
      spec.kind === "enum" &&
      spec.values.some((value) => typeof value === "number" && !Number.isFinite(value))
    )
      throw new SchemaDefinitionError("Enum includes non-wire numeric values");
    JsonSchemaCompatibility.textWire(spec, options);
  }

  /**
   * Checks whether one literal has a faithful representation in the wire context.
   * @param value Literal value declared by the field.
   * @param options Validated input wire and coercion context.
   * @returns No value when the literal can be represented.
   * @throws {SchemaDefinitionError} If bigint is lossy or the value has no supported wire form.
   */
  private static literalWire(
    value: string | number | boolean | bigint | null,
    options: IJsonSchemaCompatibilityOptions,
  ): void {
    const invalidBigint =
      typeof value === "bigint" && (!options.coerce || !Number.isSafeInteger(Number(value)));
    if (invalidBigint)
      throw new SchemaDefinitionError(
        "Bigint literal cannot be represented faithfully in this wire context",
      );
    const isNonFiniteNumber = typeof value === "number" && !Number.isFinite(value);
    const isNullText = options.wire === "text" && value === null;
    if (isNonFiniteNumber || isNullText)
      throw new SchemaDefinitionError("Literal has no supported wire representation");
  }

  /**
   * Requires coercion for non-string scalar values supplied through text input.
   * @param spec Field type whose scalar wire values are checked.
   * @param options Validated text-input context.
   * @returns No value when text values can satisfy the field.
   * @throws {SchemaDefinitionError} If strict text input cannot represent a required scalar.
   */
  private static textWire(spec: ITypeSpec, options: IJsonSchemaCompatibilityOptions): void {
    if (options.wire !== "text" || options.coerce) return;
    const unsupportedScalar =
      spec.kind === "number" ||
      spec.kind === "int" ||
      spec.kind === "boolean" ||
      JsonSchemaCompatibility.hasNonStringValues(spec);
    if (unsupportedScalar)
      throw new SchemaDefinitionError("Text input needs coercion for non-string scalars");
  }

  /**
   * Checks whether a literal or enum includes values other than strings.
   * @param spec Type specification to inspect.
   * @returns True when the scalar values include a non-string member.
   */
  private static hasNonStringValues(spec: ITypeSpec): boolean {
    if (spec.kind === "literal") return typeof spec.value !== "string";
    return spec.kind === "enum" && spec.values.some((value) => typeof value !== "string");
  }

  /**
   * Verifies that a generated variant preserves its discriminator as one exact wire value.
   * @param name Discriminator property name.
   * @param value Configured variant discriminator string.
   * @param schema Generated variant object schema.
   * @returns No value when the property preserves the configured singleton.
   * @throws {SchemaDefinitionError} If the property is missing or does not preserve that value.
   */
  public static discriminator(name: string, value: string, schema: IJsonSchema): void {
    const properties = schema.properties;
    const field: unknown =
      typeof properties === "object" && properties !== null
        ? Reflect.get(properties, name)
        : undefined;
    if (typeof field !== "object" || field === null)
      throw new SchemaDefinitionError("Discriminator requires a declared wire field");
    const literal: unknown = Reflect.get(field, "const");
    const values: unknown = Reflect.get(field, "enum");
    if (literal !== value && !(Array.isArray(values) && values.length === 1 && values[0] === value))
      throw new SchemaDefinitionError(
        "Discriminator must preserve its configured singleton wire value",
      );
  }

  /**
   * Ensures a manual fragment is safe JSON and does not contradict generated constraints.
   * @param schema Generated schema used as the authoritative contract.
   * @param fragment Optional manual annotations and structural declarations.
   * @returns No value when every supplied keyword is safe and compatible.
   * @throws {SchemaDefinitionError} If data is unsafe or a keyword changes generated behavior.
   */
  public static annotation(schema: IJsonSchema, fragment: IJsonSchemaFragment | undefined): void {
    if (fragment === undefined) return;
    const result = JsonProjection.copy(fragment, new WeakMap(), false);
    if (!result.ok) throw new SchemaDefinitionError("Schema annotations must be safe JSON data");
    for (const [key, value] of Object.entries(fragment)) {
      if (DESCRIPTIVE_KEYWORDS.has(key) || key.startsWith("x-")) continue;
      const original = JsonProjection.copy(schema[key], new WeakMap(), false);
      if (
        !original.ok ||
        !JsonSchemaCompatibility.equal(original.value, value, JsonSchemaCompatibility.context(key))
      )
        throw new SchemaDefinitionError(`Schema annotation contradicts generated keyword ${key}`);
    }
  }

  /**
   * Classifies a JSON Schema keyword's nested comparison context.
   * @param key Keyword whose child value is compared.
   * @returns Schema, schema-map or ordinary-value context.
   */
  private static context(key: string): "schema" | "map" | "value" {
    if (SCHEMA_MAP_KEYWORDS.has(key)) return "map";
    return SCHEMA_VALUE_KEYWORDS.has(key) ? "schema" : "value";
  }

  /**
   * Compares projected JSON structures under keyword-aware schema semantics.
   * @param left Generated safe JSON value.
   * @param right User-supplied safe JSON value.
   * @param context Whether values are schemas, schema maps or ordinary data.
   * @returns True when structures match after permitted descriptive extensions.
   */
  private static equal(
    left: unknown,
    right: unknown,
    context: "schema" | "map" | "value",
  ): boolean {
    if (left === right) return true;
    if (Array.isArray(left) && Array.isArray(right))
      return (
        left.length === right.length &&
        left.every((value: unknown, index) => {
          const other = right[index];
          return JsonSchemaCompatibility.equal(value, other, context);
        })
      );
    if (
      typeof left !== "object" ||
      left === null ||
      Array.isArray(left) ||
      typeof right !== "object" ||
      right === null ||
      Array.isArray(right)
    )
      return false;
    const keys = Object.keys(left).filter(
      (key) => context !== "schema" || (!DESCRIPTIVE_KEYWORDS.has(key) && !key.startsWith("x-")),
    );
    const otherKeys = Object.keys(right).filter(
      (key) => context !== "schema" || (!DESCRIPTIVE_KEYWORDS.has(key) && !key.startsWith("x-")),
    );
    if (keys.length !== otherKeys.length) return false;
    return keys.every((key) => {
      const value: unknown = Reflect.get(left, key);
      const other: unknown = Reflect.get(right, key);
      const nested =
        context === "map"
          ? "schema"
          : context === "schema"
            ? JsonSchemaCompatibility.context(key)
            : "value";
      return other !== undefined && JsonSchemaCompatibility.equal(value, other, nested);
    });
  }
}
