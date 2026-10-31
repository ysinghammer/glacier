import { describe, expect, it } from "vitest";
import {
  ApiGet,
  ApiPost,
  ApiPut,
  ApiPatch,
  ApiDelete,
  ApiParam,
  ApiUserId,
  ApiRequest,
  ApiHeader,
  ApiCookie,
  ApiResponse,
  ApiPublic,
  ApiSkipResponseLogging,
  ApiBody,
  ApiQuery,
  ApiParams,
  ApiHeaders,
  ApiCookies,
  ApiController,
  HttpEndpointMetadata,
  HttpServer,
} from "../../../index.js";
import { EndpointDeclarations } from "../../EndpointDeclarations.js";
import { TextDto } from "../../data/TextDto.js";
import { BindingController } from "../../data/BindingController.js";
import { LoopbackClient } from "../../LoopbackClient.js";
import { DESIGN_PARAMETER_TYPES_METADATA } from "@glacier/reflection";

describe("prepared deterministic routing and metadata invariants", () => {
  it.each([ApiPost, ApiPut, ApiPatch, ApiDelete])(
    "each declared verb rejects bad paths, static targets and duplicate declarations",
    (factory) => {
      /** Each public factory receives independently declared consumer methods. */
      class Controller {
        public value(): void {}
      }
      const descriptor = EndpointDeclarations.descriptor(Controller, "value");
      expect(() => factory("not-origin-form")).toThrow("route path");
      expect(() => factory("/")(Controller, "value", descriptor)).toThrow("instance method");
      EndpointDeclarations.controller(Controller);
      EndpointDeclarations.route(Controller, "value", factory("/"));
      expect(() => factory("/")(Controller.prototype, "value", descriptor)).toThrow("Duplicate");
    },
  );
  it.each([ApiBody, ApiQuery, ApiParams, ApiHeaders, ApiCookies])(
    "each explicit DTO binder rejects nonconstructor inputs and constructor/static parameter targets",
    (factory) => {
      /** Binding errors are definition failures, never inferred or delayed until a request. */
      class Controller {
        public value(input: object): void {
          void input;
        }
      }
      expect(() => Reflect.apply(factory, undefined, [new TextDto()])).toThrow("DTO class");
      expect(() => factory(TextDto)(Controller, "value", 0)).toThrow("instance method parameter");
      expect(() => factory(TextDto)(Controller.prototype, undefined, 0)).toThrow(
        "instance method parameter",
      );
    },
  );
  it("lexicographic static precedence wins ties, all verbs coexist and trailing slashes are equivalent", async () => {
    /** Parameter registration precedes static registration. */
    class Parameter {
      public value(): void {}
    }
    /** Static route's observable status differs. */
    class Static {
      public value(): void {}
    }
    EndpointDeclarations.controller(Parameter);
    EndpointDeclarations.route(Parameter, "value", ApiPost("/:id/fixed"));
    EndpointDeclarations.controller(Static);
    EndpointDeclarations.route(Static, "value", ApiGet("/fixed/:id"));
    for (const controllers of [
      [new Parameter(), new Static()],
      [new Static(), new Parameter()],
    ]) {
      const fixture = await LoopbackClient.start({ controllers });
      try {
        expect((await LoopbackClient.send(fixture.port, "/fixed/fixed/")).status).toBe(204);
        const result = await LoopbackClient.send(fixture.port, "/fixed/fixed", [], "POST");
        expect(result.status).toBe(405);
        expect(result.fields["allow"]).toEqual(["GET, HEAD, OPTIONS"]);
        expect((await LoopbackClient.send(fixture.port, "//fixed", [], "POST")).status).toBe(404);
      } finally {
        await fixture.server.close();
      }
    }
    /** All five verbs are declared on the same concrete path. */
    class Verbs {
      public get(): void {}
      public post(): void {}
      public put(): void {}
      public patch(): void {}
      public delete(): void {}
    }
    EndpointDeclarations.controller(Verbs, "/verbs/");
    for (const [name, decorate] of [
      ["get", ApiGet],
      ["post", ApiPost],
      ["put", ApiPut],
      ["patch", ApiPatch],
      ["delete", ApiDelete],
    ] as const)
      EndpointDeclarations.route(Verbs, name, decorate("/"));
    const fixture = await LoopbackClient.start({ controllers: [new Verbs()] });
    try {
      for (const method of ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"])
        expect((await LoopbackClient.send(fixture.port, "/verbs", [], method)).status).toBe(204);
      expect(
        (await LoopbackClient.send(fixture.port, "/verbs", [], "TRACE")).fields["allow"],
      ).toEqual(["GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS"]);
    } finally {
      await fixture.server.close();
    }
  });
  it("the deliberate public metadata snapshot is immutable and contains full docs, bindings and repeated responses", () => {
    const endpoints = HttpEndpointMetadata.read(BindingController);
    expect(Object.isFrozen(endpoints)).toBe(true);
    const body = endpoints.find((endpoint) => endpoint.handlerName === "body");
    expect(body?.responses.map((response) => response.status)).toEqual([200, 201]);
    expect(body?.responses[0]).toMatchObject({
      examples: { example: { count: 1, label: "ok" } },
      headers: { "X-Result": { schema: { type: "string" } } },
    });
    expect(Object.isFrozen(body?.responses[0])).toBe(true);
    const publicBody = endpoints.find((endpoint) => endpoint.handlerName === "publicBody");
    expect(publicBody).toMatchObject({
      isPublic: true,
      isResponseLoggingSkipped: true,
      method: "POST",
      template: "/bind/public",
    });
    const text = endpoints.find((endpoint) => endpoint.handlerName === "text");
    expect(text?.bindings).toHaveLength(9);
    expect(Object.isFrozen(text?.bindings)).toBe(true);
  });
  it("documentation snapshots detach mutable caller options while exclude never removes a live route", async () => {
    /** Documentation changes do not mutate prepared runtime registration. */
    class Controller {
      public value(): void {}
    }
    const options = { tags: ["original"], exclude: true };
    ApiController("/excluded", options)(Controller);
    const routeOptions = { summary: "original", tags: ["original"], exclude: true };
    EndpointDeclarations.route(Controller, "value", ApiGet("/", routeOptions));
    options.tags.push("mutated");
    routeOptions.tags.push("mutated");
    routeOptions.summary = "mutated";
    const metadata = HttpEndpointMetadata.read(Controller)[0];
    expect(metadata?.controllerOptions).toEqual({ tags: ["original"], exclude: true });
    expect(metadata?.routeOptions).toEqual({
      tags: ["original"],
      summary: "original",
      exclude: true,
    });
    expect(Object.isFrozen(metadata?.routeOptions.tags)).toBe(true);
    const fixture = await LoopbackClient.start({ controllers: [new Controller()] });
    try {
      expect((await LoopbackClient.send(fixture.port, "/excluded")).status).toBe(204);
    } finally {
      await fixture.server.close();
    }
  });
  it("inherited handlers preserve declaring contracts and prefixes; undecorated/partial overrides reject", async () => {
    /** Base controller owns a complete handler declaration. */
    class Base {
      public value(): void {}
    }
    EndpointDeclarations.controller(Base, "/base");
    EndpointDeclarations.route(Base, "value", ApiGet("/"));
    /** Application-owned subclass inherits the full handler. */
    class Child extends Base {}
    const fixture = await LoopbackClient.start({ controllers: [new Child()] });
    try {
      expect((await LoopbackClient.send(fixture.port, "/base")).status).toBe(204);
    } finally {
      await fixture.server.close();
    }
    /** Overrides cannot inherit a contract attached to another function. */
    class Override extends Base {
      public override value(): void {}
    }
    expect(() => HttpEndpointMetadata.read(Override)).toThrow("ambiguous inherited override");
    ApiGet("/own")(Override.prototype, "value", EndpointDeclarations.descriptor(Override, "value"));
    expect(() => HttpEndpointMetadata.read(Override)).toThrow("Missing");
    ApiResponse({ status: 204 })(
      Override.prototype,
      "value",
      EndpointDeclarations.descriptor(Override, "value"),
    );
    ApiController("/child")(Override);
    expect(HttpEndpointMetadata.read(Override)[0]?.template).toBe("/child/own");
  });
  it("duplicate and invalid binding targets, missing positions and unknown path references reject before listening", () => {
    /** Invalid fixture declarations are submitted through real public decorators/create. */
    class Controller {
      public value(first: string, second: string): void {
        void [first, second];
      }
    }
    EndpointDeclarations.controller(Controller);
    EndpointDeclarations.route(Controller, "value", ApiGet("/:id"));
    ApiParam("id")(Controller.prototype, "value", 0);
    expect(() => ApiParam("id")(Controller.prototype, "value", 1)).toThrow("Duplicate");
    expect(() => ApiRequest()(Controller.prototype, "value", 0)).toThrow("Duplicate");
    expect(() => HttpEndpointMetadata.read(Controller)).toThrow("Missing parameter binder");
    ApiParam("unknown")(Controller.prototype, "value", 1);
    expect(() => HttpEndpointMetadata.read(Controller)).toThrow("Unknown bound path parameter");
    for (const arguments_ of [
      [Controller, "value", 0],
      [Controller.prototype, undefined, 0],
      [Controller.prototype, "value", -1],
    ])
      expect(() => Reflect.apply(ApiRequest(), undefined, arguments_)).toThrow(
        "instance method parameter",
      );
    expect(() => ApiHeader("")).toThrow("name");
    expect(() => ApiHeader("bad field")).toThrow("field name");
    expect(() => ApiCookie("bad;field")).toThrow("field name");
    expect(() => Reflect.apply(ApiBody, undefined, [{}])).toThrow("DTO class");
    const descriptor = EndpointDeclarations.descriptor(Controller, "value");
    ApiPublic()(Controller.prototype, "value", descriptor);
    expect(() => ApiPublic()(Controller.prototype, "value", descriptor)).toThrow("Duplicate");
    ApiSkipResponseLogging()(Controller.prototype, "value", descriptor);
    expect(() => ApiSkipResponseLogging()(Controller.prototype, "value", descriptor)).toThrow(
      "Duplicate",
    );
    expect(() =>
      Reflect.apply(ApiResponse, undefined, [{ status: 200, type: TextDto, isArray: "yes" }]),
    ).toThrow("array");
    expect(() => Reflect.apply(HttpEndpointMetadata.read, HttpEndpointMetadata, [{}])).toThrow();
    /** Orphan response contracts are not silently ignored. */
    class Orphan {
      public value(): void {}
    }
    EndpointDeclarations.controller(Orphan);
    ApiResponse({ status: 204 })(
      Orphan.prototype,
      "value",
      EndpointDeclarations.descriptor(Orphan, "value"),
    );
    expect(() => HttpServer.create({ controllers: [new Orphan()], onError: () => {} })).toThrow(
      "Missing",
    );
  });

  it("explicit compiler representations validate UserId and all recorded positions without generic inference", () => {
    /** Public reflection annotations model representable signatures, not erased DTO recovery. */
    class Controller {
      public value(id = "default"): void {
        void id;
      }
    }
    EndpointDeclarations.controller(Controller);
    EndpointDeclarations.route(Controller, "value", ApiGet("/"));
    ApiUserId()(Controller.prototype, "value", 0);
    const address = { kind: "member", member: "value" } as const;
    expect(DESIGN_PARAMETER_TYPES_METADATA.setDynamic(Controller, [Number], address).isValid).toBe(
      true,
    );
    expect(() => HttpEndpointMetadata.read(Controller)).toThrow("string parameter");
    expect(DESIGN_PARAMETER_TYPES_METADATA.setDynamic(Controller, [String], address).isValid).toBe(
      true,
    );
    expect(HttpEndpointMetadata.read(Controller)[0]?.bindings).toEqual([
      { index: 0, location: "userId" },
    ]);
    /** Recorded signatures with non-user binders also preserve positional completeness. */
    class RequestController {
      public value(request: object): void {
        void request;
      }
    }
    EndpointDeclarations.controller(RequestController);
    EndpointDeclarations.route(RequestController, "value", ApiGet("/"));
    ApiRequest()(RequestController.prototype, "value", 0);
    expect(
      DESIGN_PARAMETER_TYPES_METADATA.setDynamic(RequestController, [Object], address).isValid,
    ).toBe(true);
    expect(HttpEndpointMetadata.read(RequestController)[0]?.bindings).toHaveLength(1);
    /** A sparse explicit binder cannot silently leave another argument unbound. */
    class Sparse {
      public value(request: object): void {
        void request;
      }
    }
    EndpointDeclarations.controller(Sparse);
    EndpointDeclarations.route(Sparse, "value", ApiGet("/"));
    ApiRequest()(Sparse.prototype, "value", 1);
    expect(() => HttpEndpointMetadata.read(Sparse)).toThrow("Missing parameter binder");
  });

  it("deleted handlers and invalid instance replacements fail, while an explicitly empty controller is harmless", async () => {
    /** Removing a test-owned declaration after decorating cannot leave a silently ignored route. */
    class Deleted {
      public value(): void {}
    }
    EndpointDeclarations.controller(Deleted);
    EndpointDeclarations.route(Deleted, "value", ApiGet("/"));
    Reflect.deleteProperty(Deleted.prototype, "value");
    expect(() => HttpEndpointMetadata.read(Deleted)).toThrow("Missing handler");
    /** An application-owned instance cannot replace the validated handler with a nonfunction. */
    class Replaced {
      public value(): void {}
    }
    EndpointDeclarations.controller(Replaced);
    EndpointDeclarations.route(Replaced, "value", ApiGet("/"));
    const replaced = new Replaced();
    Object.defineProperty(replaced, "value", { value: 1 });
    expect(() => HttpServer.create({ controllers: [replaced], onError: () => {} })).toThrow(
      "instance method",
    );
    let getterCalls = 0;
    const accessor = new Replaced();
    Object.defineProperty(accessor, "value", {
      get: () => {
        getterCalls++;
        return () => {};
      },
    });
    expect(() => HttpServer.create({ controllers: [accessor], onError: () => {} })).toThrow(
      "instance override",
    );
    expect(getterCalls).toBe(0);
    const invalidProxy = new Proxy(new Replaced(), {
      get: (target, key, receiver) => (key === "value" ? 1 : Reflect.get(target, key, receiver)),
    });
    expect(() => HttpServer.create({ controllers: [invalidProxy], onError: () => {} })).toThrow(
      "instance method",
    );
    /** An explicitly declared controller can have no endpoints. */
    class Empty {}
    EndpointDeclarations.controller(Empty);
    expect(HttpEndpointMetadata.read(Empty)).toEqual([]);
    const fixture = await LoopbackClient.start({ controllers: [new Empty()] });
    try {
      expect((await LoopbackClient.send(fixture.port)).status).toBe(404);
    } finally {
      await fixture.server.close();
    }
    expect(() => Reflect.apply(ApiBody, undefined, [TextDto, { examples: new Date() }])).toThrow(
      "documentation",
    );
  });
});
