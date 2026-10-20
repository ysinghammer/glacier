// @scenario TRN-007
// @scenario TRN-010
import { describe, expect, it } from "vitest";
import { LoggerFactory, TransportFailureError } from "../../../index.js";
import type { ITransport } from "../../../index.js";
import { RecordingTransport } from "../../doubles/RecordingTransport.js";
import { ThrowingTransport } from "../../doubles/ThrowingTransport.js";
import { WriteOnlyTransport } from "../../doubles/WriteOnlyTransport.js";

describe("factory flush", () => {
  it("drains every transport once and resolves after they finish", async () => {
    const order: string[] = [];
    const slow: ITransport = {
      write: () => undefined,
      flush: async () => {
        await Promise.resolve();
        order.push("slow");
      },
    };
    const recording = new RecordingTransport();
    const factory = new LoggerFactory({
      level: "info",
      transports: [
        { transport: slow, format: "json" },
        { transport: recording, format: "json" },
        { transport: recording, format: "pretty" },
        { transport: new WriteOnlyTransport(), format: "json" },
      ],
    });

    await factory.flush();
    order.push("resolved");

    expect(order).toEqual(["slow", "resolved"]);
    expect(recording.flushCount).toBe(1);
  });

  it("reports failing flushes to onError, still drains the rest and resolves", async () => {
    const reported: Error[] = [];
    const recording = new RecordingTransport();
    const factory = new LoggerFactory({
      level: "info",
      onError: (error) => reported.push(error),
      transports: [
        { transport: new ThrowingTransport(new Error("flush failed")), format: "json" },
        { transport: recording, format: "json" },
      ],
    });

    await expect(factory.flush()).resolves.toBeUndefined();

    expect(reported).toHaveLength(1);
    expect(reported[0]).toBeInstanceOf(TransportFailureError);
    expect(recording.flushCount).toBe(1);
  });
});

describe("third-party transports", () => {
  it("receives entries meeting its minimum level, with a delivery in its registered format", () => {
    const received: { level: string; format: string; text: string }[] = [];
    const custom: ITransport = {
      write: (entry, delivery) => {
        received.push({ level: entry.level, format: delivery.format, text: delivery.text() });
      },
    };
    const factory = new LoggerFactory({
      level: "debug",
      transports: [{ transport: custom, format: "json", level: "warn" }],
    });
    const created = factory.createLogger("Custom");
    if (created.outcome !== "created") {
      throw new Error("expected a created logger");
    }

    created.logger.info({ message: "skipped" });
    created.logger.error({ message: "kept" });

    expect(received).toHaveLength(1);
    expect(received[0]?.level).toBe("error");
    expect(received[0]?.format).toBe("json");
    expect(received[0]?.text).toContain('"message":"kept"');
  });

  it("renders pretty text with a trailing newline and styled output with colour on request", () => {
    const received: { text: string; format: string; styles: readonly string[] }[] = [];
    const custom: ITransport = {
      write: (_entry, delivery) => {
        const styled = delivery.styled();
        received.push({ text: delivery.text(), format: styled.format, styles: styled.styles });
      },
    };
    const factory = new LoggerFactory({
      level: "info",
      transports: [
        { transport: custom, format: "pretty" },
        { transport: custom, format: "pretty", isColorEnabled: true },
      ],
    });
    const created = factory.createLogger("Custom");
    if (created.outcome !== "created") {
      throw new Error("expected a created logger");
    }

    created.logger.info({ message: "hello" });

    expect(received[0]?.text).toMatch(/INFO {2}\[Custom\] hello\n$/);
    expect(received[0]?.styles).toEqual([]);
    expect(received[1]?.format).toContain("%c");
    expect(received[1]?.styles.length).toBeGreaterThan(0);
  });

  it("lets a transport report a late failure through its delivery", () => {
    const reported: Error[] = [];
    const custom: ITransport = {
      write: (_entry, delivery) => {
        delivery.reportError(new Error("late failure"));
      },
    };
    const factory = new LoggerFactory({
      level: "info",
      onError: (error) => reported.push(error),
      transports: [{ transport: custom, format: "json" }],
    });
    const created = factory.createLogger("Custom");
    if (created.outcome !== "created") {
      throw new Error("expected a created logger");
    }

    created.logger.info({ message: "hello" });

    expect(reported.map((error) => error.message)).toEqual(["late failure"]);
  });
});
