import type { IClass } from "@glacier/reflection";
import { SchemaDefinitionError } from "../failures/SchemaDefinition.error.js";
import { FieldRegistry } from "../schema/FieldRegistry.js";
import type { IFieldDefinition } from "../schema/IFieldDefinition.js";
import type { INumberRules } from "../schema/INumberRules.js";
import type { ISizeRules } from "../schema/ISizeRules.js";
import type { IStringFormat } from "../schema/IStringFormat.js";
import type { IStringRules } from "../schema/IStringRules.js";
import type { ITypeSpec } from "../schema/ITypeSpec.js";
import { UnionRegistry } from "../schema/UnionRegistry.js";
import { ClassAnnotations } from "./ClassAnnotations.js";
import type { IDescribeOptions } from "./IDescribeOptions.js";
import type { IJsonSchema } from "./IJsonSchema.js";
import type { IJsonSchemaFragment } from "./IJsonSchemaFragment.js";
import type { IJsonSchemaTarget } from "./IJsonSchemaTarget.js";

type IUnionSpec = Extract<ITypeSpec, { kind: "union" }>;
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
 * Builds the JSON Schema of one root class for one dialect. Every class reachable from the root, including the
 * root itself, becomes a named definition referenced by `$ref`, which also resolves cycles. Create one generator
 * per call; it holds the definitions collected so far.
 */
export class JsonSchemaGenerator {
  readonly #target: IJsonSchemaTarget;
  readonly #owners = new Map<string, IClass>();
  readonly #definitions = new Map<string, IJsonSchema>();

  public constructor(target: IJsonSchemaTarget) {
    if (!(target in REFERENCE_PREFIXES)) {
      throw new SchemaDefinitionError(
        `toJsonSchema target must be "draft-2020-12" or "openapi-3.1", received ${JSON.stringify(target)}`,
      );
    }
    this.#target = target;
  }

  /**
   * Returns the document for `root`: a `$ref` to the root definition next to `$schema` and `$defs`
   * (`draft-2020-12`) or next to `components.schemas` (`openapi-3.1`). Throws `SchemaDefinitionError` when two
   * classes share a definition name, a class has no name, or a field has modifiers but no type decorator.
   */
  public generate(root: IClass): IJsonSchema {
    const reference = this.#reference(root);
    const definitions = Object.fromEntries(this.#definitions);
    if (this.#target === "openapi-3.1") {
      return { ...reference, components: { schemas: definitions } };
    }
    return {
      $schema: "https://json-schema.org/draft/2020-12/schema",
      ...reference,
      $defs: definitions,
    };
  }

  /** Registers `target` on first sight and returns the `$ref` to its definition. */
  #reference(target: IClass): IJsonSchema {
    const name = ClassAnnotations.get(target).describe?.name ?? target.name;
    if (name === "") {
      throw new SchemaDefinitionError(
        "Cannot generate JSON Schema for an anonymous class: name it or use Describe({ name })",
      );
    }
    const owner = this.#owners.get(name);
    if (owner !== undefined && owner !== target) {
      throw new SchemaDefinitionError(
        `Two classes share the JSON Schema name ${JSON.stringify(name)}: use Describe({ name }) to tell them apart`,
      );
    }
    if (owner === undefined) {
      this.#owners.set(name, target);
      // Reserve the slot first so a cycle back to this class finds it instead of recursing.
      this.#definitions.set(name, {});
      this.#definitions.set(name, this.#define(target));
    }
    return {
      $ref: `${REFERENCE_PREFIXES[this.#target]}${JsonSchemaGenerator.#escapePointer(name)}`,
    };
  }

