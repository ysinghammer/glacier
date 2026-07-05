import { DomainException } from '../../../../../shared/kernel/index.js';

/**
 * Thrown when attempting to find or modify a user that does not exist.
 */
export class UserNotFoundException extends DomainException {
  /**
   * Creates a new UserNotFoundException.
   *
   * @param userId - The identifier of the user that was not found.
   */
  public constructor(userId: string) {
    super(`User with ID "${userId}" not found.`);
    Object.setPrototypeOf(this, UserNotFoundException.prototype);
  }
}
