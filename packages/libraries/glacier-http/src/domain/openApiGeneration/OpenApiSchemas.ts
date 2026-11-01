import { Describe, IsObject, Schema } from "@glacier/schema";
import type { IJsonObject, IJsonValue, IJsonSchemaDirection, IJsonSchema } from "@glacier/schema";
import type { IConstructableClass } from "@glacier/reflection";
import { OpenApiJson } from "./OpenApiJson.js";

const REFERENCE_PREFIX = "#/components/schemas/";
const LITERAL_KEYWORDS = new Set(["example", "examples", "default", "const", "enum"]);

/**
 * Builds detached input/output schema components from explicit DTO class identities.
 */
export class OpenApiSchemas {
  /**
   * Directionally named generated schema definitions owned by this composition.
   * @default Empty record
   */
  private readonly schemas: Record<string, IJsonValue> = {};

  /**
   * Generates separate input/output component graphs while checking root class collisions.
   * @param input DTO class identities used for request schemas.
   * @param output DTO class identities used for response schemas.
   */
  public constructor(
    input: readonly IConstructableClass<object>[],
    output: readonly IConstructableClass<object>[],
  ) {
    const names = new Set<string>();
    const all = [...new Set([...input, ...output])];
    for (const target of all) {
      const generated = Schema.toJsonSchema(target, {
        target: "openapi-3.1",
        direction: output.includes(target) ? "output" : "input",
      });
      const components = OpenApiJson.object(generated.components);
      for (const key of Object.keys(OpenApiJson.object(components.schemas))) names.add(key);
    }
    let graphName = "GlacierOpenApiGraph";
    while (names.has(graphName)) graphName += "_";
    if (all.length > 0) OpenApiSchemas.graph(all, "input", graphName);
    for (const [direction, roots] of [
      ["input", input],
      ["output", output],
    ] as const) {
      if (roots.length === 0) continue;
      const graph = OpenApiSchemas.graph([...new Set(roots)], direction, graphName);
      const definitions = OpenApiJson.object(OpenApiJson.object(graph.components).schemas);
      for (const [name, definition] of Object.entries(definitions)) {
        if (name === graphName) continue;
        this.schemas[name + OpenApiSchemas.suffix(direction)] = OpenApiSchemas.rewrite(
          definition,
          direction,
        );
      }
    }
  }

  /**
   * Creates a local component reference for one registered root and direction.
   * @param target Explicit DTO class identity.
   * @param direction Input or output schema direction.
   * @returns JSON Schema reference to the directional component.
   */
  public reference(
    target: IConstructableClass<object>,
    direction: IJsonSchemaDirection,
  ): IJsonObject {
    const generated = Schema.toJsonSchema(target, { target: "openapi-3.1", direction });
    const name = decodeURIComponent(String(generated.$ref).slice(REFERENCE_PREFIX.length))
      .replaceAll("~1", "/")
      .replaceAll("~0", "~");
    return {
      $ref: REFERENCE_PREFIX + OpenApiJson.pointer(name + OpenApiSchemas.suffix(direction)),
    };
  }

  /**
   * Resolves the generated root definition for parameter-shape inspection.
   * @param target Explicit DTO class identity.
   * @param direction Input or output schema direction.
   * @returns Root schema object from the registered component graph.
   */
  public definition(
    target: IConstructableClass<object>,
    direction: IJsonSchemaDirection,
  ): IJsonObject {
    return this.resolve(this.reference(target, direction));
  }

  /**
   * Resolves local component references and leaves inline schemas unchanged.
   * @param schema Inline schema or local component reference to resolve.
   * @returns Resolved object schema or the original inline object.
   */
  public resolve(schema: IJsonObject): IJsonObject {
    if (typeof schema.$ref !== "string") return schema;
    const name = schema.$ref.slice(REFERENCE_PREFIX.length);
    const key = decodeURIComponent(name).replaceAll("~1", "/").replaceAll("~0", "~");
    return OpenApiJson.object(this.schemas[key]);
  }

  /**
   * Adds one framework-owned component without replacing an existing name.
   * @param name Component key to reserve.
   * @param schema Detached schema object to store.
   * @returns No value; stores the schema under its component name.
   * @throws {TypeError} When the component name is already present.
   */
  public add(name: string, schema: IJsonObject): void {
    if (Object.hasOwn(this.schemas, name)) throw new TypeError(`Conflicting component ${name}`);
    this.schemas[name] = schema;
  }

  /**
   * Creates a stable component record sorted by component name.
   * @returns Components in lexicographic key order, detached from internal storage.
   */
  public components(): IJsonObject {
    return Object.fromEntries(
      Object.entries(this.schemas).sort(([left], [right]) => left.localeCompare(right)),
    );
  }

  /**
   * Generates one synthetic graph so reachable DTO schemas share collision detection.
   * @param roots DTO class identities included in this graph.
   * @param direction Input or output schema direction for the graph.
   * @param name Synthetic graph name chosen to avoid root collisions.
   * @returns Generated JSON Schema metadata for the reachable component graph.
   */
  private static graph(
    roots: readonly IConstructableClass<object>[],
    direction: IJsonSchemaDirection,
    name: string,
  ): IJsonSchema {
    /**
     * Synthetic carrier class whose public schema declarations join all graph roots.
     */
    class ComponentGraph {
      /**
       * Generates schema metadata without constructing this class or consumer DTOs.
       * @returns Schema metadata for this graph's declared root properties.
       */
      public static generate(): IJsonSchema {
        return Schema.toJsonSchema(ComponentGraph, { target: "openapi-3.1", direction });
      }
    }
    Describe({ name })(ComponentGraph);
    for (const [index, root] of roots.entries())
      IsObject(root)(ComponentGraph.prototype, `root${index}`);
    return ComponentGraph.generate();
  }

  /**
   * Selects the stable suffix distinguishing input and output component names.
   * @param direction Schema generation direction.
   * @returns `Input` for request schemas or `Output` for response schemas.
   */
  private static suffix(direction: IJsonSchemaDirection): string {
    return direction === "input" ? "Input" : "Output";
  }

  /**
   * Rewrites local references and discriminator mappings for one wire direction.
   * @param value JSON Schema value to traverse.
   * @param direction Directional component suffix to apply.
   * @param isMapping Whether this string is a discriminator mapping target; defaults to false.
   * @returns Rewritten schema data, leaving literal examples and extension values intact.
   */
  private static rewrite(
    value: IJsonValue,
    direction: IJsonSchemaDirection,
    isMapping = false,
  ): IJsonValue {
    if (Array.isArray(value)) return value.map((child) => OpenApiSchemas.rewrite(child, direction));
    if (typeof value !== "object" || value === null) return value;
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => {
        if (
          (key === "$ref" || isMapping) &&
          typeof child === "string" &&
          child.startsWith(REFERENCE_PREFIX)
        ) {
          const name = decodeURIComponent(child.slice(REFERENCE_PREFIX.length))
            .replaceAll("~1", "/")
            .replaceAll("~0", "~");
          return [
            key,
            REFERENCE_PREFIX + OpenApiJson.pointer(name + OpenApiSchemas.suffix(direction)),
          ];
        }
        if (LITERAL_KEYWORDS.has(key) || key.startsWith("x-")) return [key, child];
        return [key, OpenApiSchemas.rewrite(child, direction, key === "mapping")];
      }),
    );
  }
}
