import { randomUUID } from 'crypto';

import { BadRequestException, ConflictException, Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { User } from '../../../domain/entities/user/User.js';
import { UserEmail } from '../../../domain/entities/user/valueObjects/UserEmail.js';
import { CreateAuthUserCommand } from './CreateAuthUserCommand.js';

import type { UserRepositoryPort } from '../../../domain/entities/user/ports/UserRepositoryPort.js';
import type { CreateAuthUserCommandResult } from './CreateAuthUserCommandResult.js';

/**
 * NestJS CQRS CommandHandler implementation for {@link CreateAuthUserCommand}.
 *
 * This handler implements the use case for creating a new authenticated user.
 * It enforces business rules including email uniqueness and proper domain validation.
 */
@CommandHandler(CreateAuthUserCommand)
export class CreateAuthUserCommandHandler implements ICommandHandler<
  CreateAuthUserCommand,
  CreateAuthUserCommandResult
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
   * Executes the create user command.
   *
   * Implements the following steps:
   * 1. Validates and normalizes the email
   * 2. Checks that the email is not already in use
   * 3. Generates a new unique identifier
   * 4. Creates the user aggregate via {@link User.register}
   * 5. Persists the user via the repository
   * 6. Returns the created user's primitive representation
   *
   * @param command - The {@link CreateAuthUserCommand} containing user data.
   * @returns A promise resolving to {@link CreateAuthUserCommandResult} with the created user data.
   * @throws {BadRequestException} If email validation fails.
   * @throws {ConflictException} If the email already exists (409 Conflict).
   */
  public async execute(command: CreateAuthUserCommand): Promise<CreateAuthUserCommandResult> {
    // Step 1: Validate and normalize the email using the domain value object
    let userEmail: UserEmail;
    try {
      userEmail = UserEmail.create(command.email);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Invalid email: ${message}`);
    }

    // Step 2: Check for email uniqueness using the repository
    const existingUser = await this.userRepository.findByEmail(userEmail);
    if (existingUser !== null) {
      throw new ConflictException(`An auth user with email "${command.email}" already exists.`);
    }

    // Step 3: Generate a new unique identifier for the user
    const userId = randomUUID();

    // Step 4: Create the user aggregate using the domain factory method
    const newUser = User.register({
      id: userId,
      firstName: command.firstName,
      lastName: command.lastName,
      email: command.email,
      createdAt: new Date()
    });

    // Step 5: Persist the user to the database
    await this.userRepository.save(newUser);

    // Step 6: Return the created user's primitive representation
    const primitives = newUser.toPrimitives();
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
