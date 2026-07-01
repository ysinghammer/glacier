import type { UpdateAuthUserCommand } from './UpdateAuthUserCommand.js';
import type { UpdateAuthUserCommandResult } from './UpdateAuthUserCommandResult.js';

/**
 * Handler interface for {@link UpdateAuthUserCommand}.
 *
 * This is an inbound port in the Hexagonal Architecture, defining the contract
 * for updating existing authenticated users. Implementations should:
 * 1. Retrieve the existing user via {@link UserRepositoryPort.findById}
 * 2. Apply updates using appropriate {@link User} methods (rename, changeEmail, activate, suspend)
 * 3. Validate uniqueness constraints if email is being changed
 * 4. Persist the updated user via {@link UserRepositoryPort.save}
 * 5. Return the updated user's primitive representation
 *
 * @see {@link UpdateAuthUserCommand} for input data structure.
 * @see {@link UpdateAuthUserCommandResult} for output data structure.
 * @see {@link User#rename} for updating names.
 * @see {@link User#changeEmail} for updating email.
 * @see {@link User#activate} and {@link User#suspend} for status changes.
 * @see {@link UserRepositoryPort} for persistence operations.
 */
export interface UpdateAuthUserCommandHandler {
  /**
   * Executes the update user command.
   *
   * @param command - The {@link UpdateAuthUserCommand} containing update data.
   * @returns A promise resolving to {@link UpdateAuthUserCommandResult} with the updated user data.
   * @throws {Error} If the user is not found.
   * @throws {Error} If the new email already exists for a different user (business rule violation).
   * @throws {Error} If validation fails in the {@link User} aggregate.
   */
  execute(command: UpdateAuthUserCommand): Promise<UpdateAuthUserCommandResult>;
}
