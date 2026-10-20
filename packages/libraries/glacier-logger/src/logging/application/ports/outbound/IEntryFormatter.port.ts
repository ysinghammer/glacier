import type { ILogEntry } from "../../../domain/ILogEntry.js";

/** Turns an entry into the text a transport writes. Final formatters land in a later phase. */
export interface IEntryFormatter {
  format(entry: ILogEntry): string;
}
