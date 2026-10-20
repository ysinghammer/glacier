import type { IEntryFormatter } from "../../logging/application/ports/outbound/IEntryFormatter.port.js";
import type { ILogEntry } from "../../logging/domain/ILogEntry.js";
import { SafeValueSerializer } from "../../serialization/domain/SafeValueSerializer.js";

/**
 * Renders an entry as one JSON line ending in `\n`. Key order is `level`, `time` (ISO 8601),
 * `context`, `message`, bindings, fields, then `err`. Values pass through the safe serialiser, so
 * formatting never throws and the same entry always yields the same text.
 */
export class JsonEntryFormatter implements IEntryFormatter {
  /** Returns the JSON line for `entry`, newline included. */
  format(entry: ILogEntry): string {
    const record: Record<string, unknown> = {
      level: entry.level,
      time: SafeValueSerializer.serializeWithin(entry.time, new Set(), 0),
      context: entry.context,
      message: entry.message,
      ...SafeValueSerializer.serializeRecord(entry.bindings),
      ...SafeValueSerializer.serializeRecord(entry.fields),
    };
    if (entry.error !== undefined) {
      record["err"] = SafeValueSerializer.serializeWithin(entry.error, new Set(), 0);
    }
    return `${JSON.stringify(record)}\n`;
  }
}
