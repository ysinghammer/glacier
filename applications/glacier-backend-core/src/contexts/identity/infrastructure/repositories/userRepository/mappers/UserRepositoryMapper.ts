import { UserStatus } from '../../../../domain/entities/user/valueObjects/UserStatus.js';

import type { IUserPrimitives } from '../../../../domain/entities/user/interfaces/IUserPrimitives.js';
import type { AUTH_USERS, AUTH_USER_STATUS } from '../../../../../../generated/prisma/client.js';

/**
 * Maps {@link User} domain aggregate to and from Prisma {@link AUTH_USERS} database model.
 *
 * Responsibilities:
 * - Converts domain {@link UserStatus} enum to database {@link AUTH_USER_STATUS} enum
 * - Converts {@link IUserPrimitives} to Prisma model structure
 * - Converts Prisma model to {@link IUserPrimitives} for aggregate reconstitution
 *
 * Uses {@link User.reconstitute} to rebuild aggregates from database primitives.
 * Uses {@link User#toPrimitives} to extract data for database persistence.
 */
export class UserRepositoryMapper {
  /**
   * Converts domain {@link UserStatus} enum to database {@link AUTH_USER_STATUS} enum.
   *
   * @param status - Domain user status value from {@link UserStatus}.
   * @returns Equivalent Prisma enum value for database persistence.
   */
  private static toPrismaStatus(status: UserStatus): AUTH_USER_STATUS {
    const statusMap: Record<UserStatus, AUTH_USER_STATUS> = {
      [UserStatus.ACTIVE]: 'ACTIVE',
      [UserStatus.SUSPENDED]: 'SUSPENDED'
    };
    return statusMap[status];
  }

  /**
   * Converts database {@link AUTH_USER_STATUS} enum to domain {@link UserStatus} enum.
   *
   * @param status - Prisma user status value from database.
   * @returns Equivalent domain enum value for {@link User} aggregate.
   */
  private static toDomainStatus(status: AUTH_USER_STATUS): UserStatus {
    const statusMap: Record<AUTH_USER_STATUS, UserStatus> = {
      ACTIVE: UserStatus.ACTIVE,
      SUSPENDED: UserStatus.SUSPENDED
    };
    return statusMap[status];
  }

  /**
   * Converts {@link IUserPrimitives} to Prisma create/update input format.
   *
   * Maps domain primitive structure to database column names and types.
   * Used by repository {@link UserRepositoryPort#save} operation.
   *
   * @param primitives - Domain primitive representation from {@link User#toPrimitives}.
   * @returns Prisma input object for create or update operations.
   */
  public static toPrisma(primitives: IUserPrimitives): Omit<AUTH_USERS, never> {
    return {
      id: primitives.id,
      firstName: primitives.firstName,
      lastName: primitives.lastName,
      email: primitives.email,
      status: UserRepositoryMapper.toPrismaStatus(primitives.status),
      createdAt: primitives.createdAt,
      updatedAt: primitives.updatedAt
    };
  }

  /**
   * Converts Prisma {@link AUTH_USERS} model to {@link IUserPrimitives} for aggregate reconstitution.
   *
   * Maps database column names and types to domain primitive structure.
   * The resulting primitives can be passed to {@link User.reconstitute}.
   *
   * @param model - Prisma user model from database query result.
   * @returns Domain primitive representation suitable for {@link User.reconstitute}.
   */
  public static toDomain(model: AUTH_USERS): IUserPrimitives {
    return {
      id: model.id,
      firstName: model.firstName,
      lastName: model.lastName,
      email: model.email,
      status: UserRepositoryMapper.toDomainStatus(model.status),
      createdAt: model.createdAt,
      updatedAt: model.updatedAt
    };
  }
}
