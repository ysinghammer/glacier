import { Schema } from "@glacier/schema";
import type { IJsonObject, IJsonValue } from "@glacier/schema";
import type { IConstructableClass } from "@glacier/reflection";
import { HttpEndpointMetadata } from "../../domain/requestHandling/routing/HttpEndpointMetadata.js";
import type { IHttpEndpointMetadata } from "../../domain/requestHandling/routing/types/IHttpEndpointMetadata.js";
import type { IOpenApiGenerationOptions } from "../../domain/openApiGeneration/types/IOpenApiGenerationOptions.js";
import type { IOpenApiDocument } from "../../domain/openApiGeneration/types/IOpenApiDocument.js";
import { OpenApiJson } from "../../domain/openApiGeneration/OpenApiJson.js";
import { OpenApiSchemas } from "../../domain/openApiGeneration/OpenApiSchemas.js";
import { OpenApiInputs } from "../../domain/openApiGeneration/OpenApiInputs.js";
import { OpenApiResponses } from "../../domain/openApiGeneration/OpenApiResponses.js";

/** Validated API identity: nonblank title/version and optional description retain their spelling. */
interface IValidatedOpenApiInfo {
  /** Readonly human-readable title; required, nonblank, and retained without trimming. */
  readonly title: string;
  /** Readonly caller-defined version; required and nonblank, not the OpenAPI spec version. */
  readonly version: string;
  /** Optional readonly API description; omitted if absent, and an empty string is allowed. */
  readonly description?: string;
}

/**
 * Generates OpenAPI 3.1 from HTTP/DTO metadata through static methods, without I/O or
 * consumer instances. Holds no state; instantiation has no effect.
 *
 * @remarks Preparation can freeze DTO metadata and invoke lazy schema reference resolvers.
 * @remarks Wire checks do not prove full meta-schema validity or arbitrary callback equivalence.
 * @see OpenApiGeneration.generate
 */
export class OpenApiGeneration {
  /**
   * Validates declarations and builds OpenAPI with sorted paths and components.
   * Options stay unchanged; DTO metadata may freeze, and failures produce no partial document.
   *
   * @param options - Generation options, including controller classes and API documentation.
   * @returns Unfrozen OpenAPI 3.1.0 JSON with identity, paths, schemas, security, and limits.
   * @remarks Excluded routes still reserve signatures and require user-ID authentication.
   * @remarks Empty controller input yields empty paths and schemas; preparation is not rolled back.
   */
  public static generate(options: IOpenApiGenerationOptions): IOpenApiDocument {
    const info = OpenApiGeneration.info(options.info);
    const authentication = OpenApiGeneration.security(options.authentication);
    const endpoints = OpenApiGeneration.endpoints(
      options.controllers,
      authentication !== undefined,
    );
    const schemas = OpenApiGeneration.schemas(endpoints);
    const paths = OpenApiGeneration.paths(
      endpoints,
      schemas,
      options.errorMappings,
      authentication?.schemeName,
    );
    return OpenApiGeneration.document(info, paths, schemas, authentication?.schemes);
  }

  /**
   * Validates and copies the API identity without trimming or mutating supplied values.
   *
   * @param value - Untrusted API identity object expected to match IValidatedOpenApiInfo.
   * @returns Fresh title/version/optional-description record; other fields are discarded.
   * @throws {TypeError} For blank title/version or a non-string description.
   */
  private static info(value: unknown): IValidatedOpenApiInfo {
    const info = OpenApiJson.object(value);
    const title = info.title;
    const version = info.version;
    const description = info.description;
    if (typeof title !== "string" || title.trim() === "") throw new TypeError("Invalid API info");
    if (typeof version !== "string" || version.trim() === "")
      throw new TypeError("Invalid API info");
    if (description !== undefined && typeof description !== "string")
      throw new TypeError("Invalid API info");
    return { title, version, ...(description === undefined ? {} : { description }) };
  }

