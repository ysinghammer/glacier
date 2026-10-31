import { ContextIdMisuseError } from "../failures/ContextIdMisuse.error.js";
import { ContainerContext } from "./ContainerContext.js";
import { ContextId } from "./ContextId.js";

/** Validates the context ids passed to `resolve` by untrusted callers. */
export class ContextIds {
  /**
   * Returns the given id, or a fresh context when none is given (so nothing is shared with other calls).
   * Throws `ContextIdMisuseError` when the value is not a `ContextId` created by `ContainerContext`.
   */
  public static require(candidate: unknown): ContextId {
    if (candidate === undefined) return ContainerContext.createContextId();
    if (candidate instanceof ContextId) return candidate;
    throw new ContextIdMisuseError(
      "expected a ContextId from ContainerContext.createContextId() or undefined",
    );
  }
}
