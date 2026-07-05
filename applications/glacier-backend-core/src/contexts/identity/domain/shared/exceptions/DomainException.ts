/**
 * Base domain exception class.
 *
 * All domain-level exceptions should extend this class.
 * These exceptions represent invariant violations or business rule failures
 * and are independent of the delivery mechanism (HTTP, GraphQL, etc.).
 */
export abstract class DomainException extends Error {
  /**
   * Creates a new domain exception.
   *
   * @param message - Human-readable error message describing the exception.
   */
  protected constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, DomainException.prototype);
  }
}
