/** Documentation annotations emitted into the JSON Schema output; they never affect parsing. */
export interface IDescribeOptions {
  /** Emitted as `title`. */
  readonly title?: string;
  /** Emitted as `description`. */
  readonly description?: string;
  /** Emitted as a one-element `examples` list. */
  readonly example?: unknown;
  /** Emitted as `deprecated: true` when `true`. */
  readonly deprecated?: boolean;
  /** Class decorator only: the key of the class in `$defs` / `components.schemas` instead of its class name. */
  readonly name?: string;
}
