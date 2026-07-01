import { BadRequestException, ConflictException, Inject, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { UserEmail } from '../../../domain/entities/user/valueObjects/UserEmail.js';
import { UpdateAuthUserCommand } from './UpdateAuthUserCommand.js';

import type { UserRepositoryPort } from '../../../domain/entities/user/ports/UserRepositoryPort.js';
import type { UpdateAuthUserCommandResult } from './UpdateAuthUserCommandResult.js';

/**
 * NestJS CQRS CommandHandler implementation for {@link UpdateAuthUserCommand}.
 *
 * This handler implements the use case for updating existing authenticated users.
 * It enforces business rules including email uniqueness and proper domain validation.
 *
 * @see {@link UpdateAuthUserCommand} for input data structure.
 * @see {@link UpdateAuthUserCommandResult} for output data structure.
 * @see {@link User#rename} for updating names.
 * @see {@link User#changeEmail} for updating email.
 * @see {@link User#activate} and {@link User#suspend} for status changes.
 * @see {@link UserRepositoryPort} for persistence operations.
 */
@CommandHandler(UpdateAuthUserCommand)
export class UpdateAuthUserCommandHandler implements ICommandHandler<
  UpdateAuthUserCommand,
  UpdateAuthUserCommandResult
> {
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
   * Executes the update user command.
   *
   * Implements the following steps:
   * 1. Retrieves the existing user via {@link UserRepositoryPort.findById}
   * 2. Validates the user exists
   * 3. Applies name updates if provided using {@link User#rename}
   * 4. Applies email update if provided using {@link User#changeEmail}, checking uniqueness
   * 5. Applies status updates if provided using {@link User#activate} or {@link User#suspend}
   * 6. Persists the updated user via {@link UserRepositoryPort.save}
   * 7. Returns the updated user's primitive representation
   *
   * @param command - The {@link UpdateAuthUserCommand} containing update data.
   * @returns A promise resolving to {@link UpdateAuthUserCommandResult} with the updated user data.
   * @throws {NotFoundException} If the user with the given ID is not found (404 Not Found).
   * @throws {BadRequestException} If email validation fails (400 Bad Request).
   * @throws {ConflictException} If the new email already exists for a different user (409 Conflict).
   */
  public async execute(command: UpdateAuthUserCommand): Promise<UpdateAuthUserCommandResult> {
    // Step 1: Retrieve the existing user by ID
    const user = await this.userRepository.findById(command.userId);

    // Step 2: Validate that the user exists
    if (user === null) {
      throw new NotFoundException(`User with ID "${command.userId}" not found.`);
    }

    const now = new Date();

    // Step 3: Apply name updates if both firstName and lastName are provided
    if (command.firstName !== undefined && command.lastName !== undefined) {
      try {
        user.rename(command.firstName, command.lastName, now);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        throw new BadRequestException(`Invalid name: ${message}`);
      }
    }

    // Step 4: Apply email update if provided, checking uniqueness
    if (command.email !== undefined) {
      let userEmail: UserEmail;
      try {
        userEmail = UserEmail.create(command.email);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        throw new BadRequestException(`Invalid email: ${message}`);
      }

      // Check if the new email is already in use by a different user
      const existingUser = await this.userRepository.findByEmail(userEmail);
      if (existingUser !== null && existingUser.getId() !== command.userId) {
        throw new ConflictException(`An auth user with email "${command.email}" already exists.`);
      }

      user.changeEmail(command.email, now);
    }

    // Step 5: Apply status update if provided
    if (command.status !== undefined) {
      if (command.status === 'active') {
        user.activate(now);
      } else if (command.status === 'suspended') {
        user.suspend(now);
      } else {
        throw new BadRequestException(
          `Invalid status: "${command.status}". Must be "active" or "suspended".`
        );
      }
    }

    // Step 6: Persist the updated user to the database
    await this.userRepository.save(user);

    // Step 7: Return the updated user's primitive representation
    const primitives = user.toPrimitives();
    return {
      id: primitives.id,
      firstName: primitives.firstName,
      lastName: primitives.lastName,
      email: primitives.email,
      status: primitives.status,
      createdAt: primitives.createdAt,
      updatedAt: primitives.updatedAt
    };
  }
}
