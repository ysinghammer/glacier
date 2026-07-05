import { DomainEvent } from '../../../shared/events/DomainEvent.js';

/**
 * Event emitted when a new user is successfully registered.
 *
 * This event is published after {@link User.register} completes successfully.
 * Subscribers can react by sending welcome emails, initializing user profiles,
 * or triggering onboarding workflows.
 */
export class UserRegisteredEvent extends DomainEvent {
  /**
   * Creates a UserRegisteredEvent instance.
   *
   * @param userId - The unique identifier of the newly registered user.
   * @param email - The email address of the newly registered user.
   * @param firstName - The given name of the newly registered user.
   * @param lastName - The family name of the newly registered user.
   * @param occurredAt - When the registration occurred.
   */
  public constructor(
    userId: string,
    public readonly email: string,
    public readonly firstName: string,
    public readonly lastName: string,
    occurredAt: Date
  ) {
    super(userId, occurredAt);
    Object.setPrototypeOf(this, UserRegisteredEvent.prototype);
  }
}
