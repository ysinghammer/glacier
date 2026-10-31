import { describe, expect, it } from "vitest";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createConnection } from "node:net";
import { once } from "node:events";
import { HttpServer, HttpResponse, ApiController, ApiGet, ApiResponse } from "../../../index.js";
import type { HttpRequest, IHttpErrorContext } from "../../../index.js";
import { LoopbackClient } from "../../LoopbackClient.js";
import { PrimitiveController } from "../../data/PrimitiveController.js";
import { TextDto } from "../../data/TextDto.js";
import { Deferred } from "../../Deferred.js";

describe("explicit minimal lifecycle and necessary controller response slice", () => {
  it("compiled public-root consumers use genuine legacy registration without constructing DTOs", async () => {
    const result = await promisify(execFile)(
      process.execPath,
      [new URL("../../artifacts/compiler/CompiledConsumer.js", import.meta.url).pathname],
      { cwd: new URL("../../../", import.meta.url) },
    );
    const observation = JSON.parse(result.stdout);
    expect(observation).toMatchObject({
      status: 200,
      body: { text: "compiled" },
      cookies: ["compiled=opaque; Path=/; Secure; HttpOnly; SameSite=Lax"],
      isRecorded: true,
      controllerConstructions: 1,
      dtoConstructions: 0,
      diagnosticCount: 0,
    });
    expect(observation.requestId).toMatch(/^[0-9a-f-]{36}$/);
    expect(result.stderr).toBe("");
  });
  it("ordinary distribution import starts no resources and does not activate compiler registration", async () => {
    const script = `void process.stdout; void process.stderr; const before = process.getActiveResourcesInfo(); const metadata = Object.getOwnPropertyDescriptor(Reflect, 'metadata'); await import('@glacier/http'); const after = process.getActiveResourcesInfo(); console.log(JSON.stringify({before, after, inactive: Object.getOwnPropertyDescriptor(Reflect, 'metadata') === metadata}));`;
    const result = await promisify(execFile)(
      process.execPath,
      ["--input-type=module", "-e", script],
      { cwd: new URL("../../../", import.meta.url) },
    );
    const observation = JSON.parse(result.stdout);
    expect(observation.inactive).toBe(true);
    expect(observation.after).toEqual(observation.before);
  });

  it("create has no listener; port zero exposes actual address; close is idempotent and one-use", async () => {
    const server = HttpServer.create({ controllers: [], onError: () => {} });
    expect(server.address()).toBeUndefined();
    await server.close();
    await server.close();
    await expect(server.listen({ port: 0 })).rejects.toThrow("one-use");
    const fixture = await LoopbackClient.start();
    expect(fixture.server.address()).toEqual({ host: "127.0.0.1", port: fixture.port });
    expect(Object.isFrozen(fixture.server.address())).toBe(true);
    await expect(fixture.server.listen({ port: 0 })).rejects.toThrow("one-use");
    await Promise.all([fixture.server.close(), fixture.server.close()]);
    expect(fixture.server.address()).toBeUndefined();
    await fixture.server.close();
    await expect(LoopbackClient.send(fixture.port)).rejects.toThrow();
  });
  it("native host semantics and startup failures remain observable without restart/listener leaks", async () => {
    const first = HttpServer.create({ controllers: [], onError: () => {} });
    await first.listen({ port: 0 });
    const address = first.address();
    if (address === undefined) throw new Error("Missing native address");
    const second = HttpServer.create({ controllers: [], onError: () => {} });
    try {
      await expect(second.listen({ port: address.port })).rejects.toMatchObject({
        code: "EADDRINUSE",
      });
      expect(second.address()).toBeUndefined();
      await second.close();
      await expect(second.listen({ port: 0 })).rejects.toThrow("one-use");
    } finally {
      await first.close();
      await second.close();
    }
  });
  it.each([-1, 65536, 1.5, NaN, Infinity])(
    "rejects invalid port %s without consuming startup",
    async (port) => {
      const server = HttpServer.create({ controllers: [], onError: () => {} });
      await expect(server.listen({ port })).rejects.toThrow();
      await server.listen({ port: 0 });
      await server.close();
    },
  );
  it("unmatched targets skip authentication and matched unsupported methods remain explicit", async () => {
    let calls = 0;
    const fixture = await LoopbackClient.start({
      authentication: {
        authenticate: () => {
          calls++;
          return "actor";
        },
        challenge: { scheme: "Bearer" },
      },
    });
    try {
      expect((await LoopbackClient.send(fixture.port, "/not/a/route")).status).toBe(404);
      const result = await LoopbackClient.send(fixture.port, "/echo", [], "POST");
      expect(result.status).toBe(405);
      expect(result.fields["allow"]).toEqual(["GET, HEAD, OPTIONS"]);
      expect(calls).toBe(0);
    } finally {
      await fixture.server.close();
    }
  });
  it("static auth challenge emits 401 without invoking controllers", async () => {
    const options = {
      authenticate: () => undefined,
      challenge: { scheme: "Bearer", realm: "api" },
    };
    const fixture = await LoopbackClient.start({ authentication: options });
    options.challenge.realm = "mutated";
    try {
      fixture.controller.response = { secret: "never-return" };
      const result = await LoopbackClient.send(fixture.port);
      expect(result.status).toBe(401);
      expect(result.fields["www-authenticate"]).toEqual(['Bearer realm="api"']);
      expect(JSON.parse(result.body)).toMatchObject({
        type: "about:blank",
        title: "Unauthorized",
        status: 401,
      });
      expect(result.body).not.toContain("never-return");
    } finally {
      await fixture.server.close();
    }
  });
  it.each(["empty", "throw", "reject", "non-error"])(
    "translates %s auth failure into safe 500 diagnostics",
    async (kind) => {
      const diagnostics: { error: Error; context: IHttpErrorContext }[] = [];
      const fixture = await LoopbackClient.start({
        authentication: {
          challenge: { scheme: "Bearer" },
          authenticate: () => {
            if (kind === "empty") return "";
            if (kind === "reject") return Promise.reject(new Error("private credentials"));
            if (kind === "non-error") throw { private: "credentials" };
            throw new Error("private credentials");
          },
        },
        onError: (error, context) => {
          diagnostics.push({ error, context });
        },
      });
      try {
        const result = await LoopbackClient.send(fixture.port);
        expect(result.status).toBe(500);
        expect(result.body).not.toContain("credentials");
        expect(diagnostics).toHaveLength(1);
        expect(diagnostics[0]?.error).toBeInstanceOf(Error);
        expect(diagnostics[0]?.context).toMatchObject({
          phase: "authentication",
          route: "/:id",
          method: "GET",
        });
        expect(Object.keys(diagnostics[0]?.context ?? {}).sort()).toEqual([
          "method",
          "phase",
          "requestId",
          "route",
        ]);
      } finally {
        await fixture.server.close();
      }
    },
  );
  it("cooperatively signals disconnect without exposing or forcibly cancelling hook promises", async () => {
    const entered = new Deferred<HttpRequest>();
    const finish = new Deferred<string>();
    const fixture = await LoopbackClient.start({
      authentication: {
        challenge: { scheme: "Bearer" },
        authenticate: (request) => {
          entered.resolve(request);
          return finish.promise;
        },
      },
    });
    const socket = createConnection({ host: "127.0.0.1", port: fixture.port });
    try {
      await once(socket, "connect");
      socket.write("GET /echo HTTP/1.1\r\nHost: localhost\r\n\r\n");
      const request = await entered.promise;
      const aborted = once(request.signal, "abort");
      socket.destroy();
      await aborted;
      expect(request.signal.aborted).toBe(true);
      finish.resolve("actor");
    } finally {
      socket.destroy();
      finish.resolve("actor");
      await fixture.server.close();
    }
  });
  it("observes throwing and rejected diagnostic callbacks with secret-safe warnings", async () => {
    const warning = once(process, "warning");
    const fixture = await LoopbackClient.start({
      authentication: {
        challenge: { scheme: "Bearer" },
        authenticate: () => {
          throw new Error("private");
        },
      },
      onError: () => {
        throw new Error("private diagnostic");
      },
    });
    try {
      expect((await LoopbackClient.send(fixture.port)).status).toBe(500);
      const [error] = await warning;
      expect(error).toMatchObject({ message: "HTTP diagnostics failed" });
    } finally {
      await fixture.server.close();
    }
    const rejectedWarning = once(process, "warning");
    const next = await LoopbackClient.start({
      authentication: { challenge: { scheme: "Bearer" }, authenticate: () => "" },
      onError: () => Promise.reject(new Error("secret")),
    });
    try {
      expect((await LoopbackClient.send(next.port)).status).toBe(500);
      const [error] = await rejectedWarning;
      expect(error).toMatchObject({ message: "HTTP diagnostics rejected" });
    } finally {
      await next.server.close();
    }
  });
  it("rejects response origin/status/DTO/array violations before committing secret fields", async () => {
    const phases: string[] = [];
    const fixture = await LoopbackClient.start({
      onError: (error, context) => {
        void error;
        phases.push(context.phase);
      },
    });
    try {
      for (const value of [
        { text: "raw" },
        Object.create(HttpResponse.prototype),
        HttpResponse.json({ text: "wrong status" }),
      ]) {
        fixture.controller.response = value;
        const result = await LoopbackClient.send(fixture.port);
        expect(result.status).toBe(500);
        expect(result.body).not.toContain("wrong status");
      }
      fixture.controller.jsonResponse = HttpResponse.json(
        { text: 1 },
        { headers: { "X-Secret": "not-committed" } },
      );
      const invalid = await LoopbackClient.send(fixture.port, "/json");
      expect(invalid.status).toBe(500);
      expect(invalid.fields["x-secret"]).toBeUndefined();
      fixture.controller.arrayResponse = HttpResponse.json({ text: "not-array" });
      expect((await LoopbackClient.send(fixture.port, "/array")).status).toBe(500);
      fixture.controller.jsonFailure = new Error("controller private");
      expect((await LoopbackClient.send(fixture.port, "/json")).status).toBe(500);
      expect(phases).toContain("output");
      expect(phases).toContain("controller");
    } finally {
      await fixture.server.close();
    }
  });

  it("validates configuration and static challenges before listening", () => {
    for (const options of [
      { controllers: {}, onError: () => {} },
      { controllers: [], onError: undefined },
      { controllers: [PrimitiveController], onError: () => {} },
      { controllers: [{}], onError: () => {} },
    ]) {
      expect(() => Reflect.apply(HttpServer.create, HttpServer, [options])).toThrow();
    }
    for (const authentication of [
      { authenticate: 1, challenge: { scheme: "Bearer" } },
      { authenticate: () => "id", challenge: { scheme: true } },
      { authenticate: () => "id", challenge: { scheme: "Bearer", realm: 1 } },
      { authenticate: () => "id", challenge: { scheme: "bad scheme" } },
      { authenticate: () => "id", challenge: { scheme: "Bearer", realm: 'bad"realm' } },
    ]) {
      expect(() =>
        Reflect.apply(HttpServer.create, HttpServer, [
          { controllers: [], onError: () => {}, authentication },
        ]),
      ).toThrow();
    }
  });
  it("rejects malformed paths/declarations and invalid decorator sides", () => {
    const existing = Object.getOwnPropertyDescriptor(PrimitiveController.prototype, "value");
    if (existing === undefined) throw new Error("Missing fixture method");
    expect(() => ApiController("/")(PrimitiveController)).toThrow("Duplicate controller");
    expect(() => ApiGet("/")(PrimitiveController.prototype, "value", existing)).toThrow(
      "Duplicate GET",
    );
    expect(() =>
      ApiResponse({ status: 204 })(PrimitiveController.prototype, "value", existing),
    ).toThrow("Duplicate response");
    expect(() => Reflect.apply(ApiController("/"), undefined, [{}])).toThrow();
    for (const path of ["bad", "/bad?query", "/.", "/..", "/bad:parameter", "/bad path", "/\u007f"])
      expect(() => ApiController(path)).toThrow();
    expect(() => Reflect.apply(ApiController, undefined, [1])).toThrow();
    for (const options of [
      { status: 199 },
      { status: 300 },
      { status: 200.5 },
      { status: 205 },
      { status: 200, type: {} },
      { status: 204, type: TextDto },
      { status: 204, isArray: true },
    ])
      expect(() => Reflect.apply(ApiResponse, undefined, [options])).toThrow();
    expect(() =>
      Reflect.apply(ApiGet("/"), undefined, [PrimitiveController, "static", { value: () => {} }]),
    ).toThrow();
    expect(() =>
      Reflect.apply(ApiGet("/"), undefined, [
        PrimitiveController.prototype,
        "accessor",
        { get: () => "value" },
      ]),
    ).toThrow();
    expect(() =>
      Reflect.apply(ApiResponse({ status: 204 }), undefined, [
        PrimitiveController,
        "static",
        { value: () => {} },
      ]),
    ).toThrow();
    expect(() =>
      Reflect.apply(ApiResponse({ status: 204 }), undefined, [
        PrimitiveController.prototype,
        "accessor",
        { get: () => "value" },
      ]),
    ).toThrow();
  });
  it("rejects missing contracts, duplicate/equivalent routes and unbound handler parameters", () => {
    /** Test-owned malformed declarations remain observable through public create. */
    class Controller {
      public value(): unknown {
        return undefined;
      }
      public other(): unknown {
        return undefined;
      }
    }
    const descriptor = Object.getOwnPropertyDescriptor(Controller.prototype, "value");
    const other = Object.getOwnPropertyDescriptor(Controller.prototype, "other");
    if (descriptor === undefined || other === undefined)
      throw new Error("Missing fixture descriptor");
    ApiController("/prefix", { tags: ["test"] })(Controller);
    ApiGet("/:name", { summary: "test" })(Controller.prototype, "value", descriptor);
    expect(() => HttpServer.create({ controllers: [new Controller()], onError: () => {} })).toThrow(
      "Missing",
    );
    ApiResponse({ status: 204 })(Controller.prototype, "value", descriptor);
    ApiGet("/:other")(Controller.prototype, "other", other);
    ApiResponse({ status: 204 })(Controller.prototype, "other", other);
    expect(() => HttpServer.create({ controllers: [new Controller()], onError: () => {} })).toThrow(
      "Duplicate GET",
    );
    /** Parameter names must be unique within a route. */
    class Repeated {
      public value(): void {}
    }
    const repeated = Object.getOwnPropertyDescriptor(Repeated.prototype, "value");
    if (repeated === undefined) throw new Error("Missing fixture method");
    ApiController("/")(Repeated);
    ApiGet("/:id/:id")(Repeated.prototype, "value", repeated);
    ApiResponse({ status: 204 })(Repeated.prototype, "value", repeated);
    expect(() => HttpServer.create({ controllers: [new Repeated()], onError: () => {} })).toThrow(
      "Duplicate route parameter",
    );
    /** Every handler position requires an explicit binder. */
    class NeedsArgument {
      public value(value: string): string {
        return value;
      }
    }
    const parameterized = Object.getOwnPropertyDescriptor(NeedsArgument.prototype, "value");
    if (parameterized === undefined) throw new Error("Missing fixture method");
    ApiController("/")(NeedsArgument);
    ApiGet("/")(NeedsArgument.prototype, "value", parameterized);
    ApiResponse({ status: 204 })(NeedsArgument.prototype, "value", parameterized);
    expect(() =>
      HttpServer.create({ controllers: [new NeedsArgument()], onError: () => {} }),
    ).toThrow("Missing parameter binder");
    Object.defineProperty(NeedsArgument.prototype, "value", { value: 1 });
    expect(() =>
      HttpServer.create({ controllers: [new NeedsArgument()], onError: () => {} }),
    ).toThrow("instance method");
    /** A class without declarations is not a valid controller. */
    class Undeclared {}
    expect(() => HttpServer.create({ controllers: [new Undeclared()], onError: () => {} })).toThrow(
      "Missing",
    );
  });
});
