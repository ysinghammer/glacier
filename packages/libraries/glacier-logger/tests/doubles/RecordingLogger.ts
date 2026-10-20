import { LoggerFactory } from "../../index.js";
import type { ILogEntry, ILoggerConfiguration, Logger } from "../../index.js";
import { RecordingTransport } from "./RecordingTransport.js";

/** Test-owned logger wired to a recording transport, so tests see exactly what a transport sees. */
export class RecordingLogger {
  readonly logger: Logger;
  readonly entries: readonly ILogEntry[];

  constructor(redact?: ILoggerConfiguration["redact"]) {
    const transport = new RecordingTransport();
    const factory = new LoggerFactory({
      level: "trace",
      ...(redact === undefined ? {} : { redact }),
      transports: [{ transport, format: "json" }],
    });
    const result = factory.createLogger("Serialization");
    if (result.outcome !== "created") {
      throw new Error("expected a created logger");
    }
    this.logger = result.logger;
    this.entries = transport.entries;
  }
}
