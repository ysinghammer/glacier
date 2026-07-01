import type { User } from '../User.js';
import type { UserEmail } from '../valueObjects/UserEmail.js';

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
