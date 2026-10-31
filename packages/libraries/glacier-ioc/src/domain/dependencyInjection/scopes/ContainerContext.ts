import { ContextId } from "./ContextId.js";

/** Creates the context identities that group REQUEST-scoped resolutions. */
export class ContainerContext {
  static #lastSequence = 0;

  /** Returns a new context id, different from every id created before. */
  public static createContextId(): ContextId {
    ContainerContext.#lastSequence += 1;
    return new ContextId(ContainerContext.#lastSequence);
  }
}
