import { SchemaDefinitionError } from "../failures/SchemaDefinition.error.js";
import { JsonProjection } from "../serialization/JsonProjection.js";
import type { ITypeSpec } from "../schema/ITypeSpec.js";
import type { IJsonSchemaCompatibilityOptions } from "./IJsonSchemaCompatibilityOptions.js";
import type { IJsonSchema } from "./IJsonSchema.js";
import type { IJsonSchemaFragment } from "./IJsonSchemaFragment.js";

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
  /** Rejects invalid/unimplemented wire contexts before reading metadata. */
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

  /** Rejects known input types unavailable in JSON/text data; callbacks are deliberately not inspected or invoked. */
  public static wire(spec: ITypeSpec, options: IJsonSchemaCompatibilityOptions): void {
    if (options.direction === "output") return;
    if (spec.kind === "map" || spec.kind === "set")
      throw new SchemaDefinitionError("Map and Set inputs require non-wire instances");
    if (!options.coerce && (spec.kind === "date" || spec.kind === "bigint"))
      throw new SchemaDefinitionError("Strict wire input cannot supply Date or bigint instances");
    if (spec.kind === "literal") {
      if (
        typeof spec.value === "bigint" &&
        (!options.coerce || !Number.isSafeInteger(Number(spec.value)))
      )
        throw new SchemaDefinitionError(
          "Bigint literal cannot be represented faithfully in this wire context",
        );
      if (
        (typeof spec.value === "number" && !Number.isFinite(spec.value)) ||
        (options.wire === "text" && spec.value === null)
      )
        throw new SchemaDefinitionError("Literal has no supported wire representation");
    }
    if (
      spec.kind === "enum" &&
      spec.values.some((value) => typeof value === "number" && !Number.isFinite(value))
    )
      throw new SchemaDefinitionError("Enum includes non-wire numeric values");
    if (options.wire === "text" && !options.coerce) {
      if (
        spec.kind === "number" ||
        spec.kind === "int" ||
        spec.kind === "boolean" ||
        (spec.kind === "literal" && typeof spec.value !== "string") ||
        (spec.kind === "enum" && spec.values.some((value) => typeof value !== "string"))
      )
        throw new SchemaDefinitionError("Text input needs coercion for non-string scalars");
    }
  }

  /** Requires a preserved singleton wire discriminator after reachable definitions are complete, including cycles. */
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

  /** Allows descriptions and unchanged structural declarations, but not altered validation/projection keywords. */
  public static annotation(schema: IJsonSchema, fragment: IJsonSchemaFragment | undefined): void {
    if (fragment === undefined) return;
    const result = JsonProjection.copy(fragment, new WeakMap(), false);
    if (!result.ok) throw new SchemaDefinitionError("Schema annotations must be safe JSON data");
    for (const [key, value] of Object.entries(fragment)) {
      if (DESCRIPTIVE_KEYWORDS.has(key) || key.startsWith("x-")) continue;
      const original = JsonProjection.copy(schema[key], new WeakMap(), false);
      if (
        !original.ok ||
        !JsonSchemaCompatibility.#equal(
          original.value,
          value,
          JsonSchemaCompatibility.#context(key),
        )
      )
        throw new SchemaDefinitionError(`Schema annotation contradicts generated keyword ${key}`);
    }
  }

  /** Chooses whether a nested value is a schema, a name-to-schema map or ordinary literal data. */
  static #context(key: string): "schema" | "map" | "value" {
    if (SCHEMA_MAP_KEYWORDS.has(key)) return "map";
    return SCHEMA_VALUE_KEYWORDS.has(key) ? "schema" : "value";
  }

  /** Compares safe JSON structurally; property names and literal objects are never treated as annotation keywords. */
  static #equal(left: unknown, right: unknown, context: "schema" | "map" | "value"): boolean {
    if (left === right) return true;
    if (Array.isArray(left) && Array.isArray(right))
      return (
        left.length === right.length &&
        left.every((value: unknown, index) => {
          const other = right[index];
          return JsonSchemaCompatibility.#equal(value, other, context);
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
            ? JsonSchemaCompatibility.#context(key)
            : "value";
      return other !== undefined && JsonSchemaCompatibility.#equal(value, other, nested);
    });
  }
}
