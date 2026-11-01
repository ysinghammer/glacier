import type { IClass } from "@glacier/reflection";
import { SchemaDefinitionError } from "../failures/SchemaDefinition.error.js";
import { FieldRegistry } from "../schema/FieldRegistry.js";
import type { IFieldDefinition } from "../schema/types/IFieldDefinition.js";
import type { INumberRules } from "../schema/types/INumberRules.js";
import type { ISizeRules } from "../schema/types/ISizeRules.js";
import type { IStringFormat } from "../schema/types/IStringFormat.js";
import type { IStringRules } from "../schema/types/IStringRules.js";
import type { ITypeSpec } from "../schema/types/ITypeSpec.js";
import { UnionRegistry } from "../schema/UnionRegistry.js";
import { ClassAnnotations } from "./ClassAnnotations.js";
import type { IDescribeOptions } from "./types/IDescribeOptions.js";
import type { IJsonSchema } from "./types/IJsonSchema.js";
import type { IJsonSchemaFragment } from "./types/IJsonSchemaFragment.js";
import type { IJsonSchemaTarget } from "./types/IJsonSchemaTarget.js";
import type { IJsonSchemaDirection } from "./types/IJsonSchemaDirection.js";
import type { IJsonSchemaCompatibilityOptions } from "./types/IJsonSchemaCompatibilityOptions.js";
import { JsonSchemaCompatibility } from "./JsonSchemaCompatibility.js";

/** Discriminated-union subset of field specifications. */
type IUnionSpec = Extract<ITypeSpec, { kind: "union" }>;
/** Intermediate generated keyword record before undefined values are removed. */
type IKeywords = Record<string, unknown>;

const FORMAT_KEYWORDS: Readonly<Record<IStringFormat, string>> = {
  email: "email",
  uuid: "uuid",
  url: "uri",
  "date-time": "date-time",
  date: "date",
  ipv4: "ipv4",
};

const REFERENCE_PREFIXES: Readonly<Record<IJsonSchemaTarget, string>> = {
  "draft-2020-12": "#/$defs/",
  "openapi-3.1": "#/components/schemas/",
};

/**
 * Builds one dialect-specific JSON Schema document with named references for reachable classes and cycles.
 */
export class JsonSchemaGenerator {
  /** Selected JSON Schema dialect for reference and document layout. */
  private readonly target: IJsonSchemaTarget;
  /** Whether generated keywords describe accepted input or projected output. */
  private readonly direction: IJsonSchemaDirection;
  /** Optional metadata-only wire compatibility checks. */
  private readonly compatibility: IJsonSchemaCompatibilityOptions | undefined;
  /**
   * Class owner for each definition name, used to reject ambiguous references.
   * @default empty map
   */
  private readonly owners = new Map<string, IClass>();
  /**
   * Definitions accumulated while traversing the root and its nested classes.
   * @default empty map
   */
  private readonly definitions = new Map<string, IJsonSchema>();
  /**
   * Pending discriminator checks resolved after all reachable definitions are generated.
   * @property name Discriminator property name.
   * @property value Expected variant discriminator value.
   * @property reference Variant schema reference checked after traversal.
   * @default []
   */
  private readonly discriminators: {
    readonly name: string;
    readonly value: string;
    readonly reference: string;
  }[] = [];

  /**
   * Configures schema dialect, direction and optional compatibility validation.
   * @param target Output dialect controlling references and document shape.
   * @param direction Input or projected-output schema direction.
   * @param compatibility Optional explicit wire context for metadata checks.
   * @default direction: "input"
   * @throws {SchemaDefinitionError} If the direction or dialect is unsupported.
   */
  public constructor(
    target: IJsonSchemaTarget,
    direction: IJsonSchemaDirection = "input",
    compatibility?: IJsonSchemaCompatibilityOptions,
  ) {
    this.compatibility = compatibility;
    if (direction !== "input" && direction !== "output") {
      throw new SchemaDefinitionError('JSON Schema direction must be "input" or "output"');
    }
    this.direction = direction;
    if (!(target in REFERENCE_PREFIXES)) {
      throw new SchemaDefinitionError(
        `toJsonSchema target must be "draft-2020-12" or "openapi-3.1", received ${JSON.stringify(target)}`,
      );
    }
    this.target = target;
  }

