import type { UserStatus } from '../../../domain/entities/user/valueObjects/UserStatus.js';

/**
 * Result type for {@link CreateAuthUserCommand} execution.
 *
 * This interface represents the successful outcome of creating a new user.
 * It contains the primitive representation of the created {@link User} aggregate,
 * suitable for crossing application boundaries (e.g., returning to the presentation layer).
 *
 * @see {@link CreateAuthUserCommandHandler.execute} which produces this result.
 * @see {@link IUserPrimitives} for the structure of user primitive data.
 */
export interface CreateAuthUserCommandResult {
  /**
   * Unique identifier of the created user.
   */
  readonly id: string;

  /**
   * Given name of the created user.
   */
  readonly firstName: string;

  /**
   * Family name of the created user.
   */
  readonly lastName: string;

  /**
   * Email address of the created user (normalized).
   */
  readonly email: string;

  /**
   * Initial status of the created user.
   */
  readonly status: UserStatus;

  /**
   * Timestamp when the user was created.
   */
  readonly createdAt: Date;

  /**
   * Timestamp when the user was last updated (same as createdAt for new users).
   */
  readonly updatedAt: Date;
}
