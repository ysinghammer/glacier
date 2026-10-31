import { describe, expect, it } from "vitest";
import { ApiPost } from "../../../index.js";
import { EndpointDeclarations } from "../../EndpointDeclarations.js";
import { LoopbackClient } from "../../LoopbackClient.js";

describe("automatic HEAD and OPTIONS protocol contracts", () => {
  it("HEAD runs the GET pipeline and retains actual length/headers without any body bytes", async () => {
    let calls = 0;
    const fixture = await LoopbackClient.start({
      authentication: {
        challenge: { scheme: "Bearer" },
        authenticate: () => {
          calls++;
          return "actor";
        },
      },
    });
    try {
      const get = await LoopbackClient.send(fixture.port, "/json");
      const head = await LoopbackClient.send(fixture.port, "/json", [], "HEAD");
      expect(head.status).toBe(get.status);
      expect(head.fields["content-type"]).toEqual(get.fields["content-type"]);
      expect(head.fields["content-length"]).toEqual(get.fields["content-length"]);
      expect(head.fields["x-request-id"]?.[0]).toMatch(/^[0-9a-f-]{36}$/);
      expect(head.body).toBe("");
      expect(calls).toBe(2);
      fixture.controller.jsonResponse = { invalid: "secret" };
      const failed = await LoopbackClient.send(fixture.port, "/json", [], "HEAD");
      expect(failed.status).toBe(500);
      expect(failed.body).toBe("");
      expect(Number(failed.fields["content-length"]?.[0])).toBeGreaterThan(0);
      const options = await LoopbackClient.send(fixture.port, "/json/", [], "OPTIONS");
      expect(options.status).toBe(204);
      expect(options.body).toBe("");
      expect(options.fields["allow"]).toEqual(["GET, HEAD, OPTIONS"]);
      expect(Object.keys(options.fields).some((key) => key.startsWith("access-control-"))).toBe(
        false,
      );
      expect(calls).toBe(3);
      const unread = await LoopbackClient.send(
        fixture.port,
        "/json",
        ["Content-Length: 100"],
        "OPTIONS",
      );
      expect(unread.status).toBe(204);
      expect(unread.fields["connection"]).toEqual(["close"]);
      expect(calls).toBe(3);
      expect((await LoopbackClient.send(fixture.port, "/missing/path", [], "OPTIONS")).status).toBe(
        404,
      );
    } finally {
      await fixture.server.close();
    }
  });
  it("HEAD errors (401/404/405/400/417) contain no body bytes and unknown methods expose stable Allow", async () => {
    /** Known path without GET deliberately has no automatic HEAD success route. */
    class Controller {
      public post(): void {}
    }
    EndpointDeclarations.controller(Controller);
    EndpointDeclarations.route(Controller, "post", ApiPost("/post"));
    const fixture = await LoopbackClient.start({
      controllers: [new Controller()],
      authentication: { challenge: { scheme: "Bearer" }, authenticate: () => undefined },
    });
    try {
      for (const [path, headers, status] of [
        ["/post", [], 405],
        ["/unknown", [], 404],
        ["/bad%2fpath", [], 400],
        ["/post", ["Expect: nope"], 417],
      ] as const) {
        const result = await LoopbackClient.send(fixture.port, path, headers, "HEAD");
        expect(result.status).toBe(status);
        expect(result.body).toBe("");
      }
      const method = await LoopbackClient.send(fixture.port, "/post", [], "TRACE");
      expect(method.status).toBe(405);
      expect(method.fields["allow"]).toEqual(["POST, OPTIONS"]);
    } finally {
      await fixture.server.close();
    }
    const protectedFixture = await LoopbackClient.start({
      authentication: { challenge: { scheme: "Bearer" }, authenticate: () => undefined },
    });
    try {
      const head = await LoopbackClient.send(protectedFixture.port, "/json", [], "HEAD");
      expect(head.status).toBe(401);
      expect(head.body).toBe("");
      expect(head.fields["www-authenticate"]).toEqual(["Bearer"]);
    } finally {
      await protectedFixture.server.close();
    }
  });
});
