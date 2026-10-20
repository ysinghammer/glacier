// @scenario TRN-008
// @scenario TRN-011
import { describe, expect, it } from "vitest";
import { BrowserConsoleTransport, LoggerFactory } from "../../../index.browser.js";
import type { IConsoleOutput, ILogLevel } from "../../../index.browser.js";

type ConsoleCall = readonly [method: string, args: readonly unknown[]];

class RecordingConsole implements IConsoleOutput {
  readonly calls: ConsoleCall[] = [];
  debug(...data: unknown[]): void {
    this.calls.push(["debug", data]);
  }
  info(...data: unknown[]): void {
    this.calls.push(["info", data]);
  }
  warn(...data: unknown[]): void {
    this.calls.push(["warn", data]);
  }
  error(...data: unknown[]): void {
    this.calls.push(["error", data]);
  }
}

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
