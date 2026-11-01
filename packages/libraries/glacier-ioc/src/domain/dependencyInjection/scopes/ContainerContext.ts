import { ContextId } from "./ContextId.js";

/** Allocates increasing context identities used to share request-scoped provider instances. */
export class ContainerContext {
  /**
   * Sequence assigned to the most recently allocated id by this module instance.
   * @default `0` before any id is allocated.
   */
  private static lastSequence = 0;

  /**
   * Allocates a context identity with the next sequence from this module instance.
   * @returns Fresh context id for a request-scoped resolution group.
   */
  public static createContextId(): ContextId {
    ContainerContext.lastSequence += 1;
    return new ContextId(ContainerContext.lastSequence);
  }
}
