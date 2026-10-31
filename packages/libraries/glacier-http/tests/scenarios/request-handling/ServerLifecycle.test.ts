import { describe, expect, it } from "vitest";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { HttpServer } from "../../../index.js";
import type { IHttpErrorContext } from "../../../index.js";
import { LoopbackClient } from "../../LoopbackClient.js";
import { PrimitiveController } from "../../data/PrimitiveController.js";

describe("one-use native resource lifecycle", () => {
  it("an isolated public-root process exits after successful closure, bind failure and concurrent startup cancellation", async () => {
    const script = `
      import { HttpServer } from '@glacier/http';
      const phases = [];
      const first = HttpServer.create({ controllers: [], onError: () => {} });
      await first.listen({ host: '127.0.0.1', port: 0 });
      const failed = HttpServer.create({ controllers: [], onError: (error, context) => { phases.push(context.phase); } });
      let code;
      try { await failed.listen({ host: '127.0.0.1', port: first.address().port }); }
      catch (error) { code = error.code; }
      const cancelled = HttpServer.create({ controllers: [], onError: (error, context) => { phases.push(context.phase); } });
      const startup = cancelled.listen({ host: '127.0.0.1', port: 0 }).catch(error => error.message);
      await cancelled.close();
      const cancellation = await startup;
      await Promise.all([first.close(), failed.close()]);
      console.log(JSON.stringify({ code, cancellation, phases, closed: [first, failed, cancelled].every(server => server.address() === undefined) }));
    `;
    const result = await promisify(execFile)(
      process.execPath,
      ["--input-type=module", "-e", script],
      { cwd: new URL("../../../", import.meta.url), timeout: 5000 },
    );
    expect(JSON.parse(result.stdout)).toEqual({
      code: "EADDRINUSE",
      cancellation: "HTTP startup cancelled",
      phases: ["startup", "startup"],
      closed: true,
    });
    expect(result.stderr).toBe("");
  });
  it("bind failure is diagnostic and releases resources without invoking controller lifecycle", async () => {
    const fixture = await LoopbackClient.start();
    const diagnostics: IHttpErrorContext[] = [];
    /** HTTP must not call application-owned startup or disposal conventions. */
    class Controller extends PrimitiveController {
      /**
       * Rejects accidental application-controller startup invocation.
       * @returns No value; this method always throws.
       * @throws {Error} Always, to expose an invalid lifecycle call.
       */
      public listen(): never {
        throw new Error("controller startup forbidden");
      }
      /**
       * Rejects accidental application-controller close invocation.
       * @returns No value; this method always throws.
       * @throws {Error} Always, to expose an invalid lifecycle call.
       */
      public close(): never {
        throw new Error("controller close forbidden");
      }
      /**
       * Rejects accidental application-controller destruction invocation.
       * @returns No value; this method always throws.
       * @throws {Error} Always, to expose an invalid lifecycle call.
       */
      public destroy(): never {
        throw new Error("controller destruction forbidden");
      }
    }
    const server = HttpServer.create({
      controllers: [new Controller()],
      onError: (error, context) => {
        expect(error).toMatchObject({ code: "EADDRINUSE" });
        diagnostics.push(context);
      },
    });
    try {
      expect(server.address()).toBeUndefined();
      await expect(server.listen({ host: "127.0.0.1", port: fixture.port })).rejects.toMatchObject({
        code: "EADDRINUSE",
      });
      expect(diagnostics).toEqual([{ phase: "startup" }]);
      expect(server.address()).toBeUndefined();
      expect(server.close()).toBe(server.close());
      await server.close();
      await expect(server.listen({ port: 0 })).rejects.toThrow("one-use");
      expect((await LoopbackClient.send(fixture.port)).status).toBe(204);
    } finally {
      await fixture.server.close();
      await server.close();
    }
  });

  it("close during startup cancels listen, remains idempotent and leaves no bound address", async () => {
    const errors: IHttpErrorContext[] = [];
    const server = HttpServer.create({
      controllers: [],
      onError: (error, context) => {
        void error;
        errors.push(context);
      },
    });
    const started = server.listen({ host: "127.0.0.1", port: 0 });
    const rejected = expect(started).rejects.toThrow("startup cancelled");
    const closed = server.close();
    expect(server.close()).toBe(closed);
    await Promise.all([rejected, closed]);
    expect(server.address()).toBeUndefined();
    expect(errors).toEqual([{ phase: "startup" }]);
    await expect(server.listen({ port: 0 })).rejects.toThrow("one-use");
  });

  it("invalid host does not consume startup and closed-before-start creates no resources", async () => {
    const server = HttpServer.create({ controllers: [], onError: () => {} });
    for (const host of ["", 123]) {
      await expect(Reflect.apply(server.listen, server, [{ port: 0, host }])).rejects.toThrow(
        "host",
      );
    }
    await server.listen({ host: "127.0.0.1", port: 0 });
    await server.close();
    const unstarted = HttpServer.create({ controllers: [], onError: () => {} });
    expect(unstarted.close()).toBe(unstarted.close());
    await unstarted.close();
    expect(unstarted.address()).toBeUndefined();
  });
});
