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

/** Checks generator-sensitive JSON Schema structure without a validator dependency. */
export class JsonSchemaStructure {
  /**
   * Finds malformed keyword values and unresolved local references in a document.
   * @param document Generated JSON Schema document to inspect.
   * @returns Readonly diagnostics prefixed by their JSON pointer.
   */
  public static problems(document: Record<string, unknown>): readonly string[] {
    const problems: string[] = [];
    const container = JsonSchemaStructure.container(document);
    JsonSchemaStructure.walk(document, "", document, problems);
    for (const [name, schema] of Object.entries(container)) {
      JsonSchemaStructure.walk(schema, `/${name}`, document, problems);
    }
    return problems;
  }

  /**
   * Selects component schemas or `$defs` as the document's schema container.
   * @param document Document whose reusable schemas are selected.
   * @returns Reusable schemas, or an empty record when none are declared.
   */
  private static container(document: Record<string, unknown>): Record<string, unknown> {
    const components = document.components as { schemas?: Record<string, unknown> } | undefined;
    return (components?.schemas ?? document.$defs ?? {}) as Record<string, unknown>;
  }

  /**
   * Validates one schema node and recursively inspects its nested schemas.
   * @param value Candidate schema node; booleans are valid schema values.
   * @param pointer JSON pointer identifying this node in the document.
   * @param document Root document used to resolve local references.
   * @param problems Mutable diagnostics list receiving findings for this node.
   * @returns Nothing; appends structural violations to `problems`.
   */
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

  /**
   * Recurses through schema-valued keywords and non-empty schema lists.
   * @param schema Schema containing nested schema keywords.
   * @param pointer JSON pointer identifying `schema`.
   * @param document Root document used to resolve local references.
   * @param problems Mutable diagnostics list receiving findings.
   * @returns Nothing; appends findings while traversing nested schemas.
   */
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

  /**
   * Inspects each property value as a nested schema.
   * @param schema Schema whose `properties` keyword is inspected.
   * @param pointer JSON pointer identifying `schema`.
   * @param document Root document used to resolve local references.
   * @param problems Mutable diagnostics list receiving findings.
   * @returns Nothing; appends findings while traversing property schemas.
   */
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

  /**
   * Validates type, required, enum, numeric, pattern, and reference keywords.
   * @param schema Schema whose supported keyword values are checked.
   * @param pointer JSON pointer identifying `schema`.
   * @param document Root document used to resolve local references.
   * @param problems Mutable diagnostics list receiving findings.
   * @returns Nothing; appends a diagnostic for each invalid keyword.
   */
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

  /**
   * Checks that type names are supported and unique.
   * @param type Single type name, type-name list, or absent keyword value.
   * @param pointer JSON pointer identifying the containing schema.
   * @param problems Mutable diagnostics list receiving findings.
   * @returns Nothing; appends a finding when names are invalid or repeated.
   */
  private static checkType(type: unknown, pointer: string, problems: string[]): void {
    const types = Array.isArray(type) ? type : type === undefined ? [] : [type];
    if (!types.every((name) => typeof name === "string" && TYPE_NAMES.has(name)))
      problems.push(`${pointer}/type: unknown type ${JSON.stringify(type)}`);
    if (new Set(types).size !== types.length) problems.push(`${pointer}/type: duplicate types`);
  }

  /**
   * Requires a present `required` keyword to be a non-empty list.
   * @param required Candidate value of the `required` keyword.
   * @param pointer JSON pointer identifying the containing schema.
   * @param problems Mutable diagnostics list receiving findings.
   * @returns Nothing; appends a finding when the list is malformed.
   */
  private static checkRequired(required: unknown, pointer: string, problems: string[]): void {
    if (required !== undefined && !(Array.isArray(required) && required.length > 0))
      problems.push(`${pointer}/required: must be a non-empty array of strings`);
  }

  /**
   * Validates count and numeric bound keywords.
   * @param schema Schema whose numeric keyword values are checked.
   * @param pointer JSON pointer identifying `schema`.
   * @param problems Mutable diagnostics list receiving findings.
   * @returns Nothing; appends findings for invalid numeric values.
   */
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

  /**
   * Checks whether a pattern keyword can be compiled as a Unicode regexp.
   * @param schema Schema whose optional `pattern` value is checked.
   * @param pointer JSON pointer identifying `schema`.
   * @param problems Mutable diagnostics list receiving findings.
   * @returns Nothing; records an invalid-pattern finding when compilation fails.
   */
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

  /**
   * Resolves a local JSON pointer reference and reports missing targets.
   * @param reference Candidate value of the `$ref` keyword.
   * @param pointer JSON pointer identifying the containing schema.
   * @param document Root document traversed from the pointer.
   * @param problems Mutable diagnostics list receiving findings.
   * @returns Nothing; appends a finding for malformed or unresolved references.
   */
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
