/**
 * Opaque identity of one resolution context: REQUEST-scoped providers share one instance per context id.
 * Obtain ids from `ContainerContext.createContextId()`; ids carry no behavior and are never reused.
 */
export class ContextId {
  /** Sequence number distinguishing this id from every other id of the process, for diagnostics only. */
  readonly sequence: number;

  /** Wraps a sequence number; created by `ContainerContext`. */
  public constructor(sequence: number) {
    this.sequence = sequence;
  }
}
