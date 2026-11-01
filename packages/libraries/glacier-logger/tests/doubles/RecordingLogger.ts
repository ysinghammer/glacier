import { LoggerFactory } from "../../index.js";
import type { ILogEntry, ILoggerConfiguration, Logger } from "../../index.js";
import { RecordingTransport } from "./RecordingTransport.js";

/** Builds a public logger backed by a recording transport and exposes its delivered entries. */
export class RecordingLogger {
  /** Readonly logger reference configured for trace-level serialization scenarios. */
  public readonly logger: Logger;
  /** Readonly view of entries delivered to the owned recording transport. */
  public readonly entries: readonly ILogEntry[];

  /**
   * Creates the logger with optional redaction configuration.
   * @param redact Optional redaction policy applied before entries are recorded.
   * @throws {Error} If the fixed valid configuration unexpectedly rejects creation.
   */
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
