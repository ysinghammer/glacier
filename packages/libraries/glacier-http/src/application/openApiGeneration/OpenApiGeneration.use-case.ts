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

interface IValidatedOpenApiInfo {
  readonly title: string;
  readonly version: string;
  readonly description?: string;
}

/** Generates OpenAPI from curated request-handling contracts, with no instances, listeners, network or file/UI side effects. */
export class OpenApiGeneration {
  /** Consumes prepared source data and rejects known wire/document contradictions rather than weakening documentation. */
  public static generate(options: IOpenApiGenerationOptions): IOpenApiDocument {
    const info = OpenApiGeneration.#info(options.info);
    const authentication = OpenApiGeneration.#security(options.authentication);
    const endpoints = OpenApiGeneration.#endpoints(
      options.controllers,
      authentication !== undefined,
    );
    const schemas = OpenApiGeneration.#schemas(endpoints);
    const paths = OpenApiGeneration.#paths(
      endpoints,
      schemas,
      options.errorMappings,
      authentication?.schemeName,
    );
    return OpenApiGeneration.#document(info, paths, schemas, authentication?.schemes);
  }

  static #info(value: unknown): IValidatedOpenApiInfo {
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

  static #security(
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

  static #endpoints(
    controllers: readonly IConstructableClass<object>[],
    hasAuthentication: boolean,
  ): IHttpEndpointMetadata[] {
    const endpoints: IHttpEndpointMetadata[] = [];
    const routes = new Set<string>();
    const templates = new Map<string, string>();
    for (const controller of controllers)
      for (const endpoint of HttpEndpointMetadata.read(controller))
        OpenApiGeneration.#appendEndpoint(
          endpoints,
          routes,
          templates,
          endpoint,
          hasAuthentication,
        );
    return endpoints;
  }

  static #appendEndpoint(
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

  static #schemas(endpoints: readonly IHttpEndpointMetadata[]): OpenApiSchemas {
    const input: IConstructableClass<object>[] = [];
    const output: IConstructableClass<object>[] = [];
    for (const endpoint of endpoints) {
      OpenApiGeneration.#addInputSchemas(endpoint, input);
      OpenApiGeneration.#addOutputSchemas(endpoint, output);
    }
    const schemas = new OpenApiSchemas(input, output);
    if (endpoints.length > 0) OpenApiResponses.prepare(schemas);
    return schemas;
  }

  static #addInputSchemas(
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

  static #addOutputSchemas(
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

  static #paths(
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
      const operation = OpenApiGeneration.#operation(endpoint, schemas, globals, schemeName, ids);
      const path = endpoint.template.replace(/:([^/]+)/g, "{$1}");
      paths[path] = { ...paths[path], [endpoint.method.toLowerCase()]: operation };
    }
    return paths;
  }

  static #operation(
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
    OpenApiGeneration.#validateOperation(route, operationId, ids);
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

  static #validateOperation(route: IJsonObject, operationId: unknown, ids: Set<string>): void {
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

  static #document(
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
