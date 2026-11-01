/** A property-level refinement declared by `Refine`. */
export interface IRefinement {
  /** Synchronous check of the validated value; `false` or an exception rejects it. */
  readonly test: (value: unknown) => boolean;
  /** Replaces the default message of the issue. */
  readonly message?: string;
}
