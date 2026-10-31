import { describe, expect, it } from "vitest";
import {
  Describe,
  IsArray,
  IsDate,
  IsObject,
  IsString,
  IsTuple,
  IsUnion,
  IsLiteral,
  IsRecord,
  IsOneOf,
  Nullable,
  Optional,
  JsonSchema,
} from "@glacier/schema";
import {
  ApiBody,
  ApiController,
  ApiGet,
  ApiHeader,
  ApiHeaders,
  ApiParam,
  ApiParams,
  ApiPost,
  ApiQuery,
  ApiResponse,
  HttpServer,
  OpenApi,
} from "../../../index.js";
import type {
  IApiRouteOptions,
  IOpenApiOptions,
  IApiControllerOptions,
  IApiResponseOptions,
  IApiBodyOptions,
} from "../../../index.js";
import { OpenApiEvidence } from "../../data/OpenApiEvidence.js";

const INFO = { title: "Consistency", version: "1" };

/** Test-owned factory uses only public decorator injection points for untyped JavaScript boundary cases. */
class ConfigurationCases {
  /** Returns a fresh fully decorated controller without constructing it. */
  public static controller(
    route: IApiRouteOptions = {},
    controller: IApiControllerOptions = {},
    response: IApiResponseOptions = { status: 204 },
  ): new () => object {
    @ApiController("/case", controller)
    class Controller {
      @ApiGet("/", route) @ApiResponse(response) public get(): void {}
    }
    return Controller;
  }
}

