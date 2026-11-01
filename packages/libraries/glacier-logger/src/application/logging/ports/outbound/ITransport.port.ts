import type { ILogEntry } from "../../../../domain/logging/types/ILogEntry.js";
import type { ITransportDelivery } from "./ITransportDelivery.port.js";

/** Receives entries and registration-specific formatting for a custom destination. */
export interface ITransport {
  /** Accepts an entry; later failures can be reported through `delivery`.
   * @param entry Redacted entry to deliver.
   * @param delivery Registered format and failure-reporting callback.
   * @returns No value; synchronous throws are reported by the logger, not its caller.
   */
  write(entry: ILogEntry, delivery: ITransportDelivery): void;
  /** Drains accepted entries when the destination supports buffering.
   * @returns Promise resolves after delivery; rejects if the destination cannot flush.
   */
  flush?(): Promise<void>;
}
