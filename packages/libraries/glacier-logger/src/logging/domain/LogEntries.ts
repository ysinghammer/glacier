import { ErrorSerializer } from "../../serialization/domain/ErrorSerializer.js";
import type { ISerializedError } from "../../serialization/domain/ISerializedError.js";
import { PathRedactor } from "../../serialization/domain/PathRedactor.js";
import { SafeValueSerializer } from "../../serialization/domain/SafeValueSerializer.js";
import type { ILogEntry } from "./ILogEntry.js";
import type { ILogEntryInput } from "./ILogEntryInput.js";
import type { IRedaction } from "./IRedaction.js";
import { ReservedKeys } from "./ReservedKeys.js";

const ERROR_KEY = "err";
const ERROR_PATH_PREFIX = `${ERROR_KEY}.`;

/** Normalises log calls into entries. */
export class LogEntries {
  /**
   * Builds the entry for a call. Level, time and context always come from the logger, so call
   * fields using reserved keys (possible only by bypassing the types) are dropped rather than
   * allowed to override them. Bindings, fields and the error are redacted on a copy and then
   * serialised, so the entry is plain data and creating it never throws.
   */
  static create(input: ILogEntryInput): ILogEntry {
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
      bindings: LogEntries.#sanitise(input.bindings, input.redaction),
      fields: LogEntries.#sanitise(fields, input.redaction),
    };

    const call = input.call;
    if (call.err !== undefined) {
      const error = LogEntries.#sanitiseError(call.err, input.redaction);
      return { ...base, message: call.message ?? error.message, error };
    }
    return { ...base, message: call.message };
  }

  static #sanitise(
    record: Readonly<Record<string, unknown>>,
    redaction: IRedaction,
  ): Readonly<Record<string, unknown>> {
    const redacted = PathRedactor.redact(record, redaction.paths, redaction.censor);
    return SafeValueSerializer.serializeRecord(redacted);
  }

  /** Only `err.`-prefixed paths reach into the error; the error itself is never replaced. */
  static #sanitiseError(error: Error, redaction: IRedaction): ISerializedError {
    const paths = redaction.paths
      .filter((path) => path.startsWith(ERROR_PATH_PREFIX))
      .map((path) => path.slice(ERROR_KEY.length + 1));
    const serialized = ErrorSerializer.serialize(error);
    return PathRedactor.redact(serialized, paths, redaction.censor);
  }
}
