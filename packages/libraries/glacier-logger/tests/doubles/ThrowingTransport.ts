import type { ITransport } from "../../index.js";

/** Simulates a transport whose synchronous writes and asynchronous flushes fail predictably. */
export class ThrowingTransport implements ITransport {
  /** Private readonly unknown value used by both transport operations to fail predictably. */
  private readonly reason: unknown;

  /**
   * Creates a transport configured to fail with the supplied value.
   * @param reason Value thrown by {@link write} and used to reject {@link flush}.
   */
  constructor(reason: unknown) {
    this.reason = reason;
  }

  /**
   * Fails synchronously to simulate a transport write failure.
   * @returns No value; this test double always throws {@link reason}.
   * @throws {unknown} With the exact value supplied to the constructor.
   */
  public write(): void {
    throw this.reason;
  }

  /**
   * Rejects to simulate an asynchronous flush failure.
   * @returns A promise rejected with the exact constructor-supplied value.
   */
  public flush(): Promise<void> {
    return Promise.reject(this.reason);
  }
}
