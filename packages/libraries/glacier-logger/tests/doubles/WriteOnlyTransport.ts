import type { ILogEntry, ITransport } from "../../index.js";

/** Captures delivered entries while intentionally omitting optional flush support. */
export class WriteOnlyTransport implements ITransport {
  /**
   * Readonly array reference of entries received by {@link write}, in delivery order.
   * @default An empty array
   */
  public readonly entries: ILogEntry[] = [];

  /**
   * Records an entry without implementing optional transport flushing.
   * @param entry Entry supplied by the logger.
   * @returns No value; appends the same entry reference to {@link entries}.
   */
  public write(entry: ILogEntry): void {
    this.entries.push(entry);
  }
}
