import type { ILogEntry } from "../../../domain/ILogEntry.js";

/** Turns an entry into the text a transport writes. */
export interface IEntryFormatter {
  format(entry: ILogEntry): string;
}
