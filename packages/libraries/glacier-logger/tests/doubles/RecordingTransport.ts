import type { ILogEntry, ITransport } from "../../index.js";

/** Test-owned transport that records every entry and counts flushes. */
export class RecordingTransport implements ITransport {
  readonly entries: ILogEntry[] = [];
  flushCount = 0;

  write(entry: ILogEntry): void {
    this.entries.push(entry);
  }

  flush(): Promise<void> {
    this.flushCount += 1;
    return Promise.resolve();
  }
}
