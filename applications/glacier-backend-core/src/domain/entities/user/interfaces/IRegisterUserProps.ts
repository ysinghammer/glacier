/**
 * Input data required to register a new {@link User} aggregate.
 *
 * Used by {@link User.register} factory method.
 */
export interface IRegisterUserProps {
  /** Unique identifier assigned at registration time. */
  id: string;

  /** Given name supplied during registration. */
  firstName: string;

  /** Family name supplied during registration. */
  lastName: string;

  /** Raw email string to be validated and normalized by {@link UserEmail.create}. */
  email: string;

  /** Timestamp representing when registration occurs. */
  createdAt: Date;
}
