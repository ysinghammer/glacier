/** Test-owned promise coordination, without timers or production dependency replacement. */
export class Deferred<T> {
  public readonly promise: Promise<T>;
  private completePromise: ((value: T) => void) | undefined;

  /** Captures the native promise resolver synchronously. */
  public constructor() {
    this.promise = new Promise<T>((resolve) => {
      this.completePromise = resolve;
    });
  }

  /** Releases the coordinated test action with an explicit value. */
  public resolve(value: T): void {
    if (this.completePromise === undefined) throw new Error("Missing test promise resolver");
    this.completePromise(value);
  }
}