describe("OpenAPI consistency", () => {
  it("rejects both/neither/undefined sources, nonclasses and malformed info at the public boundary", () => {
    const Controller = ConfigurationCases.controller();
    const malformed: readonly unknown[] = [
      null,
      {},
      { info: INFO },
      { info: INFO, controllers: [], server: undefined },
      { info: INFO, controllers: undefined },
      { info: INFO, server: undefined },
      { info: INFO, server: null },
      {
        info: INFO,
        server: { registration: { controllers: [], errorMappings: [], hasAuthentication: false } },
      },
      { info: INFO, controllers: [new Controller()] },
      { info: INFO, controllers: null },
      { info: {}, controllers: [] },
      { info: { title: "", version: "1" }, controllers: [] },
      { info: { title: "x", version: "" }, controllers: [] },
      { info: { title: 1, version: "1" }, controllers: [] },
      { info: { title: "x", version: 1 }, controllers: [] },
      { info: { ...INFO, description: 1 }, controllers: [] },
    ];
    for (const options of malformed) {
      // Explicit untyped-consumer misuse, not an assertion used by implementation.
      expect(() => OpenApi.generate(options as IOpenApiOptions)).toThrow(TypeError);
    }
  });

  it("validates one bounded OIDC scheme and its descriptive fields without network access", () => {
    for (const authentication of [
      {},
      {
        schemeName: "",
        scheme: { type: "openIdConnect", openIdConnectUrl: "https://example.com" },
      },
      { schemeName: 1, scheme: {} },
      { schemeName: "oidc", scheme: { type: "apiKey", openIdConnectUrl: "https://example.com" } },
      { schemeName: "oidc", scheme: { type: "openIdConnect", openIdConnectUrl: 1 } },
      { schemeName: "oidc", scheme: { type: "openIdConnect", openIdConnectUrl: "/relative" } },
      { schemeName: "oidc", scheme: { type: "openIdConnect", openIdConnectUrl: "urn:oidc:test" } },
      {
        schemeName: "oidc",
        scheme: { type: "openIdConnect", openIdConnectUrl: "https://example.com", description: 1 },
      },
    ]) {
      // Untrusted runtime configurations must not bypass the bounded public type contract.
      expect(() =>
        OpenApi.generate({ controllers: [], info: INFO, authentication } as IOpenApiOptions),
      ).toThrow(TypeError);
    }
    expect(
      OpenApi.generate({
        controllers: [],
        info: INFO,
        authentication: {
          schemeName: "oidc",
          scheme: { type: "openIdConnect", openIdConnectUrl: "http://127.0.0.1:1/no-network" },
        },
      }).components,
    ).toMatchObject({ securitySchemes: { oidc: { type: "openIdConnect" } } });
  });

  it("rejects duplicate operation IDs, equivalent routes and incomplete inherited overrides", () => {
    @ApiController("/duplicate")
    class Controller {
      @ApiGet("/one", { operationId: "same" }) @ApiResponse({ status: 204 }) public one(): void {}
      @ApiGet("/two", { operationId: "same" }) @ApiResponse({ status: 204 }) public two(): void {}
    }
    expect(() => OpenApi.generate({ controllers: [Controller], info: INFO })).toThrow(
      "operationId",
    );
    const Duplicate = ConfigurationCases.controller();
    expect(() => OpenApi.generate({ controllers: [Duplicate, Duplicate], info: INFO })).toThrow(
      "Ambiguous route",
    );
    @ApiController("/equivalent")
    class Equivalent {
      @ApiGet("/:id") @ApiResponse({ status: 204 }) public one(): void {}
      @ApiGet("/:name") @ApiResponse({ status: 204 }) public two(): void {}
    }
    expect(() => OpenApi.generate({ controllers: [Equivalent], info: INFO })).toThrow(
      "Ambiguous route",
    );
    @ApiController("/mixed")
    class Mixed {
      @ApiGet("/:id") @ApiResponse({ status: 204 }) public get(): void {}
      @ApiPost("/:name") @ApiResponse({ status: 204 }) public post(): void {}
    }
    expect(() => OpenApi.generate({ controllers: [Mixed], info: INFO })).toThrow(
      "Inconsistent path parameter names",
    );
    @ApiController("/coherent")
    class Coherent {
      @ApiGet("/:id") @ApiResponse({ status: 204 }) public get(): void {}
      @ApiPost("/:id") @ApiResponse({ status: 204 }) public post(): void {}
    }
    expect(
      OpenApi.generate({ controllers: [Coherent], info: INFO }).paths["/coherent/{id}"],
    ).toHaveProperty("post");
    @ApiController("/base")
    class Base {
      @ApiGet("/") @ApiResponse({ status: 204 }) public get(): void {}
    }
    @ApiController("/derived")
    class Derived extends Base {
      public override get(): void {}
    }
    expect(() => OpenApi.generate({ controllers: [Derived], info: INFO })).toThrow(
      "ambiguous inherited override",
    );
  });

  it("rejects invalid descriptive route/controller/response/header annotations instead of returning malformed documents", () => {
    for (const route of [
      { operationId: "" },
      { operationId: 1 },
      { operationId: null },
      { summary: 1 },
      { description: false },
      { deprecated: "true" },
      { exclude: "true" },
      { tags: "tag" },
      { tags: [1] },
    ]) {
      const Controller = ConfigurationCases.controller(route as IApiRouteOptions);
      expect(() => OpenApi.generate({ controllers: [Controller], info: INFO })).toThrow(TypeError);
    }
    for (const controller of [{ exclude: "true" }, { tags: [1] }]) {
      const Controller = ConfigurationCases.controller(
        {},
        controller as unknown as IApiControllerOptions,
      );
      expect(() => OpenApi.generate({ controllers: [Controller], info: INFO })).toThrow(TypeError);
    }
    for (const response of [
      { status: 204, description: 1 },
      { status: 204, headers: { "Content-Length": { schema: { type: "integer" } } } },
      { status: 204, headers: { "bad header": { schema: {} } } },
      { status: 204, headers: { "X-Header": { schema: false } } },
      { status: 204, headers: { "X-Header": { schema: {} }, "x-header": { schema: {} } } },
    ]) {
      const Controller = ConfigurationCases.controller({}, {}, response as IApiResponseOptions);
      expect(() => OpenApi.generate({ controllers: [Controller], info: INFO })).toThrow(TypeError);
    }
    const Described = ConfigurationCases.controller({ deprecated: true, tags: [] });
    expect(OpenApi.generate({ controllers: [Described], info: INFO }).paths["/case"]).toMatchObject(
      { get: { deprecated: true, tags: [] } },
    );
  });

  it("rejects distinct classes across independent nested roots and across input/output direction, without comparing equal schema bytes", () => {
    @Describe({ name: "Same" })
    class First {
      @IsString() public value!: string;
    }
    @Describe({ name: "Same" })
    class Second {
      @IsString() public value!: string;
    }
    class RootOne {
      @IsObject(First) public nested!: First;
    }
    class RootTwo {
      @IsObject(Second) public nested!: Second;
    }
    @ApiController("/collision")
    class Nested {
      @ApiGet("/one") @ApiResponse({ status: 200, type: RootOne }) public one(): void {}
      @ApiGet("/two") @ApiResponse({ status: 200, type: RootTwo }) public two(): void {}
    }
    expect(() => OpenApi.generate({ controllers: [Nested], info: INFO })).toThrow(
      "share the JSON Schema name",
    );
    @ApiController("/directions")
    class Directions {
      @ApiPost("/") @ApiResponse({ status: 200, type: Second }) public post(
        @ApiBody(First) body: First,
      ): void {
        void body;
      }
    }
    expect(() => OpenApi.generate({ controllers: [Directions], info: INFO })).toThrow(
      "share the JSON Schema name",
    );
    class GlacierProblem {}
    @ApiController("/framework-collision")
    class Framework {
      @ApiGet("/") @ApiResponse({ status: 200, type: GlacierProblem }) public get(): void {}
    }
    expect(() => OpenApi.generate({ controllers: [Framework], info: INFO })).toThrow(
      "Conflicting component",
    );
  });

  it("keeps synthetic graph names private, preserves literal examples, and returns detached JSON", () => {
    @Describe({ name: "GlacierOpenApiGraph", example: { $ref: "#/components/schemas/literal" } })
    @JsonSchema({
      "x-consumer": {
        $ref: "#/components/schemas/literal",
        mapping: { value: "#/components/schemas/literal" },
      },
    })
    class Dto {
      @IsString() public value!: string;
    }
    @ApiController("/graph")
    class Controller {
      @ApiGet("/") @ApiResponse({ status: 200, type: Dto }) public get(): void {}
    }
    const info = { ...INFO };
    const document = OpenApi.generate({ controllers: [Controller], info });
    info.title = "Changed source";
    expect(document.info.title).toBe("Consistency");
    expect(document.components.schemas).toMatchObject({
      GlacierOpenApiGraphOutput: {
        examples: [{ $ref: "#/components/schemas/literal" }],
        "x-consumer": {
          $ref: "#/components/schemas/literal",
          mapping: { value: "#/components/schemas/literal" },
        },
      },
    });
    expect(JSON.stringify(document)).not.toContain('"GlacierOpenApiGraph_"');
    OpenApiEvidence.references(document);
  });

  it("fails known body-Date and structural override contradictions while permitting descriptive annotations", () => {
    class DateDto {
      @IsDate() public date!: Date;
    }
    @ApiController("/date")
    class DateController {
      @ApiPost("/") @ApiResponse({ status: 204 }) public post(
        @ApiBody(DateDto) body: DateDto,
      ): void {
        void body;
      }
    }
    expect(() => OpenApi.generate({ controllers: [DateController], info: INFO })).toThrow(
      "Strict wire input",
    );
    class BadDto {
      @IsString() @JsonSchema({ type: "number" }) public value!: string;
    }
    @ApiController("/override")
    class BadController {
      @ApiGet("/") @ApiResponse({ status: 200, type: BadDto }) public get(): void {}
    }
    expect(() => OpenApi.generate({ controllers: [BadController], info: INFO })).toThrow(
      "annotation contradicts",
    );
    class GoodDto {
      @IsString() @JsonSchema({ description: "Metadata only" }) public value!: string;
    }
    @ApiController("/good")
    class GoodController {
      @ApiPost("/") @ApiResponse({ status: 204 }) public post(
        @ApiBody(GoodDto, { description: "Body only" }) body: GoodDto,
      ): void {
        void body;
      }
    }
    expect(
      OpenApi.generate({ controllers: [GoodController], info: INFO }).components.schemas,
    ).toMatchObject({ GoodDtoInput: { properties: { value: { description: "Metadata only" } } } });
    @ApiController("/description")
    class DescriptionController {
      @ApiPost("/") @ApiResponse({ status: 204 }) public post(
        @ApiBody(GoodDto, { description: 1 } as unknown as IApiBodyOptions) body: GoodDto,
      ): void {
        void body;
      }
    }
    expect(() => OpenApi.generate({ controllers: [DescriptionController], info: INFO })).toThrow(
      "Invalid binder description",
    );
  });

  it("documents a body without description and rejects a structured binder whose root is a union rather than an object", () => {
    class Dto {
      @IsString() public value!: string;
    }
    @ApiController("/body")
    class Body {
      @ApiPost("/") @ApiResponse({ status: 204 }) public post(@ApiBody(Dto) dto: Dto): void {
        void dto;
      }
    }
    expect(OpenApi.generate({ controllers: [Body], info: INFO }).paths["/body"]).not.toHaveProperty(
      "post.requestBody.description",
    );
    class Variant {
      @IsLiteral("variant") public kind!: "variant";
    }
    @IsUnion({ discriminator: "kind", variants: { variant: Variant } })
    class Union {}
    @ApiController("/union-query")
    class Query {
      @ApiGet("/") @ApiResponse({ status: 204 }) public get(@ApiQuery(Union) dto: Union): void {
        void dto;
      }
    }
    expect(() => OpenApi.generate({ controllers: [Query], info: INFO })).toThrow(
      "Structured binder requires an object schema",
    );
  });

  it("preserves nullable repeated arrays and cyclic deepObject schemas and rejects object arrays at deeper query levels", () => {
    class Child {
      @IsString() public value!: string;
      @IsObject(() => Child) @Optional() public next?: Child;
    }
    class Query {
      @IsArray(String) @Nullable() public tags!: string[] | null;
      @IsObject(Child) @Nullable() public filter!: Child | null;
      @IsRecord(Child) @Optional() public dictionary?: Record<string, Child>;
      @IsOneOf([String, Number]) @Optional() public choice?: string | number;
    }
    @ApiController("/deep")
    class Controller {
      @ApiGet("/") @ApiResponse({ status: 204 }) public get(@ApiQuery(Query) query: Query): void {
        void query;
      }
    }
    const document = OpenApi.generate({ controllers: [Controller], info: INFO });
    expect(document.paths["/deep"]).toMatchObject({
      get: {
        parameters: [
          { name: "tags", style: "form", explode: true },
          { name: "filter", style: "deepObject" },
          { name: "dictionary", style: "deepObject" },
          { name: "choice", style: "form" },
        ],
      },
    });
    OpenApiEvidence.references(document);
    class Nested {
      @IsArray(Child) public children!: Child[];
    }
    class BadQuery {
      @IsObject(Nested) public filter!: Nested;
    }
    @ApiController("/bad-deep")
    class Bad {
      @ApiGet("/") @ApiResponse({ status: 204 }) public get(
        @ApiQuery(BadQuery) query: BadQuery,
      ): void {
        void query;
      }
    }
    expect(() => OpenApi.generate({ controllers: [Bad], info: INFO })).toThrow(
      "scalar elements at every depth",
    );
  });

  it("rejects ambiguous bound parameters and unsupported structured header/path/query array wire forms", () => {
    class Params {
      @IsString() public id!: string;
    }
    @ApiController("/ambiguous")
    class Ambiguous {
      @ApiGet("/:id") @ApiResponse({ status: 204 }) public get(
        @ApiParams(Params) params: Params,
        @ApiParam("id") id: string,
      ): void {
        void params;
        void id;
      }
    }
    expect(() => OpenApi.generate({ controllers: [Ambiguous], info: INFO })).toThrow(
      "Ambiguous bound parameter",
    );
    class WrongParams {
      @IsString() public other!: string;
    }
    @ApiController("/wrong")
    class Wrong {
      @ApiGet("/:id") @ApiResponse({ status: 204 }) public get(
        @ApiParams(WrongParams) params: WrongParams,
      ): void {
        void params;
      }
    }
    expect(() => OpenApi.generate({ controllers: [Wrong], info: INFO })).toThrow(
      "no route segment",
    );
    class Child {
      @IsString() public value!: string;
    }
    class Headers {
      @IsObject(Child) public nested!: Child;
    }
    @ApiController("/headers")
    class HeaderController {
      @ApiGet("/") @ApiResponse({ status: 204 }) public get(
        @ApiHeaders(Headers) headers: Headers,
      ): void {
        void headers;
      }
    }
    expect(() => OpenApi.generate({ controllers: [HeaderController], info: INFO })).toThrow(
      "require scalar wire fields",
    );
    for (const [decorate, isSupported] of [
      [IsArray(Child), false],
      [IsArray(String), true],
      [IsTuple([String, String]), true],
      [IsTuple([Child, String]), false],
      [IsTuple([String]), false],
    ] as const) {
      class Query {}
      decorate(Query.prototype, "items");
      @ApiController("/query")
      class QueryController {
        @ApiGet("/") @ApiResponse({ status: 204 }) public get(@ApiQuery(Query) query: Query): void {
          void query;
        }
      }
      const action = () => OpenApi.generate({ controllers: [QueryController], info: INFO });
      if (isSupported)
        expect(action().paths["/query"]).toMatchObject({
          get: {
            parameters: [
              {
                schema: { type: "array" },
                style: "form",
                explode: true,
              },
            ],
          },
        });
      else expect(action).toThrow(TypeError);
    }
    @ApiController("/raw-header")
    class RawHeader {
      @ApiGet("/") @ApiResponse({ status: 204 }) public get(
        @ApiHeader("X-Test") header: string | undefined,
      ): void {
        void header;
      }
    }
    expect(
      OpenApi.generate({ controllers: [RawHeader], info: INFO }).paths["/raw-header"],
    ).toMatchObject({ get: { parameters: [{ name: "x-test", in: "header", required: false }] } });
  });

  it("rejects unsafe documentation data without invoking accessors or toJSON", () => {
    let calls = 0;
    const accessor = { ...INFO };
    Object.defineProperty(accessor, "title", {
      enumerable: true,
      get: () => {
        calls++;
        return "secret";
      },
    });
    const cycle: Record<string, unknown> = { ...INFO };
    cycle.self = cycle;
    const sparse = new Array(2);
    const extraArray = ["x"];
    Object.defineProperty(extraArray, "extra", { value: "x", enumerable: true });
    for (const info of [
      accessor,
      cycle,
      { ...INFO, extra: () => "secret" },
      { ...INFO, extra: undefined },
      { ...INFO, extra: NaN },
      { ...INFO, extra: new Date() },
      { ...INFO, extra: sparse },
      { ...INFO, extra: extraArray },
      null,
      [],
    ]) {
      expect(() => OpenApi.generate({ controllers: [], info } as IOpenApiOptions)).toThrow(
        TypeError,
      );
    }
    expect(calls).toBe(0);
    const info = { ...INFO, extra: null, count: 2, flag: true };
    Object.setPrototypeOf(info, null);
    expect(OpenApi.generate({ controllers: [], info }).info).toEqual(INFO);
  });

  it("excludes only document entries, leaving the real runtime route available", async () => {
    @ApiController("/exclude", { tags: ["runtime"], exclude: false })
    class Controller {
      @ApiGet("/visible") @ApiResponse({ status: 204 }) public visible(): void {}
      @ApiGet("/hidden", { exclude: true }) @ApiResponse({ status: 204 }) public hidden(): void {}
    }
    @ApiController("/all-hidden", { exclude: true })
    class HiddenController {
      @ApiGet("/") @ApiResponse({ status: 204 }) public get(): void {}
    }
    const server = HttpServer.create({
      controllers: [new Controller(), new HiddenController()],
      onError: () => {},
    });
    try {
      const document = OpenApi.generate({ server, info: INFO });
      expect(Object.keys(document.paths)).toEqual(["/exclude/visible"]);
      await server.listen({ host: "127.0.0.1", port: 0 });
      const address = server.address();
      if (address === undefined) throw new Error("Missing test listener");
      expect((await fetch(`http://127.0.0.1:${address.port}/exclude/hidden`)).status).toBe(204);
      expect((await fetch(`http://127.0.0.1:${address.port}/all-hidden`)).status).toBe(204);
    } finally {
      await server.close();
    }
  });
});
