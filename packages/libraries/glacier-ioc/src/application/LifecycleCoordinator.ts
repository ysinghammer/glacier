import { LifecycleHookError } from "../domain/failures/LifecycleHook.error.js";
import type { ILifecycleHookName } from "../domain/lifecycle/ILifecycleHookName.js";
import { LifecycleHooks } from "../domain/lifecycle/LifecycleHooks.js";

/**
 * Runs the lifecycle hooks of DEFAULT-scope instances. Targets are given in initialization order: module
 * dependency order, so dependencies come before their dependents. Startup runs each hook phase over all
 * targets in that order; shutdown runs its phases over the reverse order.
 */
export class LifecycleCoordinator {
  readonly #targets: readonly object[];

  /** Creates a coordinator over instances listed in initialization order. */
  public constructor(targets: readonly object[]) {
    this.#targets = targets;
  }

  /**
   * Awaits every `onModuleInit` hook, then every `onContainerInit` hook, one at a time. Stops at the first
   * failing hook and returns it as a `LifecycleHookError`; returns `undefined` when startup succeeded.
   */
  public async initialize(): Promise<LifecycleHookError | undefined> {
    const startup: readonly ILifecycleHookName[] = ["onModuleInit", "onContainerInit"];
    for (const hook of startup) {
      const failures = await this.#runPhase(hook, this.#targets, true);
      if (failures.length > 0) return failures[0];
    }
    return undefined;
  }

  /**
   * Awaits `onModuleDestroy`, then `beforeContainerShutdown`, then `onContainerShutdown` over the reverse of
   * initialization order. A failing hook never skips the remaining hooks; every failure is returned in
   * the order it occurred as `LifecycleHookError`s, empty when shutdown succeeded.
   */
  public async shutdown(): Promise<readonly LifecycleHookError[]> {
    const reversed = [...this.#targets].reverse();
    const shutdown: readonly ILifecycleHookName[] = [
      "onModuleDestroy",
      "beforeContainerShutdown",
      "onContainerShutdown",
    ];
    const failures: LifecycleHookError[] = [];
    for (const hook of shutdown) {
      failures.push(...(await this.#runPhase(hook, reversed, false)));
    }
    return failures;
  }

  /** Invokes one hook on each target in order; with `isStoppingOnFailure` it returns at the first failure. */
  async #runPhase(
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
