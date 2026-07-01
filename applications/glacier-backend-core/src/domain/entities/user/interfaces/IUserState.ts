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
  id: string;

  /** Validated given name. */
  firstName: string;

  /** Validated family name. */
  lastName: string;

  /** Validated {@link UserEmail} value object. */
  email: UserEmail;

  /** Current user lifecycle status (see {@link UserStatus}). */
  status: UserStatus;

  /** Aggregate creation timestamp. */
  createdAt: Date;

  /** Aggregate last modification timestamp. */
  updatedAt: Date;
}