  /**
   * Generates a document containing the root reference and all reachable class definitions.
   * @param root Root class whose schema is generated.
   * @returns Dialect-specific document with definitions and resolved references.
   */
  public generate(root: IClass): IJsonSchema {
    const reference = this.reference(root);
    for (const discriminator of this.discriminators) {
      for (const [name, schema] of this.definitions) {
        const reference = REFERENCE_PREFIXES[this.target] + JsonSchemaGenerator.escapePointer(name);
        if (discriminator.reference === reference)
          JsonSchemaCompatibility.discriminator(discriminator.name, discriminator.value, schema);
      }
    }
    const definitions = Object.fromEntries(this.definitions);
    if (this.target === "openapi-3.1") {
      return { ...reference, components: { schemas: definitions } };
    }
    return {
      $schema: "https://json-schema.org/draft/2020-12/schema",
      ...reference,
      $defs: definitions,
    };
  }

  /**
   * Reserves and returns a class definition reference, defining it on first sight.
   * @param target Class to identify in the generated document.
   * @returns Local `$ref` to the class definition.
   * @throws {SchemaDefinitionError} If the class has no name or shares a name with another class.
   */
  private reference(target: IClass): IJsonSchema {
    const name = ClassAnnotations.get(target).describe?.name ?? target.name;
    if (name === "") {
      throw new SchemaDefinitionError(
        "Cannot generate JSON Schema for an anonymous class: name it or use Describe({ name })",
      );
    }
    const owner = this.owners.get(name);
    if (owner !== undefined && owner !== target) {
      throw new SchemaDefinitionError(
        `Two classes share the JSON Schema name ${JSON.stringify(name)}: use Describe({ name }) to tell them apart`,
      );
    }
    if (owner === undefined) {
      this.owners.set(name, target);
      // Reserve the slot first so a cycle back to this class finds it instead of recursing.
      this.definitions.set(name, {});
      this.definitions.set(name, this.define(target));
    }
    return {
      $ref: `${REFERENCE_PREFIXES[this.target]}${JsonSchemaGenerator.escapePointer(name)}`,
    };
  }

  /**
   * Escapes a definition name for use in a URI-fragment JSON Pointer.
   * @param name Definition name to encode.
   * @returns Percent-encoded pointer segment with JSON Pointer escapes applied.
   */
  private static escapePointer(name: string): string {
    return encodeURIComponent(name.replaceAll("~", "~0").replaceAll("/", "~1"));
  }

  /**
   * Generates and annotates one class or union definition.
   * @param target Class whose body is converted to schema keywords.
   * @returns Generated schema with class documentation and manual fragment applied.
   */
  private define(target: IClass): IJsonSchema {
    const union = UnionRegistry.get(target);
    const schema = union === undefined ? this.object(target) : this.union(union.spec);
    const { describe, fragment } = ClassAnnotations.get(target);
    return this.annotate(schema, describe, fragment);
  }

  /**
   * Generates an object schema from effective class fields.
   * @param target Class whose fields define object properties.
   * @returns Object schema with projected property names and required fields.
   * @throws {SchemaDefinitionError} If output projection maps multiple fields to one key.
   */
  private object(target: IClass): IJsonSchema {
    const fields = FieldRegistry.readAll(target);
    if (this.direction === "output") {
      const keys = new Set<string>();
      for (const field of fields) {
        const key = JsonSchemaGenerator.keyOf(field);
        if (keys.has(key))
          throw new SchemaDefinitionError(`Duplicate projected key ${key} in ${target.name}`);
        keys.add(key);
      }
    }
    const properties = Object.fromEntries(
      fields.map((field) => [JsonSchemaGenerator.keyOf(field), this.field(field)]),
    );
    const required = fields
      .filter(
        ({ modifiers }) =>
          modifiers.optional !== true &&
          (this.direction === "output" || modifiers.defaultValue === undefined),
      )
      .map((field) => JsonSchemaGenerator.keyOf(field));
    return JsonSchemaGenerator.compact({
      type: "object",
      properties,
      required: required.length === 0 ? undefined : required,
      additionalProperties: this.direction === "output" ? false : undefined,
    });
  }

  /**
   * Selects the wire key used for a field in generated properties.
   * @param field Field definition with optional input-key rename.
   * @returns Renamed input key, or the declared property name.
   */
  private static keyOf(field: IFieldDefinition): string {
    return field.modifiers.inputKey ?? field.name;
  }

  /**
   * Generates the schema for a field, including nullability and annotations.
   * @param field Effective field definition to convert.
   * @returns Generated field schema with documentation and manual fragment merged.
   */
  private field(field: IFieldDefinition): IJsonSchema {
    const { modifiers } = field;
    const schema = this.spec(field.type);
    const typed = modifiers.nullable === true ? JsonSchemaGenerator.nullable(schema) : schema;
    return this.annotate(typed, modifiers.describe, modifiers.jsonSchema);
  }

