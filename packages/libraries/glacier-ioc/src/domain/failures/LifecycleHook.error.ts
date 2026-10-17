import { ContainerError } from "./ContainerError.error.js";

/** Raised when a lifecycle hook of a provider instance throws or rejects; the original failure is the `cause`. */
export class LifecycleHookError extends ContainerError {
  /** Creates the error naming the hook and the class of the instance it failed on. */
  public constructor(hook: string, target: object, cause: unknown) {
    super(`Lifecycle hook ${hook} failed on ${target.constructor.name}`, { cause });
  }
}
