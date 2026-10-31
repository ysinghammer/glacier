import { SchemaError, SchemaDefinitionError } from "@glacier/schema";
import type { IJsonObject, IJsonValue } from "@glacier/schema";
import type { IHttpEndpointMetadata } from "../requestHandling/routing/types/IHttpEndpointMetadata.js";
import type { IHttpErrorMapping } from "../requestHandling/responses/types/IHttpErrorMapping.js";
import { OpenApiSchemas } from "./OpenApiSchemas.js";
import { OpenApiInputs } from "./OpenApiInputs.js";
import { OpenApiJson } from "./OpenApiJson.js";

const FRAMEWORK_FAILURES: Readonly<Record<string, string>> = {
  "400": "Bad Request",
  "408": "Request Timeout",
  "413": "Payload Too Large",
  "414": "URI Too Long",
  "415": "Unsupported Media Type",
  "417": "Expectation Failed",
  "431": "Request Header Fields Too Large",
  "500": "Internal Server Error",
};
const RESERVED_HEADERS = new Set([
  "content-type",
  "content-length",
  "x-request-id",
  "set-cookie",
  "www-authenticate",
  "allow",
  "connection",
  "transfer-encoding",
  "keep-alive",
  "upgrade",
  "trailer",
  "te",
]);

/** Documents successful declarations and safe framework/mapped Problem Details without overwriting shared statuses. */
export class OpenApiResponses {
  /** Registers framework components once per nonempty document and rejects consumer component name collisions. */
  public static prepare(schemas: OpenApiSchemas): void {
    schemas.add("GlacierInputIssueOutput", {
      type: "object",
      additionalProperties: false,
      required: ["location", "path", "code"],
      properties: {
        location: { type: "string", enum: ["body", "query", "params", "headers", "cookies"] },
        path: { type: "array", items: { anyOf: [{ type: "string" }, { type: "number" }] } },
        code: { type: "string" },
      },
    });
    schemas.add("GlacierProblemOutput", {
      type: "object",
      additionalProperties: false,
      required: ["type", "title", "status", "detail"],
      properties: {
        type: { type: "string", format: "uri" },
        title: { type: "string" },
        status: { type: "integer", minimum: 400, maximum: 599 },
        detail: { type: "string" },
        requestId: { type: "string" },
        issues: { type: "array", items: { $ref: "#/components/schemas/GlacierInputIssueOutput" } },
      },
    });
  }

  /** Applies scope precedence for identical/subclass errors and preserves all potentially selectable alternatives. */
  public static operation(
    endpoint: IHttpEndpointMetadata,
    schemas: OpenApiSchemas,
    globals: readonly IHttpErrorMapping[],
    hasAuthentication: boolean,
  ): IJsonObject {
    const responses: Record<string, IJsonValue> = {};
    for (const response of endpoint.responses) {
      const headerNames = new Set<string>();
      if (response.description !== undefined && typeof response.description !== "string")
        throw new TypeError("Invalid response description");
      const headers: Record<string, IJsonValue> = {
        "X-Request-Id": {
          required: true,
          schema: { type: "string" },
          description: "Server-generated request identity.",
        },
      };
      for (const [name, header] of Object.entries(response.headers ?? {})) {
        if (headerNames.has(name.toLowerCase()))
          throw new TypeError("Ambiguous response header documentation");
        headerNames.add(name.toLowerCase());
        if (RESERVED_HEADERS.has(name.toLowerCase()))
          throw new TypeError("Reserved response header documentation");
        if (!/^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/.test(name))
          throw new TypeError("Invalid response header documentation");
        OpenApiJson.object(header.schema);
        Object.defineProperty(headers, name, {
          value: OpenApiJson.object(header),
          enumerable: true,
        });
      }
      responses[String(response.status)] = {
        description:
          response.description ?? (response.status === 204 ? "No Content" : "Successful response"),
        headers,
        ...(response.status === 204
          ? {}
          : {
              content: {
                "application/json": {
                  schema:
                    response.isArray === true
                      ? { type: "array", items: schemas.reference(response.type, "output") }
                      : schemas.reference(response.type, "output"),
                  ...OpenApiInputs.examples(response),
                },
              },
            }),
      };
    }
    const alternatives = new Map<number, IJsonObject[]>();
    const titles = new Map<number, string[]>();
    for (const [status, title] of Object.entries(FRAMEWORK_FAILURES))
      OpenApiResponses.#problem(alternatives, titles, Number(status), title, "about:blank", title);
    if (hasAuthentication && !endpoint.isPublic)
      OpenApiResponses.#problem(
        alternatives,
        titles,
        401,
        "Unauthorized",
        "about:blank",
        "Unauthorized",
      );
    const earlier: IHttpErrorMapping[] = [];
    for (const scope of [
      endpoint.endpointErrorMappings,
      endpoint.controllerErrorMappings,
      globals,
    ]) {
      for (const mapping of scope) {
        if (
          mapping.error === SchemaError ||
          mapping.error === SchemaDefinitionError ||
          mapping.error.prototype instanceof SchemaError ||
          mapping.error.prototype instanceof SchemaDefinitionError
        )
          continue;
        if (earlier.some((prior) => OpenApiResponses.#inherits(mapping.error, prior.error)))
          continue;
        OpenApiResponses.#problem(
          alternatives,
          titles,
          mapping.status,
          mapping.title,
          mapping.type ?? "about:blank",
          mapping.detail ?? mapping.title,
        );
      }
      earlier.push(...scope);
    }
    for (const [status, variants] of alternatives) {
      responses[String(status)] = {
        description: [...new Set(titles.get(status))].join(" / "),
        headers: {
          "X-Request-Id": {
            schema: { type: "string" },
            description: "Present when transport normalization established a request identity.",
          },
          ...(status === 401 && hasAuthentication
            ? {
                "WWW-Authenticate": {
                  schema: { type: "string" },
                  description: "The server's configured static authentication challenge.",
                },
              }
            : {}),
        },
        content: {
          "application/problem+json": {
            schema: { anyOf: variants },
          },
        },
      };
    }
    return responses;
  }

  /** Walks class prototypes without invoking consumer Symbol.hasInstance callbacks or exception constructors. */
  static #inherits(child: IHttpErrorMapping["error"], parent: IHttpErrorMapping["error"]): boolean {
    let prototype: object | null = child.prototype;
    while (prototype !== null) {
      if (prototype === parent.prototype) return true;
      prototype = Object.getPrototypeOf(prototype);
    }
    return false;
  }

  /** Adds a static safe alternative; status collisions are represented as anyOf, never ambiguous oneOf. */
  static #problem(
    alternatives: Map<number, IJsonObject[]>,
    titles: Map<number, string[]>,
    status: number,
    title: string,
    type: string,
    detail: string,
  ): void {
    const variants = alternatives.get(status) ?? [];
    variants.push({
      allOf: [
        { $ref: "#/components/schemas/GlacierProblemOutput" },
        {
          properties: {
            status: { const: status },
            title: { const: title },
            type: { const: type },
            detail: { const: detail },
          },
        },
      ],
    });
    alternatives.set(status, variants);
    titles.set(status, [...(titles.get(status) ?? []), title]);
  }
}
