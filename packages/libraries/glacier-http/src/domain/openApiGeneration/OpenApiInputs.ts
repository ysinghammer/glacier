import type { IJsonObject, IJsonValue } from "@glacier/schema";
import type { IHttpEndpointMetadata } from "../requestHandling/routing/types/IHttpEndpointMetadata.js";
import { OpenApiSchemas } from "./OpenApiSchemas.js";
import { OpenApiJson } from "./OpenApiJson.js";

const QUERY_LIMITATION =
  "Bracket notation for objects; repeated keys for scalar arrays. Deeply nested objects and nested repeated arrays are not uniformly supported by OpenAPI tooling. No indexed arrays, arrays of objects, empty brackets, dotted paths or embedded JSON.";

/** Describes the actual binder wire grammar without reconstructing handler types or invoking controllers. */
export class OpenApiInputs {
  /** Produces bound parameters and one required JSON object body; ambiguous parameter declarations fail. */
  public static operation(endpoint: IHttpEndpointMetadata, schemas: OpenApiSchemas): IJsonObject {
    const parameters: IJsonObject[] = [];
    const names = new Set<string>();
    let requestBody: IJsonObject | undefined;
    const pathNames = endpoint.template
      .split("/")
      .filter((part) => part.startsWith(":"))
      .map((part) => part.slice(1));
    for (const binding of endpoint.bindings) {
      const body = OpenApiInputs.binding(binding, parameters, names, pathNames, schemas);
      if (body !== undefined) requestBody = body;
    }
    for (const name of pathNames) {
      if (!names.has(`path:${name}`))
        OpenApiInputs.add(
          parameters,
          names,
          OpenApiInputs.parameter(name, "path", { type: "string" }, true),
        );
    }
    return {
      ...(parameters.length === 0 ? {} : { parameters }),
      ...(requestBody === undefined ? {} : { requestBody }),
    };
  }

  private static binding(
    binding: IHttpEndpointMetadata["bindings"][number],
    parameters: IJsonObject[],
    names: Set<string>,
    pathNames: readonly string[],
    schemas: OpenApiSchemas,
  ): IJsonObject | undefined {
    if (!("options" in binding)) return undefined;
    if (
      binding.options.description !== undefined &&
      typeof binding.options.description !== "string"
    )
      throw new TypeError("Invalid binder description");
    if (binding.location === "body")
      return {
        required: true,
        ...(binding.options.description === undefined
          ? {}
          : { description: binding.options.description }),
        content: {
          "application/json": {
            schema: schemas.reference(binding.dto, "input"),
            ...OpenApiInputs.wrapExamples(binding.options),
          },
        },
      };
    if ("dto" in binding) {
      OpenApiInputs.structuredParameters(binding, parameters, names, pathNames, schemas);
      return undefined;
    }
    OpenApiInputs.scalarParameter(binding, parameters, names);
    return undefined;
  }

  private static structuredParameters(
    binding: Extract<IHttpEndpointMetadata["bindings"][number], { readonly dto: unknown }>,
    parameters: IJsonObject[],
    names: Set<string>,
    pathNames: readonly string[],
    schemas: OpenApiSchemas,
  ): void {
    const definition = schemas.definition(binding.dto, "input");
    if (definition.type !== "object")
      throw new TypeError("Structured binder requires an object schema");
    const required = Array.isArray(definition.required) ? definition.required : [];
    const properties = OpenApiJson.object(definition.properties);
    for (const [name, value] of Object.entries(properties)) {
      const location = OpenApiInputs.structuredLocation(binding.location);
      if (location === "path" && !pathNames.includes(name))
        throw new TypeError("Path DTO property has no route segment");
      const schema = OpenApiJson.object(value);
      if (location === "query") OpenApiInputs.query(schema, schemas, new Set());
      const parameter = OpenApiInputs.parameter(
        name,
        location,
        schema,
        location === "path" || required.includes(name),
        binding.options.description,
      );
      OpenApiInputs.add(parameters, names, parameter);
    }
  }

  private static structuredLocation(location: string): string {
    switch (location) {
      case "params":
        return "path";
      case "headers":
        return "header";
      case "cookies":
        return "cookie";
      default:
        return "query";
    }
  }

  private static scalarParameter(
    binding: Extract<IHttpEndpointMetadata["bindings"][number], { readonly name: string }>,
    parameters: IJsonObject[],
    names: Set<string>,
  ): void {
    const location = binding.location === "param" ? "path" : binding.location;
    const scalarLocation =
      location === "header" ? "header" : location === "cookie" ? "cookie" : "path";
    OpenApiInputs.add(parameters, names, {
      ...OpenApiInputs.parameter(
        binding.name,
        scalarLocation,
        { type: "string" },
        scalarLocation === "path",
        binding.options.description,
      ),
      ...OpenApiInputs.wrapExamples(binding.options),
    });
  }

