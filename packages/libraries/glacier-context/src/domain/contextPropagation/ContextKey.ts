import type { IContextEntry } from "./IContextEntry.js";

/**
 * Typed identity of one context value. A key is identified by the instance itself, never by its description,
 * so two keys with the same description never collide.
 */
export class ContextKey<T> {
  /** Human-readable name used in diagnostics only. */
  readonly description: string;

  private constructor(description: string) {
    this.description = description;
  }

  /** Creates a new key of value type `T`, distinct from every other key even with an equal description. */
  public static create<T>(description: string): ContextKey<T> {
    return new ContextKey<T>(description);
  }

  /** Pairs this key with a value of its own type for `GlacierContext.run`; a mismatching value fails to compile. */
  public with(value: T): IContextEntry {
    return { key: this, value };
  }
}
