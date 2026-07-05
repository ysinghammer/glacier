import type { UserStatus } from '../../../domain/entities/user/valueObjects/UserStatus.js';

/**
 * Read model for user data crossing application boundaries.
 *
 * This interface is used as the return type for commands and queries that operate on users.
 * It represents the user's state at a point in time, suitable for presentation to clients.
 *
 * Consolidates the structure previously duplicated across:
 * - {@link CreateAuthUserCommandResult}
 * - {@link UpdateAuthUserCommandResult}
 * - {@link GetAuthUserByIdQueryResult}
 */
export interface UserReadModel {
  /** Unique identifier of the user. */
  readonly id: string;

  /** Given name of the user. */
  readonly firstName: string;

  /** Family name of the user. */
  readonly lastName: string;

  /** Normalized email address of the user. */
  readonly email: string;

  /** Current lifecycle status of the user. */
  readonly status: UserStatus;

  /** Timestamp when the user was originally created. */
  readonly createdAt: Date;

  /** Timestamp when the user was last updated. */
  readonly updatedAt: Date;
}
