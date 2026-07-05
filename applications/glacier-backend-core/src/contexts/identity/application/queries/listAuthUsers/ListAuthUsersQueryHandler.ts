import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { UserStatus } from '../../../domain/entities/user/valueObjects/UserStatus.js';
import { ListAuthUsersQuery } from './ListAuthUsersQuery.js';

import type { UserRepositoryPort } from '../../../domain/entities/user/ports/UserRepositoryPort.js';
import type { ListAuthUsersQueryResult } from './ListAuthUsersQueryResult.js';

/**
 * NestJS CQRS QueryHandler implementation for {@link ListAuthUsersQuery}.
 *
 * This handler implements the use case for retrieving a paginated, filtered,
 * and sorted list of users. Following CQRS principles, this is a read-only
 * operation that does not modify state.
 *
 * @see {@link ListAuthUsersQuery} for input data structure.
 * @see {@link ListAuthUsersQueryResult} for output data structure.
 * @see {@link UserRepositoryPort.findAll} for the repository method.
 */
@QueryHandler(ListAuthUsersQuery)
export class ListAuthUsersQueryHandler implements IQueryHandler<
  ListAuthUsersQuery,
  ListAuthUsersQueryResult
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
   * Executes the list users query.
   *
   * Implements the following steps:
   * 1. Parses and validates pagination parameters
   * 2. Parses optional filters (status, search query)
   * 3. Parses optional sort specification
   * 4. Retrieves paginated users via {@link UserRepositoryPort.findAll}
   * 5. Converts user aggregates to primitive representations
   * 6. Returns paginated results with metadata
   *
   * @param query - The {@link ListAuthUsersQuery} containing pagination, filter, and sort parameters.
   * @returns A promise resolving to {@link ListAuthUsersQueryResult} with paginated user data.
   */
  public async execute(query: ListAuthUsersQuery): Promise<ListAuthUsersQueryResult> {
    // Step 1: Parse and validate pagination parameters
    const pageNumber = Math.max(1, query.pageNumber);
    const pageSize = Math.min(100, Math.max(1, query.pageSize));

    // Step 2: Parse optional status filter
    let status: UserStatus | undefined;
    if (query.filterStatus !== undefined) {
      if (query.filterStatus === 'active') {
        status = UserStatus.ACTIVE;
      } else if (query.filterStatus === 'suspended') {
        status = UserStatus.SUSPENDED;
      }
    }

    // Step 3: Parse optional sort specification
    let sort: { field: string; direction: 'asc' | 'desc' } | undefined;
    if (query.sort !== undefined) {
      const sortParts = query.sort.split(',')[0]; // Take first sort field
      if (sortParts) {
        const isDescending = sortParts.startsWith('-');
        const field = isDescending ? sortParts.substring(1) : sortParts;
        sort = {
          field,
          direction: isDescending ? 'desc' : 'asc'
        };
      }
    }

    // Step 4: Retrieve paginated users from repository
    const result = await this.userRepository.findAll({
      page: pageNumber,
      pageSize,
      status,
      searchQuery: query.filterQuery,
      sort
    });

    // Step 5: Convert user aggregates to primitive representations
    const items = result.items.map((user) => {
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
    });

    // Step 6: Calculate pagination metadata and return result
    const totalPages = Math.ceil(result.totalItems / pageSize);

    return {
      items,
      pagination: {
        currentPage: pageNumber,
        pageSize,
        totalItems: result.totalItems,
        totalPages
      }
    };
  }
}
