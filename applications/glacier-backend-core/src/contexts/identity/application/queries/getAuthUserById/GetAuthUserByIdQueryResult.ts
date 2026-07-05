import type { UserReadModel } from '../../shared/readModels/UserReadModel.js';

/**
 * Result type for {@link GetAuthUserByIdQuery} execution.
 *
 * This is a type alias for {@link UserReadModel}, representing the successful outcome
 * of retrieving a user by ID. It contains the primitive representation of the
 * {@link User} aggregate, suitable for crossing application boundaries.
 *
 * @see {@link UserReadModel} for the structure of the read model.
 * @see {@link GetAuthUserByIdQueryHandler.execute} which produces this result.
 */
export type GetAuthUserByIdQueryResult = UserReadModel;
