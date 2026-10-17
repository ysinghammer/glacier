/**
 * Optional hook for DEFAULT-scope providers, detected by its name alone: called once per instance after every
 * `beforeContainerShutdown` hook has run, in reverse initialization order. A failure is reported by `close`
 * after every remaining hook has still run.
 */
export interface IOnContainerShutdown {
  /** Completes shutdown of the instance; the returned promise is awaited. */
  onContainerShutdown(): void | Promise<void>;
}
