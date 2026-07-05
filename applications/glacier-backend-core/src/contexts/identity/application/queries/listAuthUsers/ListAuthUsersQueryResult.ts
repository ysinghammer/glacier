import type { UserReadModel } from '../../shared/readModels/UserReadModel.js';

/**
 * Result type for {@link ListAuthUsersQuery} execution.
 *
 * This interface represents the successful outcome of listing users.
 * It contains a paginated list of users along with pagination metadata.
 *
 * @see {@link ListAuthUsersQueryHandler.execute} which produces this result.
 * @see {@link UserReadModel} for the structure of individual user items.
 * @see {@link ListAuthUsersQueryResultPagination} for pagination metadata.
 */
export type ListAuthUsersQueryResultItem = UserReadModel;

/**
 * Pagination metadata for {@link ListAuthUsersQueryResult}.
 *
 * Contains information about the current page, total pages, and total items.
 */
export interface ListAuthUsersQueryResultPagination {
  /**
   * Current page number (1-based).
   */
  readonly currentPage: number;

  /**
   * Number of items per page.
   */
  readonly pageSize: number;

  /**
   * Total number of items across all pages.
   */
  readonly totalItems: number;

  /**
   * Total number of pages.
   */
  readonly totalPages: number;
}

/**
 * Result type for {@link ListAuthUsersQuery} execution.
 *
 * This interface represents the successful outcome of listing users.
 * It contains a paginated list of users along with pagination metadata.
 *
 * @see {@link ListAuthUsersQueryHandler.execute} which produces this result.
 * @see {@link ListAuthUsersQueryResultItem} for the structure of individual user items.
 * @see {@link ListAuthUsersQueryResultPagination} for pagination metadata.
 */
export interface ListAuthUsersQueryResult {
  /**
   * Array of user items for the current page.
   */
  readonly items: ReadonlyArray<ListAuthUsersQueryResultItem>;

  /**
   * Pagination metadata.
   */
  readonly pagination: ListAuthUsersQueryResultPagination;
}
