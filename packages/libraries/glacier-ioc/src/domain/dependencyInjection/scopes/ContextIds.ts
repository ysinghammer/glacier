import { ContextIdMisuseError } from "../errors/ContextIdMisuse.error.js";
import { ContainerContext } from "./ContainerContext.js";
import { ContextId } from "./ContextId.js";

/** Validates context identities supplied to provider resolution. */
export class ContextIds {
  /**
   * Uses the supplied identity or allocates a fresh one when omitted.
   * @param candidate Supplied context id, or `undefined` to create an isolated context.
   * @returns The supplied id or a newly allocated context id.
   * @throws {ContextIdMisuseError} If a supplied value is not a `ContextId` instance.
   */
  public static require(candidate: unknown): ContextId {
    if (candidate === undefined) return ContainerContext.createContextId();
    if (candidate instanceof ContextId) return candidate;
    throw new ContextIdMisuseError(
      "expected a ContextId from ContainerContext.createContextId() or undefined",
    );
  }
}
