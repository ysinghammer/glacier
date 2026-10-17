/**
 * A typed token for dependencies without a class, such as interfaces or configuration values.
 * Every instance owns a fresh symbol, so tokens are unique by identity even with equal descriptions.
 * The type parameter is a compile-time phantom that lets later APIs infer the resolved value type.
 */
export class InjectionToken<T> {
  /** Compile-time carrier of the resolved value type; it has no runtime representation. */
  declare readonly phantomType: T | undefined;
  /** Human-readable text included in container error messages. */
  readonly description: string;
  /** The unique symbol identifying this token inside containers and metadata. */
  readonly symbol: symbol;

  /** Creates a token with a fresh identity; the description is diagnostic only and never shared. */
  public constructor(description: string) {
    this.description = description;
    this.symbol = Symbol(description);
  }
}
