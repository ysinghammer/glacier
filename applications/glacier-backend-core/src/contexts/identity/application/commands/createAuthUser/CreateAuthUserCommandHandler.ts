import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { UserEmail } from '../../../domain/entities/user/valueObjects/UserEmail.js';
import { UserFactory } from '../../../domain/factories/userFactory/UserFactory.js';
import { UserAlreadyExistsException } from '../../../domain/shared/exceptions/UserAlreadyExistsException.js';
import { InvalidUserDataException } from '../../../domain/shared/exceptions/InvalidUserDataException.js';
import { CreateAuthUserCommand } from './CreateAuthUserCommand.js';

import type { UserRepositoryPort } from '../../../domain/entities/user/ports/UserRepositoryPort.js';
import type { CreateAuthUserCommandResult } from './CreateAuthUserCommandResult.js';

/**
 * NestJS CQRS CommandHandler implementation for {@link CreateAuthUserCommand}.
 *
 * This handler implements the use case for creating a new authenticated user.
 * It enforces business rules including email uniqueness and proper domain validation.
 * Throws domain-level exceptions which are mapped to HTTP responses by {@link DomainExceptionFilter}.
 */
@CommandHandler(CreateAuthUserCommand)
export class CreateAuthUserCommandHandler implements ICommandHandler<
  CreateAuthUserCommand,
  CreateAuthUserCommandResult
> {
  /**
   * Creates a new handler instance with injected dependencies.
   *
   * @param userFactory - Factory for creating new user aggregates with injected infrastructure concerns.
   * @param userRepository - Repository for user persistence operations.
   */
  public constructor(
    private readonly userFactory: UserFactory,
    @Inject('UserRepositoryPort')
    private readonly userRepository: UserRepositoryPort
  ) {}

  /**
   * Executes the create user command.
   *
   * Implements the following steps:
   * 1. Validates and normalizes the email
   * 2. Checks that the email is not already in use
   * 3. Creates the user aggregate via {@link UserFactory} with injected ID/Clock ports
   * 4. Persists the user via the repository
   * 5. Returns the created user's primitive representation
   *
   * @param command - The {@link CreateAuthUserCommand} containing user data.
   * @returns A promise resolving to {@link CreateAuthUserCommandResult} with the created user data.
   * @throws {InvalidUserDataException} If email validation fails.
   * @throws {UserAlreadyExistsException} If the email already exists.
   */
  public async execute(command: CreateAuthUserCommand): Promise<CreateAuthUserCommandResult> {
    // Step 1: Validate and normalize the email using the domain value object
    let userEmail: UserEmail;
    try {
      userEmail = UserEmail.create(command.email);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new InvalidUserDataException('email', message);
    }

    // Step 2: Check for email uniqueness using the repository
    const existingUser = await this.userRepository.findByEmail(userEmail);
    if (existingUser !== null) {
      throw new UserAlreadyExistsException(command.email);
    }

    // Step 3: Create the user aggregate using the domain factory with injected infrastructure ports
    const newUser = this.userFactory.create({
      firstName: command.firstName,
      lastName: command.lastName,
      email: command.email
    });

    // Step 4: Persist the user to the database
    await this.userRepository.save(newUser);

    // Step 5: Return the created user's primitive representation
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
