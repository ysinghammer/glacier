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

/**
 * Generates OpenAPI success and safe Problem Details response contracts.
 */
export class OpenApiResponses {
  /**
   * Adds the framework-owned validation issue and Problem Details schemas.
   * @param schemas Component registry receiving the framework schemas.
   * @returns No value; reserves the framework component names in the registry.
   */
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

  /**
   * Builds success and failure responses using endpoint, controller, then global mappings.
   * @param endpoint Prepared endpoint success and scoped error contracts.
   * @param schemas Component registry used for response body references.
   * @param globals Prepared application-wide error mappings.
   * @param hasAuthentication Whether protected routes may produce authentication failures.
   * @returns OpenAPI response map keyed by HTTP status code.
   */
  public static operation(
    endpoint: IHttpEndpointMetadata,
    schemas: OpenApiSchemas,
    globals: readonly IHttpErrorMapping[],
    hasAuthentication: boolean,
  ): IJsonObject {
    const responses = OpenApiResponses.successResponses(endpoint, schemas);
    const { alternatives, titles } = OpenApiResponses.failureAlternatives(
      endpoint,
      globals,
      hasAuthentication,
    );
    OpenApiResponses.renderFailures(responses, alternatives, titles, hasAuthentication);
    return responses;
  }

  /**
   * Converts every declared successful response into a status-keyed record.
   * @param endpoint Endpoint containing success response declarations.
   * @param schemas Component registry for response DTO references.
   * @returns Response objects keyed by their numeric status strings.
   */
  private static successResponses(
    endpoint: IHttpEndpointMetadata,
    schemas: OpenApiSchemas,
  ): Record<string, IJsonValue> {
    const responses: Record<string, IJsonValue> = {};
    for (const response of endpoint.responses)
      responses[String(response.status)] = OpenApiResponses.successResponse(response, schemas);
    return responses;
  }

  /**
   * Converts one success declaration to a bodyless or JSON response object.
   * @param response Explicit endpoint success contract.
   * @param schemas Component registry for JSON response DTO references.
   * @returns OpenAPI response object with documented headers and optional content.
   * @throws {TypeError} When the response description is not a string.
   */
  private static successResponse(
    response: IHttpEndpointMetadata["responses"][number],
    schemas: OpenApiSchemas,
  ): IJsonObject {
    if (response.description !== undefined && typeof response.description !== "string")
      throw new TypeError("Invalid response description");
    const headers = OpenApiResponses.headers(response.headers);
    if (response.status === 204)
      return {
        description: response.description ?? "No Content",
        headers,
      };
    return {
      description: response.description ?? "Successful response",
      headers,
      content: {
        "application/json": {
          schema: OpenApiResponses.responseSchema(response, schemas),
          ...OpenApiInputs.examples(response),
        },
      },
    };
  }

  /**
   * Adds the generated request ID header and validates documented response headers.
   * @param supplied Optional documented header contracts.
   * @returns Response header objects including the generated request identity.
   * @throws {TypeError} When supplied names collide after case normalization.
   */
  private static headers(
    supplied: IHttpEndpointMetadata["responses"][number]["headers"],
  ): Record<string, IJsonValue> {
    const names = new Set<string>();
    const headers: Record<string, IJsonValue> = {
      "X-Request-Id": {
        required: true,
        schema: { type: "string" },
        description: "Server-generated request identity.",
      },
    };
    for (const [name, header] of Object.entries(supplied ?? {})) {
      const normalizedName = name.toLowerCase();
      if (names.has(normalizedName)) throw new TypeError("Ambiguous response header documentation");
      names.add(normalizedName);
      OpenApiResponses.validateHeaderName(name, normalizedName);
      OpenApiJson.object(header.schema);
      Object.defineProperty(headers, name, { value: OpenApiJson.object(header), enumerable: true });
    }
    return headers;
  }

  /**
   * Rejects transport-owned names and names outside the HTTP field-token grammar.
   * @param name Original documented header name.
   * @param normalizedName Lower-case name used for reserved-name checks.
   * @returns No value; confirms the name can be documented as caller-owned.
   * @throws {TypeError} When the name is reserved or is not a valid token.
   */
  private static validateHeaderName(name: string, normalizedName: string): void {
    if (RESERVED_HEADERS.has(normalizedName))
      throw new TypeError("Reserved response header documentation");
    if (!/^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/.test(name))
      throw new TypeError("Invalid response header documentation");
  }

  /**
   * Creates the DTO component reference or array schema for a successful response.
   * @param response Non-204 success declaration with a DTO class identity.
   * @param schemas Component registry used to resolve directional references.
   * @returns DTO schema reference, optionally wrapped as an array schema.
   */
  private static responseSchema(
    response: Exclude<IHttpEndpointMetadata["responses"][number], { readonly status: 204 }>,
    schemas: OpenApiSchemas,
  ): IJsonValue {
    const reference = schemas.reference(response.type, "output");
    return response.isArray === true ? { type: "array", items: reference } : reference;
  }

