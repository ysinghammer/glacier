/**
 * Inbound port for time-related operations.
 *
 * Abstracts the system clock to enable deterministic domain logic and testability.
 * Implementations provide the current timestamp without coupling domain code to `Date.now()`.
 *
 * Used by factories and domain logic to assign timestamps.
 * This is a shared kernel port used across all bounded contexts.
 */
export interface ClockPort {
  /**
   * Returns the current moment in time.
   *
   * @returns A Date instance representing the current timestamp.
   */
  now(): Date;
}
