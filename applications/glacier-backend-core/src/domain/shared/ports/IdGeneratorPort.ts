/**
 * Inbound port for unique identifier generation.
 *
 * Abstracts ID creation strategy (e.g., UUID v4, ULID, CUID) from domain logic,
 * allowing deterministic testing and flexible infrastructure implementations.
 *
 * Used by factories like {@link UserFactory} to assign aggregate identifiers.
 */
export interface IdGeneratorPort {
  /**
   * Generates a unique identifier.
   *
   * @returns A unique identifier string suitable for aggregate root identification.
   */
  generate(): string;
}
