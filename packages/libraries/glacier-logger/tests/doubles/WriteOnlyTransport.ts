import type { ILogEntry, ITransport } from "../../index.js";

/** Test-owned transport without a `flush` method. */
export class WriteOnlyTransport implements ITransport {
  public readonly entries: ILogEntry[] = [];

  public write(entry: ILogEntry): void {
    this.entries.push(entry);
  }
}
