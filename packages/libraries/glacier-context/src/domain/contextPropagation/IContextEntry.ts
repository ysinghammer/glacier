import type { ContextKey } from "./ContextKey.js";

/**
 * One key/value pair to layer onto a context. Obtain entries from `ContextKey.with`, which is the only
 * place that ties the value's type to the key's type.
 */
export interface IContextEntry {
  /** The key the value is stored under. */
  readonly key: ContextKey<unknown>;
  /** The value, stored as given without cloning or freezing. */
  readonly value: unknown;
}
