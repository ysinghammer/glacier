const TYPE_NAMES = new Set(["string", "number", "integer", "boolean", "object", "array", "null"]);
const COUNT_KEYWORDS = [
  "minLength",
  "maxLength",
  "minItems",
  "maxItems",
  "minProperties",
  "maxProperties",
];
const NUMBER_KEYWORDS = [
  "minimum",
  "maximum",
  "exclusiveMinimum",
  "exclusiveMaximum",
  "multipleOf",
];
const SCHEMA_LIST_KEYWORDS = ["oneOf", "anyOf", "allOf", "prefixItems"];
const SCHEMA_KEYWORDS = ["items", "additionalProperties"];

/**
 * Checks generated documents against the rules of the JSON Schema 2020-12 meta-schema that the generator can
 * violate (keyword value types and resolvable `$ref`s), because no validator dependency is allowed. Returns the
 * problems found, each prefixed with its JSON pointer.
 */
export class JsonSchemaStructure {
  public static problems(document: Record<string, unknown>): readonly string[] {
    const problems: string[] = [];
    const container = JsonSchemaStructure.container(document);
    JsonSchemaStructure.walk(document, "", document, problems);
    for (const [name, schema] of Object.entries(container)) {
      JsonSchemaStructure.walk(schema, `/${name}`, document, problems);
    }
    return problems;
  }

  private static container(document: Record<string, unknown>): Record<string, unknown> {
    const components = document.components as { schemas?: Record<string, unknown> } | undefined;
    return (components?.schemas ?? document.$defs ?? {}) as Record<string, unknown>;
  }

  private static walk(
    value: unknown,
    pointer: string,
    document: Record<string, unknown>,
    problems: string[],
  ): void {
    if (typeof value === "boolean") return;
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      problems.push(`${pointer}: a schema must be an object or boolean`);
      return;
    }
    const schema = value as Record<string, unknown>;
    JsonSchemaStructure.checkKeywords(schema, pointer, document, problems);
    JsonSchemaStructure.walkNestedSchemas(schema, pointer, document, problems);
    JsonSchemaStructure.walkProperties(schema, pointer, document, problems);
  }

  private static walkNestedSchemas(
    schema: Record<string, unknown>,
    pointer: string,
    document: Record<string, unknown>,
    problems: string[],
  ): void {
    for (const keyword of SCHEMA_KEYWORDS) {
      if (keyword in schema) {
        JsonSchemaStructure.walk(schema[keyword], `${pointer}/${keyword}`, document, problems);
      }
    }
    for (const keyword of SCHEMA_LIST_KEYWORDS) {
      if (!(keyword in schema)) continue;
      const list = schema[keyword];
      if (!Array.isArray(list) || list.length === 0) {
        problems.push(`${pointer}/${keyword}: must be a non-empty array`);
        continue;
      }
      list.forEach((item, index) =>
        JsonSchemaStructure.walk(item, `${pointer}/${keyword}/${index}`, document, problems),
      );
    }
  }

  private static walkProperties(
    schema: Record<string, unknown>,
    pointer: string,
    document: Record<string, unknown>,
    problems: string[],
  ): void {
    const properties = schema.properties;
    if (typeof properties === "object" && properties !== null) {
      for (const [name, property] of Object.entries(properties)) {
        JsonSchemaStructure.walk(property, `${pointer}/properties/${name}`, document, problems);
      }
    }
  }

  private static checkKeywords(
    schema: Record<string, unknown>,
    pointer: string,
    document: Record<string, unknown>,
    problems: string[],
  ): void {
    const { type, required, enum: members, $ref: reference } = schema;
    JsonSchemaStructure.checkType(type, pointer, problems);
    JsonSchemaStructure.checkRequired(required, pointer, problems);
    if (members !== undefined && !Array.isArray(members))
      problems.push(`${pointer}/enum: must be an array`);
    JsonSchemaStructure.checkNumericKeywords(schema, pointer, problems);
    JsonSchemaStructure.checkPattern(schema, pointer, problems);
    if (reference !== undefined)
      JsonSchemaStructure.checkReference(reference, pointer, document, problems);
  }

  private static checkType(type: unknown, pointer: string, problems: string[]): void {
    const types = Array.isArray(type) ? type : type === undefined ? [] : [type];
    if (!types.every((name) => typeof name === "string" && TYPE_NAMES.has(name)))
      problems.push(`${pointer}/type: unknown type ${JSON.stringify(type)}`);
    if (new Set(types).size !== types.length) problems.push(`${pointer}/type: duplicate types`);
  }

  private static checkRequired(required: unknown, pointer: string, problems: string[]): void {
    if (required !== undefined && !(Array.isArray(required) && required.length > 0))
      problems.push(`${pointer}/required: must be a non-empty array of strings`);
  }

  private static checkNumericKeywords(
    schema: Record<string, unknown>,
    pointer: string,
    problems: string[],
  ): void {
    for (const keyword of COUNT_KEYWORDS) {
      const count = schema[keyword];
      if (count !== undefined && !(Number.isInteger(count) && (count as number) >= 0)) {
        problems.push(`${pointer}/${keyword}: must be a non-negative integer`);
      }
    }
    for (const keyword of NUMBER_KEYWORDS) {
      if (keyword in schema && typeof schema[keyword] !== "number") {
        problems.push(`${pointer}/${keyword}: must be a number`);
      }
    }
  }

  private static checkPattern(
    schema: Record<string, unknown>,
    pointer: string,
    problems: string[],
  ): void {
    if ("pattern" in schema) {
      try {
        new RegExp(schema.pattern as string, "u");
      } catch {
        problems.push(`${pointer}/pattern: not a valid regular expression`);
      }
    }
  }

  private static checkReference(
    reference: unknown,
    pointer: string,
    document: Record<string, unknown>,
    problems: string[],
  ): void {
    if (typeof reference !== "string" || !reference.startsWith("#/")) {
      problems.push(`${pointer}/$ref: must be a local pointer`);
      return;
    }
    let current: unknown = document;
    for (const part of reference.slice(2).split("/")) {
      const key = decodeURIComponent(part).replaceAll("~1", "/").replaceAll("~0", "~");
      current =
        typeof current === "object" && current !== null
          ? (current as Record<string, unknown>)[key]
          : undefined;
    }
    if (current === undefined) problems.push(`${pointer}/$ref: ${reference} does not resolve`);
  }
}
