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

/** Generates OpenAPI from curated request-handling contracts, with no instances, listeners, network or file/UI side effects. */
export class OpenApiGeneration {
  /** Consumes prepared source data and rejects known wire/document contradictions rather than weakening documentation. */
  public static generate(options: IOpenApiGenerationOptions): IOpenApiDocument {
    const info = OpenApiJson.object(options.info);
    if (
      typeof info.title !== "string" ||
      info.title.trim() === "" ||
      typeof info.version !== "string" ||
      info.version.trim() === "" ||
      (info.description !== undefined && typeof info.description !== "string")
    )
      throw new TypeError("Invalid API info");
    const controllers = options.controllers;
    const globals = options.errorMappings;
    const hasAuthentication = options.authentication !== undefined;
    const securitySchemes: Record<string, IJsonValue> = {};
    if (options.authentication !== undefined) {
      const authentication = OpenApiJson.object(options.authentication);
      const scheme = OpenApiJson.object(authentication.scheme);
      if (
        typeof authentication.schemeName !== "string" ||
        authentication.schemeName.trim() === "" ||
        scheme.type !== "openIdConnect" ||
        typeof scheme.openIdConnectUrl !== "string" ||
        (scheme.description !== undefined && typeof scheme.description !== "string")
      )
        throw new TypeError("Invalid OpenAPI authentication");
      const url = new URL(scheme.openIdConnectUrl);
      if (url.protocol !== "https:" && url.protocol !== "http:")
        throw new TypeError("OIDC discovery must be an absolute HTTP URL");
      Object.defineProperty(securitySchemes, authentication.schemeName, {
        value: scheme,
        enumerable: true,
      });
    }
    const endpoints: IHttpEndpointMetadata[] = [];
    const routes = new Set<string>();
    const templates = new Map<string, string>();
    for (const controller of controllers) {
      for (const endpoint of HttpEndpointMetadata.read(controller)) {
        if (
          endpoint.controllerOptions.exclude !== undefined &&
          typeof endpoint.controllerOptions.exclude !== "boolean"
        )
          throw new TypeError("Invalid controller exclusion");
        const pathSignature = endpoint.template.replace(/:[^/]+/g, ":");
        const signature = `${endpoint.method}:${pathSignature}`;
        if (routes.has(signature)) throw new TypeError("Ambiguous route metadata");
        routes.add(signature);
        if (
          !hasAuthentication &&
          endpoint.bindings.some((binding) => binding.location === "userId")
        )
          throw new TypeError("UserId requires documented authentication");
        if (endpoint.controllerOptions.exclude !== true && endpoint.routeOptions.exclude !== true) {
          const previous = templates.get(pathSignature);
          if (previous !== undefined && previous !== endpoint.template)
            throw new TypeError("Inconsistent path parameter names across methods");
          templates.set(pathSignature, endpoint.template);
          endpoints.push(endpoint);
        }
      }
    }
    const input: IConstructableClass<object>[] = [];
    const output: IConstructableClass<object>[] = [];
    for (const endpoint of endpoints) {
      for (const binding of endpoint.bindings) {
        if (!("dto" in binding)) continue;
        Schema.assertJsonSchemaCompatibility(binding.dto, {
          direction: "input",
          wire: binding.location === "body" ? "json" : "text",
          coerce: binding.location !== "body",
        });
        input.push(binding.dto);
      }
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
    const schemas = new OpenApiSchemas(input, output);
    if (endpoints.length > 0) OpenApiResponses.prepare(schemas);
    const paths: Record<string, IJsonObject> = {};
    const ids = new Set<string>();
    for (const endpoint of endpoints.sort((left, right) =>
      `${left.template}:${left.method}`.localeCompare(`${right.template}:${right.method}`),
    )) {
      const route = OpenApiJson.object(endpoint.routeOptions);
      const controller = OpenApiJson.object(endpoint.controllerOptions);
      const operationId =
        route.operationId === undefined
          ? `${endpoint.controllerName}.${endpoint.handlerName}`
          : route.operationId;
      if (typeof operationId !== "string" || operationId.trim() === "" || ids.has(operationId))
        throw new TypeError("Invalid or duplicate operationId");
      ids.add(operationId);
      for (const key of ["summary", "description"])
        if (route[key] !== undefined && typeof route[key] !== "string")
          throw new TypeError("Invalid operation description");
      for (const key of ["deprecated", "exclude"])
        if (route[key] !== undefined && typeof route[key] !== "boolean")
          throw new TypeError("Invalid operation flag");
      const tags = route.tags ?? controller.tags;
      if (
        tags !== undefined &&
        (!Array.isArray(tags) || tags.some((tag) => typeof tag !== "string"))
      )
        throw new TypeError("Invalid operation tags");
      const operation: IJsonObject = {
        operationId,
        ...(route.summary === undefined ? {} : { summary: route.summary }),
        ...(route.description === undefined ? {} : { description: route.description }),
        ...(route.deprecated === undefined ? {} : { deprecated: route.deprecated }),
        ...(tags === undefined ? {} : { tags }),
        ...OpenApiInputs.operation(endpoint, schemas),
        responses: OpenApiResponses.operation(endpoint, schemas, globals, hasAuthentication),
        ...(hasAuthentication && !endpoint.isPublic
          ? { security: [{ [String(options.authentication?.schemeName)]: [] }] }
          : {}),
      };
      const path = endpoint.template.replace(/:([^/]+)/g, "{$1}");
      paths[path] = { ...paths[path], [endpoint.method.toLowerCase()]: operation };
    }
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
        ...(hasAuthentication ? { securitySchemes } : {}),
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
