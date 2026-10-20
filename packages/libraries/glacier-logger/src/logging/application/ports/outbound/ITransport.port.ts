import type { ILogEntry } from "../../../domain/ILogEntry.js";

/**
 * Destination for log entries. `write` must not throw for ordinary delivery problems and
 * `flush`, when present, resolves once every accepted entry has been delivered.
 */
export interface ITransport {
  write(entry: ILogEntry): void;
  flush?(): Promise<void>;
}
