import { Injectable } from '@nestjs/common';

import { User } from '../../../domain/entities/user/User.js';
import { PrismaClient } from '../../../generated/prisma/client.js';
import { UserRepositoryMapper } from './mappers/UserRepositoryMapper.js';

import type { UserRepositoryPort } from '../../../domain/entities/user/ports/UserRepositoryPort.js';
import type { UserEmail } from '../../../domain/entities/user/valueObjects/UserEmail.js';

/**
 * Prisma-based implementation of {@link UserRepositoryPort} for PostgreSQL persistence.
 *
 * This adapter translates domain operations into Prisma ORM calls, maintaining
 * the separation between domain logic and infrastructure concerns.
 *
 * Architecture responsibilities:
 * - Implements outbound port {@link UserRepositoryPort} from the domain layer
 * - Uses {@link UserRepositoryMapper} to convert between domain and database models
 * - Uses {@link User.reconstitute} to rebuild aggregates from database primitives
 * - Uses {@link User#toPrimitives} to extract data for database persistence
 * - Handles database exceptions and translates them to domain-level errors
 *
 * All queries target the {@link AUTH_USERS} database table.
 */
@Injectable()
export class UserRepository implements UserRepositoryPort {
  /**
   * Creates a new Prisma-based user repository adapter.
   *
   * @param prisma - Prisma client instance for database operations (injected by NestJS).
   */
  public constructor(private readonly prisma: PrismaClient) {}

  /**
   * Finds a {@link User} aggregate by its unique identifier.
   *
   * Queries the {@link AUTH_USERS} table by primary key.
   * Returns null if no user exists with the given identifier.
   *
   * @param id - Unique identifier of the user to find.
   * @returns A promise resolving to the reconstituted {@link User} aggregate or null.
   * @throws {Error} If database query fails or aggregate reconstitution fails.
   */
  public async findById(id: string): Promise<User | null> {
    const userModel = await this.prisma.aUTH_USERS.findUnique({
      where: { id }
    });

    if (userModel === null) {
      return null;
    }

    const primitives = UserRepositoryMapper.toDomain(userModel);
    return User.reconstitute(primitives);
  }

  /**
   * Finds a {@link User} aggregate by its {@link UserEmail} value object.
   *
   * Queries the {@link AUTH_USERS} table using the unique email index.
   * Returns null if no user exists with the given email address.
   *
   * @param email - {@link UserEmail} value object to search for.
   * @returns A promise resolving to the reconstituted {@link User} aggregate or null.
   * @throws {Error} If database query fails or aggregate reconstitution fails.
   */
  public async findByEmail(email: UserEmail): Promise<User | null> {
    const userModel = await this.prisma.aUTH_USERS.findUnique({
      where: { email: email.toString() }
    });

    if (userModel === null) {
      return null;
    }

    const primitives = UserRepositoryMapper.toDomain(userModel);
    return User.reconstitute(primitives);
  }

  /**
   * Persists a {@link User} aggregate to the database.
   *
   * Performs an upsert operation on the {@link AUTH_USERS} table:
   * - Creates a new record if the user ID doesn't exist
   * - Updates the existing record if the user ID already exists
   *
   * Extracts primitive data using {@link User#toPrimitives} and converts
   * it to Prisma format using {@link UserRepositoryMapper.toPrisma}.
   *
   * @param user - {@link User} aggregate to persist.
   * @returns A promise that resolves when the database operation completes.
   * @throws {Error} If database operation fails (e.g., unique constraint violation).
   */
  public async save(user: User): Promise<void> {
    const primitives = user.toPrimitives();
    const prismaData = UserRepositoryMapper.toPrisma(primitives);

    await this.prisma.aUTH_USERS.upsert({
      where: { id: prismaData.id },
      create: prismaData,
      update: {
        firstName: prismaData.firstName,
        lastName: prismaData.lastName,
        email: prismaData.email,
        status: prismaData.status,
        updatedAt: prismaData.updatedAt
      }
    });
  }

  /**
   * Removes a {@link User} aggregate from the database by its unique identifier.
   *
   * Deletes the record from the {@link AUTH_USERS} table.
   * Silently succeeds if no user exists with the given identifier.
   *
   * Note: This is a hard delete operation. Consider implementing soft delete
   * using {@link User#suspend} if audit trails or data recovery are required.
   *
   * @param id - Unique identifier of the user to remove.
   * @returns A promise that resolves when the database operation completes.
   * @throws {Error} If database operation fails (e.g., foreign key constraint violation).
   */
  public async removeById(id: string): Promise<void> {
    await this.prisma.aUTH_USERS.delete({
      where: { id }
    });
  }
}