  /**
   * Copies optional OIDC documentation without mutating input or fetching its discovery URL.
   * Parses, but does not normalize, the URL; safe extra JSON scheme fields are retained.
   *
   * @param value - Optional authentication configuration from IOpenApiGenerationOptions.
   * @returns Undefined if absent; otherwise the named detached scheme and its key.
   * @throws {TypeError} For blank scheme names or a scheme not typed openIdConnect.
   * @throws {TypeError} For non-string discovery URL or supplied description.
   * @throws {TypeError} If the parsed URL protocol is not HTTP or HTTPS.
   */
  private static security(
    value: IOpenApiGenerationOptions["authentication"],
  ): { readonly schemes: Record<string, IJsonValue>; readonly schemeName: string } | undefined {
    if (value === undefined) return undefined;
    const authentication = OpenApiJson.object(value);
    const scheme = OpenApiJson.object(authentication.scheme);
    const schemeName = authentication.schemeName;
    const discoveryUrl = scheme.openIdConnectUrl;
    if (typeof schemeName !== "string" || schemeName.trim() === "")
      throw new TypeError("Invalid OpenAPI authentication");
    if (scheme.type !== "openIdConnect" || typeof discoveryUrl !== "string")
      throw new TypeError("Invalid OpenAPI authentication");
    if (scheme.description !== undefined && typeof scheme.description !== "string")
      throw new TypeError("Invalid OpenAPI authentication");
    const url = new URL(discoveryUrl);
    if (url.protocol !== "https:" && url.protocol !== "http:")
      throw new TypeError("OIDC discovery must be an absolute HTTP URL");
    const schemes: Record<string, IJsonValue> = {};
    Object.defineProperty(schemes, schemeName, {
      value: scheme,
      enumerable: true,
    });
    return { schemes, schemeName };
  }

  /**
   * Collects included endpoints with unique routes without constructing controllers or changing input.
   * Reading contracts prepares DTOs and may freeze their metadata.
   *
   * @param controllers - Controller classes inspected in caller-supplied order.
   * @param hasAuthentication - Whether user-ID bindings have a configured authentication scheme.
   * @returns Fresh mutable array of included endpoints, empty when none qualify.
   */
  private static endpoints(
    controllers: readonly IConstructableClass<object>[],
    hasAuthentication: boolean,
  ): IHttpEndpointMetadata[] {
    const endpoints: IHttpEndpointMetadata[] = [];
    const routes = new Set<string>();
    const templates = new Map<string, string>();
    for (const controller of controllers)
      for (const endpoint of HttpEndpointMetadata.read(controller))
        OpenApiGeneration.appendEndpoint(endpoints, routes, templates, endpoint, hasAuthentication);
    return endpoints;
  }

  /**
   * Reserves method/template identity, ignoring parameter names, then appends included endpoints.
   * Excluded routes still reserve signatures and require user-ID authentication; no rollback.
   *
   * @param endpoints - Mutable output array; included endpoint references are appended here.
   * @param routes - Mutable signatures; updated before authentication and exclusion checks.
   * @param templates - Mutable path-name map; updated for included routes after validation.
   * @param endpoint - Prepared route contract to validate and possibly retain by reference.
   * @param hasAuthentication - Whether user-ID bindings can use documented authentication.
   * @returns No value; updates tracking collections and appends included endpoints.
   * @throws {TypeError} For a non-boolean controller exclusion flag.
   * @throws {TypeError} For a previously reserved method/template signature.
   * @throws {TypeError} For a user-ID binding without authentication.
   * @throws {TypeError} For inconsistent parameter names on one included path.
   */
  private static appendEndpoint(
    endpoints: IHttpEndpointMetadata[],
    routes: Set<string>,
    templates: Map<string, string>,
    endpoint: IHttpEndpointMetadata,
    hasAuthentication: boolean,
  ): void {
    if (
      endpoint.controllerOptions.exclude !== undefined &&
      typeof endpoint.controllerOptions.exclude !== "boolean"
    )
      throw new TypeError("Invalid controller exclusion");
    const pathSignature = endpoint.template.replace(/:[^/]+/g, ":");
    const signature = `${endpoint.method}:${pathSignature}`;
    if (routes.has(signature)) throw new TypeError("Ambiguous route metadata");
    routes.add(signature);
    if (!hasAuthentication && endpoint.bindings.some((binding) => binding.location === "userId"))
      throw new TypeError("UserId requires documented authentication");
    if (endpoint.controllerOptions.exclude === true || endpoint.routeOptions.exclude === true)
      return;
    const previous = templates.get(pathSignature);
    if (previous !== undefined && previous !== endpoint.template)
      throw new TypeError("Inconsistent path parameter names across methods");
    templates.set(pathSignature, endpoint.template);
    endpoints.push(endpoint);
  }

