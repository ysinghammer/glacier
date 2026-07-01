/**
 * Result type for {@link GetAuthUserByIdQuery} execution.
 *
 * This interface represents the successful outcome of retrieving a user by ID.
 * It contains the primitive representation of the {@link User} aggregate,
 * suitable for crossing application boundaries (e.g., returning to the presentation layer).
 *
 * @see {@link GetAuthUserByIdQueryHandler.execute} which produces this result.
 * @see {@link IUserPrimitives} for the structure of user primitive data.
 */
export interface GetAuthUserByIdQueryResult {
  /**
   * Unique identifier of the user.
   */
  readonly id: string;

  /**
   * Given name of the user.
   */
  readonly firstName: string;

  /**
   * Family name of the user.
   */
  readonly lastName: string;

  /**
   * Email address of the user (normalized).
   */
  readonly email: string;

  /**
   * Current status of the user.
   */
  readonly status: string;

  /**
   * Timestamp when the user was created.
   */
  readonly createdAt: Date;

  /**
   * Timestamp when the user was last updated.
   */
  readonly updatedAt: Date;
}
