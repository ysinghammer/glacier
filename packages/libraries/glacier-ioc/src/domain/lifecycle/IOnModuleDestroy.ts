/**
 * Optional hook for DEFAULT-scope providers, detected by its name alone: called once per instance when
 * `close` starts, in the reverse of module initialization order. A failure is reported by `close` after
 * every remaining hook has still run.
 */
export interface IOnModuleDestroy {
  /** Releases what the instance acquired; the returned promise is awaited. */
  onModuleDestroy(): void | Promise<void>;
}
