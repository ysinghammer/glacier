import type { ILogEntry, ITransport } from "../../index.js";

/** Test-owned transport that records every entry and counts flushes. */
export class RecordingTransport implements ITransport {
  public readonly entries: ILogEntry[] = [];
  public flushCount = 0;

  public write(entry: ILogEntry): void {
    this.entries.push(entry);
  }

  public flush(): Promise<void> {
    this.flushCount += 1;
    return Promise.resolve();
  }
}
