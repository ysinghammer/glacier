import { DomainException } from './DomainException.js';

/**
 * Thrown when user data fails domain validation (email, name, status).
 */
export class InvalidUserDataException extends DomainException {
  /**
   * Creates a new InvalidUserDataException.
   *
   * @param field - The field that failed validation.
   * @param reason - The reason why validation failed.
   */
  public constructor(field: string, reason: string) {
    super(`Invalid ${field}: ${reason}`);
    Object.setPrototypeOf(this, InvalidUserDataException.prototype);
  }
}
