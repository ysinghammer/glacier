import { describe, expect, it } from "vitest";
import { createConnection } from "node:net";
import { once } from "node:events";
import { ApiGet, ApiSkipResponseLogging, ApiMapError } from "../../../index.js";
import type { HttpRequest, IHttpResponseLogRecord, IHttpErrorContext } from "../../../index.js";
import { EndpointDeclarations } from "../../EndpointDeclarations.js";
import { LoopbackClient } from "../../LoopbackClient.js";
import { Deferred } from "../../Deferred.js";
import { TextDto } from "../../data/TextDto.js";
import { HttpResponse } from "../../../index.js";

describe("exactly-once native response metadata accounting", () => {
  it("disconnect after headers preserves committed status and counts handed-off bytes, not client-delivered bytes", async () => {
    const text = "x".repeat(16 * 1024 * 1024);
    /** A large validated response exceeds native buffering so a client can disconnect after headers. */
    class Controller {
      public value(): HttpResponse<TextDto> {
        return HttpResponse.json({ text });
      }
    }
    EndpointDeclarations.controller(Controller);
    EndpointDeclarations.route(Controller, "value", ApiGet("/large"), {
      status: 200,
      type: TextDto,
    });
    const logged = new Deferred<IHttpResponseLogRecord>();
    let count = 0;
    const fixture = await LoopbackClient.start({
      controllers: [new Controller()],
      onResponseLog: (record) => {
        count++;
        logged.resolve(record);
      },
    });
    const socket = createConnection({ host: "127.0.0.1", port: fixture.port });
    let receivedBytes = 0;
    try {
      await once(socket, "connect");
      socket.once("data", (chunk: Buffer) => {
        receivedBytes += chunk.length;
        socket.destroy();
      });
      socket.write("GET /large HTTP/1.1\r\nHost: localhost\r\n\r\n");
      const record = await logged.promise;
      expect(record).toMatchObject({
        status: 200,
        route: "/large",
        outcome: "disconnected",
        bodyBytes: Buffer.byteLength(JSON.stringify({ text })),
      });
      expect(record.bodyBytes).toBeGreaterThan(receivedBytes);
      expect(count).toBe(1);
    } finally {
      socket.destroy();
      await fixture.server.close();
    }
  });
  it("logs actual status/bytes and identity without raw target, headers, cookies, request/response bodies or errors", async () => {
    const records: IHttpResponseLogRecord[] = [];
    const fixture = await LoopbackClient.start({
      authentication: { challenge: { scheme: "Bearer" }, authenticate: () => "actor-id" },
      onResponseLog: (record) => {
        records.push(record);
      },
    });
    try {
      const json = await LoopbackClient.send(fixture.port, "/json?token=secret-query", [
        "Authorization: Bearer secret-token",
        "Cookie: token=secret-cookie",
      ]);
      const head = await LoopbackClient.send(fixture.port, "/json", [], "HEAD");
      const empty = await LoopbackClient.send(fixture.port, "/echo");
      const unknown = await LoopbackClient.send(fixture.port, "/unknown/path?secret=value");
      const options = await LoopbackClient.send(fixture.port, "/json", [], "OPTIONS");
      const method = await LoopbackClient.send(fixture.port, "/json", [], "POST");
      const expectFailure = await LoopbackClient.send(fixture.port, "/json", [
        "Expect: not-supported",
      ]);
      const invalid = await LoopbackClient.send(fixture.port, "/json?bad[]=secret");
      const duplicate = await LoopbackClient.send(fixture.port, "/json", [
        "Cookie: token=one; token=secret",
      ]);
      const results = [
        json,
        head,
        empty,
        unknown,
        options,
        method,
        expectFailure,
        invalid,
        duplicate,
      ];
      expect(records).toHaveLength(results.length);
      for (const [index, result] of results.entries()) {
        const record = records[index];
        expect(record).toMatchObject({
          requestId: result.fields["x-request-id"]?.[0],
          status: result.status,
          bodyBytes: Buffer.byteLength(result.body),
          outcome: "completed",
        });
        expect(record?.durationMs).toBeGreaterThanOrEqual(0);
        expect(Object.isFrozen(record)).toBe(true);
        expect(
          Object.keys(record ?? {}).every((key) =>
            [
              "requestId",
              "method",
              "route",
              "userId",
              "status",
              "durationMs",
              "bodyBytes",
              "outcome",
            ].includes(key),
          ),
        ).toBe(true);
      }
      expect(records[0]).toMatchObject({ route: "/json", userId: "actor-id", method: "GET" });
      expect(records[1]).toMatchObject({ method: "HEAD", bodyBytes: 0 });
      expect(records[3]).not.toHaveProperty("route");
      expect(records[3]).not.toHaveProperty("userId");
      expect(records[8]?.route).toBe("/json");
      expect(JSON.stringify(records)).not.toContain("secret");
      expect(JSON.stringify(records)).not.toContain("text");
    } finally {
      await fixture.server.close();
    }
  });

  it("disconnect before headers omits status and reports zero bytes once; later hook failure remains diagnostic", async () => {
    const entered = new Deferred<HttpRequest>();
    const release = new Deferred<void>();
    const logged = new Deferred<IHttpResponseLogRecord>();
    const diagnosed = new Deferred<IHttpErrorContext>();
    let logCount = 0;
    const fixture = await LoopbackClient.start({
      authentication: {
        challenge: { scheme: "Bearer" },
        authenticate: async (request) => {
          entered.resolve(request);
          await release.promise;
          throw new Error("secret-token");
        },
      },
      onResponseLog: (record) => {
        logCount++;
        logged.resolve(record);
      },
      onError: (error, context) => {
        void error;
        diagnosed.resolve(context);
      },
    });
    const socket = createConnection({ host: "127.0.0.1", port: fixture.port });
    const connected = once(socket, "connect");
    try {
      await connected;
      socket.write("GET /echo HTTP/1.1\r\nHost: localhost\r\n\r\n");
      const request = await entered.promise;
      const aborted = once(request.signal, "abort");
      socket.destroy();
      await aborted;
      const record = await logged.promise;
      expect(record).toMatchObject({
        requestId: request.requestId,
        route: "/:id",
        outcome: "disconnected",
        bodyBytes: 0,
      });
      expect(record).not.toHaveProperty("status");
      expect(record).not.toHaveProperty("userId");
      release.resolve();
      expect(await diagnosed.promise).toMatchObject({
        phase: "authentication",
        requestId: request.requestId,
      });
      expect(logCount).toBe(1);
    } finally {
      socket.destroy();
      release.resolve();
      await fixture.server.close();
    }
  });

  it("excluded endpoints skip success, input/auth rejection and disconnect while diagnostics and unmatched logs stay active", async () => {
    /** An application-owned excluded endpoint can deliberately throw a mapped server failure. */
    class Controller {
      public value(): never {
        throw new Error("secret");
      }
    }
    EndpointDeclarations.controller(Controller);
    EndpointDeclarations.route(Controller, "value", ApiGet("/skip"));
    const descriptor = EndpointDeclarations.descriptor(Controller, "value");
    ApiSkipResponseLogging()(Controller.prototype, "value", descriptor);
    ApiMapError(Error, { status: 503, title: "Unavailable" })(Controller);
    const entered = new Deferred<HttpRequest>();
    const release = new Deferred<string>();
    let mode = "missing";
    const logs: IHttpResponseLogRecord[] = [];
    const diagnostics: IHttpErrorContext[] = [];
    const fixture = await LoopbackClient.start({
      controllers: [new Controller()],
      authentication: {
        challenge: { scheme: "Bearer" },
        authenticate: (request) => {
          if (mode === "missing") return undefined;
          if (mode === "disconnect") {
            entered.resolve(request);
            return release.promise;
          }
          return "actor";
        },
      },
      onResponseLog: (record) => {
        logs.push(record);
      },
      onError: (error, context) => {
        void error;
        diagnostics.push(context);
      },
    });
    const socket = createConnection({ host: "127.0.0.1", port: fixture.port });
    const connected = once(socket, "connect");
    try {
      expect((await LoopbackClient.send(fixture.port, "/skip")).status).toBe(401);
      expect(
        (await LoopbackClient.send(fixture.port, "/skip", ["Cookie: a=one; a=secret"])).status,
      ).toBe(400);
      mode = "allowed";
      expect((await LoopbackClient.send(fixture.port, "/skip")).status).toBe(503);
      expect(diagnostics).toHaveLength(1);
      expect(logs).toHaveLength(0);
      expect((await LoopbackClient.send(fixture.port, "/unknown")).status).toBe(404);
      expect(logs).toHaveLength(1);
      mode = "disconnect";
      await connected;
      socket.write("GET /skip HTTP/1.1\r\nHost: localhost\r\n\r\n");
      const request = await entered.promise;
      const aborted = once(request.signal, "abort");
      socket.destroy();
      await aborted;
      release.resolve("actor");
    } finally {
      socket.destroy();
      release.resolve("actor");
      await fixture.server.close();
    }
    expect(logs).toHaveLength(1);
    expect(diagnostics).toHaveLength(2);
  });

  it("excluded successful responses remain unlogged, while unexpected failures retain actual 500 and failed outcome", async () => {
    const records: IHttpResponseLogRecord[] = [];
    /** A simple declared void route can succeed or fail independently of logging exclusion. */
    class Controller {
      public value(): void {}
    }
    EndpointDeclarations.controller(Controller);
    EndpointDeclarations.route(Controller, "value", ApiGet("/skip"));
    ApiSkipResponseLogging()(
      Controller.prototype,
      "value",
      EndpointDeclarations.descriptor(Controller, "value"),
    );
    const fixture = await LoopbackClient.start({
      controllers: [new Controller()],
      onResponseLog: (record) => {
        records.push(record);
      },
    });
    try {
      expect((await LoopbackClient.send(fixture.port, "/skip")).status).toBe(204);
      expect(records).toEqual([]);
    } finally {
      await fixture.server.close();
    }
    const next = await LoopbackClient.start({
      onResponseLog: (record) => {
        records.push(record);
      },
    });
    try {
      next.controller.jsonFailure = new Error("secret");
      const response = await LoopbackClient.send(next.port, "/json");
      expect(records[0]).toMatchObject({
        status: 500,
        outcome: "failed",
        bodyBytes: Buffer.byteLength(response.body),
      });
    } finally {
      await next.server.close();
    }
  });
});
