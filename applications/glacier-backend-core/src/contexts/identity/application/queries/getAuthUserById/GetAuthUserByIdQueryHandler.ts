import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { UserNotFoundException } from '../../../domain/shared/exceptions/UserNotFoundException.js';
import { GetAuthUserByIdQuery } from './GetAuthUserByIdQuery.js';

import type { UserRepositoryPort } from '../../../domain/entities/user/ports/UserRepositoryPort.js';
import type { GetAuthUserByIdQueryResult } from './GetAuthUserByIdQueryResult.js';

/**
 * NestJS CQRS QueryHandler implementation for {@link GetAuthUserByIdQuery}.
 *
 * This handler implements the use case for retrieving a single user by identifier.
 * Following CQRS principles, this is a read-only operation that does not modify state.
 * Throws domain-level exceptions which are mapped to HTTP responses by {@link DomainExceptionFilter}.
 *
 * @see {@link GetAuthUserByIdQuery} for input data structure.
 * @see {@link GetAuthUserByIdQueryResult} for output data structure.
 * @see {@link UserRepositoryPort.findById} for the repository method.
 * @see {@link User#toPrimitives} for converting the aggregate to primitives.
 */
@QueryHandler(GetAuthUserByIdQuery)
export class GetAuthUserByIdQueryHandler implements IQueryHandler<
  GetAuthUserByIdQuery,
  GetAuthUserByIdQueryResult
> {
  /**
   * Creates a new handler instance with injected dependencies.
   *
   * @param userRepository - Repository for user read operations.
   */
  public constructor(
    @Inject('UserRepositoryPort')
    private readonly userRepository: UserRepositoryPort
  ) {}

  /**
   * Executes the get user by ID query.
   *
   * Implements the following steps:
   * 1. Retrieves the user via {@link UserRepositoryPort.findById}
   * 2. Validates the user exists
   * 3. Returns the user's primitive representation
   *
   * @param query - The {@link GetAuthUserByIdQuery} containing the user ID.
   * @returns A promise resolving to {@link GetAuthUserByIdQueryResult} with the user data.
   * @throws {UserNotFoundException} If the user with the given ID is not found.
   */
  public async execute(query: GetAuthUserByIdQuery): Promise<GetAuthUserByIdQueryResult> {
    // Step 1: Retrieve the user by ID
    const user = await this.userRepository.findById(query.userId);

    // Step 2: Validate that the user exists
    if (user === null) {
      throw new UserNotFoundException(query.userId);
    }

    // Step 3: Return the user's primitive representation
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
