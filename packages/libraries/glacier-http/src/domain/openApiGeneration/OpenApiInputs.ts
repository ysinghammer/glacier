import type { IJsonObject, IJsonValue } from "@glacier/schema";
import type { IHttpEndpointMetadata } from "../requestHandling/routing/types/IHttpEndpointMetadata.js";
import { OpenApiSchemas } from "./OpenApiSchemas.js";
import { OpenApiJson } from "./OpenApiJson.js";

const QUERY_LIMITATION =
  "Bracket notation for objects; repeated keys for scalar arrays. Deeply nested objects and nested repeated arrays are not uniformly supported by OpenAPI tooling. No indexed arrays, arrays of objects, empty brackets, dotted paths or embedded JSON.";

/**
 * Generates OpenAPI input contracts from explicit binder metadata and wire-shape schemas.
 */
export class OpenApiInputs {
  /**
   * Builds path/query/header/cookie parameters and the endpoint's JSON request body.
   * @param endpoint Prepared endpoint metadata containing explicit binders.
   * @param schemas Directional schemas used to describe DTO-backed inputs.
   * @returns OpenAPI operation fields for declared parameters and optional request body.
   */
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

  /**
   * Converts one explicit binder into either a request body or one/more parameters.
   * @param binding Prepared parameter binding declaration.
   * @param parameters Output parameter list receiving generated contracts.
   * @param names Parameter identities already emitted, used to reject collisions.
   * @param pathNames Named path segments available to bind.
   * @param schemas Directional schemas used for DTO-backed bindings.
   * @returns Request-body object for a body binder, or undefined for other locations.
   * @throws {TypeError} When the binder description is not a string.
   */
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

  /**
   * Expands the explicit DTO object's properties into location-specific parameters.
   * @param binding DTO-backed binder with its input location and documentation options.
   * @param parameters Output parameter list receiving the expanded properties.
   * @param names Parameter identities already emitted, used to reject collisions.
   * @param pathNames Named route segments available to path DTO properties.
   * @param schemas Directional schema resolver for DTO property definitions.
   * @returns No value; appends each supported property parameter.
   * @throws {TypeError} When DTO schema is not an object or a path property is unbound.
   */
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

  /**
   * Maps binder source names to OpenAPI parameter locations.
   * @param location Explicit binder source name.
   * @returns OpenAPI `path`, `header`, `cookie`, or `query` location.
   */
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

  /**
   * Converts one named scalar binder into its OpenAPI parameter object.
   * @param binding Named path, header, or cookie binding.
   * @param parameters Output parameter list receiving the declaration.
   * @param names Parameter identities already emitted, used to reject collisions.
   * @returns No value; appends one parameter with optional examples.
   */
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

  /**
   * Wraps copied named JSON values as OpenAPI Example Objects.
   * @param options Optional description/examples record to document.
   * @returns OpenAPI examples field, or an empty object when examples are absent.
   */
  public static examples(options: {
    readonly description?: string;
    readonly examples?: Readonly<Record<string, IJsonValue>>;
  }): IJsonObject {
    return OpenApiInputs.wrapExamples(options);
  }

  /**
   * Wraps each named raw value in an Example Object without changing absence semantics.
   * @param options Optional static description and named examples record.
   * @returns Examples field when supplied, or an empty object when absent.
   */
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

  /**
   * Produces one OpenAPI parameter and rejects structured non-query wire values.
   * @param name Parameter name as bound or declared by a DTO.
   * @param location OpenAPI parameter location.
   * @param schema JSON Schema describing the parameter value.
   * @param required Whether a value must be supplied.
   * @param description Optional static parameter description.
   * @returns OpenAPI parameter record with query serialization settings when applicable.
   * @throws {TypeError} When a non-query parameter is an object or array on the wire.
   */
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

  /**
   * Checks nested query-schema arrays while terminating on repeated component references.
   * @param schema Schema node to inspect.
   * @param schemas Resolver for local component references.
   * @param visited Component references already traversed in this query schema.
   * @returns No value; validates the supported query-array grammar.
   */
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

  /**
   * Validates one query array's tuple length and scalar element requirements.
   * @param resolved Resolved array schema object.
   * @returns No value; accepts only the documented repeated-scalar grammar.
   * @throws {TypeError} When tuples are too short or array elements are structured.
   */
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

  /**
   * Traverses nested object properties and union alternatives for query compatibility.
   * @param resolved Resolved schema object whose children are inspected.
   * @param schemas Resolver for local component references.
   * @param visited Component references already traversed in this query schema.
   * @returns No value; validates every supported nested schema branch.
   */
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

  /**
   * Adds a parameter only when its normalized location/name identity is unique.
   * @param parameters Output list receiving a unique parameter declaration.
   * @param names Parameter identities already emitted.
   * @param parameter OpenAPI parameter record to append.
   * @returns No value; updates the list and identity set together.
   * @throws {TypeError} When another declaration already uses this location and name.
   */
  private static add(parameters: IJsonObject[], names: Set<string>, parameter: IJsonObject): void {
    const key = `${String(parameter.in)}:${String(parameter.name)}`;
    if (names.has(key)) throw new TypeError("Ambiguous bound parameter documentation");
    names.add(key);
    parameters.push(parameter);
  }
}
