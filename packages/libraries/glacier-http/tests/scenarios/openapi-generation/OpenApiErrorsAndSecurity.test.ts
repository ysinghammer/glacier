import { describe, expect, it } from "vitest";
import { SchemaError, SchemaDefinitionError } from "@glacier/schema";
import {
  ApiController,
  ApiGet,
  ApiMapError,
  ApiPublic,
  ApiResponse,
  ApiUserId,
  HttpServer,
  OpenApi,
} from "../../../index.js";
import { OpenApiEvidence } from "../../data/OpenApiEvidence.js";

const INFO = { title: "Secured", version: "1" };
const AUTHENTICATION = {
  schemeName: "oidc",
  scheme: {
    type: "openIdConnect",
    openIdConnectUrl: "https://identity.example.com/.well-known/openid-configuration",
    description: "External identity",
  },
} as const;

describe("OpenAPI errors and security", () => {
  it("matches real registered authentication and public routes before listen, while listening and after close without calling the hook", async () => {
    let calls = 0;
    @ApiController("/security")
    /** Declares protected and public routes for authentication documentation checks. */
    class Controller {
      /**
       * Declares a protected empty route requiring an authenticated user id.
       * @param userId Authenticated user identifier supplied by the binder.
       * @returns No value; exercises protected route metadata and transport behavior.
       */
      @ApiGet("/protected") @ApiResponse({ status: 204 }) public protected(
        @ApiUserId() userId: string,
      ): void {
        void userId;
      }
      /**
       * Declares an empty route that bypasses authentication.
       * @returns No value; exercises public route metadata and transport behavior.
       */
      @ApiGet("/public") @ApiPublic() @ApiResponse({ status: 204 }) public public(): void {}
    }
    const server = HttpServer.create({
      controllers: [new Controller()],
      authentication: {
        authenticate: () => {
          calls++;
          return undefined;
        },
        challenge: { scheme: "Bearer", realm: "api" },
      },
      onError: () => {},
    });
    const document = OpenApi.generate({ server, info: INFO, authentication: AUTHENTICATION });
    expect(server.address()).toBeUndefined();
    expect(calls).toBe(0);
    expect(document.components).toMatchObject({ securitySchemes: { oidc: AUTHENTICATION.scheme } });
    expect(document.paths["/security/protected"]).toMatchObject({
      get: {
        security: [{ oidc: [] }],
        responses: {
          "401": {
            headers: { "WWW-Authenticate": { schema: { type: "string" } } },
            content: {
              "application/problem+json": {
                schema: {
                  anyOf: [
                    {
                      allOf: [
                        { $ref: "#/components/schemas/GlacierProblemOutput" },
                        { properties: { title: { const: "Unauthorized" } } },
                      ],
                    },
                  ],
                },
              },
            },
          },
        },
      },
    });
    expect(document.paths["/security/public"]).not.toHaveProperty("get.security");
    expect(document.paths["/security/public"]).not.toHaveProperty("get.responses.401");
    expect(() => OpenApi.generate({ server, info: INFO })).toThrow("authentication disagrees");
    expect(() => OpenApi.generate({ controllers: [Controller], info: INFO })).toThrow(
      "UserId requires",
    );
    try {
      await server.listen({ host: "127.0.0.1", port: 0 });
      const address = server.address();
      if (address === undefined) throw new Error("Missing test listener");
      expect(OpenApi.generate({ server, info: INFO, authentication: AUTHENTICATION })).toEqual(
        document,
      );
      expect(calls).toBe(0);
      const publicResponse = await fetch(`http://127.0.0.1:${address.port}/security/public`);
      expect(publicResponse.status).toBe(204);
      expect(calls).toBe(0);
      const protectedResponse = await fetch(`http://127.0.0.1:${address.port}/security/protected`);
      expect(protectedResponse.status).toBe(401);
      expect(protectedResponse.headers.get("www-authenticate")).toBe('Bearer realm="api"');
      expect(await protectedResponse.json()).toMatchObject({
        type: "about:blank",
        title: "Unauthorized",
        status: 401,
        detail: "Unauthorized",
      });
      expect(calls).toBe(1);
    } finally {
      await server.close();
    }
    expect(OpenApi.generate({ server, info: INFO, authentication: AUTHENTICATION })).toEqual(
      document,
    );
    OpenApiEvidence.references(document);
  });

  it("rejects authentication added to an unprotected server and permits explicit class-only documentation including special JSON scheme names", async () => {
    @ApiController("/plain")
    /** Declares one unprotected empty route for authentication mismatch checks. */
    class Controller {
      /**
       * Declares an empty route without authentication metadata.
       * @returns No value; used for documentation and live route checks.
       */
      @ApiGet("/") @ApiResponse({ status: 204 }) public get(): void {}
    }
    const server = HttpServer.create({ controllers: [new Controller()], onError: () => {} });
    try {
      expect(() =>
        OpenApi.generate({ server, info: INFO, authentication: AUTHENTICATION }),
      ).toThrow("authentication disagrees");
      expect(OpenApi.generate({ server, info: INFO }).components).not.toHaveProperty(
        "securitySchemes",
      );
      const document = OpenApi.generate({
        controllers: [Controller],
        info: INFO,
        authentication: { ...AUTHENTICATION, schemeName: "__proto__" },
      });
      expect(JSON.stringify(document.components)).toContain('"__proto__":');
      expect(document.paths["/plain"]).toMatchObject({
        get: { security: [{ ["__proto__"]: [] }] },
      });
    } finally {
      await server.close();
    }
  });

  it("preserves framework and same-status mapped alternatives while honoring endpoint/controller/global class precedence", async () => {
    /** Endpoint-level application failure identity for mapping precedence checks. */
    class EndpointError extends Error {}
    /** Controller-level application failure identity. */
    class ControllerError extends Error {}
    /** Globally mapped application failure identity. */
    class GlobalError extends Error {}
    /** Separate global failure sharing a status code with another mapping. */
    class OtherError extends Error {}
    /** Framework schema failure subtype that must remain unmapped as business error. */
    class SchemaChild extends SchemaError {}
    /** Framework schema-definition subtype that must remain unmapped as business error. */
    class DefinitionChild extends SchemaDefinitionError {}
    @ApiController("/errors")
    @ApiMapError(EndpointError, { status: 403, title: "Shadowed controller" })
    @ApiMapError(ControllerError, { status: 404, title: "Controller rejection" })
    @ApiMapError(SchemaError, { status: 499, title: "Cannot override schema" })
    @ApiMapError(SchemaDefinitionError, { status: 498, title: "Cannot override definition" })
    @ApiMapError(SchemaChild, { status: 497, title: "Cannot override schema child" })
    @ApiMapError(DefinitionChild, { status: 496, title: "Cannot override definition child" })
    /** Maps an endpoint error while retaining controller/global mapping precedence. */
    class Controller {
      /**
       * Throws the endpoint error used to generate a mapped problem alternative.
       * @returns No value; invocation always throws the endpoint failure.
       * @throws {EndpointError} Always, with a private message excluded from output.
       */
      @ApiGet("/")
      @ApiResponse({ status: 204 })
      @ApiMapError(EndpointError, {
        status: 409,
        title: "Endpoint rejection",
        type: "urn:problem:endpoint",
        detail: "Static safe detail",
      })
      public get(): void {
        throw new EndpointError("secret");
      }
    }
    const server = HttpServer.create({
      controllers: [new Controller()],
      errorMappings: [
        { error: EndpointError, status: 502, title: "Shadowed global" },
        { error: ControllerError, status: 503, title: "Shadowed global controller" },
        { error: GlobalError, status: 500, title: "Global failure" },
        { error: OtherError, status: 500, title: "Other failure" },
      ],
      onError: () => {},
    });
    try {
      const document = OpenApi.generate({ server, info: INFO });
      expect(document.paths["/errors"]).toMatchObject({
        get: {
          responses: {
            "409": {
              content: {
                "application/problem+json": {
                  schema: {
                    anyOf: [
                      {
                        allOf: [
                          { $ref: "#/components/schemas/GlacierProblemOutput" },
                          {
                            properties: {
                              status: { const: 409 },
                              type: { const: "urn:problem:endpoint" },
                              title: { const: "Endpoint rejection" },
                              detail: { const: "Static safe detail" },
                            },
                          },
                        ],
                      },
                    ],
                  },
                },
              },
            },
            "404": { description: "Controller rejection" },
            "500": { description: "Internal Server Error / Global failure / Other failure" },
          },
        },
      });
      for (const status of ["403", "502", "503", "499", "498", "497", "496"])
        expect(document.paths["/errors"]).not.toHaveProperty(`get.responses.${status}`);
      expect(document.components.schemas).toMatchObject({
        GlacierInputIssueOutput: {
          additionalProperties: false,
          required: ["location", "path", "code"],
        },
        GlacierProblemOutput: {
          additionalProperties: false,
          required: ["type", "title", "status", "detail"],
        },
      });
      expect(JSON.stringify(document)).not.toContain("secret");
      OpenApiEvidence.references(document);
      await server.listen({ host: "127.0.0.1", port: 0 });
      const address = server.address();
      if (address === undefined) throw new Error("Missing test listener");
      const response = await fetch(`http://127.0.0.1:${address.port}/errors`);
      expect(response.status).toBe(409);
      expect(await response.json()).toMatchObject({
        type: "urn:problem:endpoint",
        title: "Endpoint rejection",
        detail: "Static safe detail",
      });
    } finally {
      await server.close();
    }
  });

  it("does not advertise a lower-scope subclass mapping shadowed by an earlier base-class rule", () => {
    let hasInstanceCalls = 0;
    /** Base error identity selected by the controller mapping scope. */
    class Base extends Error {}
    /** Child error identity whose global mapping is shadowed. */
    class Child extends Base {}
    Object.defineProperty(Base, Symbol.hasInstance, {
      value: () => {
        hasInstanceCalls++;
        throw new Error("Must not invoke class hooks");
      },
    });
    @ApiController("/precedence")
    @ApiMapError(Base, { status: 400, title: "Base rejection" })
    @ApiMapError(Child, { status: 422, title: "Same-scope child rejection" })
    /** Exposes error mapping metadata without invoking class identity hooks. */
    class Controller {
      /**
       * Declares the empty endpoint whose error alternatives are inspected.
       * @returns No value; this handler is not invoked by generation.
       */
      @ApiGet("/") @ApiResponse({ status: 204 }) public get(): void {}
    }
    const server = HttpServer.create({
      controllers: [new Controller()],
      errorMappings: [{ error: Child, status: 409, title: "Shadowed" }],
      onError: () => {},
    });
    expect(OpenApi.generate({ server, info: INFO }).paths["/precedence"]).toMatchObject({
      get: {
        responses: {
          "400": { description: "Bad Request / Base rejection" },
          "422": { description: "Same-scope child rejection" },
        },
      },
    });
    expect(OpenApi.generate({ server, info: INFO }).paths["/precedence"]).not.toHaveProperty(
      "get.responses.409",
    );
    expect(hasInstanceCalls).toBe(0);
    return server.close();
  });
});
