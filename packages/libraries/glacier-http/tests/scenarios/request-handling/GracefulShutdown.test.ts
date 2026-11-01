import { describe, expect, it } from "vitest";
import { once } from "node:events";
import { createConnection } from "node:net";
import { ApiGet, ApiRequest, HttpServer, HttpResponse } from "../../../index.js";
import type { HttpRequest, IHttpErrorContext, IHttpResponseLogRecord } from "../../../index.js";
import { Deferred } from "../../Deferred.js";
import { LoopbackClient } from "../../LoopbackClient.js";
import { EndpointDeclarations } from "../../EndpointDeclarations.js";
import { TextDto } from "../../data/TextDto.js";

describe("whole-resource shutdown deadline", () => {
  it("an invoked controller cooperates with forced shutdown; aborted transport cannot account a late body as handed off", async () => {
    const entered = new Deferred<HttpRequest>();
    const acknowledged = new Deferred<void>();
    const logged = new Deferred<IHttpResponseLogRecord>();
    /** Application-owned controller explicitly cooperates; HTTP does not forcibly settle its promise. */
    class Controller {
      /**
       * Waits for request cancellation before returning a late response.
       * @param request Server-created request whose abort signal coordinates shutdown.
       * @returns Promise fulfilled with the late response after abort acknowledgment.
       */
      public async value(request: HttpRequest): Promise<HttpResponse<TextDto>> {
        entered.resolve(request);
        await once(request.signal, "abort");
        acknowledged.resolve();
        return HttpResponse.json({ text: "late" });
      }
    }
    EndpointDeclarations.controller(Controller);
    EndpointDeclarations.route(Controller, "value", ApiGet("/slow"), {
      status: 200,
      type: TextDto,
    });
    ApiRequest()(Controller.prototype, "value", 0);
    const fixture = await LoopbackClient.start({
      controllers: [new Controller()],
      limits: { shutdownTimeoutMs: 40 },
      onResponseLog: (record) => {
        logged.resolve(record);
      },
    });
    const socket = createConnection({ host: "127.0.0.1", port: fixture.port });
    try {
      await once(socket, "connect");
      socket.write("GET /slow HTTP/1.1\r\nHost: localhost\r\n\r\n");
      const request = await entered.promise;
      await expect(fixture.server.close()).rejects.toThrow("drain timed out");
      await acknowledged.promise;
      expect(request.signal.aborted).toBe(true);
      const record = await logged.promise;
      expect(record).toMatchObject({
        requestId: request.requestId,
        bodyBytes: 0,
        outcome: "disconnected",
      });
      expect(record).not.toHaveProperty("status");
      expect(fixture.server.address()).toBeUndefined();
    } finally {
      socket.destroy();
    }
  });
  it("drains an active response and its subsequent logging before application dependencies can be disposed", async () => {
    const entered = new Deferred<HttpRequest>();
    const release = new Deferred<string>();
    const logEntered = new Deferred<void>();
    const logRelease = new Deferred<void>();
    const fixture = await LoopbackClient.start({
      authentication: {
        challenge: { scheme: "Bearer" },
        authenticate: (request) => {
          entered.resolve(request);
          return release.promise;
        },
      },
      onResponseLog: () => {
        logEntered.resolve();
        return logRelease.promise;
      },
    });
    const response = LoopbackClient.send(fixture.port);
    const request = await entered.promise;
    let canDispose = false;
    const closed = fixture.server.close().then(() => {
      canDispose = true;
    });
    try {
      expect(fixture.server.address()).toBeUndefined();
      expect(fixture.server.close()).not.toBe(closed);
      expect(canDispose).toBe(false);
      expect(request.signal.aborted).toBe(false);
      await expect(LoopbackClient.send(fixture.port)).rejects.toThrow();
      release.resolve("actor");
      expect((await response).status).toBe(204);
      await logEntered.promise;
      expect(canDispose).toBe(false);
      logRelease.resolve();
      await closed;
      expect(canDispose).toBe(true);
      expect(request.signal.aborted).toBe(false);
    } finally {
      release.resolve("actor");
      logRelease.resolve();
      await closed;
    }
  });

  it("a partial header socket closes within the single budget whether native idle cleanup or forced cleanup wins", async () => {
    const diagnostics: IHttpErrorContext[] = [];
    const fixture = await LoopbackClient.start({
      limits: { shutdownTimeoutMs: 40 },
      onError: (error, context) => {
        void error;
        diagnostics.push(context);
      },
    });
    const socket = createConnection({ host: "127.0.0.1", port: fixture.port });
    socket.on("error", (error) => {
      expect(error).toMatchObject({ code: "ECONNRESET" });
    });
    try {
      await once(socket, "connect");
      socket.write("GET /echo HTTP/1.1\r\nHost:");
      const ended = new Promise<void>((resolve) => {
        socket.once("close", () => resolve());
      });
      const startedAt = performance.now();
      const closing = fixture.server.close();
      const failure = await closing.then(
        () => undefined,
        (error: unknown) => error,
      );
      await ended;
      expect(performance.now() - startedAt).toBeLessThan(1000);
      if (failure === undefined) {
        expect(diagnostics).toEqual([]);
        await closing;
      } else {
        expect(failure).toBeInstanceOf(Error);
        expect(String(failure)).toContain("drain timed out");
        expect(diagnostics).toEqual([{ phase: "shutdown" }]);
        await expect(fixture.server.close()).rejects.toThrow("drain timed out");
      }
      expect(fixture.server.address()).toBeUndefined();
    } finally {
      socket.destroy();
    }
  });

  it("new pipelined work after close is not accepted on an existing active connection", async () => {
    const entered = new Deferred<HttpRequest>();
    const release = new Deferred<string>();
    let calls = 0;
    const fixture = await LoopbackClient.start({
      authentication: {
        challenge: { scheme: "Bearer" },
        authenticate: (request) => {
          calls++;
          entered.resolve(request);
          return release.promise;
        },
      },
    });
    const socket = createConnection({ host: "127.0.0.1", port: fixture.port });
    try {
      await once(socket, "connect");
      socket.write("GET /echo HTTP/1.1\r\nHost: localhost\r\n\r\n");
      const request = await entered.promise;
      const aborted = once(request.signal, "abort");
      const closing = fixture.server.close();
      socket.write("GET /echo HTTP/1.1\r\nHost: localhost\r\n\r\n");
      await aborted;
      expect(calls).toBe(1);
      release.resolve("actor");
      await closing;
      expect(fixture.server.address()).toBeUndefined();
    } finally {
      socket.destroy();
      release.resolve("actor");
      await fixture.server.close();
    }
  });

  it("forced shutdown aborts a cooperative request but does not pretend an arbitrary authentication promise settled", async () => {
    const entered = new Deferred<HttpRequest>();
    const release = new Deferred<string>();
    const lateFailure = new Deferred<IHttpErrorContext>();
    const diagnostics: IHttpErrorContext[] = [];
    const fixture = await LoopbackClient.start({
      limits: { shutdownTimeoutMs: 40 },
      authentication: {
        challenge: { scheme: "Bearer" },
        authenticate: async (request) => {
          entered.resolve(request);
          await release.promise;
          throw new Error("late-private-auth");
        },
      },
      onError: (error, context) => {
        void error;
        diagnostics.push(context);
        if (context.phase === "authentication") lateFailure.resolve(context);
      },
    });
    const socket = createConnection({ host: "127.0.0.1", port: fixture.port });
    try {
      await once(socket, "connect");
      socket.write("GET /echo HTTP/1.1\r\nHost: localhost\r\n\r\n");
      const request = await entered.promise;
      const aborted = once(request.signal, "abort");
      await expect(fixture.server.close()).rejects.toThrow("drain timed out");
      await aborted;
      expect(request.signal.aborted).toBe(true);
      expect(diagnostics).toEqual([{ phase: "shutdown" }]);
      release.resolve("actor");
      expect(await lateFailure.promise).toMatchObject({
        phase: "authentication",
        requestId: request.requestId,
      });
      expect(diagnostics).toHaveLength(2);
    } finally {
      socket.destroy();
      release.resolve("actor");
    }
  });

  it("disconnected unresolved work is still tracked even when the native listener has no sockets left", async () => {
    const entered = new Deferred<HttpRequest>();
    const release = new Deferred<string>();
    const fixture = await LoopbackClient.start({
      limits: { shutdownTimeoutMs: 40 },
      authentication: {
        challenge: { scheme: "Bearer" },
        authenticate: (request) => {
          entered.resolve(request);
          return release.promise;
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
      await expect(fixture.server.close()).rejects.toThrow("drain timed out");
    } finally {
      socket.destroy();
      release.resolve("actor");
    }
  });

  it("close before listen remains idempotent without automatic process signal listeners", async () => {
    const before = [process.listenerCount("SIGINT"), process.listenerCount("SIGTERM")];
    const server = HttpServer.create({ controllers: [], onError: () => {} });
    await server.close();
    expect([process.listenerCount("SIGINT"), process.listenerCount("SIGTERM")]).toEqual(before);
  });
});
