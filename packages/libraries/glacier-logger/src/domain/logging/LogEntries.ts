import { ErrorSerializer } from "../serialization/ErrorSerializer.js";
import type { ISerializedError } from "../serialization/ISerializedError.js";
import { PathRedactor } from "../serialization/PathRedactor.js";
import { SafeValueSerializer } from "../serialization/SafeValueSerializer.js";
import type { ILogEntry } from "./types/ILogEntry.js";
import type { ILogEntryInput } from "./types/ILogEntryInput.js";
import type { IRedaction } from "./types/IRedaction.js";
import { ReservedKeys } from "./ReservedKeys.js";

const ERROR_KEY = "err";
const ERROR_PATH_PREFIX = `${ERROR_KEY}.`;

/** Converts calls into safe, normalized records for formatters and transports. */
export class LogEntries {
  /**
   * Normalizes logger metadata and call data without allowing call fields to override owned keys.
   * Structured values are redacted on copies and serialized to safe plain data.
   * @param input - Level, timestamp, context, bindings, call, and redaction settings to combine.
   * @returns An entry with reserved fields removed and any error serialized.
   */
  public static create(input: ILogEntryInput): ILogEntry {
    const fields: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input.call)) {
      if (!ReservedKeys.isReserved(key)) {
        fields[key] = value;
      }
    }

    const base = {
      level: input.level,
      time: input.time,
      context: input.context,
      bindings: LogEntries.sanitise(input.bindings, input.redaction),
      fields: LogEntries.sanitise(fields, input.redaction),
    };

    const call = input.call;
    if (call.err !== undefined) {
      const error = LogEntries.sanitiseError(call.err, input.redaction);
      return { ...base, message: call.message ?? error.message, error };
    }
    return { ...base, message: call.message };
  }

  /** Redacts and serializes a record without changing its input.
   * @param record - Structured values to sanitize.
   * @param redaction - Exact paths and replacement text to apply before serialization.
   * @returns A plain record containing only serialized values.
   */
  private static sanitise(
    record: Readonly<Record<string, unknown>>,
    redaction: IRedaction,
  ): Readonly<Record<string, unknown>> {
    const redacted = PathRedactor.redact(record, redaction.paths, redaction.censor);
    return SafeValueSerializer.serializeRecord(redacted);
  }

  /** Applies only `err.` paths to serialized error properties, preserving the error object shape.
   * @param error - Error whose data is serialized before redaction.
   * @param redaction - Settings; only paths prefixed with `err.` are used.
   * @returns Serialized error data with matching properties censored.
   */
  private static sanitiseError(error: Error, redaction: IRedaction): ISerializedError {
    const paths = redaction.paths
      .filter((path) => path.startsWith(ERROR_PATH_PREFIX))
      .map((path) => path.slice(ERROR_KEY.length + 1));
    const serialized = ErrorSerializer.serialize(error);
    return PathRedactor.redact(serialized, paths, redaction.censor);
  }
}