  /**
   * Extends a schema to accept null while preserving its existing constraints.
   * @param schema Non-null schema to extend.
   * @returns Schema accepting null through type, enum or `anyOf` keywords.
   */
  private static nullable(schema: IJsonSchema): IJsonSchema {
    const { type } = schema;
    if (type === "null") return schema;
    if (typeof type === "string") return { ...schema, type: [type, "null"] };
    if (Array.isArray(schema.enum)) return { ...schema, enum: [...schema.enum, null] };
    return { anyOf: [schema, { type: "null" }] };
  }

  /**
   * Applies documentation keywords and then user fragment overrides.
   * @param schema Generated base schema.
   * @param describe Optional title, description, example and deprecation annotation.
   * @param fragment Optional manual keywords that take final precedence.
   * @returns New schema record containing generated and supplied keywords.
   */
  private annotate(
    schema: IJsonSchema,
    describe: IDescribeOptions | undefined,
    fragment: IJsonSchemaFragment | undefined,
  ): IJsonSchema {
    if (this.compatibility !== undefined) JsonSchemaCompatibility.annotation(schema, fragment);
    const documentation = JsonSchemaGenerator.compact({
      title: describe?.title,
      description: describe?.description,
      examples: describe !== undefined && "example" in describe ? [describe.example] : undefined,
      deprecated: describe?.deprecated === true ? true : undefined,
    });
    return { ...schema, ...documentation, ...fragment };
  }

  /**
   * Converts a field type specification into JSON Schema keywords.
   * @param spec Declared scalar, collection, nested-class or union type.
   * @returns Corresponding JSON Schema fragment or reference.
   */
  private spec(spec: ITypeSpec): IJsonSchema {
    if (this.compatibility !== undefined) JsonSchemaCompatibility.wire(spec, this.compatibility);
    switch (spec.kind) {
      case "string":
      case "number":
      case "int":
      case "boolean":
      case "bigint":
      case "date":
      case "literal":
      case "enum":
      case "any":
        return this.scalar(spec);
      case "array":
      case "tuple":
      case "set":
      case "map":
      case "record":
        return this.collectionSpec(spec);
      case "object":
        return this.reference(spec.target);
      case "lazy":
        return this.reference(spec.resolve());
      case "union":
        return this.union(spec);
      case "oneOf":
        return { oneOf: spec.options.map((option) => this.spec(option)) };
    }
  }

  /**
   * Generates scalar keywords for a scalar field type.
   * @param spec Scalar type specification and its applicable constraints.
   * @returns Scalar schema for the selected input or output direction.
   */
  private scalar(
    spec: Extract<
      ITypeSpec,
      {
        kind:
          | "string"
          | "number"
          | "int"
          | "boolean"
          | "bigint"
          | "date"
          | "literal"
          | "enum"
          | "any";
      }
    >,
  ): IJsonSchema {
    switch (spec.kind) {
      case "string":
        return JsonSchemaGenerator.string(spec.rules);
      case "number":
        return { type: "number", ...JsonSchemaGenerator.numeric(spec.rules) };
      case "int":
        return { type: "integer", ...JsonSchemaGenerator.numeric(spec.rules) };
      case "boolean":
        return { type: "boolean" };
      case "bigint":
        return this.direction === "output" ? { not: {} } : { type: "integer" };
      case "date":
        return { type: "string", format: "date-time" };
      case "literal":
        return JsonSchemaGenerator.literalSpec(spec.value, this.direction);
      case "enum":
        return JsonSchemaGenerator.enumSpec(spec.values, this.direction);
      case "any":
        return {};
    }
  }

  /**
   * Generates a literal schema while excluding values unavailable in JSON output.
   * @param value Literal declared by the field.
   * @param direction Input or projected-output schema direction.
   * @returns Literal schema, or an always-failing schema for an invalid output literal.
   */
  private static literalSpec(
    value: string | number | boolean | bigint | null,
    direction: "input" | "output",
  ): IJsonSchema {
    const invalidOutput =
      direction === "output" &&
      (typeof value === "bigint" || (typeof value === "number" && !Number.isFinite(value)));
    if (invalidOutput) return { not: {} };
    return JsonSchemaGenerator.literal(value);
  }

  /**
   * Generates enum keywords for the selected projection direction.
   * @param values Allowed string and number values.
   * @param direction Input or projected-output schema direction.
   * @returns Enum schema containing values representable in that direction.
   */
  private static enumSpec(
    values: readonly (string | number)[],
    direction: "input" | "output",
  ): IJsonSchema {
    if (direction === "input") return { enum: [...values] };
    const wireValues = values.filter(
      (value) => typeof value === "string" || Number.isFinite(value),
    );
    return wireValues.length === 0 ? { not: {} } : { enum: wireValues };
  }

