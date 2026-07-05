import { UserEmail } from '../valueObjects/UserEmail.js';
import { UserStatus } from '../valueObjects/UserStatus.js';

/**
 * Internal state contract used to construct a fully validated {@link User} aggregate instance.
 *
 * Only used by the private {@link User} constructor.
 * Unlike {@link IUserPrimitives}, email is a {@link UserEmail} value object, not a string.
 */
export interface IUserState {
  /** Unique identifier of the user aggregate. */
  readonly id: string;

  /** Validated given name. */
  readonly firstName: string;

  /** Validated family name. */
  readonly lastName: string;

  /** Validated {@link UserEmail} value object. */
  readonly email: UserEmail;

  /** Current user lifecycle status (see {@link UserStatus}). */
  readonly status: UserStatus;

  /** Aggregate creation timestamp. */
  readonly createdAt: Date;

  /** Aggregate last modification timestamp. */
  readonly updatedAt: Date;
}
