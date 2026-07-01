import type { GetAuthUserByIdQuery } from './GetAuthUserByIdQuery.js';
import type { GetAuthUserByIdQueryResult } from './GetAuthUserByIdQueryResult.js';

/**
 * Handler interface for {@link GetAuthUserByIdQuery}.
 *
 * This is an inbound port in the Hexagonal Architecture, defining the contract
 * for retrieving a single user by identifier. Implementations should:
 * 1. Retrieve the user via {@link UserRepositoryPort.findById}
 * 2. Return the user's primitive representation if found
 * 3. Return null or throw an error if not found (implementation choice)
 *
 * @see {@link GetAuthUserByIdQuery} for input data structure.
 * @see {@link GetAuthUserByIdQueryResult} for output data structure.
 * @see {@link UserRepositoryPort.findById} for the repository method.
 * @see {@link User#toPrimitives} for converting the aggregate to primitives.
 */
export interface GetAuthUserByIdQueryHandler {
  /**
   * Executes the get user by ID query.
   *
   * @param query - The {@link GetAuthUserByIdQuery} containing the user ID.
   * @returns A promise resolving to {@link GetAuthUserByIdQueryResult} with the user data.
   * @throws {Error} If the user is not found.
   */
  execute(query: GetAuthUserByIdQuery): Promise<GetAuthUserByIdQueryResult>;
}