  static #escapePointer(name: string): string {
    return encodeURIComponent(name.replaceAll("~", "~0").replaceAll("/", "~1"));
  }

  #define(target: IClass): IJsonSchema {
    const union = UnionRegistry.get(target);
    const schema = union === undefined ? this.#object(target) : this.#union(union.spec);
    const { describe, fragment } = ClassAnnotations.get(target);
    return JsonSchemaGenerator.#annotate(schema, describe, fragment);
  }

  #object(target: IClass): IJsonSchema {
    const fields = FieldRegistry.readAll(target);
    const properties = Object.fromEntries(
      fields.map((field) => [JsonSchemaGenerator.#keyOf(field), this.#field(field)]),
    );
    const required = fields
      .filter(
        ({ modifiers }) => modifiers.optional !== true && modifiers.defaultValue === undefined,
      )
      .map((field) => JsonSchemaGenerator.#keyOf(field));
    return JsonSchemaGenerator.#compact({
      type: "object",
      properties,
      required: required.length === 0 ? undefined : required,
    });
  }

  static #keyOf(field: IFieldDefinition): string {
    return field.modifiers.inputKey ?? field.name;
  }

  #field(field: IFieldDefinition): IJsonSchema {
    const { modifiers } = field;
    const schema = this.#spec(field.type);
    const typed = modifiers.nullable === true ? JsonSchemaGenerator.#nullable(schema) : schema;
    return JsonSchemaGenerator.#annotate(typed, modifiers.describe, modifiers.jsonSchema);
  }

  /** Lets `null` through: scalar types gain a `null` type, enums a `null` member, everything else an `anyOf`. */
  static #nullable(schema: IJsonSchema): IJsonSchema {
    const { type } = schema;
    if (type === "null") return schema;
    if (typeof type === "string") return { ...schema, type: [type, "null"] };
    if (Array.isArray(schema.enum)) return { ...schema, enum: [...schema.enum, null] };
    return { anyOf: [schema, { type: "null" }] };
  }

  /** Layers documentation and then the manual fragment over the generated keywords. */
  static #annotate(
    schema: IJsonSchema,
    describe: IDescribeOptions | undefined,
    fragment: IJsonSchemaFragment | undefined,
  ): IJsonSchema {
    const documentation = JsonSchemaGenerator.#compact({
      title: describe?.title,
      description: describe?.description,
      examples: describe !== undefined && "example" in describe ? [describe.example] : undefined,
      deprecated: describe?.deprecated === true ? true : undefined,
    });
    return { ...schema, ...documentation, ...fragment };
  }

  #spec(spec: ITypeSpec): IJsonSchema {
    switch (spec.kind) {
      case "string":
        return JsonSchemaGenerator.#string(spec.rules);
      case "number":
        return { type: "number", ...JsonSchemaGenerator.#numeric(spec.rules) };
      case "int":
        return { type: "integer", ...JsonSchemaGenerator.#numeric(spec.rules) };
      case "boolean":
        return { type: "boolean" };
      case "bigint":
        return { type: "integer" };
      case "date":
        return { type: "string", format: "date-time" };
      case "literal":
        return JsonSchemaGenerator.#literal(spec.value);
      case "enum":
        return { enum: [...spec.values] };
      case "any":
        return {};
      case "array":
        return JsonSchemaGenerator.#compact({
          type: "array",
          items: this.#spec(spec.element),
          ...JsonSchemaGenerator.#items(spec.rules),
          uniqueItems: spec.rules.unique === true ? true : undefined,
        });
      case "tuple":
        return {
          type: "array",
          prefixItems: spec.elements.map((element) => this.#spec(element)),
          items: false,
          minItems: spec.elements.length,
          maxItems: spec.elements.length,
        };
      case "set":
        return {
          type: "array",
          items: this.#spec(spec.element),
          ...JsonSchemaGenerator.#items(spec.rules),
          uniqueItems: true,
        };
      // A map has string keys in JSON, so it reads like a record.
      case "map":
      case "record":
        return JsonSchemaGenerator.#compact({
          type: "object",
          additionalProperties: this.#spec(spec.value),
          ...JsonSchemaGenerator.#properties(spec.rules),
        });
      case "object":
        return this.#reference(spec.target);
      case "lazy":
        return this.#reference(spec.resolve());
      case "union":
        return this.#union(spec);
      case "oneOf":
        return { oneOf: spec.options.map((option) => this.#spec(option)) };
    }
  }

  static #string(rules: IStringRules): IJsonSchema {
    return JsonSchemaGenerator.#compact({
      type: "string",
      minLength: rules.length ?? rules.min,
      maxLength: rules.length ?? rules.max,
      pattern: rules.pattern?.source,
      format: rules.format === undefined ? undefined : FORMAT_KEYWORDS[rules.format],
    });
  }

  static #numeric(rules: INumberRules): IKeywords {
    return JsonSchemaGenerator.#compact({
      minimum: rules.min,
      maximum: rules.max,
      exclusiveMinimum: rules.exclusiveMin,
      exclusiveMaximum: rules.exclusiveMax,
      multipleOf: rules.multipleOf,
    });
  }

  static #items(rules: ISizeRules): IKeywords {
    return JsonSchemaGenerator.#compact({ minItems: rules.min, maxItems: rules.max });
  }

  static #properties(rules: ISizeRules): IKeywords {
    return JsonSchemaGenerator.#compact({ minProperties: rules.min, maxProperties: rules.max });
  }

  /** JSON has no bigint, so a bigint literal is emitted as the number it denotes. */
  static #literal(value: string | number | boolean | bigint | null): IJsonSchema {
    if (value === null) return { type: "null" };
    if (typeof value === "bigint") return { type: "integer", const: Number(value) };
    return { type: typeof value, const: value };
  }

  /** The `oneOf` of the variant references with a `discriminator` mapping every value to its variant. */
  #union(spec: IUnionSpec): IJsonSchema {
    const references = [...spec.variants].map(
      ([value, variant]) => [value, this.#spec(variant)] as const,
    );
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

  static #compact(keywords: IKeywords): IKeywords {
    return Object.fromEntries(Object.entries(keywords).filter(([, value]) => value !== undefined));
  }
}
