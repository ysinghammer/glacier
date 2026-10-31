import type { ILifecycleHookName } from "./ILifecycleHookName.js";

/** Duck-typed discovery and invocation of lifecycle hooks on provider instances. */
export class LifecycleHooks {
  /** Whether a provider value can carry hooks; primitives cannot. */
  public static canHaveHooks(value: unknown): value is object {
    return typeof value === "object" && value !== null;
  }

  /**
   * Calls the named hook on the target when it has one and awaits its result; targets without the hook are
   * skipped. Rejects with whatever the hook throws or rejects with.
   */
  public static async invoke(target: object, hook: ILifecycleHookName): Promise<void> {
    const candidate: unknown = Reflect.get(target, hook);
    if (typeof candidate !== "function") return;
    await Reflect.apply(candidate, target, []);
  }
}
