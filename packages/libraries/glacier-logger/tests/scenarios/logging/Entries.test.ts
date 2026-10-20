// @scenario LOG-017
// @scenario LOG-018
import { describe, expect, it } from "vitest";
import { InvalidBindingsError, LoggerFactory } from "../../../index.js";
import type { ILogCall, Logger } from "../../../index.js";
import { FixedClock } from "../../doubles/FixedClock.js";
import { RecordingTransport } from "../../doubles/RecordingTransport.js";

const INSTANT = new Date("2026-01-02T03:04:05.000Z");

function setup(): { transport: RecordingTransport; logger: Logger } {
  const transport = new RecordingTransport();
  const factory = new LoggerFactory({
    level: "trace",
    bindings: { service: "api", region: "eu" },
    clock: new FixedClock(INSTANT),
    transports: [{ transport, format: "json" }],
  });
  const result = factory.createLogger("Orders", { bindings: { region: "us", shard: 3 } });
  if (result.outcome !== "created") {
    throw new Error("expected a created logger");
  }
  return { transport, logger: result.logger };
}

describe("entry normalisation", () => {
  it("fills level, injected time, context, message, bindings and fields", () => {
    const { transport, logger } = setup();

    logger.info({ message: "placed", orderId: 7 });

    expect(transport.entries).toEqual([
      {
        level: "info",
        time: INSTANT,
        context: "Orders",
        message: "placed",
        bindings: { service: "api", region: "us", shard: 3 },
        fields: { orderId: 7 },
      },
    ]);
  });

  it("uses the system clock when none is injected", () => {
    const transport = new RecordingTransport();
    const factory = new LoggerFactory({
      level: "info",
      transports: [{ transport, format: "json" }],
    });
    const result = factory.createLogger("Clocked");
    const before = Date.now();

    if (result.outcome === "created") {
      result.logger.info({ message: "now" });
    }

    const time = transport.entries[0]?.time.getTime() ?? 0;
    expect(time).toBeGreaterThanOrEqual(before);
    expect(time).toBeLessThanOrEqual(Date.now());
  });

  it("accepts an error call without a message and defaults to the error message", () => {
    const { transport, logger } = setup();
    const err = new Error("boom");

    logger.error({ err });

    expect(transport.entries[0]?.message).toBe("boom");
    expect(transport.entries[0]?.error).toMatchObject({ type: "Error", message: "boom" });
    expect(transport.entries[0]?.fields).toEqual({});
  });

  it("keeps an explicit message next to an error", () => {
    const { transport, logger } = setup();
    const err = new Error("boom");

    logger.fatal({ err, message: "crashed", code: 9 });

    expect(transport.entries[0]).toMatchObject({
      message: "crashed",
      error: { type: "Error", message: "boom" },
      fields: { code: 9 },
    });
  });

  it("layers factory bindings, context, child bindings and call fields in that order", () => {
    const { transport, logger } = setup();

    const child = logger.child({ shard: 4, tenant: "t1" });
    child.info({ message: "m", tenant: "call", extra: true });

    const entry = transport.entries[0];
    expect(entry?.context).toBe("Orders");
    expect(entry?.bindings).toEqual({ service: "api", region: "us", shard: 4, tenant: "t1" });
    expect(entry?.fields).toEqual({ tenant: "call", extra: true });
  });

  it("never lets call fields override reserved keys, even when the types are bypassed", () => {
    const { transport, logger } = setup();
    const forged = {
      message: "real",
      level: "fatal",
      time: "yesterday",
      context: "Forged",
      err: undefined,
      kept: 1,
    } as unknown as ILogCall;

    logger.info(forged);

    expect(transport.entries[0]).toEqual({
      level: "info",
      time: INSTANT,
      context: "Orders",
      message: "real",
      bindings: { service: "api", region: "us", shard: 3 },
      fields: { kept: 1 },
    });
  });
});

describe("Logger.child", () => {
  it("keeps the context, merges bindings and leaves the parent unchanged", () => {
    const { transport, logger } = setup();

    const child = logger.child({ request: "r1" });
    logger.info({ message: "parent" });
    child.info({ message: "child" });

    expect(transport.entries[0]?.bindings).toEqual({ service: "api", region: "us", shard: 3 });
    expect(transport.entries[1]?.bindings).toEqual({
      service: "api",
      region: "us",
      shard: 3,
      request: "r1",
    });
    expect(transport.entries.map((entry) => entry.context)).toEqual(["Orders", "Orders"]);
  });

  it("throws InvalidBindingsError for reserved or empty keys that bypass the types", () => {
    const { logger } = setup();
    const bypassed = { level: "x", "": 1 } as unknown as Parameters<Logger["child"]>[0];

    expect(() => logger.child(bypassed)).toThrow(InvalidBindingsError);
    try {
      logger.child(bypassed);
    } catch (error) {
      expect((error as InvalidBindingsError).violations.map((violation) => violation.code)).toEqual(
        ["reserved_binding_key", "empty_binding_key"],
      );
      expect((error as Error).name).toBe("InvalidBindingsError");
    }
  });
});
