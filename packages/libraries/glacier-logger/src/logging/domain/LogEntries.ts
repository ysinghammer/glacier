import type { ILogEntry } from "./ILogEntry.js";
import type { ILogEntryInput } from "./ILogEntryInput.js";
import { ReservedKeys } from "./ReservedKeys.js";

/** Normalises log calls into entries. */
export class LogEntries {
  /**
   * Builds the entry for a call. Level, time and context always come from the logger, so call
   * fields using reserved keys (possible only by bypassing the types) are dropped rather than
   * allowed to override them.
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
      bindings: input.bindings,
      fields,
    };

    const call = input.call;
    if (call.err !== undefined) {
      return { ...base, message: call.message ?? call.err.message, error: call.err };
    }
    return { ...base, message: call.message };
  }
}
