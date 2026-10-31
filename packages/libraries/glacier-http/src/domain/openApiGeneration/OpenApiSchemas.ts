import { Describe, IsObject, Schema } from "@glacier/schema";
import type { IJsonObject, IJsonValue, IJsonSchemaDirection, IJsonSchema } from "@glacier/schema";
import type { IConstructableClass } from "@glacier/reflection";
import { OpenApiJson } from "./OpenApiJson.js";

const REFERENCE_PREFIX = "#/components/schemas/";
const LITERAL_KEYWORDS = new Set(["example", "examples", "default", "const", "enum"]);

/** Composes complete class graphs through public schema declarations, retaining global class collision detection. */
export class OpenApiSchemas {
  private readonly schemas: Record<string, IJsonValue> = {};

  /** Checks all root identities together before directional graphs; the synthetic graph never becomes a public component. */
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

  /** Returns a reference to a registered root in the requested wire direction. */
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

  /** Resolves a prepared root object for parameter decomposition without exposing schema metadata. */
  public definition(
    target: IConstructableClass<object>,
    direction: IJsonSchemaDirection,
  ): IJsonObject {
    return this.resolve(this.reference(target, direction));
  }

  /** Resolves a generated local schema reference for wire-shape checks, leaving inline schemas intact. */
  public resolve(schema: IJsonObject): IJsonObject {
    if (typeof schema.$ref !== "string") return schema;
    const name = schema.$ref.slice(REFERENCE_PREFIX.length);
    const key = decodeURIComponent(name).replaceAll("~1", "/").replaceAll("~0", "~");
    return OpenApiJson.object(this.schemas[key]);
  }

  /** Adds framework-owned schemas with collision rejection, never a silent override. */
  public add(name: string, schema: IJsonObject): void {
    if (Object.hasOwn(this.schemas, name)) throw new TypeError(`Conflicting component ${name}`);
    this.schemas[name] = schema;
  }

  /** Returns sorted detached components for stable output independent of registration order. */
  public components(): IJsonObject {
    return Object.fromEntries(
      Object.entries(this.schemas).sort(([left], [right]) => left.localeCompare(right)),
    );
  }

  /** Uses a behavior-bearing local graph class solely for metadata composition through deliberate public APIs. */
  private static graph(
    roots: readonly IConstructableClass<object>[],
    direction: IJsonSchemaDirection,
    name: string,
  ): IJsonSchema {
    /** One generator call keeps reachable class ownership together, including nested cycles and unions. */
    class ComponentGraph {
      /** Generates metadata, never an instance of the graph or any consumer DTO. */
      public static generate(): IJsonSchema {
        return Schema.toJsonSchema(ComponentGraph, { target: "openapi-3.1", direction });
      }
    }
    Describe({ name })(ComponentGraph);
    for (const [index, root] of roots.entries())
      IsObject(root)(ComponentGraph.prototype, `root${index}`);
    return ComponentGraph.generate();
  }

  /** Stable directional names are independent of traversal and contain no collision-hiding numeric suffixes. */
  private static suffix(direction: IJsonSchemaDirection): string {
    return direction === "input" ? "Input" : "Output";
  }

  /** Rewrites schema refs/discriminator mappings, never literal examples or enum/const data. */
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
