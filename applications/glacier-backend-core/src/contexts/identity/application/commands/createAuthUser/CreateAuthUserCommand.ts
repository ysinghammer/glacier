import { Command } from '@nestjs/cqrs';

import { CreateAuthUserCommandResult } from './CreateAuthUserCommandResult.js';

/**
 * Command to create a new authenticated user.
 *
 * This command encapsulates all data needed to register a new user in the system.
 * The command follows the Command pattern from DDD, representing a user's intent
 * to create a new user entity.
 *
 * @see {@link CreateAuthUserCommandHandler} for command execution logic.
 * @see {@link User.register} for the domain method that validates and creates the user aggregate.
 */
export class CreateAuthUserCommand extends Command<CreateAuthUserCommandResult> {
  /**
   * Given name of the user to create.
   * Will be validated and trimmed by the {@link User} aggregate.
   */
  public readonly firstName: string;
  /**
   * Family name of the user to create.
   * Will be validated and trimmed by the {@link User} aggregate.
   */
  public readonly lastName: string;
  /**
   * Email address of the user to create.
   * Will be validated, normalized, and converted to {@link UserEmail} value object.
   */
  public readonly email: string;
  /**
   * Optional initial status for the user.
   * Defaults to {@link UserStatus.ACTIVE} if not provided.
   */
  public readonly status?: string;
  /**
   * Creates a new CreateAuthUserCommand instance.
   *
   * @param firstName - The given name of the user.
   * @param lastName - The family name of the user.
   * @param email - The email address of the user.
   * @param status - Optional initial status for the user.
   */
  constructor(firstName: string, lastName: string, email: string, status?: string) {
    super();
    this.firstName = firstName;
    this.lastName = lastName;
    this.email = email;
    this.status = status;
  }
}
