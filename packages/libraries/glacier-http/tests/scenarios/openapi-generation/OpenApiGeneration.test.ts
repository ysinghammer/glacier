import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import {
  Default,
  Describe,
  IsArray,
  IsBoolean,
  IsInt,
  IsObject,
  IsString,
  IsLiteral,
  IsUnion,
  IsTuple,
  Nullable,
  Optional,
  Rename,
} from "@glacier/schema";
import {
  ApiBody,
  ApiController,
  ApiCookie,
  ApiCookies,
  ApiGet,
  ApiHeader,
  ApiHeaders,
  ApiParam,
  ApiParams,
  ApiPost,
  ApiQuery,
  ApiRequest,
  ApiResponse,
  HttpRequest,
  HttpResponse,
  OpenApi,
  HttpServer,
} from "../../../index.js";
import { OpenApiEvidence } from "../../data/OpenApiEvidence.js";

const INFO = { title: "Example API", version: "1.0", description: "Metadata contracts" };

describe("OpenAPI generation", () => {
  it("agrees with real body/query parsing, tuple and singleton-array wire grammar, output renaming and redacted failures", async () => {
    class Dto {
      @IsString() @Rename("display_name") public name!: string;
    }
    class Filter {
      @IsBoolean() public active!: boolean;
    }
    class Query {
      @IsArray(String) public tags!: string[];
      @IsTuple([String, Number]) public tuple!: [string, number];
      @IsObject(Filter) public filter!: Filter;
    }
    @ApiController("/agreement")
    class Controller {
      @ApiPost("/")
      @ApiResponse({ status: 200, type: Dto })
      public post(@ApiBody(Dto) body: Dto, @ApiQuery(Query) query: Query): HttpResponse<Dto> {
        return HttpResponse.json({
          name: `${body.name}:${query.tags.join(",")}:${query.tuple.join("/")}:${String(query.filter.active)}`,
        });
      }
    }
    const diagnostics: Error[] = [];
    const server = HttpServer.create({
      controllers: [new Controller()],
      onError: (error) => {
        diagnostics.push(error);
      },
    });
    try {
      const document = OpenApi.generate({ server, info: INFO });
      expect(document.components.schemas).toMatchObject({
        QueryInput: {
          properties: {
            tuple: {
              type: "array",
              prefixItems: [{ type: "string" }, { type: "number" }],
              minItems: 2,
              maxItems: 2,
              items: false,
            },
          },
        },
        DtoOutput: { properties: { display_name: { type: "string" } } },
      });
      OpenApiEvidence.references(document);
      await server.listen({ host: "127.0.0.1", port: 0 });
      const address = server.address();
      if (address === undefined) throw new Error("Missing test listener");
      const base = `http://127.0.0.1:${address.port}/agreement`;
      const response = await fetch(`${base}?tags=node&tuple=hello&tuple=2&filter[active]=true`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ display_name: "Ada", ignored: "stripped" }),
      });
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ display_name: "Ada:node:hello/2:true" });
      const invalid = await fetch(
        `${base}?tags=node&tuple=hello&tuple=secret&filter[active]=true`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ display_name: "Ada" }),
        },
      );
      expect(invalid.status).toBe(400);
      const problem: unknown = await invalid.json();
      expect(problem).toMatchObject({
        status: 400,
        issues: [{ location: "query", path: ["tuple", 1], code: "invalid_type" }],
      });
      expect(JSON.stringify(problem)).not.toContain("secret");
      expect(diagnostics).toEqual([]);
    } finally {
      await server.close();
    }
  });
  it("generates from genuine compiled decorators without constructors, value callbacks or listeners", () => {
    const result = spawnSync(process.execPath, ["tests/artifacts/compiler/CompiledOpenApi.js"], {
      cwd: new URL("../../..", import.meta.url),
      encoding: "utf8",
      timeout: 5000,
    });
    expect(result.error).toBeUndefined();
    expect(result.status).toBe(0);
    const evidence: unknown = JSON.parse(result.stdout);
    expect(evidence).toMatchObject({
      constructors: 0,
      valueCallbacks: 0,
      document: {
        openapi: "3.1.0",
        paths: { "/compiled-openapi/value": { post: { summary: "Compiled metadata" } } },
      },
    });
  });

  it("documents directional body, repeated arrays, deepObject, normalized scalar binders and multiple successful response forms", () => {
    /** Shared request/response schema has distinct requiredness and renamed wire fields. */
    @Describe({ name: "Wire/Dto~name" })
    class Dto {
      @IsString() @Rename("display_name") @Default("default") public name!: string;
      @IsString() @Optional() public optional?: string;
      @IsString() @Nullable() public nullable!: string | null;
    }
    /** Nested filter is representable but deeper serialization has tooling limits. */
    class Filter {
      @IsBoolean() public active!: boolean;
    }
    /** Query DTO binds repeated scalar arrays and nested bracket notation. */
    class Query {
      @IsArray(String) public tags!: string[];
      @IsObject(Filter) @Optional() public filter?: Filter;
      @IsInt() @Optional() public page?: number;
    }
    /** Path DTO uses the route's actual named segment. */
    class Params {
      @IsInt() public id!: number;
    }
    /** Normalized header contract. */
    class Headers {
      @IsString() @Rename("x-client") public client!: string;
    }
    /** Structured cookie contract. */
    class Cookies {
      @IsString() @Optional() public session?: string;
    }
    /** Classes can require services unavailable to generation. */
    @ApiController("/users", { tags: ["users"] })
    class Controller {
      /** Application-owned dependency must not be constructed. */
      public constructor(public readonly service: string) {
        throw new Error("Unavailable");
      }
      /** Every binder is explicit; docs come from the runtime decorators. */
      @ApiPost("/:id", {
        summary: "Create",
        description: "Described",
        operationId: "createUser",
        deprecated: false,
        tags: ["write"],
      })
      @ApiResponse({
        status: 200,
        type: Dto,
        description: "One",
        examples: { one: { display_name: "Ada", nullable: null } },
        headers: {
          "X-Custom": {
            schema: { type: "string" },
            description: "Custom",
            example: "yes",
            required: true,
          },
        },
      })
      @ApiResponse({ status: 201, type: Dto, isArray: true })
      @ApiResponse({ status: 204, description: "Empty" })
      public create(
        @ApiBody(Dto, {
          description: "Payload",
          examples: { request: { display_name: "Ada", nullable: null } },
        })
        body: Dto,
        @ApiQuery(Query, { description: "Filters" }) query: Query,
        @ApiParams(Params, { description: "Identifier" }) params: Params,
        @ApiHeaders(Headers) headers: Headers,
        @ApiCookies(Cookies) cookies: Cookies,
        @ApiRequest() request: HttpRequest,
      ): HttpResponse<Dto> {
        void query;
        void params;
        void headers;
        void cookies;
        void request;
        return HttpResponse.json(body);
      }
      /** Named binders describe raw strings, not schema-inferred values. */
      @ApiGet("/raw/:name")
      @ApiResponse({ status: 204 })
      public raw(
        @ApiParam("name", { description: "Raw", examples: { raw: "Ada" } }) name: string,
        @ApiHeader("X-Raw", { description: "Raw header" }) header: string | undefined,
        @ApiCookie("raw", { description: "Raw cookie" }) cookie: string | undefined,
      ): void {
        void name;
        void header;
        void cookie;
      }
    }
    const document = OpenApi.generate({ controllers: [Controller], info: INFO });
    expect(document.info).toEqual(INFO);
    expect(document.paths["/users/{id}"]).toMatchObject({
      post: {
        operationId: "createUser",
        tags: ["write"],
        deprecated: false,
        requestBody: {
          required: true,
          description: "Payload",
          content: {
            "application/json": {
              examples: { request: { value: { display_name: "Ada", nullable: null } } },
            },
          },
        },
        parameters: [
          {
            name: "tags",
            in: "query",
            required: true,
            style: "form",
            explode: true,
            schema: { type: "array", items: { type: "string" } },
          },
          {
            name: "filter",
            in: "query",
            required: false,
            style: "deepObject",
            explode: true,
            "x-glacier-serialization": expect.stringContaining("not uniformly supported"),
          },
          { name: "page", in: "query", required: false },
          { name: "id", in: "path", required: true, schema: { type: "integer" } },
          { name: "x-client", in: "header" },
          { name: "session", in: "cookie", required: false },
        ],
        responses: {
          "200": { description: "One", headers: { "X-Custom": { example: "yes" } } },
          "201": { content: { "application/json": { schema: { type: "array" } } } },
          "204": { description: "Empty" },
        },
      },
    });
    expect(document.paths["/users/raw/{name}"]).toMatchObject({
      get: {
        operationId: "Controller.raw",
        tags: ["users"],
        parameters: [
          { name: "name", in: "path", required: true, examples: { raw: { value: "Ada" } } },
          { name: "x-raw", in: "header", required: false },
          { name: "raw", in: "cookie", required: false },
        ],
      },
    });
    expect(document.components.schemas).toMatchObject({
      "Wire/Dto~nameInput": { required: ["nullable"] },
      "Wire/Dto~nameOutput": {
        required: ["display_name", "nullable"],
        additionalProperties: false,
      },
    });
    expect(JSON.parse(JSON.stringify(document))).toEqual(document);
    OpenApiEvidence.references(document);
  });

  it("resolves cyclic and discriminated-union references with escaped stable directional names", () => {
    /** Recursive field references never expand indefinitely. */
    @Describe({ name: "Tree/~ ü" })
    class Tree {
      @IsString() public name!: string;
      @IsObject(() => Tree) @Optional() public next?: Tree;
    }
    /** Union variant preserves a declared discriminator. */
    class Variant {
      @IsLiteral("variant") public kind!: "variant";
      @IsObject(Tree) public tree!: Tree;
    }
    /** Class union is generated without instance construction. */
    @IsUnion({ discriminator: "kind", variants: { variant: Variant } })
    class Union {}
    @ApiController("/cycles")
    class Controller {
      @ApiGet("/") @ApiResponse({ status: 200, type: Union }) public get(): void {}
    }
    const document = OpenApi.generate({ controllers: [Controller], info: INFO });
    OpenApiEvidence.references(document);
    expect(document.components.schemas).toMatchObject({
      UnionOutput: {
        discriminator: { mapping: { variant: "#/components/schemas/VariantOutput" } },
      },
      "Tree/~ üOutput": {
        properties: { next: { $ref: "#/components/schemas/Tree~1~0%20%C3%BCOutput" } },
      },
    });
    expect(OpenApi.generate({ controllers: [Controller], info: INFO })).toEqual(document);
  });

  it("generates implicit path strings and metadata-only empty documents without HEAD or OPTIONS operations", () => {
    @ApiController("/implicit")
    class Controller {
      @ApiGet("/:id") @ApiResponse({ status: 204 }) public get(): void {}
    }
    const document = OpenApi.generate({ controllers: [Controller], info: INFO });
    expect(document.paths["/implicit/{id}"]).toMatchObject({
      get: {
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
        responses: { "204": { description: "No Content" } },
      },
    });
    expect(document.paths["/implicit/{id}"]).not.toHaveProperty("head");
    expect(document.paths["/implicit/{id}"]).not.toHaveProperty("options");
    expect(OpenApi.generate({ controllers: [], info: INFO })).toMatchObject({
      paths: {},
      components: { schemas: {} },
    });
  });
});
