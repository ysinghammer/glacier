/**
 * Input data required to create a new {@link User} via {@link UserFactory}.
 *
 * This interface defines the minimal set of attributes needed from external sources
 * (e.g., application layer, API requests) to construct a valid {@link User} aggregate.
 * Infrastructure concerns like ID ({@link IdGeneratorPort}) and timestamp
 * ({@link ClockPort}) generation are handled by {@link UserFactory}.
 */
export interface ICreateUserInput {
  /** Given name of the user being created. */
  readonly firstName: string;

  /** Family name of the user being created. */
  readonly lastName: string;

  /** Email address to be validated and normalized by {@link UserEmail.create}. */
  readonly email: string;
}
