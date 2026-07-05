import { DomainEvent } from '../../../shared/events/DomainEvent.js';

/**
 * Event emitted when a suspended user is activated.
 *
 * This event is published after {@link User.activate} completes successfully.
 * Subscribers can react by:
 * - Restoring access permissions
 * - Re-enabling API access
 * - Notifying the user via email
 * - Recording activation audit logs
 */
export class UserActivatedEvent extends DomainEvent {
  /**
   * Creates a UserActivatedEvent instance.
   *
   * @param userId - The unique identifier of the activated user.
   * @param occurredAt - When the activation occurred.
   */
  public constructor(userId: string, occurredAt: Date) {
    super(userId, occurredAt);
    Object.setPrototypeOf(this, UserActivatedEvent.prototype);
  }
}
