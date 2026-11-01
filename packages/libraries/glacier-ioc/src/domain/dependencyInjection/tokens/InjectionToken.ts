/**
 * Typed identity for non-class dependencies, carrying the resolved value type only at compile time.
 * @template T Value type resolved when this token is requested.
 */
export class InjectionToken<T> {
  /** Type-only carrier used to infer resolved values; no runtime field is emitted. */
  declare public readonly phantomType: T | undefined;
  /** Diagnostic label used in container error messages; it does not determine token identity. */
  public readonly description: string;
  /** Fresh symbol that identifies this token independently of other token instances. */
  public readonly symbol: symbol;

  /**
   * Creates a token with a fresh symbol identity.
   * @param description Human-readable diagnostic label; equal labels do not merge identities.
   */
  public constructor(description: string) {
    this.description = description;
    this.symbol = Symbol(description);
  }
}
