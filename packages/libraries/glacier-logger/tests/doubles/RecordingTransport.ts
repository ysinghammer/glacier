import type { ILogEntry, ITransport } from "../../index.js";

/** Captures delivered log entries and counts completed flush requests for assertions. */
export class RecordingTransport implements ITransport {
  /**
   * Readonly array reference of entries received by {@link write}, in delivery order.
   * @default An empty array
   */
  public readonly entries: ILogEntry[] = [];
  /**
   * Number of times {@link flush} has been requested.
   * @default 0
   */
  public flushCount = 0;

  /**
   * Adds a delivered entry to the observable recording.
   * @param entry Entry supplied by the logger.
   * @returns No value; appends the same entry reference to {@link entries}.
   */
  public write(entry: ILogEntry): void {
    this.entries.push(entry);
  }

  /**
   * Records a flush request and completes immediately.
   * @returns A promise fulfilled after incrementing {@link flushCount}.
   */
  public flush(): Promise<void> {
    this.flushCount += 1;
    return Promise.resolve();
  }
}
