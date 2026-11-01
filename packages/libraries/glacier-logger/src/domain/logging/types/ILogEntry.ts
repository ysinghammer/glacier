import type { ISerializedError } from "../../serialization/ISerializedError.js";
import type { ILogLevel } from "./ILogLevel.js";

/**
 * Normalized record consumed by formatters and transports. Structured values are sanitized plain
 * data; members are readonly and consumers must not mutate the entry.
 */
export interface ILogEntry {
  /** Severity selected by the logger for this call. */
  readonly level: ILogLevel;
  /** Timestamp selected by the logger; formatters may render it without changing it. */
  readonly time: Date;
  /** Logger context associated with the call. */
  readonly context: string;
  /** Call message, falling back to the error message when an error call omits one. */
  readonly message: string;
  /** Sanitized logger bindings, with later child layers taking precedence. */
  readonly bindings: Readonly<Record<string, unknown>>;
  /** Sanitized call data with logger-reserved keys removed. */
  readonly fields: Readonly<Record<string, unknown>>;
  /** Sanitized serialized error; absent when the call did not include `err`. */
  readonly error?: ISerializedError;
}
