import { ContainerError } from "./ContainerError.error.js";

/** Wraps a provider lifecycle-hook failure while preserving the original failure as its cause. */
export class LifecycleHookError extends ContainerError {
  /**
   * Constructs a lifecycle failure and retains the original thrown value as cause.
   * @param hook Name of the lifecycle hook that failed.
   * @param target Provider instance on which the hook ran.
   * @param cause Original thrown value or rejection reason.
   */
  public constructor(hook: string, target: object, cause: unknown) {
    super(`Lifecycle hook ${hook} failed on ${target.constructor.name}`, { cause });
  }
}
