import type { User } from '../User.js';
import type { UserEmail } from '../valueObjects/UserEmail.js';
import type { UserStatus } from '../valueObjects/UserStatus.js';

/**
 * Options for paginating and filtering user queries.
 */
export interface FindAllUsersOptions {
  /**
   * Page number (1-based).
   */
  readonly page: number;

  /**
   * Number of items per page.
   */
  readonly pageSize: number;

  /**
   * Optional status filter.
   */
  readonly status?: UserStatus;

  /**
   * Optional text search across user fields (name, email).
   */
  readonly searchQuery?: string;

  /**
   * Optional sort field and direction.
   */
  readonly sort?: {
    readonly field: string;
    readonly direction: 'asc' | 'desc';
  };
}

/**
 * Result of a paginated user query.
 */
export interface FindAllUsersResult {
  /**
   * Array of user aggregates for the current page.
   */
  readonly items: ReadonlyArray<User>;

  /**
   * Total number of items across all pages.
   */
  readonly totalItems: number;
}

/**
 * Outbound port defining persistence operations for the {@link User} aggregate.
 *
 * Implementations should use {@link User.reconstitute} to rebuild aggregates from storage
 * and {@link User#toPrimitives} to extract data for persistence.
 */
export interface UserRepositoryPort {
  /**
   * Finds a user by identifier.
   *
   * @param id - Unique identifier of the {@link User} to find.
   * @returns A promise resolving to the {@link User} aggregate if found, or null if not found.
   */
  findById(id: string): Promise<User | null>;

  /**
   * Finds a user by {@link UserEmail} value object.
   *
   * @param email - {@link UserEmail} value object to search for.
   * @returns A promise resolving to the {@link User} aggregate if found, or null if not found.
   */
  findByEmail(email: UserEmail): Promise<User | null>;

  /**
   * Finds all users with pagination, filtering, and sorting.
   *
   * @param options - Options for pagination, filtering, and sorting.
   * @returns A promise resolving to {@link FindAllUsersResult} with paginated user data.
   */
  findAll(options: FindAllUsersOptions): Promise<FindAllUsersResult>;

  /**
   * Persists a {@link User} aggregate.
   *
   * Performs an upsert operation: creates if the user doesn't exist, updates if it does.
   *
   * @param user - {@link User} aggregate to persist.
   * @returns A promise that resolves when persistence is complete.
   */
  save(user: User): Promise<void>;

  /**
   * Removes a {@link User} aggregate by identifier.
   *
   * @param id - Unique identifier of the {@link User} to remove.
   * @returns A promise that resolves when removal is complete.
   */
  removeById(id: string): Promise<void>;
}
