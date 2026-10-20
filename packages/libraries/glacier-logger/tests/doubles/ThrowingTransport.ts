import type { ITransport } from "../../index.js";

/** Test-owned transport whose `write` and `flush` fail with the given reason. */
export class ThrowingTransport implements ITransport {
  readonly #reason: unknown;

  constructor(reason: unknown) {
    this.#reason = reason;
  }

  write(): void {
    throw this.#reason;
  }

  flush(): Promise<void> {
    return Promise.reject(this.#reason);
  }
}
