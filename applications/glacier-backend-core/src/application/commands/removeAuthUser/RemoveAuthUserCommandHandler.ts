import { Inject, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { RemoveAuthUserCommand } from './RemoveAuthUserCommand.js';

import type { UserRepositoryPort } from '../../../domain/entities/user/ports/UserRepositoryPort.js';

/**
 * NestJS CQRS CommandHandler implementation for {@link RemoveAuthUserCommand}.
 *
 * This handler implements the use case for soft-deleting an authenticated user
 * by suspending them. Following business rules, this is a soft-delete operation
 * that sets the user's status to {@link UserStatus.SUSPENDED} rather than
 * physically deleting the record.
 *
 * @see {@link RemoveAuthUserCommand} for input data structure.
 * @see {@link User#suspend} for the domain method that suspends the user.
 * @see {@link UserRepositoryPort} for persistence operations.
 */
@CommandHandler(RemoveAuthUserCommand)
export class RemoveAuthUserCommandHandler implements ICommandHandler<RemoveAuthUserCommand, void> {
  /**
   * Creates a new handler instance with injected dependencies.
   *
   * @param userRepository - Repository for user persistence operations.
   */
  public constructor(
    @Inject('UserRepositoryPort')
    private readonly userRepository: UserRepositoryPort
  ) {}

  /**
   * Executes the remove (suspend) user command.
   *
   * Implements the following steps:
   * 1. Retrieves the existing user via {@link UserRepositoryPort.findById}
   * 2. Validates the user exists
   * 3. Calls {@link User#suspend} to mark the user as suspended
   * 4. Persists the updated user via {@link UserRepositoryPort.save}
   *
   * @param command - The {@link RemoveAuthUserCommand} containing the user ID.
   * @returns A promise that resolves when the user has been suspended.
   * @throws {NotFoundException} If the user with the given ID is not found (404 Not Found).
   */
  public async execute(command: RemoveAuthUserCommand): Promise<void> {
    // Step 1: Retrieve the existing user by ID
    const user = await this.userRepository.findById(command.userId);

    // Step 2: Validate that the user exists
    if (user === null) {
      throw new NotFoundException(`User with ID "${command.userId}" not found.`);
    }

    // Step 3: Suspend the user using the domain method
    user.suspend(new Date());

    // Step 4: Persist the updated user to the database
    await this.userRepository.save(user);
  }
}
