import { DomainEvent } from '../../../shared/events/DomainEvent.js';

/**
 * Event emitted when a user is suspended.
 *
 * This event is published after {@link User.suspend} completes successfully.
 * Subscribers can react by:
 * - Revoking active sessions
 * - Blocking API access tokens
 * - Notifying the user via email
 * - Recording suspension audit logs
 */
export class UserSuspendedEvent extends DomainEvent {
  /**
   * Creates a UserSuspendedEvent instance.
   *
   * @param userId - The unique identifier of the suspended user.
   * @param occurredAt - When the suspension occurred.
   */
  public constructor(userId: string, occurredAt: Date) {
    super(userId, occurredAt);
    Object.setPrototypeOf(this, UserSuspendedEvent.prototype);
  }
}
