import { LifecycleHookError } from "../../domain/dependencyInjection/errors/LifecycleHook.error.js";
import type { ILifecycleHookName } from "../../domain/dependencyInjection/lifecycle/types/ILifecycleHookName.js";
import { LifecycleHooks } from "../../domain/dependencyInjection/lifecycle/LifecycleHooks.js";

/** Runs lifecycle phases over default instances in dependency order, reversing that order for shutdown. */
export class LifecycleCoordinator {
  /** Readonly reference to default instances, ordered with dependencies before dependents. */
  private readonly targets: readonly object[];

  /** Creates a coordinator over default instances in their initialization order.
   * @param targets Instances in module dependency order; the readonly list is retained as supplied.
   */
  public constructor(targets: readonly object[]) {
    this.targets = targets;
  }

  /** Awaits `onModuleInit`, then `onContainerInit`, stopping at the first failed hook.
   * @returns `undefined` on success, or the first failure as a `LifecycleHookError`.
   */
  public async initialize(): Promise<LifecycleHookError | undefined> {
    const startup: readonly ILifecycleHookName[] = ["onModuleInit", "onContainerInit"];
    for (const hook of startup) {
      const failures = await this.runPhase(hook, this.targets, true);
      if (failures.length > 0) return failures[0];
    }
    return undefined;
  }

  /** Awaits shutdown hooks in reverse order without skipping targets after failures.
   * @returns All hook failures in occurrence order, or an empty list when shutdown succeeds.
   */
  public async shutdown(): Promise<readonly LifecycleHookError[]> {
    const reversed = [...this.targets].reverse();
    const shutdown: readonly ILifecycleHookName[] = [
      "onModuleDestroy",
      "beforeContainerShutdown",
      "onContainerShutdown",
    ];
    const failures: LifecycleHookError[] = [];
    for (const hook of shutdown) {
      failures.push(...(await this.runPhase(hook, reversed, false)));
    }
    return failures;
  }

  /** Invokes one hook on each target and optionally stops after its first failure.
   * @param hook Lifecycle operation to invoke on each target.
   * @param targets Instances visited in the supplied order.
   * @param isStoppingOnFailure Whether to stop after the first captured hook failure.
   * @returns Captured failures in visit order; empty when every invocation succeeds.
   */
  private async runPhase(
    hook: ILifecycleHookName,
    targets: readonly object[],
    isStoppingOnFailure: boolean,
  ): Promise<readonly LifecycleHookError[]> {
    const failures: LifecycleHookError[] = [];
    for (const target of targets) {
      try {
        await LifecycleHooks.invoke(target, hook);
      } catch (cause) {
        failures.push(new LifecycleHookError(hook, target, cause));
        if (isStoppingOnFailure) return failures;
      }
    }
    return failures;
  }
}
