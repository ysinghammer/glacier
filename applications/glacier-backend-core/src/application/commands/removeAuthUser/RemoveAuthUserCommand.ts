import { Command } from '@nestjs/cqrs';

/**
 * Command to soft-delete an authenticated user by suspending them.
 *
 * This command encapsulates the intent to remove a user from active use.
 * Following business rules, this is a soft-delete operation that sets the user's
 * status to {@link UserStatus.SUSPENDED} rather than physically deleting the record.
 *
 * @see {@link RemoveAuthUserCommandHandler} for command execution logic.
 * @see {@link User#suspend} for the domain method that performs the soft delete.
 */
export class RemoveAuthUserCommand extends Command<void> {
  /**
   * Unique identifier of the user to remove (suspend).
   */
  public readonly userId: string;

  /**
   * Creates a new RemoveAuthUserCommand instance.
   *
   * @param userId - The unique identifier of the user to suspend.
   */
  constructor(userId: string) {
    super();
    this.userId = userId;
  }
}
