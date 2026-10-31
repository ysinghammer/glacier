/** The names of the lifecycle hooks a DEFAULT-scope provider instance may implement. */
export type ILifecycleHookName =
  | "onModuleInit"
  | "onContainerInit"
  | "onModuleDestroy"
  | "beforeContainerShutdown"
  | "onContainerShutdown";
