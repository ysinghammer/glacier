/**
 * Input data required to register a new {@link User} aggregate.
 *
 * Used by {@link User.register} factory method.
 */
export interface IRegisterUserProps {
  /** Unique identifier assigned at registration time. */
  readonly id: string;

  /** Given name supplied during registration. */
  readonly firstName: string;

  /** Family name supplied during registration. */
  readonly lastName: string;

  /** Raw email string to be validated and normalized by {@link UserEmail.create}. */
  readonly email: string;

  /** Timestamp representing when registration occurs. */
  readonly createdAt: Date;
}