  /** Named raw values become Example Objects without executing consumer serialization callbacks. */
  public static examples(options: {
    readonly description?: string;
    readonly examples?: Readonly<Record<string, IJsonValue>>;
  }): IJsonObject {
    return OpenApiInputs.wrapExamples(options);
  }

  /** Wraps copied examples; absence is distinct from an explicitly empty examples record. */
  private static wrapExamples(options: {
    readonly description?: string;
    readonly examples?: Readonly<Record<string, IJsonValue>>;
  }): IJsonObject {
    if (options.examples === undefined) return {};
    return {
      examples: Object.fromEntries(
        Object.entries(options.examples).map(([name, value]) => [
          name,
          { value: OpenApiJson.copy(value) },
        ]),
      ),
    };
  }

  /** Scalar arrays repeat query keys; nested query objects use bounded deepObject documentation. */
  private static parameter(
    name: string,
    location: string,
    schema: IJsonObject,
    required: boolean,
    description?: string,
  ): IJsonObject {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    const alternatives = Array.isArray(schema.anyOf) ? schema.anyOf : [];
    const isObject =
      types.includes("object") ||
      typeof schema.$ref === "string" ||
      alternatives.some(
        (alternative) =>
          typeof alternative === "object" && alternative !== null && "$ref" in alternative,
      );
    const isArray = types.includes("array");
    if (location !== "query" && (isObject || isArray))
      throw new TypeError("Header/cookie/path binders require scalar wire fields");
    return {
      name: location === "header" ? name.toLowerCase() : name,
      in: location,
      required,
      schema,
      ...(description === undefined ? {} : { description }),
      ...(location === "query"
        ? {
            style: isObject ? "deepObject" : "form",
            explode: true,
            ...(isObject ? { "x-glacier-serialization": QUERY_LIMITATION } : {}),
          }
        : {}),
    };
  }

  /** Checks nested repeated-array grammar without expanding cyclic DTO references indefinitely. */
  private static query(schema: IJsonObject, schemas: OpenApiSchemas, visited: Set<string>): void {
    if (typeof schema.$ref === "string") {
      if (visited.has(schema.$ref)) return;
      visited.add(schema.$ref);
    }
    const resolved = schemas.resolve(schema);
    const types = Array.isArray(resolved.type) ? resolved.type : [resolved.type];
    if (types.includes("array")) {
      OpenApiInputs.queryArray(resolved);
      return;
    }
    OpenApiInputs.queryChildren(resolved, schemas, visited);
  }

  private static queryArray(resolved: IJsonObject): void {
    if (Array.isArray(resolved.prefixItems) && resolved.prefixItems.length < 2)
      throw new TypeError(
        "Query tuples need at least two repeated scalar values; singleton promotion applies only to IsArray",
      );
    const items = Array.isArray(resolved.prefixItems)
      ? resolved.prefixItems.map((item) => OpenApiJson.object(item))
      : [OpenApiJson.object(resolved.items)];
    if (items.some((item) => item.$ref !== undefined))
      throw new TypeError("Query arrays require scalar elements at every depth");
  }

  private static queryChildren(
    resolved: IJsonObject,
    schemas: OpenApiSchemas,
    visited: Set<string>,
  ): void {
    for (const child of Object.values(OpenApiJson.object(resolved.properties ?? {})))
      OpenApiInputs.query(OpenApiJson.object(child), schemas, visited);
    for (const key of ["anyOf", "oneOf"]) {
      const alternatives = resolved[key];
      if (Array.isArray(alternatives))
        for (const child of alternatives)
          OpenApiInputs.query(OpenApiJson.object(child), schemas, visited);
    }
    if (typeof resolved.additionalProperties === "object" && resolved.additionalProperties !== null)
      OpenApiInputs.query(OpenApiJson.object(resolved.additionalProperties), schemas, visited);
  }

  /** Parameter identity is location plus normalized name; duplicate metadata cannot overwrite documentation. */
  private static add(parameters: IJsonObject[], names: Set<string>, parameter: IJsonObject): void {
    const key = `${String(parameter.in)}:${String(parameter.name)}`;
    if (names.has(key)) throw new TypeError("Ambiguous bound parameter documentation");
    names.add(key);
    parameters.push(parameter);
  }
}
