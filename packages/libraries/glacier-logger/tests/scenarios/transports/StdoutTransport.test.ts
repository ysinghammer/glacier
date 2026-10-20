// @scenario TRN-001
// @scenario TRN-002
// @scenario TRN-003
// @scenario TRN-014
// @scenario TRN-015
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LoggerFactory, NodeStdoutTransport, TransportFailureError } from "../../../index.js";
import type { ILoggerConfiguration, Logger } from "../../../index.js";
import { FakeProcessHost } from "../../doubles/FakeProcessHost.js";
import { IS_NODE } from "../../doubles/RuntimeKind.js";

interface IStdoutSetup {
  readonly host: FakeProcessHost;
  readonly factory: LoggerFactory;
  readonly logger: Logger;
}

function setup(
  options: ConstructorParameters<typeof NodeStdoutTransport>[0] = {},
  configuration: Partial<ILoggerConfiguration> = {},
): IStdoutSetup {
  const host = new FakeProcessHost();
  const factory = new LoggerFactory({
    level: "info",
    transports: [{ transport: new NodeStdoutTransport({ host, ...options }), format: "json" }],
    ...configuration,
  });
  const created = factory.createLogger("Stdout");
  if (created.outcome !== "created") {
    throw new Error("expected a created logger");
  }
  return { host, factory, logger: created.logger };
}

function messagesOf(chunks: readonly string[]): string[] {
  return chunks
    .join("")
    .split("\n")
    .filter((line) => line !== "")
    .map((line) => String((JSON.parse(line) as { message: unknown }).message));
}

describe("buffered stdout transport", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("holds lines below the threshold until the timer fires", async () => {
    const { host, logger } = setup();

    logger.info({ message: "first" });
    logger.info({ message: "second" });
    await vi.advanceTimersByTimeAsync(99);
    expect(host.stdout.chunks).toEqual([]);
    await vi.advanceTimersByTimeAsync(1);

    expect(host.stdout.chunks).toHaveLength(1);
    expect(messagesOf(host.stdout.chunks)).toEqual(["first", "second"]);
  });

  it("writes pending lines immediately when flushed and nothing when idle", async () => {
    const { host, factory, logger } = setup();

    await factory.flush();
    expect(host.stdout.chunks).toEqual([]);
    logger.info({ message: "now" });
    await factory.flush();

    expect(messagesOf(host.stdout.chunks)).toEqual(["now"]);
    await vi.advanceTimersByTimeAsync(1000);
    expect(host.stdout.chunks).toHaveLength(1);
  });

  it("honours a configured flush interval", async () => {
    const { host, logger } = setup({ flushIntervalMs: 10 });

    logger.info({ message: "quick" });
    await vi.advanceTimersByTimeAsync(10);

    expect(messagesOf(host.stdout.chunks)).toEqual(["quick"]);
  });

  it("writes without waiting for the timer once the buffer reaches the byte limit", async () => {
    const { host, logger } = setup({ maxBufferBytes: 200 });

    logger.info({ message: "small" });
    await vi.advanceTimersByTimeAsync(0);
    expect(host.stdout.chunks).toEqual([]);
    logger.info({ message: "x".repeat(150) });
    await vi.advanceTimersByTimeAsync(0);

    expect(host.stdout.chunks).toHaveLength(1);
    expect(host.stdout.chunks[0]?.length).toBeGreaterThanOrEqual(200);
  });

  it("uses a 4 KB limit by default and counts bytes rather than characters", async () => {
    const { host, logger } = setup();

    logger.info({ message: "é".repeat(1500) });
    await vi.advanceTimersByTimeAsync(0);
    expect(host.stdout.chunks).toEqual([]);
    logger.info({ message: "é".repeat(700) });
    await vi.advanceTimersByTimeAsync(0);

    expect(host.stdout.chunks).toHaveLength(1);
  });

  it("keeps line order across flushes and waits for the stream before the next write", async () => {
    const { host, factory, logger } = setup();
    host.stdout.isHolding = true;

    logger.info({ message: "one" });
    const firstFlush = factory.flush();
    await vi.advanceTimersByTimeAsync(0);
    logger.info({ message: "two" });
    const secondFlush = factory.flush();
    logger.info({ message: "three" });
    await vi.advanceTimersByTimeAsync(0);
    expect(messagesOf(host.stdout.chunks)).toEqual(["one"]);

    host.stdout.releaseHeld();
    await Promise.all([firstFlush, secondFlush]);

    expect(host.stdout.chunks).toHaveLength(2);
    expect(messagesOf(host.stdout.chunks)).toEqual(["one", "two", "three"]);
  });

  it("writes lines that arrive during a write with the next timer", async () => {
    const { host, factory, logger } = setup();
    host.stdout.isHolding = true;

    logger.info({ message: "one" });
    const flush = factory.flush();
    await vi.advanceTimersByTimeAsync(0);
    logger.info({ message: "two" });
    host.stdout.releaseHeld();
    await flush;
    expect(messagesOf(host.stdout.chunks)).toEqual(["one"]);
    await vi.advanceTimersByTimeAsync(100);

    expect(messagesOf(host.stdout.chunks)).toEqual(["one", "two"]);
  });

  it("writes pretty lines with a trailing newline", async () => {
    const host = new FakeProcessHost();
    const factory = new LoggerFactory({
      level: "info",
      transports: [{ transport: new NodeStdoutTransport({ host }), format: "pretty" }],
    });
    const created = factory.createLogger("Stdout");
    if (created.outcome !== "created") {
      throw new Error("expected a created logger");
    }

    created.logger.info({ message: "hello" });
    await factory.flush();

    expect(host.stdout.chunks[0]).toMatch(/INFO {2}\[Stdout\] hello\n$/);
  });

  it("reports a failing stream write to onError without throwing to the caller", async () => {
    const reported: Error[] = [];
    const { host, factory, logger } = setup({}, { onError: (error) => reported.push(error) });
    host.stdout.failure = new Error("EPIPE");

    expect(() => {
      logger.info({ message: "lost" });
    }).not.toThrow();
    await factory.flush();

    expect(reported).toHaveLength(1);
    expect(reported[0]).toBeInstanceOf(TransportFailureError);
    expect(reported[0]?.message).toBe("Transport failed to deliver log output: EPIPE");
  });

  it("rejects buffering options that are not positive integers", () => {
    const host = new FakeProcessHost();

    expect(() => new NodeStdoutTransport({ host, maxBufferBytes: 0 })).toThrow(RangeError);
    expect(() => new NodeStdoutTransport({ host, flushIntervalMs: 1.5 })).toThrow(
      "flushIntervalMs must be a positive integer, received 1.5",
    );
  });

  it.runIf(IS_NODE)("targets the running process when no host is given", () => {
    expect(() => new NodeStdoutTransport()).not.toThrow();
  });

  it.runIf(!IS_NODE)("refuses to start outside Node without a host", () => {
    expect(() => new NodeStdoutTransport()).toThrow("Node transports need a Node.js process");
  });
});
