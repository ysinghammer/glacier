import type { UserReadModel } from '../../shared/readModels/UserReadModel.js';

/**
 * Result type for {@link CreateAuthUserCommand} execution.
 *
 * This is a type alias for {@link UserReadModel}, representing the successful outcome
 * of creating a new user. It contains the primitive representation of the created
 * {@link User} aggregate, suitable for crossing application boundaries.
 *
 * @see {@link UserReadModel} for the structure of the read model.
 * @see {@link CreateAuthUserCommandHandler.execute} which produces this result.
 */
export type CreateAuthUserCommandResult = UserReadModel;
