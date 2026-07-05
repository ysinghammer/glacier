import type { UserReadModel } from '../../shared/readModels/UserReadModel.js';

/**
 * Result type for {@link UpdateAuthUserCommand} execution.
 *
 * This is a type alias for {@link UserReadModel}, representing the successful outcome
 * of updating a user. It contains the primitive representation of the updated
 * {@link User} aggregate, suitable for crossing application boundaries.
 *
 * @see {@link UserReadModel} for the structure of the read model.
 * @see {@link UpdateAuthUserCommandHandler.execute} which produces this result.
 */
export type UpdateAuthUserCommandResult = UserReadModel;
