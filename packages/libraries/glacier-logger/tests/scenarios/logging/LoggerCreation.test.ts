// @scenario LOG-012
// @scenario LOG-016
import { describe, expect, it } from "vitest";
import { LoggerFactory } from "../../../index.js";
import type { Logger } from "../../../index.js";
import { FixedClock } from "../../doubles/FixedClock.js";
import { RecordingTransport } from "../../doubles/RecordingTransport.js";

const INSTANT = new Date("2026-01-02T03:04:05.000Z");

function createFactory(transport: RecordingTransport): LoggerFactory {
  return new LoggerFactory({
    level: "trace",
    clock: new FixedClock(INSTANT),
    transports: [{ transport, format: "json" }],
  });
}

function loggerOf(factory: LoggerFactory, context: string): Logger {
  const result = factory.createLogger(context);
  if (result.outcome !== "created") {
    throw new Error("expected a created logger");
  }
  return result.logger;
}

describe("LoggerFactory.createLogger", () => {
  it("rejects an empty context", () => {
    const result = createFactory(new RecordingTransport()).createLogger("");

    expect(result).toEqual({
      outcome: "rejected",
      reasons: [{ code: "empty_context", message: "Context must not be empty" }],
    });
  });

  it("rejects bindings with reserved keys", () => {
    const result = createFactory(new RecordingTransport()).createLogger("Svc", {
      bindings: { context: "other", ok: 1 },
    });

    expect(result).toEqual({
      outcome: "rejected",
      reasons: [{ code: "reserved_binding_key", message: 'Binding key "context" is reserved' }],
    });
  });

  it("returns a logger for a valid context", () => {
    const result = createFactory(new RecordingTransport()).createLogger("UserService");

    expect(result.outcome).toBe("created");
    expect(result.outcome === "created" && typeof result.logger.info).toBe("function");
  });

  it("reports empty context and bad bindings together", () => {
    const result = createFactory(new RecordingTransport()).createLogger("", {
      bindings: { err: 1 },
    });

    expect(result.outcome === "rejected" && result.reasons.map((reason) => reason.code)).toEqual([
      "empty_context",
      "reserved_binding_key",
    ]);
  });

  it("gives loggers with different contexts distinct context values", () => {
    const transport = new RecordingTransport();
    const factory = createFactory(transport);

    loggerOf(factory, "UserService").info({ message: "a" });
    loggerOf(factory, "OrderService").info({ message: "b" });

    expect(transport.entries.map((entry) => entry.context)).toEqual([
      "UserService",
      "OrderService",
    ]);
  });
});

describe("LoggerFactory.flush", () => {
  it("flushes transports that support it and tolerates those that do not", async () => {
    const flushable = new RecordingTransport();
    const factory = new LoggerFactory({
      level: "info",
      transports: [
        { transport: flushable, format: "json" },
        { transport: { write: () => undefined }, format: "json" },
      ],
    });

    await factory.flush();

    expect(flushable.flushCount).toBe(1);
  });
});
