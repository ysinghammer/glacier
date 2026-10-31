/**
 * Optional hook for DEFAULT-scope providers, detected by its name alone: called once per instance after the
 * whole container has been created. All `onModuleInit` hooks run, awaited one after another in module
 * dependency order, before any `onContainerInit` hook starts. A failure aborts `create`.
 */
export interface IOnModuleInit {
  /** Prepares the instance; the returned promise is awaited. */
  onModuleInit(): void | Promise<void>;
}
