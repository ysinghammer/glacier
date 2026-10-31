import { describe, expect, it } from "vitest";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { ApiGet, ApiMapError, HttpServer, HttpEndpointMetadata } from "../../../index.js";
import type { IHttpErrorContext, IHttpErrorMapping } from "../../../index.js";
import { EndpointDeclarations } from "../../EndpointDeclarations.js";
import { LoopbackClient } from "../../LoopbackClient.js";

/** Application exceptions are class identities, not public payload sources. */
class BusinessError extends Error {}
/** More specific application rejection. */
class SpecificError extends BusinessError {}
/** Deep inheritance makes specificity independent of declaration order. */
class DeepError extends SpecificError {}

describe("static controller-only business mapping precedence", () => {
  it("genuine compiled ApiMapError and logging-exclusion decorators retain mapping ownership in a public-root consumer", async () => {
    const result = await promisify(execFile)(
      process.execPath,
      [new URL("../../artifacts/compiler/CompiledErrors.js", import.meta.url).pathname],
      { cwd: new URL("../../../", import.meta.url) },
    );
    expect(JSON.parse(result.stdout)).toEqual({
      statuses: [409, 503],
      details: ["Static endpoint", "Static controller"],
      logCount: 1,
      diagnosticCount: 1,
      logStatus: 409,
    });
    expect(result.stderr).toBe("");
  });
  it("endpoint beats controller beats global; nearest class wins in the selected scope", async () => {
    /** A shared controller throws application-owned errors from an explicit test source. */
    class Controller {
      failure: unknown = new DeepError("secret-message", { cause: "secret-cause" });
      public local(): never {
        throw this.failure;
      }
      public scoped(): never {
        throw this.failure;
      }
      public global(): never {
        throw this.failure;
      }
    }
    /** Separate controller has only global mappings. */
    class GlobalController {
      public value(): never {
        throw new DeepError("secret");
      }
    }
    EndpointDeclarations.controller(Controller);
    EndpointDeclarations.controller(GlobalController);
    for (const name of ["local", "scoped", "global"])
      EndpointDeclarations.route(Controller, name, ApiGet(`/${name}`));
    EndpointDeclarations.route(GlobalController, "value", ApiGet("/only-global"));
    ApiMapError(BusinessError, { status: 403, title: "Controller rejection" })(Controller);
    ApiMapError(SpecificError, { status: 409, title: "Specific controller rejection" })(Controller);
    const descriptor = EndpointDeclarations.descriptor(Controller, "local");
    ApiMapError(Error, {
      status: 400,
      title: "Endpoint rejection",
      detail: "Static safe detail",
      type: "urn:glacier:rejection",
    })(Controller.prototype, "local", descriptor);
    const controller = new Controller();
    const errors: { error: Error; context: IHttpErrorContext }[] = [];
    const globals: IHttpErrorMapping[] = [
      { error: DeepError, status: 422, title: "Deep global rejection" },
      { error: Error, status: 503, title: "Global unavailable" },
    ];
    const fixture = await LoopbackClient.start({
      controllers: [controller, new GlobalController()],
      errorMappings: globals,
      onError: (error, context) => {
        errors.push({ error, context });
      },
    });
    globals.length = 0;
    try {
      const local = await LoopbackClient.send(fixture.port, "/local");
      expect(JSON.parse(local.body)).toEqual({
        type: "urn:glacier:rejection",
        title: "Endpoint rejection",
        detail: "Static safe detail",
        status: 400,
        requestId: local.fields["x-request-id"]?.[0],
      });
      expect((await LoopbackClient.send(fixture.port, "/scoped")).status).toBe(409);
      expect((await LoopbackClient.send(fixture.port, "/only-global")).status).toBe(422);
      expect(errors).toHaveLength(0);
      controller.failure = new BusinessError("secret");
      expect((await LoopbackClient.send(fixture.port, "/scoped")).status).toBe(403);
      controller.failure = new TypeError("secret");
      const unexpected = await LoopbackClient.send(fixture.port, "/global");
      expect(unexpected.status).toBe(503);
      expect(unexpected.body).not.toContain("secret");
      expect(errors).toHaveLength(1);
      expect(errors[0]?.error).toBe(controller.failure);
      expect(errors[0]?.context).toMatchObject({
        phase: "controller",
        route: "/global",
        requestId: unexpected.fields["x-request-id"]?.[0],
      });
      const registration = fixture.server.registration;
      expect(registration.controllers).toEqual([Controller, GlobalController]);
      expect(registration.errorMappings).toHaveLength(2);
      expect(registration.hasAuthentication).toBe(false);
      expect(Object.isFrozen(registration)).toBe(true);
      expect(Reflect.set(fixture.server, "registration", {})).toBe(false);
      expect(fixture.server.registration).toBe(registration);
      expect(Object.isFrozen(registration.controllers)).toBe(true);
      expect(Object.isFrozen(registration.errorMappings)).toBe(true);
      expect(Object.isFrozen(registration.errorMappings[0])).toBe(true);
      expect(Object.keys(registration).sort()).toEqual([
        "controllers",
        "errorMappings",
        "hasAuthentication",
      ]);
      const metadata = HttpEndpointMetadata.read(Controller);
      expect(
        metadata.find((entry) => entry.handlerName === "local")?.endpointErrorMappings,
      ).toMatchObject([{ error: Error, status: 400 }]);
      expect(metadata[0]?.controllerErrorMappings).toHaveLength(2);
    } finally {
      await fixture.server.close();
    }
  });

  it("inherits controller scope and actual handler scope, without leaking parent endpoint mappings across overrides", async () => {
    /** Base declaration is inherited without controller construction by metadata reads. */
    class Base {
      public value(): never {
        throw new SpecificError("secret");
      }
    }
    /** Unchanged handler inherits its endpoint mapping. */
    class Inherited extends Base {}
    /** Override must redeclare contracts and does not inherit endpoint mappings. */
    class Override extends Base {
      public override value(): never {
        throw new SpecificError("secret");
      }
    }
    EndpointDeclarations.controller(Base);
    EndpointDeclarations.route(Base, "value", ApiGet("/base"));
    ApiMapError(BusinessError, { status: 403, title: "Base scope" })(Base);
    ApiMapError(SpecificError, { status: 409, title: "Base endpoint" })(
      Base.prototype,
      "value",
      EndpointDeclarations.descriptor(Base, "value"),
    );
    EndpointDeclarations.controller(Inherited, "/inherited");
    EndpointDeclarations.controller(Override, "/override");
    EndpointDeclarations.route(Override, "value", ApiGet("/base"));
    const fixture = await LoopbackClient.start({ controllers: [new Inherited(), new Override()] });
    try {
      expect((await LoopbackClient.send(fixture.port, "/inherited/base")).status).toBe(409);
      expect((await LoopbackClient.send(fixture.port, "/override/base")).status).toBe(403);
    } finally {
      await fixture.server.close();
    }
  });

  it("rejects duplicate identities and invalid class, status, static text and absolute type declarations", () => {
    const valid = { error: BusinessError, status: 400, title: "Safe" };
    for (const change of [
      { error: {} },
      { error: class NotError {} },
      { status: 399 },
      { status: 600 },
      { status: 400.5 },
      { title: 1 },
      { title: "" },
      { title: "bad\r\ntext" },
      { detail: 1 },
      { detail: "bad\u0000text" },
      { type: 1 },
      { type: "bad\nuri" },
      { type: "/relative" },
      { type: " https://example.test/problem" },
    ])
      expect(() =>
        Reflect.apply(HttpServer.create, HttpServer, [
          { controllers: [], onError: () => {}, errorMappings: [{ ...valid, ...change }] },
        ]),
      ).toThrow();
    expect(() =>
      Reflect.apply(HttpServer.create, HttpServer, [
        { controllers: [], onError: () => {}, errorMappings: {} },
      ]),
    ).toThrow();
    expect(() =>
      HttpServer.create({
        controllers: [],
        onError: () => {},
        errorMappings: [
          { error: BusinessError, status: 400, title: "First" },
          { error: BusinessError, status: 500, title: "Second" },
        ],
      }),
    ).toThrow("Duplicate error mapping");
    /** Only public decorator target validation is observed. */
    class Controller {
      public value(): void {}
      public static value(): void {}
    }
    const mapping = ApiMapError(BusinessError, { status: 400, title: "Safe" });
    mapping(Controller);
    expect(() => mapping(Controller)).toThrow("Duplicate");
    const descriptor = EndpointDeclarations.descriptor(Controller, "value");
    mapping(Controller.prototype, "value", descriptor);
    expect(() => mapping(Controller.prototype, "value", descriptor)).toThrow("Duplicate");
    for (const args of [
      [{}],
      [Controller.prototype, "value"],
      [Controller, "value", descriptor],
      [Controller.prototype, Symbol("method"), descriptor],
      [Controller.prototype, "value", { get: () => "secret" }],
    ])
      expect(() => Reflect.apply(mapping, undefined, args)).toThrow();
    expect(() => HttpServer.create({ controllers: [new Controller()], onError: () => {} })).toThrow(
      "Missing",
    );
    const metadata = HttpServer.create({
      controllers: [],
      onError: () => {},
      errorMappings: [
        {
          error: Error,
          status: 599,
          title: "Unicode ✓",
          detail: "",
          type: "https://example.test/problem",
        },
      ],
    });
    expect(metadata.registration.errorMappings[0]).toMatchObject({
      detail: "",
      type: "https://example.test/problem",
      status: 599,
    });
  });
});