  /**
   * Checks wire compatibility and composes directional schema graphs without changing endpoints.
   * Nonempty input adds framework failure components; lazy references may resolve.
   *
   * @param endpoints - Included contracts whose DTOs supply directional schema roots.
   * @returns New directional DTO/failure registry; empty input yields an empty registry.
   */
  private static schemas(endpoints: readonly IHttpEndpointMetadata[]): OpenApiSchemas {
    const input: IConstructableClass<object>[] = [];
    const output: IConstructableClass<object>[] = [];
    for (const endpoint of endpoints) {
      OpenApiGeneration.addInputSchemas(endpoint, input);
      OpenApiGeneration.addOutputSchemas(endpoint, output);
    }
    const schemas = new OpenApiSchemas(input, output);
    if (endpoints.length > 0) OpenApiResponses.prepare(schemas);
    return schemas;
  }

  /**
   * Appends input DTO roots after wire checks; body uses JSON, other locations use text coercion.
   * Ignores non-DTO bindings; appends completed before a later failure remain.
   *
   * @param endpoint - Prepared endpoint whose bindings are inspected without mutation.
   * @param input - Mutable root array; duplicate DTO identities may be appended.
   * @returns No value; appends each DTO after its wire check succeeds.
   */
  private static addInputSchemas(
    endpoint: IHttpEndpointMetadata,
    input: IConstructableClass<object>[],
  ): void {
    for (const binding of endpoint.bindings) {
      if (!("dto" in binding)) continue;
      Schema.assertJsonSchemaCompatibility(binding.dto, {
        direction: "input",
        wire: binding.location === "body" ? "json" : "text",
        coerce: binding.location !== "body",
      });
      input.push(binding.dto);
    }
  }

  /**
   * Checks response DTOs as output JSON without coercion and appends output roots.
   * Status 204 adds no schema; earlier appends survive later failures.
   *
   * @param endpoint - Prepared endpoint whose responses are inspected without mutation.
   * @param output - Mutable root array; duplicate DTO identities may be appended.
   * @returns No value; appends each non-204 response DTO after its wire check succeeds.
   */
  private static addOutputSchemas(
    endpoint: IHttpEndpointMetadata,
    output: IConstructableClass<object>[],
  ): void {
    for (const response of endpoint.responses) {
      if (response.status === 204) continue;
      Schema.assertJsonSchemaCompatibility(response.type, {
        direction: "output",
        wire: "json",
        coerce: false,
      });
      output.push(response.type);
    }
  }

  /**
   * Sorts endpoints in place and groups operations by brace-style paths and lowercase methods.
   * Enforces unique IDs without changing metadata, mappings, or schemas.
   *
   * @param endpoints - Mutable generation array, sorted by template and HTTP method.
   * @param schemas - Directional registry used for operation references and wire checks.
   * @param globals - Global mappings applied after endpoint and controller mappings.
   * @param schemeName - Security-scheme name; undefined omits authentication requirements.
   * @returns Fresh path items, empty without endpoints; nested schema values remain shared.
   */
  private static paths(
    endpoints: IHttpEndpointMetadata[],
    schemas: OpenApiSchemas,
    globals: IOpenApiGenerationOptions["errorMappings"],
    schemeName: string | undefined,
  ): Record<string, IJsonObject> {
    const paths: Record<string, IJsonObject> = {};
    const ids = new Set<string>();
    const sorted = endpoints.sort((left, right) =>
      `${left.template}:${left.method}`.localeCompare(`${right.template}:${right.method}`),
    );
    for (const endpoint of sorted) {
      const operation = OpenApiGeneration.operation(endpoint, schemas, globals, schemeName, ids);
      const path = endpoint.template.replace(/:([^/]+)/g, "{$1}");
      paths[path] = { ...paths[path], [endpoint.method.toLowerCase()]: operation };
    }
    return paths;
  }

