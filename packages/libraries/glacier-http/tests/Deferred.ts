/** Test-owned promise coordination, without timers or production dependency replacement. */
export class Deferred<T> {
  readonly promise: Promise<T>;
  #resolve: ((value: T) => void) | undefined;

  /** Captures the native promise resolver synchronously. */
  public constructor() {
    this.promise = new Promise<T>((resolve) => {
      this.#resolve = resolve;
    });
  }

  /** Releases the coordinated test action with an explicit value. */
  public resolve(value: T): void {
    if (this.#resolve === undefined) throw new Error("Missing test promise resolver");
    this.#resolve(value);
  }
}
