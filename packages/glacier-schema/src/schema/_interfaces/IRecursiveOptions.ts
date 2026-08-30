/** Options accepted by `Schema.recursive`. */
export interface IRecursiveOptions {
  /** Caps how deep validation recurses into a self-referential structure. Default: 50. */
  readonly maxDepth?: number;
}
