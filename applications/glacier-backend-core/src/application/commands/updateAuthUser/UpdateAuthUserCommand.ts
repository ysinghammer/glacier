import { Command } from '@nestjs/cqrs';

import { UpdateAuthUserCommandResult } from './UpdateAuthUserCommandResult.js';

/**
 * Command to update an existing authenticated user.
 *
 * This command encapsulates all data needed to modify a user's information.
 * The command follows the Command pattern from DDD, representing a user's intent
 * to update an existing user entity.
 *
 * All fields except {@link userId} are optional, allowing partial updates.
 *
 * @see {@link UpdateAuthUserCommandHandler} for command execution logic.
 * @see {@link User#rename} for updating name fields.
 * @see {@link User#changeEmail} for updating email.
 * @see {@link User#activate} and {@link User#suspend} for status changes.
 */
export class UpdateAuthUserCommand extends Command<UpdateAuthUserCommandResult> {
  /**
   * Unique identifier of the user to update.
   */
  public readonly userId: string;

  /**
   * Optional new given name for the user.
   * If provided, will be validated and trimmed by the {@link User} aggregate.
   */
  public readonly firstName?: string;

  /**
   * Optional new family name for the user.
   * If provided, will be validated and trimmed by the {@link User} aggregate.
   */
  public readonly lastName?: string;

  /**
   * Optional new email address for the user.
   * If provided, will be validated, normalized, and converted to {@link UserEmail} value object.
   */
  public readonly email?: string;

  /**
   * Optional new status for the user.
   * If provided, will trigger {@link User#activate} or {@link User#suspend}.
   */
  public readonly status?: string;

  /**
   * Creates a new UpdateAuthUserCommand instance.
   *
   * @param userId - The unique identifier of the user to update.
   * @param firstName - Optional new given name.
   * @param lastName - Optional new family name.
   * @param email - Optional new email address.
   * @param status - Optional new status.
   */
  constructor(
    userId: string,
    firstName?: string,
    lastName?: string,
    email?: string,
    status?: string
  ) {
    super();
    this.userId = userId;
    this.firstName = firstName;
    this.lastName = lastName;
    this.email = email;
    this.status = status;
  }
}
