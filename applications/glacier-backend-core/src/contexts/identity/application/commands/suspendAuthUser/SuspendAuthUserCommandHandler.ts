import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { UserNotFoundException } from '../../../domain/shared/exceptions/UserNotFoundException.js';
import { SuspendAuthUserCommand } from './SuspendAuthUserCommand.js';

import type { UserRepositoryPort } from '../../../domain/entities/user/ports/UserRepositoryPort.js';
import type { ClockPort } from '../../../domain/shared/ports/ClockPort.js';

/**
 * NestJS CQRS CommandHandler implementation for {@link SuspendAuthUserCommand}.
 *
 * This handler implements the use case for soft-deleting an authenticated user
 * by suspending them. Following business rules, this is a soft-delete operation
 * that sets the user's status to {@link UserStatus.SUSPENDED} rather than
 * physically deleting the record.
 * Throws domain-level exceptions which are mapped to HTTP responses by {@link DomainExceptionFilter}.
 *
 * @see {@link SuspendAuthUserCommand} for input data structure.
 * @see {@link User#suspend} for the domain method that suspends the user.
 * @see {@link UserRepositoryPort} for persistence operations.
 */
@CommandHandler(SuspendAuthUserCommand)
export class SuspendAuthUserCommandHandler implements ICommandHandler<
  SuspendAuthUserCommand,
  void
> {
  /**
   * Creates a new handler instance with injected dependencies.
   *
   * @param userRepository - Repository for user persistence operations.
   * @param clock - Clock port for obtaining the current timestamp.
   */
  public constructor(
    @Inject('UserRepositoryPort')
    private readonly userRepository: UserRepositoryPort,
    @Inject('ClockPort')
    private readonly clock: ClockPort
  ) {}

  /**
   * Executes the suspend user command.
   *
   * Implements the following steps:
   * 1. Retrieves the existing user via {@link UserRepositoryPort.findById}
   * 2. Validates the user exists
   * 3. Calls {@link User#suspend} to mark the user as suspended
   * 4. Persists the updated user via {@link UserRepositoryPort.save}
   *
   * @param command - The {@link SuspendAuthUserCommand} containing the user ID.
   * @returns A promise that resolves when the user has been suspended.
   * @throws {UserNotFoundException} If the user with the given ID is not found.
   */
  public async execute(command: SuspendAuthUserCommand): Promise<void> {
    // Step 1: Retrieve the existing user by ID
    const user = await this.userRepository.findById(command.userId);

    // Step 2: Validate that the user exists
    if (user === null) {
      throw new UserNotFoundException(command.userId);
    }

    // Step 3: Suspend the user using the domain method with injected clock
    user.suspend(this.clock.now());

    // Step 4: Persist the updated user to the database
    await this.userRepository.save(user);
  }
}
