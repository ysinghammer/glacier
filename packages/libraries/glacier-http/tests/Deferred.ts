/** Test-owned promise coordination, without timers or production dependency replacement.
 * @template T Value coordinated between test actions.
 */
export class Deferred<T> {
  /** Promise released by `resolve`; remains pending until that call. */
  public readonly promise: Promise<T>;
  /**
   * Resolver captured during construction and consumed by `resolve`.
   * @param value Promise fulfillment value passed to the captured resolver.
   * @returns No value; calling it fulfills the public promise.
   * @default undefined
   */
  private completePromise: ((value: T) => void) | undefined;

  /**
   * Creates a pending promise and captures its resolver synchronously.
   * @returns No value; initializes the public pending promise.
   */
  public constructor() {
    this.promise = new Promise<T>((resolve) => {
      this.completePromise = resolve;
    });
  }

  /**
   * Resolves the coordinated promise with its completed test value.
   * @param value Value supplied to promise continuations.
   * @returns No value; fulfills the pending promise exactly once.
   * @throws {Error} When the promise resolver was not captured during construction.
   */
  public resolve(value: T): void {
    if (this.completePromise === undefined) throw new Error("Missing test promise resolver");
    this.completePromise(value);
  }
}
