import type { ILogEntry, ITransport } from "../../index.js";

/** Test-owned transport without a `flush` method. */
export class WriteOnlyTransport implements ITransport {
  readonly entries: ILogEntry[] = [];

  write(entry: ILogEntry): void {
    this.entries.push(entry);
  }
}
