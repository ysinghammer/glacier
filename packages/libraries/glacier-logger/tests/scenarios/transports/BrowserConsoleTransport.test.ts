// @scenario TRN-008
// @scenario TRN-011
import { describe, expect, it } from "vitest";
import { BrowserConsoleTransport, LoggerFactory } from "../../../index.browser.js";
import type { IConsoleOutput, ILogLevel } from "../../../index.browser.js";

/** Represents one captured console method invocation and its argument list. */
type ConsoleCall = readonly [method: string, args: readonly unknown[]];

/** Captures console method calls for assertions about browser transport delivery. */
class RecordingConsole implements IConsoleOutput {
  /**
   * Readonly array reference of calls received by the console double, in order.
   * @default An empty array
   */
  public readonly calls: ConsoleCall[] = [];

  /**
   * Records data passed to the debug console method.
   * @param data Arguments supplied to the console method.
   * @returns No value; stores a `debug` call in {@link calls}.
   */
  public debug(...data: unknown[]): void {
    this.calls.push(["debug", data]);
  }

  /**
   * Records data passed to the info console method.
   * @param data Arguments supplied to the console method.
   * @returns No value; stores an `info` call in {@link calls}.
   */
  public info(...data: unknown[]): void {
    this.calls.push(["info", data]);
  }

  /**
   * Records data passed to the warn console method.
   * @param data Arguments supplied to the console method.
   * @returns No value; stores a `warn` call in {@link calls}.
   */
  public warn(...data: unknown[]): void {
    this.calls.push(["warn", data]);
  }

  /**
   * Records data passed to the error console method.
   * @param data Arguments supplied to the console method.
   * @returns No value; stores an `error` call in {@link calls}.
   */
  public error(...data: unknown[]): void {
    this.calls.push(["error", data]);
  }
}

/**
 * Creates a logger configured with one browser-console transport.
 * @param format Output representation requested from the transport.
 * @param output Injected console implementation receiving rendered data.
 * @returns The logger creation outcome for the fixed `Browser` context.
 */
function loggerFor(
  format: "json" | "pretty",
  output: IConsoleOutput,
): ReturnType<LoggerFactory["createLogger"]> {
  return new LoggerFactory({
    level: "trace",
    transports: [
      {
        transport: new BrowserConsoleTransport({ console: output }),
        format,
        isColorEnabled: true,
      },
    ],
  }).createLogger("Browser");
}

describe("browser console transport", () => {
  it("keeps injected console records out of serialization and rejects borrowed receivers", () => {
    const output = new RecordingConsole();
    output.info("synthetic-console-secret");
    const transport = new BrowserConsoleTransport({ console: output });
    expect(JSON.stringify(transport)).toBe("{}");
    expect({ ...transport }).toEqual({});
    const borrowed: unknown = Object.create(transport);
    const result = new LoggerFactory({
      level: "info",
      transports: [
        {
          format: "json",
          transport: {
            write(entry, delivery) {
              expect(() => transport.write.call(borrowed, entry, delivery)).toThrow(TypeError);
              transport.write(entry, delivery);
            },
          },
        },
      ],
    }).createLogger("ReceiverSafety");
    if (result.outcome !== "created") throw new Error("Expected logger creation");
    result.logger.info({ message: "valid receiver" });
    expect(output.calls).toHaveLength(2);
  });

  it("maps levels to console methods and passes the entry object in json mode", () => {
    const output = new RecordingConsole();
    const created = loggerFor("json", output);
    if (created.outcome !== "created") {
      throw new Error("expected a created logger");
    }
    const levels: readonly ILogLevel[] = ["trace", "debug", "info", "warn", "error", "fatal"];
    for (const level of levels) {
      created.logger[level]({ message: level });
    }

    expect(output.calls.map(([method]) => method)).toEqual([
      "debug",
      "debug",
      "info",
      "warn",
      "error",
      "error",
    ]);
    const [, args] = output.calls[2] ?? ["", []];
    expect(args).toHaveLength(1);
    expect(args[0]).toMatchObject({ level: "info", message: "info" });
  });

  it("passes the styled format string and styles in pretty mode", () => {
    const output = new RecordingConsole();
    const created = loggerFor("pretty", output);
    if (created.outcome !== "created") {
      throw new Error("expected a created logger");
    }
    created.logger.info({ message: "hello" });

    const [method, args] = output.calls[0] ?? ["", []];
    expect(method).toBe("info");
    expect(typeof args[0]).toBe("string");
    expect(String(args[0])).toContain("%c");
    expect(args.length).toBeGreaterThan(1);
  });

  it("defaults to the global console", () => {
    const original = console.info;
    const seen: unknown[][] = [];
    console.info = (...data: unknown[]) => {
      seen.push(data);
    };
    try {
      const created = new LoggerFactory({
        level: "info",
        transports: [{ transport: new BrowserConsoleTransport(), format: "json" }],
      }).createLogger("Default");
      if (created.outcome !== "created") {
        throw new Error("expected a created logger");
      }
      created.logger.info({ message: "global" });
    } finally {
      console.info = original;
    }

    expect(seen).toHaveLength(1);
  });
});
