/**
 * Inbound port for unique identifier generation.
 *
 * Abstracts ID creation strategy (e.g., UUID v4, ULID, CUID) from domain logic,
 * allowing deterministic testing and flexible infrastructure implementations.
 *
 * Used by factories and domain logic to assign aggregate identifiers.
 * This is a shared kernel port used across all bounded contexts.
 */
export interface IdGeneratorPort {
  /**
   * Generates a unique identifier.
   *
   * @returns A unique identifier string suitable for aggregate root identification.
   */
  generate(): string;
}
