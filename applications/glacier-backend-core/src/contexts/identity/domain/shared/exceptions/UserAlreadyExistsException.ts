import { DomainException } from '../../../../../shared/kernel/index.js';

/**
 * Thrown when attempting to create a user with an email that already exists.
 */
export class UserAlreadyExistsException extends DomainException {
  /**
   * Creates a new UserAlreadyExistsException.
   *
   * @param email - The email address that is already in use.
   */
  public constructor(email: string) {
    super(`An auth user with email "${email}" already exists.`);
    Object.setPrototypeOf(this, UserAlreadyExistsException.prototype);
  }
}
