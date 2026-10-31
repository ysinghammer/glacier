import { describe, expect, it } from "vitest";
import { once } from "node:events";
import { HttpServer } from "../../../index.js";
import type { IHttpErrorContext, IHttpResponseLogRecord } from "../../../index.js";
import { LoopbackClient } from "../../LoopbackClient.js";
import { Deferred } from "../../Deferred.js";

describe("bounded nonblocking logging and nonrecursive diagnostics", () => {
  it("slow logs do not delay responses, overflow is observable, capacity recovers, and shutdown drains pending work", async () => {
    const release = new Deferred<void>();
    const entered = new Deferred<IHttpResponseLogRecord>();
    const errors: { error: Error; context: IHttpErrorContext }[] = [];
    let calls = 0;
    const fixture = await LoopbackClient.start({
      limits: { pendingResponseLogs: 1 },
      onResponseLog: (record) => {
        calls++;
        entered.resolve(record);
        if (calls === 1) return release.promise;
      },
      onError: (error, context) => {
        errors.push({ error, context });
      },
    });
    try {
      const first = await LoopbackClient.send(fixture.port);
      expect(first.status).toBe(204);
      expect((await entered.promise).requestId).toBe(first.fields["x-request-id"]?.[0]);
      const second = await LoopbackClient.send(fixture.port);
      expect(second.status).toBe(204);
      expect(calls).toBe(1);
      expect(errors).toHaveLength(1);
      expect(errors[0]?.error.message).toBe("HTTP response logging overflow");
      expect(errors[0]?.context).toEqual({
        requestId: second.fields["x-request-id"]?.[0],
        method: "GET",
        route: "/:id",
        phase: "response-logging",
      });
      release.resolve();
      await release.promise;
      expect((await LoopbackClient.send(fixture.port)).status).toBe(204);
      expect(calls).toBe(2);
    } finally {
      release.resolve();
      await fixture.server.close();
    }

    const drainRelease = new Deferred<void>();
    const next = await LoopbackClient.start({ onResponseLog: () => drainRelease.promise });
    expect((await LoopbackClient.send(next.port)).status).toBe(204);
    let isClosed = false;
    const closing = next.server.close().then(() => {
      isClosed = true;
    });
    await Promise.resolve();
    expect(isClosed).toBe(false);
    drainRelease.resolve();
    await closing;
    expect(isClosed).toBe(true);
  });

  it.each(["throw", "reject"])(
    "%s logging preserves response success and produces one safe-context diagnostic",
    async (mode) => {
      const diagnostic = new Deferred<{ error: Error; context: IHttpErrorContext }>();
      let calls = 0;
      const failure = new Error("secret-log-data");
      const fixture = await LoopbackClient.start({
        onResponseLog: () => {
          if (mode === "reject") return Promise.reject(failure);
          throw failure;
        },
        onError: (error, context) => {
          calls++;
          diagnostic.resolve({ error, context });
        },
      });
      try {
        const result = await LoopbackClient.send(fixture.port, "/unknown/path?token=secret");
        expect(result.status).toBe(404);
        const observation = await diagnostic.promise;
        expect(observation.error).toBe(failure);
        expect(observation.context).toEqual({
          phase: "response-logging",
          method: "GET",
          requestId: result.fields["x-request-id"]?.[0],
        });
        expect(JSON.stringify(observation.context)).not.toContain("secret");
        expect(calls).toBe(1);
        expect(result.body).not.toContain("secret");
      } finally {
        await fixture.server.close();
      }
    },
  );

  it("finite drain timeout rejects shutdown observably; late rejection remains supervised", async () => {
    const late = new Deferred<void>();
    const diagnostics: { error: Error; context: IHttpErrorContext }[] = [];
    const fixture = await LoopbackClient.start({
      limits: { shutdownTimeoutMs: 20 },
      onResponseLog: async () => {
        await late.promise;
        throw new Error("secret-late");
      },
      onError: (error, context) => {
        diagnostics.push({ error, context });
      },
    });
    try {
      expect((await LoopbackClient.send(fixture.port)).status).toBe(204);
      await expect(fixture.server.close()).rejects.toThrow("logging drain timed out");
      expect(diagnostics[0]?.context).toEqual({ phase: "shutdown" });
      await expect(fixture.server.close()).rejects.toThrow("logging drain timed out");
    } finally {
      late.resolve();
      await late.promise;
    }
    // The rejection reaction is supervised even though the shutdown budget already expired.
    await Promise.resolve();
    await Promise.resolve();
    expect(diagnostics).toHaveLength(2);
    expect(diagnostics[1]?.context.phase).toBe("response-logging");
  });

  it.each(["throw", "reject", "async-success"])(
    "invalid %s diagnostics warn minimally without recursion or secret details",
    async (mode) => {
      let calls = 0;
      const warning = once(process, "warning");
      const fixture = await LoopbackClient.start({
        onResponseLog: () => {
          throw { secret: "log-credential" };
        },
        onError: () => {
          calls++;
          if (mode === "throw") throw new Error("secret-diagnostic");
          if (mode === "reject") return Promise.reject(new Error("secret-diagnostic"));
          return Promise.resolve();
        },
      });
      try {
        expect((await LoopbackClient.send(fixture.port)).status).toBe(204);
        const [result] = await warning;
        expect(result).toMatchObject({
          message:
            mode === "throw"
              ? "HTTP diagnostics failed"
              : mode === "reject"
                ? "HTTP diagnostics rejected"
                : "HTTP diagnostics must be synchronous",
        });
        expect(String(result)).not.toContain("secret");
        expect(calls).toBe(1);
      } finally {
        await fixture.server.close();
      }
    },
  );

  it("rejects invalid logging hooks and nonfinite/zero/fractional logging limits at construction", () => {
    expect(() =>
      Reflect.apply(HttpServer.create, HttpServer, [
        { controllers: [], onError: () => {}, onResponseLog: 1 },
      ]),
    ).toThrow("logging hook");
    for (const key of ["pendingResponseLogs", "shutdownTimeoutMs"])
      for (const value of [0, -1, 1.5, NaN, Infinity, 2_147_483_648])
        expect(() =>
          HttpServer.create({ controllers: [], onError: () => {}, limits: { [key]: value } }),
        ).toThrow("limit");
  });
});
