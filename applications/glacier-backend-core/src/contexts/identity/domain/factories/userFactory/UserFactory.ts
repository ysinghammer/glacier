import { User } from '../../entities/user/User.js';
import { ICreateUserInput } from './interfaces/ICreateUserInput.js';

import type { ClockPort, IdGeneratorPort } from '../../../../../shared/kernel/index.js';

/**
 * Domain factory for creating {@link User} aggregates.
 *
 * Orchestrates user registration by injecting infrastructure concerns via
 * {@link IdGeneratorPort} and {@link ClockPort}, then delegates domain validation
 * to {@link User.register}.
 * This keeps the {@link User} aggregate free from infrastructure dependencies.
 */
export class UserFactory {
  /**
   * Creates a user factory with required infrastructure ports.
   *
   * @param idGenerator - {@link IdGeneratorPort} for generating unique identifiers.
   * @param clock - {@link ClockPort} for obtaining current timestamps.
   */
  public constructor(
    private readonly idGenerator: IdGeneratorPort,
    private readonly clock: ClockPort
  ) {}

  /**
   * Creates a new {@link User} aggregate with infrastructure-generated ID and timestamp.
   *
   * @param input - User attributes from external sources (see {@link ICreateUserInput}).
   * @returns A newly registered {@link User} aggregate in {@link UserStatus.ACTIVE} status.
   * @throws {Error} If user attributes fail domain validation (see {@link User.register}).
   */
  public create(input: ICreateUserInput): User {
    return User.register({
      id: this.idGenerator.generate(),
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      createdAt: this.clock.now()
    });
  }
}
