/**
 * Base class for all domain events.
 *
 * Domain events represent significant business occurrences within an aggregate.
 * They are framework-agnostic (no NestJS/CQRS dependencies) and capture immutable
 * facts about what happened in the domain.
 *
 * All domain events have:
 * - An aggregate ID (who the event is about)
 * - An occurrence timestamp (when it happened)
 */
export abstract class DomainEvent {
  /**
   * Creates a domain event instance.
   *
   * @param aggregateId - The ID of the aggregate that emitted this event.
   * @param occurredAt - When the event occurred in the domain.
   */
  public constructor(
    public readonly aggregateId: string,
    public readonly occurredAt: Date
  ) {}
}
