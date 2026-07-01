/**
 * Inbound port for time-related operations.
 *
 * Abstracts the system clock to enable deterministic domain logic and testability.
 * Implementations provide the current timestamp without coupling domain code to `Date.now()`.
 *
 * Used by factories like {@link UserFactory} to assign creation timestamps.
 */
export interface ClockPort {
  /**
   * Returns the current moment in time.
   *
   * @returns A Date instance representing the current timestamp.
   */
  now(): Date;
}