  /**
   * Generates array/object keywords for a collection type specification.
   * @param spec Collection kind, element types and size rules.
   * @returns Collection schema with recursively generated child schemas.
   */
  private collectionSpec(
    spec: Extract<ITypeSpec, { kind: "array" | "tuple" | "set" | "map" | "record" }>,
  ): IJsonSchema {
    switch (spec.kind) {
      case "array":
        return JsonSchemaGenerator.compact({
          type: "array",
          items: this.spec(spec.element),
          ...JsonSchemaGenerator.items(spec.rules),
          uniqueItems: spec.rules.unique === true ? true : undefined,
        });
      case "tuple":
        return {
          type: "array",
          prefixItems: spec.elements.map((element) => this.spec(element)),
          items: false,
          minItems: spec.elements.length,
          maxItems: spec.elements.length,
        };
      case "set":
        return {
          type: "array",
          items: this.spec(spec.element),
          ...JsonSchemaGenerator.items(spec.rules),
          uniqueItems: true,
        };
      case "map":
        return JsonSchemaGenerator.compact({
          type: "object",
          propertyNames: this.direction === "output" ? this.spec(spec.key) : undefined,
          additionalProperties: this.spec(spec.value),
          ...JsonSchemaGenerator.properties(spec.rules),
        });
      case "record":
        return JsonSchemaGenerator.compact({
          type: "object",
          additionalProperties: this.spec(spec.value),
          ...JsonSchemaGenerator.properties(spec.rules),
        });
    }
  }

  /**
   * Generates string validation keywords from string rules.
   * @param rules Length, pattern and format constraints.
   * @returns String schema containing applicable keywords.
   */
  private static string(rules: IStringRules): IJsonSchema {
    return JsonSchemaGenerator.compact({
      type: "string",
      minLength: rules.length ?? rules.min,
      maxLength: rules.length ?? rules.max,
      pattern: rules.pattern?.source,
      format: rules.format === undefined ? undefined : FORMAT_KEYWORDS[rules.format],
    });
  }

  /**
   * Maps numeric constraints to JSON Schema numeric keywords.
   * @param rules Inclusive/exclusive bounds and multiple constraint.
   * @returns Keyword record omitting undefined values.
   */
  private static numeric(rules: INumberRules): IKeywords {
    return JsonSchemaGenerator.compact({
      minimum: rules.min,
      maximum: rules.max,
      exclusiveMinimum: rules.exclusiveMin,
      exclusiveMaximum: rules.exclusiveMax,
      multipleOf: rules.multipleOf,
    });
  }

  /**
   * Maps collection count bounds to array-size keywords.
   * @param rules Minimum and maximum entry counts.
   * @returns Array keyword record omitting undefined bounds.
   */
  private static items(rules: ISizeRules): IKeywords {
    return JsonSchemaGenerator.compact({ minItems: rules.min, maxItems: rules.max });
  }

  /**
   * Maps collection count bounds to object-property keywords.
   * @param rules Minimum and maximum entry counts.
   * @returns Object keyword record omitting undefined bounds.
   */
  private static properties(rules: ISizeRules): IKeywords {
    return JsonSchemaGenerator.compact({ minProperties: rules.min, maxProperties: rules.max });
  }

  /**
   * Builds a JSON Schema literal declaration for a scalar.
   * @param value Accepted literal value; bigint is represented by its numeric value.
   * @returns Schema using `type` and `const` keywords.
   */
  private static literal(value: string | number | boolean | bigint | null): IJsonSchema {
    if (value === null) return { type: "null" };
    if (typeof value === "bigint") return { type: "integer", const: Number(value) };
    return { type: typeof value, const: value };
  }

  /**
   * Generates oneOf references and discriminator mappings for a union.
   * @param spec Discriminator name and variant type specifications.
   * @returns Union schema with variant references and mapping metadata.
   */
  private union(spec: IUnionSpec): IJsonSchema {
    const references = [...spec.variants].map(
      ([value, variant]) => [value, this.spec(variant)] as const,
    );
    if (this.compatibility !== undefined)
      for (const [value, reference] of references)
        this.discriminators.push({
          name: spec.discriminator,
          value,
          reference: String(reference.$ref),
        });
    return {
      oneOf: references.map(([, reference]) => reference),
      discriminator: {
        propertyName: spec.discriminator,
        mapping: Object.fromEntries(
          references.map(([value, reference]) => [value, reference.$ref]),
        ),
      },
    };
  }

  /**
   * Removes undefined-valued entries from a generated keyword record.
   * @param keywords Candidate keyword-value mapping.
   * @returns New record containing only defined keyword values.
   */
  private static compact(keywords: IKeywords): IKeywords {
    return Object.fromEntries(Object.entries(keywords).filter(([, value]) => value !== undefined));
  }
}
