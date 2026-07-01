/**
 * Result type for {@link UpdateAuthUserCommand} execution.
 *
 * This interface represents the successful outcome of updating a user.
 * It contains the primitive representation of the updated {@link User} aggregate,
 * suitable for crossing application boundaries (e.g., returning to the presentation layer).
 *
 * @see {@link UpdateAuthUserCommandHandler.execute} which produces this result.
 * @see {@link IUserPrimitives} for the structure of user primitive data.
 */
export interface UpdateAuthUserCommandResult {
  /**
   * Unique identifier of the updated user.
   */
  readonly id: string;

  /**
   * Given name of the updated user.
   */
  readonly firstName: string;

  /**
   * Family name of the updated user.
   */
  readonly lastName: string;

  /**
   * Email address of the updated user (normalized).
   */
  readonly email: string;

  /**
   * Current status of the updated user.
   */
  readonly status: string;

  /**
   * Timestamp when the user was originally created.
   */
  readonly createdAt: Date;

  /**
   * Timestamp when the user was last updated.
   */
  readonly updatedAt: Date;
}
