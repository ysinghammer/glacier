import { describe, expect, it } from "vitest";
import { HttpServer } from "../../../index.js";
import { LoopbackClient } from "../../LoopbackClient.js";

describe("finite construction and transport limits", () => {
  it("rejects invalid bounds for every approved limit, including incompatible receive timeouts", () => {
    for (const limits of [null, false, [], "unbounded"]) {
      expect(() =>
        Reflect.apply(HttpServer.create, HttpServer, [
          { controllers: [], onError: () => {}, limits },
        ]),
      ).toThrow("limits");
    }
    for (const key of [
      "bodyBytes",
      "headerBytes",
      "requestTargetBytes",
      "queryPairs",
      "queryDepth",
      "headersTimeoutMs",
      "requestTimeoutMs",
      "shutdownTimeoutMs",
      "pendingResponseLogs",
    ]) {
      for (const value of [0, -1, 1.5, NaN, Infinity, 2_147_483_648]) {
        expect(() =>
          HttpServer.create({ controllers: [], onError: () => {}, limits: { [key]: value } }),
        ).toThrow("limit");
      }
      for (const value of [null, undefined, "100", false]) {
        expect(() =>
          Reflect.apply(HttpServer.create, HttpServer, [
            { controllers: [], onError: () => {}, limits: { [key]: value } },
          ]),
        ).toThrow("limit");
      }
    }
    expect(() =>
      HttpServer.create({
        controllers: [],
        onError: () => {},
        limits: { headersTimeoutMs: 51, requestTimeoutMs: 50 },
      }),
    ).toThrow("Header receive limit");
  });

  it("configured header bounds preserve more than Node's default header count rather than silently dropping credentials", async () => {
    const fixture = await LoopbackClient.start({
      limits: { headerBytes: 65536 },
      authentication: {
        challenge: { scheme: "Bearer" },
        authenticate: (request) => {
          expect(request.headers.get("authorization")).toBe("Bearer final");
          expect(request.headers.get("x-2001")).toBe("present");
          return "actor";
        },
      },
    });
    try {
      const headers = Array.from({ length: 2002 }, (_, index) => `X-${index}: present`);
      headers.push("Authorization: Bearer final");
      expect((await LoopbackClient.send(fixture.port, "/echo", headers)).status).toBe(204);
      expect(
        (
          await LoopbackClient.send(fixture.port, "/echo", [
            ...headers,
            "Authorization: Bearer duplicate",
          ])
        ).status,
      ).toBe(400);
    } finally {
      await fixture.server.close();
    }
  });

  it("snapshots configurable target, query pair and nesting bounds before normalization", async () => {
    const limits = { requestTargetBytes: 32, queryPairs: 2, queryDepth: 2 };
    const fixture = await LoopbackClient.start({ limits });
    limits.requestTargetBytes = 1000;
    limits.queryPairs = 100;
    limits.queryDepth = 10;
    try {
      expect((await LoopbackClient.send(fixture.port, `/echo?x=${"a".repeat(24)}`)).status).toBe(
        204,
      );
      expect((await LoopbackClient.send(fixture.port, `/echo?x=${"a".repeat(25)}`)).status).toBe(
        414,
      );
      expect((await LoopbackClient.send(fixture.port, "/echo?a=1&b=2")).status).toBe(204);
      expect((await LoopbackClient.send(fixture.port, "/echo?a=1&b=2&c=3")).status).toBe(400);
      expect((await LoopbackClient.send(fixture.port, "/echo?a[b]=1")).status).toBe(204);
      expect((await LoopbackClient.send(fixture.port, "/echo?a[b][c]=1")).status).toBe(400);
    } finally {
      await fixture.server.close();
    }
  });

  it("native header excess returns identity-free 431 without authentication or response logging", async () => {
    let calls = 0;
    const fixture = await LoopbackClient.start({
      limits: { headerBytes: 128 },
      authentication: {
        challenge: { scheme: "Bearer" },
        authenticate: () => {
          calls++;
          return "actor";
        },
      },
      onResponseLog: () => {
        calls++;
      },
    });
    try {
      const response = await LoopbackClient.send(fixture.port, "/echo", [
        `X-Large: ${"s".repeat(256)}`,
      ]);
      expect(response.status).toBe(431);
      expect(response.fields["connection"]).toEqual(["close"]);
      expect(response.fields["x-request-id"]).toBeUndefined();
      expect(response.body).toBe("");
      expect(calls).toBe(0);
      expect((await LoopbackClient.send(fixture.port)).status).toBe(204);
    } finally {
      await fixture.server.close();
    }
  });

  it.each([
    "Content-Length: 1\r\nContent-Length: 2\r\n",
    "Content-Length: 1\r\nTransfer-Encoding: chunked\r\n",
    "Content-Length: -1\r\n",
    "X-Bad: value\u0000\r\n",
  ])(
    "malformed framing closes safely and cannot execute a pipelined successor: %s",
    async (headers) => {
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
        const response = await LoopbackClient.raw(
          fixture.port,
          `GET /echo HTTP/1.1\r\nHost: localhost\r\n${headers}\r\nxGET /echo HTTP/1.1\r\nHost: localhost\r\n\r\n`,
        );
        expect(response.status).toBe(400);
        expect(response.fields["connection"]).toEqual(["close"]);
        expect(response.fields["x-request-id"]).toBeUndefined();
        expect(calls).toBe(0);
        expect((await LoopbackClient.send(fixture.port)).status).toBe(204);
      } finally {
        await fixture.server.close();
      }
    },
  );
  it("unsupported nonchunked transfer framing closes before authentication even when Node emitted an initial request", async () => {
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
      const response = await LoopbackClient.raw(
        fixture.port,
        "POST /echo HTTP/1.1\r\nHost: localhost\r\nTransfer-Encoding: invalid\r\n\r\nxGET /echo HTTP/1.1\r\nHost: localhost\r\n\r\n",
      );
      expect(response.raw).toBe("");
      expect(calls).toBe(0);
    } finally {
      await fixture.server.close();
    }
  });
});
