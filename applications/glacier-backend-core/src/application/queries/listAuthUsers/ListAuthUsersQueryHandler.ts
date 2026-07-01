import type { ListAuthUsersQuery } from './ListAuthUsersQuery.js';
import type { ListAuthUsersQueryResult } from './ListAuthUsersQueryResult.js';

/**
 * Handler interface for {@link ListAuthUsersQuery}.
 *
 * This is an inbound port in the Hexagonal Architecture, defining the contract
 * for retrieving a paginated, filtered, and sorted list of users.
 * Implementations should:
 * 1. Apply pagination based on {@link ListAuthUsersQuery#pageNumber} and {@link ListAuthUsersQuery#pageSize}
 * 2. Apply status filter if {@link ListAuthUsersQuery#filterStatus} is provided
 * 3. Apply text search if {@link ListAuthUsersQuery#filterQuery} is provided
 * 4. Apply sorting if {@link ListAuthUsersQuery#sort} is provided
 * 5. Include related entities if {@link ListAuthUsersQuery#include} is provided
 * 6. Return paginated results with metadata
 *
 * @see {@link ListAuthUsersQuery} for input data structure.
 * @see {@link ListAuthUsersQueryResult} for output data structure.
 * @see {@link UserRepositoryPort} for persistence operations (may need extension for list queries).
 */
export interface ListAuthUsersQueryHandler {
  /**
   * Executes the list users query.
   *
   * @param query - The {@link ListAuthUsersQuery} containing pagination, filter, and sort parameters.
   * @returns A promise resolving to {@link ListAuthUsersQueryResult} with paginated user data.
   */
  execute(query: ListAuthUsersQuery): Promise<ListAuthUsersQueryResult>;
}
