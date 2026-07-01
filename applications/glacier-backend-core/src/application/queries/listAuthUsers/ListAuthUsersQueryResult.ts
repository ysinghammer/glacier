import type { UserStatus } from '../../../domain/entities/user/valueObjects/UserStatus.js';

/**
 * Individual user item in the {@link ListAuthUsersQueryResult}.
 *
 * Represents a single user's data in the paginated list result.
 *
 * @see {@link IUserPrimitives} for the structure of user primitive data.
 */
export interface ListAuthUsersQueryResultItem {
  /**
   * Unique identifier of the user.
   */
  readonly id: string;

  /**
   * Given name of the user.
   */
  readonly firstName: string;

  /**
   * Family name of the user.
   */
  readonly lastName: string;

  /**
   * Email address of the user (normalized).
   */
  readonly email: string;

  /**
   * Current status of the user.
   */
  readonly status: UserStatus;

  /**
   * Timestamp when the user was created.
   */
  readonly createdAt: Date;

  /**
   * Timestamp when the user was last updated.
   */
  readonly updatedAt: Date;
}

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
