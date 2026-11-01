import type { IRedaction } from "./IRedaction.js";
import type { ILogCall } from "./ILogCall.js";
import type { ILogLevel } from "./ILogLevel.js";

/** Supplies logger metadata, call data, and sanitization settings for one entry. */
export interface ILogEntryInput {
  /** Level assigned by the logger. */
  readonly level: ILogLevel;
  /** Timestamp assigned by the logger. */
  readonly time: Date;
  /** Context assigned by the logger. */
  readonly context: string;
  /** Logger bindings to include after redaction and serialization. */
  readonly bindings: Readonly<Record<string, unknown>>;
  /** Message or error call and its structured fields. */
  readonly call: ILogCall;
  /** Paths and censor text applied to structured values. */
  readonly redaction: IRedaction;
}
