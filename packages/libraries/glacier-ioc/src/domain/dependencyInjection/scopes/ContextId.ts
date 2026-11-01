/** Identity grouping request-scoped instances; the container keys contexts by the `ContextId` object. */
export class ContextId {
  /** Sequence value supplied at construction and exposed for diagnostics; it does not determine identity. */
  public readonly sequence: number;

  /**
   * Stores a diagnostic sequence; use `ContainerContext.createContextId()` for allocated ids.
   * @param sequence Numeric diagnostic value stored on this id.
   */
  public constructor(sequence: number) {
    this.sequence = sequence;
  }
}
