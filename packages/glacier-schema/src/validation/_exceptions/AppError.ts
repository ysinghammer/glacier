/**
 * Abstract base class for every error raised by `@glacier/schema`.
 *
 * Every concrete failure case in this package is a named subclass of
 * `AppError` rather than a generic `Error` — this keeps `catch` sites able
 * to discriminate on `code` without relying on fragile `instanceof` chains
 * across duplicated package instances.
 */
export abstract class AppError extends Error {
  /**
   * Stable, machine-readable identifier for the failure case, e.g.
   * `"schema-validation-failed"`.
   */
  public readonly code: string;

  /**
   * @param message Human-readable description of the failure.
   * @param code Stable, machine-readable identifier for the failure case.
   * @param cause Optional underlying error that triggered this one.
   */
  protected constructor(message: string, code: string, cause?: unknown) {
    super(message, cause === undefined ? undefined : { cause });
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
