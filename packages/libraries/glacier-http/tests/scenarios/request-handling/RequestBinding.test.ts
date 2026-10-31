import { describe, expect, it } from "vitest";
import { BindingController } from "../../data/BindingController.js";
import { LoopbackClient } from "../../LoopbackClient.js";
import { ContinueClient } from "../../ContinueClient.js";
import { HttpServer } from "../../../index.js";
import { createConnection } from "node:net";
import { once } from "node:events";

describe("explicit request-local DTO and direct-value binding", () => {
  it("textual DTOs coerce, nested query scalar arrays promote, and direct binders preserve identity", async () => {
    const fixture = await LoopbackClient.start({
      controllers: [new BindingController()],
      authentication: { challenge: { scheme: "Bearer" }, authenticate: () => "actor" },
    });
    try {
      for (const tags of ["filter[tags]=one", "filter[tags]=one&filter[tags]=two"]) {
        const result = await LoopbackClient.send(
          fixture.port,
          `/bind/42?filter[active]=true&${tags}`,
          ["X-Count: 7", "X-Raw: opaque", "Cookie: id=9; raw=a%2B+b"],
        );
        expect(result.status).toBe(200);
        expect(JSON.parse(result.body).value).toMatchObject({
          id: "42",
          params: { id: 42 },
          query: {
            filter: { active: true, tags: tags.includes("two") ? ["one", "two"] : ["one"] },
          },
          headers: { count: 7 },
          cookies: { id: 9 },
          header: "opaque",
          cookie: "a%2B+b",
          userId: "actor",
          request: {
            method: "GET",
            route: "/bind/:id",
            isAborted: false,
            requestId: result.fields["x-request-id"]?.[0],
          },
        });
      }
      const direct = await LoopbackClient.send(fixture.port, "/bind/direct", ["Cookie: empty="]);
      expect(JSON.parse(direct.body).value).toEqual({ header: null, cookie: "" });
      expect(
        JSON.parse((await LoopbackClient.send(fixture.port, "/bind/direct")).body).value,
      ).toEqual({ header: null, cookie: null });
    } finally {
      await fixture.server.close();
    }
  });
  it("invalid text DTO fields return safe issues at every affected location", async () => {
    const fixture = await LoopbackClient.start({
      controllers: [new BindingController()],
      authentication: { challenge: { scheme: "Bearer" }, authenticate: () => "actor" },
    });
    try {
      const result = await LoopbackClient.send(
        fixture.port,
        "/bind/private-value?filter[active]=private-value&filter[tags]=one",
        ["X-Count: private-value", "Cookie: id=private-value"],
      );
      expect(result.status).toBe(400);
      const issues = JSON.parse(result.body).issues;
      expect(issues.map((issue: { location: string }) => issue.location).sort()).toEqual([
        "cookies",
        "headers",
        "params",
        "query",
      ]);
      for (const issue of issues)
        expect(Object.keys(issue).sort()).toEqual(["code", "location", "path"]);
      expect(result.body).not.toContain("private-value");
      const repeated = await LoopbackClient.send(
        fixture.port,
        "/bind/42?filter[active]=true&filter[active]=false&filter[tags]=one",
        ["X-Count: 1", "Cookie: id=1"],
      );
      expect(repeated.status).toBe(400);
    } finally {
      await fixture.server.close();
    }
  });

  it("JSON is noncoercing, constructor-free, strips unknowns, and accepts UTF-8 JSON and +json only", async () => {
    const fixture = await LoopbackClient.start({
      controllers: [new BindingController()],
      authentication: { challenge: { scheme: "Bearer" }, authenticate: () => "actor" },
    });
    try {
      for (const media of [
        "application/json",
        'application/problem+json; charset="UTF-8"',
        "application/vnd.example+json; charset=utf-8",
      ]) {
        const body = '{"count":201,"label":"héllo","extra":"stripped"}';
        const result = await LoopbackClient.raw(
          fixture.port,
          `POST /bind/body HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\nContent-Type: ${media}\r\nContent-Length: ${Buffer.byteLength(body)}\r\n\r\n${body}`,
        );
        expect(result.status).toBe(201);
        expect(JSON.parse(result.body)).toEqual({ count: 201, label: "héllo" });
      }
      const invalid = await ContinueClient.send(
        fixture.port,
        "/bind/body",
        '{"count":"private-value","label":"reject"}',
      );
      expect(invalid.status).toBe(400);
      expect(JSON.parse(invalid.body).issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ location: "body", path: ["count"] }),
          expect.objectContaining({ location: "body", path: ["label"] }),
        ]),
      );
      expect(invalid.body).not.toContain("private-value");
      expect(invalid.body).not.toContain("private-refinement-detail");
    } finally {
      await fixture.server.close();
    }
  });

  it("empty, malformed, nonobject and invalid UTF-8 bodies fail safely; media, compression and unbound framing reject early", async () => {
    const fixture = await LoopbackClient.start({
      controllers: [new BindingController()],
      authentication: { challenge: { scheme: "Bearer" }, authenticate: () => "actor" },
    });
    try {
      for (const body of ["", " ", "{bad", "null", "[]", "1", '"text"']) {
        const result = await ContinueClient.send(fixture.port, "/bind/body", body);
        expect(result.status).toBe(400);
      }
      for (const media of [
        "text/plain",
        "application/json; charset=latin1",
        "application/json; other=yes",
        "application/notjson",
        "",
      ]) {
        const result = await ContinueClient.send(fixture.port, "/bind/body", "{}", {
          "Content-Type": media,
        });
        expect(result.status).toBe(415);
        expect(result.hasContinued).toBe(false);
      }
      expect((await LoopbackClient.send(fixture.port, "/bind/body", [], "POST")).status).toBe(415);
      expect(
        (
          await LoopbackClient.send(
            fixture.port,
            "/bind/body",
            ["Content-Type: application/json"],
            "POST",
          )
        ).status,
      ).toBe(400);
      const compressed = await ContinueClient.send(fixture.port, "/bind/body", "{}", {
        "Content-Encoding": "identity",
      });
      expect(compressed.status).toBe(415);
      for (const headers of [["Content-Length: 1"]]) {
        expect((await LoopbackClient.send(fixture.port, "/bind/direct", headers)).status).toBe(400);
      }
      const unbound = await LoopbackClient.raw(
        fixture.port,
        "GET /bind/direct HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\nTransfer-Encoding: chunked\r\n\r\n1\r\na\r\n0\r\n\r\n",
      );
      expect(unbound.status).toBe(400);
      const emptyUnbound = await LoopbackClient.raw(
        fixture.port,
        "GET /bind/direct HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\nTransfer-Encoding: chunked\r\n\r\n0\r\n\r\n",
      );
      expect(emptyUnbound.status).toBe(200);
      expect(
        (await LoopbackClient.send(fixture.port, "/bind/direct", ["Content-Encoding: gzip"]))
          .status,
      ).toBe(415);
      const chunked = await LoopbackClient.raw(
        fixture.port,
        "POST /bind/body HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\nContent-Type: application/json\r\nTransfer-Encoding: chunked\r\n\r\n0\r\n\r\n",
      );
      expect(chunked.status).toBe(400);
      const invalidUtf8 = await new Promise<string>((resolve, reject) => {
        const socket = createConnection({ host: "127.0.0.1", port: fixture.port });
        let data = "";
        socket.setEncoding("utf8");
        socket.once("connect", () => {
          socket.write(
            "POST /bind/body HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\nContent-Type: application/json\r\nContent-Length: 2\r\n\r\n",
          );
          socket.write(Buffer.from([0xc3, 0x28]));
        });
        socket.on("data", (chunk: string) => {
          data += chunk;
        });
        socket.once("error", reject);
        socket.once("end", () => resolve(data));
      });
      expect(invalidUtf8).toContain("400 Bad Request");
    } finally {
      await fixture.server.close();
    }
  });

  it("declared and chunked bodies enforce the same finite byte bound; incomplete bodies time out or disconnect", async () => {
    const fixture = await LoopbackClient.start({
      controllers: [new BindingController()],
      limits: { bodyBytes: 24, requestTimeoutMs: 200 },
      authentication: { challenge: { scheme: "Bearer" }, authenticate: () => "actor" },
    });
    try {
      const exact = '{"count":1,"label":"ok"}';
      expect(Buffer.byteLength(exact)).toBe(24);
      expect((await ContinueClient.send(fixture.port, "/bind/body", exact)).status).toBe(200);
      const overflow = await ContinueClient.send(fixture.port, "/bind/body", exact + " ");
      expect(overflow.status).toBe(413);
      expect(overflow.hasContinued).toBe(false);
      const chunked = await LoopbackClient.raw(
        fixture.port,
        `POST /bind/body HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\nContent-Type: application/json\r\nTransfer-Encoding: chunked\r\n\r\n19\r\n${exact} \r\n0\r\n\r\n`,
      );
      expect(chunked.status).toBe(413);
      const timeout = await LoopbackClient.raw(
        fixture.port,
        "POST /bind/body HTTP/1.1\r\nHost: localhost\r\nContent-Type: application/json\r\nContent-Length: 24\r\n\r\n{",
      );
      expect(timeout.raw).not.toContain("200 OK");
      const socket = createConnection({ host: "127.0.0.1", port: fixture.port });
      await once(socket, "connect");
      socket.resume();
      socket.write(
        "POST /bind/body HTTP/1.1\r\nHost: localhost\r\nContent-Type: application/json\r\nContent-Length: 24\r\n\r\n{",
      );
      socket.end();
      await once(socket, "close");
    } finally {
      await fixture.server.close();
    }
    for (const bodyBytes of [0, -1, NaN, Infinity, 1.5, 2_147_483_648])
      expect(() =>
        HttpServer.create({ controllers: [], onError: () => {}, limits: { bodyBytes } }),
      ).toThrow("limit");
  });

  it("concurrent requests reuse the controller but isolate credentials, IDs, query and cancellation signals", async () => {
    const signals = new Set<AbortSignal>();
    let authenticationCalls = 0;
    const fixture = await LoopbackClient.start({
      controllers: [new BindingController()],
      authentication: {
        challenge: { scheme: "Bearer" },
        authenticate: async (request) => {
          signals.add(request.signal);
          authenticationCalls++;
          await Promise.resolve();
          return request.headers.get("authorization");
        },
      },
    });
    try {
      const results = await Promise.all(
        Array.from({ length: 12 }, (_, index) =>
          LoopbackClient.send(
            fixture.port,
            `/bind/${index}?filter[active]=true&filter[tags]=tag${index}`,
            [`Authorization: actor${index}`, `X-Count: ${index}`, `Cookie: id=${index}`],
          ),
        ),
      );
      const requestIds = new Set<string>();
      const controllerCalls = new Set<number>();
      for (const [index, result] of results.entries()) {
        expect(result.status).toBe(200);
        const value = JSON.parse(result.body).value;
        expect(value).toMatchObject({
          id: String(index),
          userId: `actor${index}`,
          params: { id: index },
          query: { filter: { tags: [`tag${index}`] } },
          request: { isAborted: false },
        });
        requestIds.add(value.request.requestId);
        controllerCalls.add(value.controllerCall);
      }
      expect(requestIds.size).toBe(12);
      expect(signals.size).toBe(12);
      expect(authenticationCalls).toBe(12);
      expect([...controllerCalls].sort((left, right) => left - right)).toEqual(
        Array.from({ length: 12 }, (_, index) => index + 1),
      );
    } finally {
      await fixture.server.close();
    }
  });
});