  /**
   * Builds an operation with inputs, responses, and protected-route security.
   * Route tags override controller tags; default IDs use controller.handler and are not rolled back.
   *
   * @param endpoint - Prepared route options, controller options, bindings, responses, and visibility.
   * @param schemas - Registry supplying input/output references and resolved wire shapes.
   * @param globals - Global mappings, lower priority than endpoint and controller mappings.
   * @param schemeName - Authentication scheme name, or undefined when undocumented.
   * @param ids - Mutable set of operation IDs reserved during this generation.
   * @returns New operation object; schema values inside it remain shared.
   * @throws {TypeError} If effective route/controller tags are not an array of strings.
   */
  private static operation(
    endpoint: IHttpEndpointMetadata,
    schemas: OpenApiSchemas,
    globals: IOpenApiGenerationOptions["errorMappings"],
    schemeName: string | undefined,
    ids: Set<string>,
  ): IJsonObject {
    const route = OpenApiJson.object(endpoint.routeOptions);
    const controller = OpenApiJson.object(endpoint.controllerOptions);
    const operationId =
      route.operationId === undefined
        ? `${endpoint.controllerName}.${endpoint.handlerName}`
        : route.operationId;
    OpenApiGeneration.validateOperation(route, operationId, ids);
    const tags = route.tags ?? controller.tags;
    if (tags !== undefined && (!Array.isArray(tags) || tags.some((tag) => typeof tag !== "string")))
      throw new TypeError("Invalid operation tags");
    return {
      operationId,
      ...(route.summary === undefined ? {} : { summary: route.summary }),
      ...(route.description === undefined ? {} : { description: route.description }),
      ...(route.deprecated === undefined ? {} : { deprecated: route.deprecated }),
      ...(tags === undefined ? {} : { tags }),
      ...OpenApiInputs.operation(endpoint, schemas),
      responses: OpenApiResponses.operation(endpoint, schemas, globals, schemeName !== undefined),
      ...(schemeName !== undefined && !endpoint.isPublic
        ? { security: [{ [schemeName]: [] }] }
        : {}),
    };
  }

  /**
   * Reserves a unique nonblank operation ID before checking route descriptions and flags.
   * Later validation failure leaves the ID reserved; route options are unchanged.
   *
   * @param route - Detached route options containing optional descriptions and flags.
   * @param operationId - Candidate ID; must be nonblank and absent from ids.
   * @param ids - Mutable ID set; updated once the candidate ID passes validation.
   * @returns No value; reserves the ID and validates the checked route fields.
   * @throws {TypeError} For a non-string, blank, or previously reserved operation ID.
   * @throws {TypeError} For non-string summary or description values.
   * @throws {TypeError} For non-boolean deprecated or exclude values.
   */
  private static validateOperation(
    route: IJsonObject,
    operationId: unknown,
    ids: Set<string>,
  ): void {
    if (typeof operationId !== "string" || operationId.trim() === "" || ids.has(operationId))
      throw new TypeError("Invalid or duplicate operationId");
    ids.add(operationId);
    for (const key of ["summary", "description"])
      if (route[key] !== undefined && typeof route[key] !== "string")
        throw new TypeError("Invalid operation description");
    for (const key of ["deprecated", "exclude"])
      if (route[key] !== undefined && typeof route[key] !== "boolean")
        throw new TypeError("Invalid operation flag");
  }

  /**
   * Assembles OpenAPI with protocol/schema-limit extensions and checks safe JSON, not full meta-schema validity.
   * Retains paths, schemes, and nested schemas without mutating or freezing them.
   *
   * @param info - Validated identity copied into a fresh info record.
   * @param paths - Generated path-item record retained by reference; empty when there are no routes.
   * @param schemas - Registry supplying the sorted components.schemas record.
   * @param securitySchemes - Named schemes retained by reference; undefined omits the field.
   * @returns OpenAPI 3.1.0 document with identity, paths, components, and limits.
   */
  private static document(
    info: IValidatedOpenApiInfo,
    paths: Record<string, IJsonObject>,
    schemas: OpenApiSchemas,
    securitySchemes: Record<string, IJsonValue> | undefined,
  ): IOpenApiDocument {
    const document: IOpenApiDocument = {
      openapi: "3.1.0",
      info: {
        title: info.title,
        version: info.version,
        ...(info.description === undefined ? {} : { description: info.description }),
      },
      paths,
      components: {
        schemas: schemas.components(),
        ...(securitySchemes === undefined ? {} : { securitySchemes }),
      },
      "x-glacier-protocol":
        "HEAD implicitly executes GET and suppresses body bytes. OPTIONS implicitly returns 204 with Allow on known paths; neither is an operation or CORS support. Unknown paths return 404, unsupported methods on known paths return 405 with Allow. JSON and application/*+json input objects are accepted. Receive/size failures may close transport before a complete problem or request identity can be sent.",
      "x-glacier-schema-limits":
        "Bounded structural and wire checks, not complete OpenAPI meta-schema validation. Arbitrary refinements/transforms, overlapping oneOf alternatives, descriptor safety and JavaScript finite-number/identity behavior are not fully representable. Query deep serialization has tooling limitations.",
    };
    OpenApiJson.object(document);
    return document;
  }
}
