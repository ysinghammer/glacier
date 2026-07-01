/**
 * Query to retrieve a single authenticated user by identifier.
 *
 * This query encapsulates the intent to fetch a specific user's data.
 * Following CQRS principles, this is a read-only operation that does not
 * modify any state.
 *
 * @see {@link GetAuthUserByIdQueryHandler} for query execution logic.
 * @see {@link UserRepositoryPort.findById} for the repository method used to fetch the user.
 */
export class GetAuthUserByIdQuery {
  /**
   * Unique identifier of the user to retrieve.
   */
  public readonly userId: string;

  /**
   * Creates a new GetAuthUserByIdQuery instance.
   *
   * @param userId - The unique identifier of the user to fetch.
   */
  constructor(userId: string) {
    this.userId = userId;
  }
}
