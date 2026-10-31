/**
 * Optional hook for DEFAULT-scope providers, detected by its name alone: called once per instance after every
 * module's `onModuleInit` hook has completed, in module dependency order. A failure aborts `create`.
 */
export interface IOnContainerInit {
  /** Finishes startup of the instance; the returned promise is awaited. */
  onContainerInit(): void | Promise<void>;
}
