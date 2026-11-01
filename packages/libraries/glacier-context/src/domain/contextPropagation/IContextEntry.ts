import type { ContextKey } from "./ContextKey.js";

/** Key/value pair layered onto a context; use `ContextKey.with` to preserve the key/value type relationship. */
export interface IContextEntry {
  /** Identity under which the value is stored; key identity is based on the key instance. */
  readonly key: ContextKey<unknown>;
  /** Value stored as supplied, without cloning or freezing; its type is checked when paired through `with`. */
  readonly value: unknown;
}
