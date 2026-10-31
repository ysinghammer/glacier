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
  /**
   * Builds fresh decorated controller classes for runtime configuration edge cases.
   * @param route Route options supplied to the fixture handler; defaults to empty options.
   * @param controller Controller options; defaults to empty options.
   * @param response Response contract; defaults to status 204.
   * @returns Class constructor with route metadata and no constructed instance.
   */
  public static controller(
    route: IApiRouteOptions = {},
    controller: IApiControllerOptions = {},
    response: IApiResponseOptions = { status: 204 },
  ): new () => object {
    @ApiController("/case", controller)
    /** Test controller carrying the supplied route and response declarations. */
    class Controller {
      /** Declares the configured bodyless test route.
       * @returns No value; exercises metadata generation only.
       */
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
    /** Routes share one operation ID to verify generation rejects ambiguity. */
    class Controller {
      /** First route using the duplicated operation ID.
       * @returns No value; generation inspects its metadata only.
       */
      @ApiGet("/one", { operationId: "same" }) @ApiResponse({ status: 204 }) public one(): void {}
      /** Second route using the duplicated operation ID.
       * @returns No value; generation inspects its metadata only.
       */
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
    /** Route parameters have different names but equivalent matching shapes. */
    class Equivalent {
      /** Declares the first equivalent path shape.
       * @returns No value; generation inspects its metadata only.
       */
      @ApiGet("/:id") @ApiResponse({ status: 204 }) public one(): void {}
      /** Declares the second equivalent path shape.
       * @returns No value; generation inspects its metadata only.
       */
      @ApiGet("/:name") @ApiResponse({ status: 204 }) public two(): void {}
    }
    expect(() => OpenApi.generate({ controllers: [Equivalent], info: INFO })).toThrow(
      "Ambiguous route",
    );
    @ApiController("/mixed")
    /** GET and POST use different names for the same path position. */
    class Mixed {
      /** Declares the GET path parameter name.
       * @returns No value; generation inspects its metadata only.
       */
      @ApiGet("/:id") @ApiResponse({ status: 204 }) public get(): void {}
      /** Declares the POST path parameter name.
       * @returns No value; generation inspects its metadata only.
       */
      @ApiPost("/:name") @ApiResponse({ status: 204 }) public post(): void {}
    }
    expect(() => OpenApi.generate({ controllers: [Mixed], info: INFO })).toThrow(
      "Inconsistent path parameter names",
    );
    @ApiController("/coherent")
    /** Multiple methods use one consistent path parameter name. */
    class Coherent {
      /** Declares the GET variant of the coherent path.
       * @returns No value; generation inspects its metadata only.
       */
      @ApiGet("/:id") @ApiResponse({ status: 204 }) public get(): void {}
      /** Declares the POST variant of the coherent path.
       * @returns No value; generation inspects its metadata only.
       */
      @ApiPost("/:id") @ApiResponse({ status: 204 }) public post(): void {}
    }
    expect(
      OpenApi.generate({ controllers: [Coherent], info: INFO }).paths["/coherent/{id}"],
    ).toHaveProperty("post");
    @ApiController("/base")
    /** Base class provides a fully declared route for override checks. */
    class Base {
      /** Base handler inherited by subclasses.
       * @returns No value; generation inspects its metadata only.
       */
      @ApiGet("/") @ApiResponse({ status: 204 }) public get(): void {}
    }
    @ApiController("/derived")
    /** Overrides the base handler without redeclaring route metadata. */
    class Derived extends Base {
      /** Incomplete override used to verify inherited metadata rejection.
       * @returns No value; generation inspects the incomplete override.
       */
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
    /** First class with a shared explicit JSON Schema name. */
    class First {
      /** Required scalar value in the first nested schema. */
      @IsString() public value!: string;
    }
    @Describe({ name: "Same" })
    /** Distinct class colliding with the first class's schema name. */
    class Second {
      /** Required scalar value in the second nested schema. */
      @IsString() public value!: string;
    }
    /** First independent schema root. */
    class RootOne {
      /** Nested reference to the first colliding class. */
      @IsObject(First) public nested!: First;
    }
    /** Second independent schema root. */
    class RootTwo {
      /** Nested reference to the second colliding class. */
      @IsObject(Second) public nested!: Second;
    }
    @ApiController("/collision")
    /** Uses both schema roots to detect name collision across nested components. */
    class Nested {
      /** Exposes the first root under a successful response.
       * @returns No value; generation reads the declared schema type.
       */
      @ApiGet("/one") @ApiResponse({ status: 200, type: RootOne }) public one(): void {}
      /** Exposes the second root under a successful response.
       * @returns No value; generation reads the declared schema type.
       */
      @ApiGet("/two") @ApiResponse({ status: 200, type: RootTwo }) public two(): void {}
    }
    expect(() => OpenApi.generate({ controllers: [Nested], info: INFO })).toThrow(
      "share the JSON Schema name",
    );
    @ApiController("/directions")
    /** Shares one schema name across different input and output class identities. */
    class Directions {
      /** Declares distinct body-input and response-output DTO references.
       * @param body Request body instance supplied by the declared binder.
       * @returns No value; generation compares input and output schema identities.
       */
      @ApiPost("/") @ApiResponse({ status: 200, type: Second }) public post(
        @ApiBody(First) body: First,
      ): void {
        void body;
      }
    }
    expect(() => OpenApi.generate({ controllers: [Directions], info: INFO })).toThrow(
      "share the JSON Schema name",
    );
    /** Class identity intentionally collides with a framework-owned schema name. */
    class GlacierProblem {}
    @ApiController("/framework-collision")
    /** Exposes the colliding schema through a response declaration. */
    class Framework {
      /** Declares the framework-name collision response.
       * @returns No value; generation reads the declared response schema.
       */
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
    /** Schema annotations retain literal examples while the generator uses private graph names. */
    class Dto {
      /** Required scalar value in the annotated schema. */
      @IsString() public value!: string;
    }
    @ApiController("/graph")
    /** Exposes the annotated DTO for detached document assertions. */
    class Controller {
      /** Declares the schema's successful output route.
       * @returns No value; generation reads the declared response schema.
       */
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
    /** Input DTO with a date value unsupported by strict JSON wire parsing. */
    class DateDto {
      /** Required date field used to trigger body schema contradiction. */
      @IsDate() public date!: Date;
    }
    @ApiController("/date")
    /** Binds the date DTO as a request body. */
    class DateController {
      /** Declares strict body input whose date shape is rejected.
       * @param body Request body with an unsupported Date field.
       * @returns No value; generation rejects the declared input schema.
       */
      @ApiPost("/") @ApiResponse({ status: 204 }) public post(
        @ApiBody(DateDto) body: DateDto,
      ): void {
        void body;
      }
    }
    expect(() => OpenApi.generate({ controllers: [DateController], info: INFO })).toThrow(
      "Strict wire input",
    );
    /** DTO whose custom schema contradicts its string validator. */
    class BadDto {
      /** String validator contradicted by the explicit numeric schema. */
      @IsString() @JsonSchema({ type: "number" }) public value!: string;
    }
    @ApiController("/override")
    /** Exposes the contradictory schema as a response. */
    class BadController {
      /** Declares the conflicting response type.
       * @returns No value; generation validates the response schema.
       */
      @ApiGet("/") @ApiResponse({ status: 200, type: BadDto }) public get(): void {}
    }
    expect(() => OpenApi.generate({ controllers: [BadController], info: INFO })).toThrow(
      "annotation contradicts",
    );
    /** DTO whose metadata-only description remains consistent with its string type. */
    class GoodDto {
      /** Required string field with additional descriptive metadata. */
      @IsString() @JsonSchema({ description: "Metadata only" }) public value!: string;
    }
    @ApiController("/good")
    /** Accepts the documented body DTO without returning a body. */
    class GoodController {
      /** Declares the body-only route.
       * @param body Validated DTO supplied by the body binder.
       * @returns No value; route declares no response body.
       */
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
    /** Contains a deliberately malformed binder description. */
    class DescriptionController {
      /** Declares body input with an invalid untyped description.
       * @param body Validated DTO supplied by the body binder.
       * @returns No value; generation rejects the invalid binder description.
       */
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
    /** Minimal string DTO used by the body and structured-query cases. */
    class Dto {
      /** Required string value in the JSON schema. */
      @IsString() public value!: string;
    }
    @ApiController("/body")
    /** Binds a DTO without an explicit request-body description. */
    class Body {
      /** Declares the bodyless response after accepting the DTO input.
       * @param dto DTO accepted by the structured body binder.
       * @returns No value; route declares an empty response.
       */
      @ApiPost("/") @ApiResponse({ status: 204 }) public post(@ApiBody(Dto) dto: Dto): void {
        void dto;
      }
    }
    expect(OpenApi.generate({ controllers: [Body], info: INFO }).paths["/body"]).not.toHaveProperty(
      "post.requestBody.description",
    );
    /** One class variant for a union that cannot serve as an object query schema. */
    class Variant {
      /** Discriminator literal identifying the variant. */
      @IsLiteral("variant") public kind!: "variant";
    }
    @IsUnion({ discriminator: "kind", variants: { variant: Variant } })
    /** Class identity annotated with the union schema declaration. */
    class Union {}
    @ApiController("/union-query")
    /** Binds the union as a structured query to verify object-root validation. */
    class Query {
      /** Attempts structured binding of the union schema.
       * @param dto Union value used by the structured query binder.
       * @returns No value; generation rejects its non-object schema root.
       */
      @ApiGet("/") @ApiResponse({ status: 204 }) public get(@ApiQuery(Union) dto: Union): void {
        void dto;
      }
    }
    expect(() => OpenApi.generate({ controllers: [Query], info: INFO })).toThrow(
      "Structured binder requires an object schema",
    );
  });

  it("preserves nullable repeated arrays and cyclic deepObject schemas and rejects object arrays at deeper query levels", () => {
    /** Recursive nested object used by deep query schema assertions. */
    class Child {
      /** Required leaf string. */
      @IsString() public value!: string;
      /** Optional recursive child node. */
      @IsObject(() => Child) @Optional() public next?: Child;
    }
    /** Query contract covering nullable arrays, objects, records, and unions. */
    class Query {
      /** Nullable repeated string query values. */
      @IsArray(String) @Nullable() public tags!: string[] | null;
      /** Nullable nested filter object. */
      @IsObject(Child) @Nullable() public filter!: Child | null;
      /** Optional map of child objects. */
      @IsRecord(Child) @Optional() public dictionary?: Record<string, Child>;
      /** Optional scalar choice accepting either text or number. */
      @IsOneOf([String, Number]) @Optional() public choice?: string | number;
    }
    @ApiController("/deep")
    /** Exposes the structured query contract for OpenAPI serialization checks. */
    class Controller {
      /** Accepts validated query data without producing a response body.
       * @param query Validated nested query values.
       * @returns No value; the route declares an empty response.
       */
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
    /** Nested query object containing a scalar array. */
    class Nested {
      /** Array of child objects unsupported by deep query serialization. */
      @IsArray(Child) public children!: Child[];
    }
    /** Query DTO rooted at the unsupported nested array structure. */
    class BadQuery {
      /** Nested object that contains the unsupported array. */
      @IsObject(Nested) public filter!: Nested;
    }
    @ApiController("/bad-deep")
    /** Exposes the unsupported nested array through a structured query binder. */
    class Bad {
      /** Attempts to bind the invalid query shape.
       * @param query Query DTO containing the unsupported nested array.
       * @returns No value; generation rejects the unsupported serialization.
       */
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
    /** Path parameter DTO used to test route/binder ambiguity. */
    class Params {
      /** Path id also declared by the route template. */
      @IsString() public id!: string;
    }
    @ApiController("/ambiguous")
    /** Binds one path value twice to trigger ambiguity validation. */
    class Ambiguous {
      /** Declares duplicate binding of the route id.
       * @param params DTO binding for the route id.
       * @param id Direct binding for the same route id.
       * @returns No value; generation rejects the ambiguous declaration.
       */
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
    /** Path DTO whose field does not correspond to the route segment. */
    class WrongParams {
      /** Unmatched parameter name. */
      @IsString() public other!: string;
    }
    @ApiController("/wrong")
    /** Binds a path DTO with an unknown route parameter. */
    class Wrong {
      /** Declares the mismatched path binding.
       * @param params DTO whose field does not match the route.
       * @returns No value; generation rejects the unmatched parameter.
       */
      @ApiGet("/:id") @ApiResponse({ status: 204 }) public get(
        @ApiParams(WrongParams) params: WrongParams,
      ): void {
        void params;
      }
    }
    expect(() => OpenApi.generate({ controllers: [Wrong], info: INFO })).toThrow(
      "no route segment",
    );
    /** Scalar schema nested inside a structured request header. */
    class Child {
      /** Required scalar header value. */
      @IsString() public value!: string;
    }
    /** Header DTO containing an unsupported nested object. */
    class Headers {
      /** Nested header object rejected by scalar wire validation. */
      @IsObject(Child) public nested!: Child;
    }
    @ApiController("/headers")
    /** Exposes the unsupported structured-header case. */
    class HeaderController {
      /** Binds structured headers for generation validation.
       * @param headers Header DTO with a nested object field.
       * @returns No value; generation rejects non-scalar header fields.
       */
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
      /**
       * Dynamic test schema receiving one array validator without declaring runtime fields.
       * @property items - Array schema registered dynamically for the current validator case.
       */
      class Query {}
      decorate(Query.prototype, "items");
      @ApiController("/query")
      /** Exposes the current dynamic query array schema. */
      class QueryController {
        /** Binds the generated query DTO for wire-form checks.
         * @param query Dynamically decorated query DTO.
         * @returns No value; generation checks the selected array wire form.
         */
        @ApiGet("/") @ApiResponse({ status: 204 }) public get(@ApiQuery(Query) query: Query): void {
          void query;
        }
      }
      /**
       * Generates the current decorated query document for a wire-form assertion.
       * @returns Generated document for the current query schema.
       */
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
    /** Documents a direct optional scalar header binder. */
    class RawHeader {
      /** Declares the optional raw header parameter.
       * @param header Optional raw value from the `X-Test` request header.
       * @returns No value; generation documents the optional scalar binder.
       */
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
    const sparse: unknown[] = [];
    // Leave holes deliberately: a dense array would not exercise sparse-array rejection.
    sparse.length = 2;
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
    /** Has one documented route and one hidden route, both live at runtime. */
    class Controller {
      /** Visible in generated documentation and available at runtime.
       * @returns No value; the live endpoint is bodyless.
       */
      @ApiGet("/visible") @ApiResponse({ status: 204 }) public visible(): void {}
      /** Excluded from generated documentation but available at runtime.
       * @returns No value; the live endpoint is bodyless.
       */
      @ApiGet("/hidden", { exclude: true }) @ApiResponse({ status: 204 }) public hidden(): void {}
    }
    @ApiController("/all-hidden", { exclude: true })
    /** Excludes all of its routes from generated documentation. */
    class HiddenController {
      /** Live route omitted from the OpenAPI document.
       * @returns No value; the live endpoint is bodyless.
       */
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
