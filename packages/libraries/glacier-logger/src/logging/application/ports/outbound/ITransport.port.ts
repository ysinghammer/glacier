import type { ILogEntry } from "../../../domain/ILogEntry.js";
import type { ITransportDelivery } from "./ITransportDelivery.port.js";

/**
 * Destination for log entries. Implement it to add a custom transport.
 *
 * `write` receives the entry and a delivery that renders it in the registration's format and
 * reports asynchronous failures. It should not throw for ordinary delivery problems: a throw is
 * caught by the logger and reported to `onError`, never to the logging caller. `flush`, when
 * present, resolves once every accepted entry has been delivered.
 */
export interface ITransport {
  write(entry: ILogEntry, delivery: ITransportDelivery): void;
  flush?(): Promise<void>;
}
