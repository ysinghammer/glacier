/** Base for exceptional ORM failures, preserving an optional underlying cause. */
export class OrmError extends Error {
  /**
   * Creates a named ORM error without changing the supplied cause.
   * @param message A human-readable, secret-safe failure summary.
   * @param options Optional native error options, including the underlying cause.
   */
  public constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = new.target.name;
  }
}
