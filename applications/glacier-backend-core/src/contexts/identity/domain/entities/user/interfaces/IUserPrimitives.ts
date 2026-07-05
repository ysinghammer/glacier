import { UserStatus } from '../valueObjects/UserStatus.js';

/**
 * Serializable representation of {@link User} data used for persistence and transport boundaries.
 *
 * Produced by {@link User#toPrimitives} when exporting aggregate state.
 * Consumed by {@link User.reconstitute} when rebuilding aggregate from storage.
 * Email is stored as a string, not {@link UserEmail} value object.
 */
export interface IUserPrimitives {
  /** Unique identifier of the user. */
  readonly id: string;

  /** Persisted given name. */
  readonly firstName: string;

  /** Persisted family name. */
  readonly lastName: string;

  /** Persisted normalized email value. */
  readonly email: string;

  /** Persisted lifecycle status value (see {@link UserStatus}). */
  readonly status: UserStatus;

  /** Persisted creation timestamp. */
  readonly createdAt: Date;

  /** Persisted last update timestamp. */
  readonly updatedAt: Date;
}
