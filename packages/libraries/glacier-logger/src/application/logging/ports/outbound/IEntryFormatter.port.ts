import type { ILogEntry } from "../../../../domain/logging/types/ILogEntry.js";

/** Converts a log entry into the text representation written by a transport. */
export interface IEntryFormatter {
  /** Formats one entry.
   * @param entry Entry to convert.
   * @returns Formatted text for the transport to write.
   */
  format(entry: ILogEntry): string;
}
