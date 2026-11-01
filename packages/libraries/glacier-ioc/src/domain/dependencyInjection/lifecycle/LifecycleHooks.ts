import type { ILifecycleHookName } from "./types/ILifecycleHookName.js";

/** Detects object hook targets and invokes optional lifecycle methods with their instance as `this`. */
export class LifecycleHooks {
  /**
   * Tests whether a resolved value can expose lifecycle methods.
   * @param value Any resolved provider value.
   * @returns `true` for non-null objects; functions and primitives return `false`.
   */
  public static canHaveHooks(value: unknown): value is object {
    return typeof value === "object" && value !== null;
  }

  /** Calls and awaits a callable hook on its target; a missing or non-callable hook is skipped.
   * @param target Provider instance whose hook is inspected and called.
   * @param hook Lifecycle method name to invoke.
   * @returns A promise fulfilled after the hook completes, or rejected with its failure.
   */
  public static async invoke(target: object, hook: ILifecycleHookName): Promise<void> {
    const candidate: unknown = Reflect.get(target, hook);
    if (typeof candidate !== "function") return;
    await Reflect.apply(candidate, target, []);
  }
}
