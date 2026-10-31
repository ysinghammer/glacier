import type { ITransport } from "../../index.js";

/** Test-owned transport whose `write` and `flush` fail with the given reason. */
export class ThrowingTransport implements ITransport {
  private readonly reason: unknown;

  constructor(reason: unknown) {
    this.reason = reason;
  }

  public write(): void {
    throw this.reason;
  }

  public flush(): Promise<void> {
    return Promise.reject(this.reason);
  }
}
