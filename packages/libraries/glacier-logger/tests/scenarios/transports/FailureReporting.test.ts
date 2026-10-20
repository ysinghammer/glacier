// @scenario TRN-009
// @scenario TRN-012
// @scenario TRN-013
import { afterEach, describe, expect, it, vi } from "vitest";
import { LoggerFactory, TransportFailureError } from "../../../index.js";
import type { ILoggerConfiguration, ITransport, Logger } from "../../../index.js";
import { IS_NODE } from "../../doubles/RuntimeKind.js";
import { RecordingDiagnostics } from "../../doubles/RecordingDiagnostics.js";
import { ThrowingTransport } from "../../doubles/ThrowingTransport.js";

function loggerFor(configuration: Partial<ILoggerConfiguration>, transport: ITransport): Logger {
  const factory = new LoggerFactory({
    level: "info",
    transports: [{ transport, format: "json" }],
    ...configuration,
  });
  const created = factory.createLogger("Reporting");
  if (created.outcome !== "created") {
    throw new Error("expected a created logger");
  }
  return created.logger;
}

describe("failure reporting", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reports a throwing transport to onError and does not throw to the caller", () => {
    const reported: Error[] = [];
    const logger = loggerFor(
      { onError: (error) => reported.push(error) },
      new ThrowingTransport(new Error("disk full")),
    );

    expect(() => {
      logger.info({ message: "hello" });
    }).not.toThrow();

    expect(reported).toHaveLength(1);
    expect(reported[0]).toBeInstanceOf(TransportFailureError);
    expect(reported[0]?.message).toBe("Transport failed to deliver log output: disk full");
    expect(reported[0]?.cause).toEqual(new Error("disk full"));
  });

  it("wraps a non-error throw with its text", () => {
    const reported: Error[] = [];
    const logger = loggerFor(
      { onError: (error) => reported.push(error) },
      new ThrowingTransport("nope"),
    );

    logger.info({ message: "hello" });

    expect(reported[0]?.message).toBe("Transport failed to deliver log output: nope");
  });

  it("falls back to one diagnostics line when onError itself throws, without looping", () => {
    const diagnostics = new RecordingDiagnostics();
    let handlerCalls = 0;
    const logger = loggerFor(
      {
        diagnostics,
        onError: () => {
          handlerCalls += 1;
          throw new Error("handler broke");
        },
      },
      new ThrowingTransport(new Error("first\nsecond")),
    );

    logger.info({ message: "hello" });

    expect(handlerCalls).toBe(1);
    expect(diagnostics.lines).toEqual([
      "[glacier-logger] Transport failed to deliver log output: first second",
    ]);
  });

  it("drops the report when the diagnostics output also fails", () => {
    const logger = loggerFor(
      { diagnostics: new RecordingDiagnostics(true) },
      new ThrowingTransport(new Error("boom")),
    );

    expect(() => {
      logger.info({ message: "hello" });
    }).not.toThrow();
  });

  it("writes the default line to the diagnostics output without a stack", () => {
    const diagnostics = new RecordingDiagnostics();
    const logger = loggerFor({ diagnostics }, new ThrowingTransport(new Error("boom")));

    logger.info({ message: "hello" });

    expect(diagnostics.lines).toEqual([
      "[glacier-logger] Transport failed to deliver log output: boom",
    ]);
    expect(diagnostics.lines[0]).not.toContain(" at ");
  });

  it.runIf(IS_NODE)("uses stderr by default on Node", () => {
    const written: string[] = [];
    vi.spyOn(process.stderr, "write").mockImplementation((chunk: string | Uint8Array) => {
      written.push(String(chunk));
      return true;
    });
    const logger = loggerFor({}, new ThrowingTransport(new Error("boom")));

    logger.info({ message: "hello" });

    expect(written).toEqual(["[glacier-logger] Transport failed to deliver log output: boom\n"]);
  });

  it.runIf(!IS_NODE)("uses console.error by default in the browser", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const logger = loggerFor({}, new ThrowingTransport(new Error("boom")));

    logger.info({ message: "hello" });

    expect(spy).toHaveBeenCalledWith(
      "[glacier-logger] Transport failed to deliver log output: boom",
    );
  });
});
