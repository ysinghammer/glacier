import { Query } from '@nestjs/cqrs';

import { ListAuthUsersQueryResult } from './ListAuthUsersQueryResult.js';

/**
 * Query to retrieve a paginated, filtered, and sorted list of authenticated users.
 *
 * This query encapsulates all parameters needed to fetch a collection of users
 * with pagination, filtering, and sorting capabilities. Following CQRS principles,
 * this is a read-only operation that does not modify any state.
 *
 * @see {@link ListAuthUsersQueryHandler} for query execution logic.
 */
export class ListAuthUsersQuery extends Query<ListAuthUsersQueryResult> {
  /**
   * Page number for pagination (1-based).
   * Defaults to 1 if not specified.
   */
  public readonly pageNumber: number;

  /**
   * Number of items per page.
   * Defaults to 20 if not specified, with a maximum of 100.
   */
  public readonly pageSize: number;

  /**
   * Optional filter by user status.
   * Can be 'ACTIVE' or 'SUSPENDED'.
   */
  public readonly filterStatus?: string;

  /**
   * Optional text search query for filtering users.
   * Searches across user fields like name and email.
   */
  public readonly filterQuery?: string;

  /**
   * Optional sort specification.
   * Comma-separated fields with optional "-" prefix for descending order.
   * Example: "-createdAt,email" sorts by createdAt descending, then email ascending.
   */
  public readonly sort?: string;

  /**
   * Optional related entities to include in the response.
   * Currently supports 'accounts'.
   */
  public readonly include?: string;

  /**
   * Creates a new ListAuthUsersQuery instance.
   *
   * @param pageNumber - Page number for pagination (1-based, defaults to 1).
   * @param pageSize - Number of items per page (defaults to 20, max 100).
   * @param filterStatus - Optional status filter.
   * @param filterQuery - Optional text search query.
   * @param sort - Optional sort specification.
   * @param include - Optional related entities to include.
   */
  constructor(
    pageNumber: number = 1,
    pageSize: number = 20,
    filterStatus?: string,
    filterQuery?: string,
    sort?: string,
    include?: string
  ) {
    super();
    this.pageNumber = pageNumber;
    this.pageSize = pageSize;
    this.filterStatus = filterStatus;
    this.filterQuery = filterQuery;
    this.sort = sort;
    this.include = include;
  }
}
