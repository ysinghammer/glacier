// @scenario LOG-014
import { describe, expect, it } from "vitest";
import { LoggerFactory } from "../../../index.js";
import type { ILogLevel, Logger } from "../../../index.js";
import { RecordingTransport } from "../../doubles/RecordingTransport.js";
import { WriteOnlyTransport } from "../../doubles/WriteOnlyTransport.js";

function loggerWith(factory: LoggerFactory): Logger {
  const result = factory.createLogger("Router");
  if (result.outcome !== "created") {
    throw new Error("expected a created logger");
  }
  return result.logger;
}

function logAllLevels(logger: Logger): void {
  logger.trace({ message: "t" });
  logger.debug({ message: "d" });
  logger.info({ message: "i" });
  logger.warn({ message: "w" });
  logger.error({ message: "e" });
  logger.fatal({ message: "f" });
}

describe("level filtering and routing", () => {
  it("writes nothing below the global level and everything at or above it", () => {
    const transport = new RecordingTransport();
    const factory = new LoggerFactory({
      level: "warn",
      transports: [{ transport, format: "json" }],
    });

    logAllLevels(loggerWith(factory));

    expect(transport.entries.map((entry) => entry.level)).toEqual(["warn", "error", "fatal"]);
  });

  it("routes by per-transport minimum level after the global filter", () => {
    const everything = new RecordingTransport();
    const errorsOnly = new RecordingTransport();
    const belowGlobal = new WriteOnlyTransport();
    const factory = new LoggerFactory({
      level: "info",
      transports: [
        { transport: everything, format: "json" },
        { transport: errorsOnly, format: "pretty", level: "error" },
        { transport: belowGlobal, format: "json", level: "trace" },
      ],
    });

    logAllLevels(loggerWith(factory));

    const levelsOf = (entries: { level: ILogLevel }[]): ILogLevel[] =>
      entries.map((entry) => entry.level);
    expect(levelsOf(everything.entries)).toEqual(["info", "warn", "error", "fatal"]);
    expect(levelsOf(errorsOnly.entries)).toEqual(["error", "fatal"]);
    expect(levelsOf(belowGlobal.entries)).toEqual(["info", "warn", "error", "fatal"]);
  });
});
