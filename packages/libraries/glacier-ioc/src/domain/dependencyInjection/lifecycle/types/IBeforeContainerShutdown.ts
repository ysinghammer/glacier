/**
 * Optional hook for DEFAULT-scope providers, detected by its name alone: called once per instance after every
 * `onModuleDestroy` hook has run, in reverse initialization order. A failure is reported by `close` after
 * every remaining hook has still run.
 */
export interface IBeforeContainerShutdown {
  /** Performs final work before the container shuts down; the returned promise is awaited. */
  beforeContainerShutdown(): void | Promise<void>;
}