  /**
   * Collects framework and precedence-selectable mapped error alternatives by status.
   * @param endpoint Endpoint-scoped and controller-scoped mappings and route visibility.
   * @param globals Prepared global error mappings.
   * @param hasAuthentication Whether protected routes can return an authentication problem.
   * @returns Alternatives and public titles grouped by status for response rendering.
   */
  private static failureAlternatives(
    endpoint: IHttpEndpointMetadata,
    globals: readonly IHttpErrorMapping[],
    hasAuthentication: boolean,
  ): {
    /** Safe response schema alternatives grouped by status. */
    readonly alternatives: Map<number, IJsonObject[]>;
    /** Public response titles grouped by status. */
    readonly titles: Map<number, string[]>;
  } {
    const alternatives = new Map<number, IJsonObject[]>();
    const titles = new Map<number, string[]>();
    for (const [status, title] of Object.entries(FRAMEWORK_FAILURES))
      OpenApiResponses.problem(alternatives, titles, Number(status), title, "about:blank", title);
    if (hasAuthentication && !endpoint.isPublic)
      OpenApiResponses.problem(
        alternatives,
        titles,
        401,
        "Unauthorized",
        "about:blank",
        "Unauthorized",
      );
    const earlier: IHttpErrorMapping[] = [];
    const scopes = [endpoint.endpointErrorMappings, endpoint.controllerErrorMappings, globals];
    for (const scope of scopes) {
      OpenApiResponses.appendMappings(alternatives, titles, scope, earlier);
      earlier.push(...scope);
    }
    return { alternatives, titles };
  }

  /**
   * Adds documentable mappings that are not shadowed by an earlier scope.
   * @param alternatives Problem schemas grouped by status to update.
   * @param titles Public titles grouped by status to update.
   * @param scope Current mappings at one precedence level.
   * @param earlier Higher-precedence mappings that can shadow this scope.
   * @returns No value; appends each potentially selectable mapping alternative.
   */
  private static appendMappings(
    alternatives: Map<number, IJsonObject[]>,
    titles: Map<number, string[]>,
    scope: readonly IHttpErrorMapping[],
    earlier: readonly IHttpErrorMapping[],
  ): void {
    for (const mapping of scope) {
      if (!OpenApiResponses.isDocumentable(mapping)) continue;
      if (earlier.some((prior) => OpenApiResponses.inherits(mapping.error, prior.error))) continue;
      OpenApiResponses.problem(
        alternatives,
        titles,
        mapping.status,
        mapping.title,
        mapping.type ?? "about:blank",
        mapping.detail ?? mapping.title,
      );
    }
  }

  /**
   * Excludes schema-library errors that are reserved for framework handling.
   * @param mapping Prepared error mapping to inspect.
   * @returns True when the mapped error can appear in generated API documentation.
   */
  private static isDocumentable(mapping: IHttpErrorMapping): boolean {
    return !(
      mapping.error === SchemaError ||
      mapping.error === SchemaDefinitionError ||
      mapping.error.prototype instanceof SchemaError ||
      mapping.error.prototype instanceof SchemaDefinitionError
    );
  }

  /**
   * Renders grouped safe failure alternatives into the status-keyed response map.
   * @param responses Existing success responses to extend with failure responses.
   * @param alternatives Safe Problem Details alternatives grouped by status.
   * @param titles Public descriptions grouped by status.
   * @param hasAuthentication Whether 401 responses include a challenge header contract.
   * @returns No value; mutates the local response record with failure responses.
   */
  private static renderFailures(
    responses: Record<string, IJsonValue>,
    alternatives: Map<number, IJsonObject[]>,
    titles: Map<number, string[]>,
    hasAuthentication: boolean,
  ): void {
    for (const [status, variants] of alternatives)
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

  /**
   * Tests whether one mapped error class inherits from another by prototype identity.
   * @param child Candidate more-specific error class.
   * @param parent Candidate base error class.
   * @returns True when the child prototype chain contains the parent prototype.
   */
  private static inherits(
    child: IHttpErrorMapping["error"],
    parent: IHttpErrorMapping["error"],
  ): boolean {
    let prototype: object | null = child.prototype;
    while (prototype !== null) {
      if (prototype === parent.prototype) return true;
      prototype = Object.getPrototypeOf(prototype);
    }
    return false;
  }

  /**
   * Adds one static Problem Details alternative and title for its status.
   * @param alternatives Schemas grouped by status to update.
   * @param titles Titles grouped by status to update.
   * @param status HTTP status represented by the alternative.
   * @param title Static public title.
   * @param type Static Problem Details type URI.
   * @param detail Static public detail text.
   * @returns No value; appends the alternative and its title to the local groups.
   */
  private static problem(
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
