import type { RemoveAuthUserCommand } from './RemoveAuthUserCommand.js';

/**
 * Handler interface for {@link RemoveAuthUserCommand}.
 *
 * This is an inbound port in the Hexagonal Architecture, defining the contract
 * for soft-deleting authenticated users. Implementations should:
 * 1. Retrieve the existing user via {@link UserRepositoryPort.findById}
 * 2. Call {@link User#suspend} to mark the user as suspended
 * 3. Persist the updated user via {@link UserRepositoryPort.save}
 * 4. Return void as per the soft-delete convention
 *
 * Note: This is a soft-delete operation. The user record remains in storage
 * but is marked as {@link UserStatus.SUSPENDED}, preventing normal operations.
 *
 * @see {@link RemoveAuthUserCommand} for input data structure.
 * @see {@link User#suspend} for the domain method that suspends the user.
 * @see {@link UserRepositoryPort} for persistence operations.
 */
export interface RemoveAuthUserCommandHandler {
  /**
   * Executes the remove (suspend) user command.
   *
   * @param command - The {@link RemoveAuthUserCommand} containing the user ID.
   * @returns A promise that resolves when the user has been suspended.
   * @throws {Error} If the user is not found.
   */
  execute(command: RemoveAuthUserCommand): Promise<void>;
}
