import type { IEntryFormatter } from "../../application/logging/ports/outbound/IEntryFormatter.port.js";
import type { ILogEntry } from "../logging/types/ILogEntry.js";
import { SafeValueSerializer } from "../serialization/SafeValueSerializer.js";

/** Formats normalized entries as newline-terminated JSON records. */
export class JsonEntryFormatter implements IEntryFormatter {
  /** Serializes entry data in stable key order, including a trailing newline.
   * @param entry - Normalized record to convert to JSON.
   * @returns JSON line ordered as level, time, context, message, bindings, fields, optional `err`.
   */
  public format(entry: ILogEntry): string {
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
