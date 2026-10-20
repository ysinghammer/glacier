// @scenario TRN-006
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LoggerFactory, NodeFileTransport, NodeStdoutTransport } from "../../../index.js";
import type { Logger } from "../../../index.js";
import { FakeProcessHost } from "../../doubles/FakeProcessHost.js";
import { InMemoryFileSystem } from "../../doubles/InMemoryFileSystem.js";

function stdoutLogger(host: FakeProcessHost): { factory: LoggerFactory; logger: Logger } {
  const factory = new LoggerFactory({
    level: "info",
    transports: [{ transport: new NodeStdoutTransport({ host }), format: "json" }],
  });
  const created = factory.createLogger("Exit");
  if (created.outcome !== "created") {
    throw new Error("expected a created logger");
  }
  return { factory, logger: created.logger };
}

describe("flushing at exit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("registers no process handlers until lines are pending and removes them once drained", async () => {
    const host = new FakeProcessHost();
    const { factory, logger } = stdoutLogger(host);
    expect(host.listenerCount("beforeExit")).toBe(0);

    logger.info({ message: "pending" });
    expect(host.listenerCount("beforeExit")).toBe(1);
    expect(host.listenerCount("SIGINT")).toBe(1);
    expect(host.listenerCount("SIGTERM")).toBe(1);
    await factory.flush();

    expect(host.listenerCount("beforeExit")).toBe(0);
    expect(host.listenerCount("SIGINT")).toBe(0);
    expect(host.listenerCount("SIGTERM")).toBe(0);
  });

  it("registers handlers once for every transport on the same process", async () => {
    const host = new FakeProcessHost();
    const first = stdoutLogger(host);
    const second = stdoutLogger(host);

    first.logger.info({ message: "a" });
    second.logger.info({ message: "b" });
    expect(host.listenerCount("beforeExit")).toBe(1);
    await first.factory.flush();
    expect(host.listenerCount("beforeExit")).toBe(1);
    await second.factory.flush();

    expect(host.listenerCount("beforeExit")).toBe(0);
  });

  it("flushes pending lines on beforeExit", async () => {
    const host = new FakeProcessHost();
    const { logger } = stdoutLogger(host);

    logger.info({ message: "before exit" });
    host.emit("beforeExit");
    await vi.advanceTimersByTimeAsync(0);

    expect(host.stdout.chunks).toHaveLength(1);
    expect(host.listenerCount("beforeExit")).toBe(0);
  });

  it("flushes on a signal and then raises it again so the process terminates", async () => {
    const host = new FakeProcessHost();
    const fileSystem = new InMemoryFileSystem();
    const factory = new LoggerFactory({
      level: "info",
      transports: [
        { transport: new NodeStdoutTransport({ host }), format: "json" },
        {
          transport: new NodeFileTransport({ path: "exit.log", fileSystem, host }),
          format: "json",
        },
      ],
    });
    const created = factory.createLogger("Exit");
    if (created.outcome !== "created") {
      throw new Error("expected a created logger");
    }

    created.logger.error({ message: "interrupted" });
    host.emit("SIGINT");
    await vi.advanceTimersByTimeAsync(0);

    expect(host.stdout.chunks).toHaveLength(1);
    expect(fileSystem.files.get("exit.log")).toContain("interrupted");
    expect(host.raised).toEqual(["SIGINT"]);
    expect(host.listenerCount("SIGINT")).toBe(0);
    expect(host.listenerCount("SIGTERM")).toBe(0);
  });

  it("leaves the signal to other listeners when someone else handles it", async () => {
    const host = new FakeProcessHost();
    host.on("SIGTERM", () => undefined);
    const { logger } = stdoutLogger(host);

    logger.info({ message: "shutting down" });
    host.emit("SIGTERM");
    await vi.advanceTimersByTimeAsync(0);

    expect(host.stdout.chunks).toHaveLength(1);
    expect(host.raised).toEqual([]);
  });

  it("registers its handlers again when new lines arrive after a signal was left to others", async () => {
    const host = new FakeProcessHost();
    host.on("SIGTERM", () => undefined);
    const { factory, logger } = stdoutLogger(host);

    logger.info({ message: "one" });
    host.emit("SIGTERM");
    await vi.advanceTimersByTimeAsync(0);
    logger.info({ message: "two" });

    expect(host.listenerCount("beforeExit")).toBe(1);
    await factory.flush();
    expect(host.stdout.chunks).toHaveLength(2);
  });
});
