import { Command } from '@nestjs/cqrs';

/**
 * Command to suspend an authenticated user (soft-delete).
 *
 * This command encapsulates the intent to deactivate a user and remove them from active use.
 * Following business rules, this is a soft-delete operation that sets the user's
 * status to {@link UserStatus.SUSPENDED} rather than physically deleting the record.
 *
 * @see {@link SuspendAuthUserCommandHandler} for command execution logic.
 * @see {@link User#suspend} for the domain method that performs the suspension.
 */
export class SuspendAuthUserCommand extends Command<void> {
  /**
   * Unique identifier of the user to suspend.
   */
  public readonly userId: string;

  /**
   * Creates a new SuspendAuthUserCommand instance.
   *
   * @param userId - The unique identifier of the user to suspend.
   */
  constructor(userId: string) {
    super();
    this.userId = userId;
  }
}
