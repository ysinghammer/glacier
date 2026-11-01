import { describe, expect, it } from "vitest";
import { ApiController, ApiGet, ApiPublic, ApiUserId, HttpServer } from "../../../index.js";
import { BindingController } from "../../data/BindingController.js";
import { LoopbackClient } from "../../LoopbackClient.js";
import { EndpointDeclarations } from "../../EndpointDeclarations.js";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

describe("protected and public authentication precedes body work", () => {
  it("genuine compiled decorators preserve default argument positions, reject incompatible UserId and bind JSON without constructing DTOs", async () => {
    const result = await promisify(execFile)(
      process.execPath,
      [new URL("../../artifacts/compiler/CompiledBindings.js", import.meta.url).pathname],
      { cwd: new URL("../../../", import.meta.url) },
    );
    expect(JSON.parse(result.stdout)).toEqual({
      status: 200,
      body: '{"count":3}',
      isWrongRejected: true,
      parameterCount: 2,
      dtoConstructions: 0,
    });
    expect(result.stderr).toBe("");
  });
  it("auth is called exactly once before protected body rejection, and public routes skip it", async () => {
    let calls = 0;
    const fixture = await LoopbackClient.start({
      controllers: [new BindingController()],
      authentication: {
        challenge: { scheme: "Bearer", realm: "api" },
        authenticate: () => {
          calls++;
          return undefined;
        },
      },
    });
    try {
      const protectedResult = await LoopbackClient.raw(
        fixture.port,
        "POST /bind/body HTTP/1.1\r\nHost: localhost\r\nContent-Type: text/plain\r\nContent-Length: 100\r\n\r\n",
      );
      expect(protectedResult.status).toBe(401);
      expect(protectedResult.fields["www-authenticate"]).toEqual(['Bearer realm="api"']);
      expect(calls).toBe(1);
      const publicResult = await LoopbackClient.send(
        fixture.port,
        "/bind/public",
        ["Content-Type: text/plain", "Content-Length: 100"],
        "POST",
      );
      expect(publicResult.status).toBe(415);
      expect(calls).toBe(1);
      expect((await LoopbackClient.send(fixture.port, "/bind/public", [], "OPTIONS")).status).toBe(
        204,
      );
      expect(calls).toBe(1);
    } finally {
      await fixture.server.close();
    }
  });
  it("UserId on unprotected/public methods fails synchronously before listen", () => {
    expect(() =>
      HttpServer.create({ controllers: [new BindingController()], onError: () => {} }),
    ).toThrow("authentication");
    /** Test-owned incompatible public binder declarations. */
    class PublicController {
      /**
       * Accepts the path id while its public binder declaration is intentionally invalid.
       * @param id String route identifier.
       * @returns No value; the method exists only for construction validation.
       */
      public handler(id: string): void {
        void id;
      }
    }
    ApiController("/")(PublicController);
    EndpointDeclarations.route(PublicController, "handler", ApiGet("/"));
    ApiUserId()(PublicController.prototype, "handler", 0);
    ApiPublic()(
      PublicController.prototype,
      "handler",
      EndpointDeclarations.descriptor(PublicController, "handler"),
    );
    expect(() =>
      HttpServer.create({
        controllers: [new PublicController()],
        authentication: { challenge: { scheme: "Bearer" }, authenticate: () => "id" },
        onError: () => {},
      }),
    ).toThrow("protected");
  });
});
