import { describe, expect, it } from "vitest";
import { BindingController } from "../../data/BindingController.js";
import { LoopbackClient } from "../../LoopbackClient.js";
import { ContinueClient } from "../../ContinueClient.js";

describe("Expect preflight with a client withholding all body bytes", () => {
  it("routing, methods, authentication, length and media rejections never send Continue", async () => {
    const fixture = await LoopbackClient.start({
      controllers: [new BindingController()],
      limits: { bodyBytes: 64 },
      authentication: {
        challenge: { scheme: "Bearer" },
        authenticate: (request) =>
          request.headers.get("authorization") === "yes" ? "actor" : undefined,
      },
    });
    try {
      for (const [path, headers, status] of [
        ["/missing", {}, 404],
        ["/bind/direct", {}, 405],
        ["/bind/body", {}, 401],
        ["/bind/body", { Authorization: "yes", "Content-Length": "65" }, 413],
        ["/bind/body", { Authorization: "yes", "Content-Type": "text/plain" }, 415],
        ["/bind/body", { Authorization: "yes", "Content-Encoding": "gzip" }, 415],
        ["/bind/body", { Authorization: "yes", "Content-Length": "00" }, 400],
      ] as const) {
        const result = await ContinueClient.send(
          fixture.port,
          path,
          '{"count":1,"label":"ok"}',
          headers,
        );
        expect(result.status).toBe(status);
        expect(result.hasContinued).toBe(false);
      }
      const accepted = await ContinueClient.send(
        fixture.port,
        "/bind/body",
        '{"count":1,"label":"ok"}',
        { Authorization: "yes" },
      );
      expect(accepted.hasContinued).toBe(true);
      expect(accepted.status).toBe(200);
      expect(JSON.parse(accepted.body)).toEqual({ count: 1, label: "ok" });
      const unsupported = await ContinueClient.send(fixture.port, "/bind/body", "{}", {
        Expect: "something-else",
      });
      expect(unsupported.status).toBe(417);
      expect(unsupported.hasContinued).toBe(false);
    } finally {
      await fixture.server.close();
    }
  });
  it("a bodyless endpoint sends only the final response and closes, without unnecessary Continue", async () => {
    const fixture = await LoopbackClient.start();
    try {
      const result = await LoopbackClient.raw(
        fixture.port,
        "GET /echo HTTP/1.1\r\nHost: localhost\r\nExpect: 100-continue\r\n\r\n",
      );
      expect(result.status).toBe(204);
      expect(result.fields["connection"]).toEqual(["close"]);
      expect(result.raw).not.toContain("100 Continue");
      const options = await LoopbackClient.raw(
        fixture.port,
        "OPTIONS /echo HTTP/1.1\r\nHost: localhost\r\nExpect: 100-continue\r\n\r\n",
      );
      expect(options.status).toBe(204);
      expect(options.raw).not.toContain("100 Continue");
    } finally {
      await fixture.server.close();
    }
  });
});
