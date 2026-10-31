import type { IContextEntry } from "./IContextEntry.js";

/**
 * Typed identity for a context value; the instance, not its diagnostic description, determines key identity.
 * @template T - Type of value that may be paired with this key.
 */
export class ContextKey<T> {
  /** Human-readable diagnostic label; it does not affect key identity and cannot be changed after creation. */
  public readonly description: string;

  /**
   * Initializes a key with its diagnostic label. Use {@link ContextKey.create} to construct keys.
   * @param description - Diagnostic label retained by this key; it does not determine identity.
   */
  private constructor(description: string) {
    this.description = description;
  }

  /**
   * Creates a fresh key whose instance identity is distinct from every other key.
   * @template T - Type of value associated with the new key.
   * @param description - Human-readable diagnostic label; equality does not affect key identity.
   * @returns A fresh key associated with values of type T.
   */
  public static create<T>(description: string): ContextKey<T> {
    return new ContextKey<T>(description);
  }

  /**
   * Pairs this key with a value for use as a `GlacierContext.run` entry.
   * @param value - Value paired with this key; its type must be T.
   * @returns An entry pairing this key and value without cloning or freezing the value.
   */
  public with(value: T): IContextEntry {
    return { key: this, value };
  }
}
