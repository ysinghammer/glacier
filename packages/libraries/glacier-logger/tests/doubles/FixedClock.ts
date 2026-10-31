import type { IClock } from "../../index.js";

/** Provides a stable clock for scenarios that need deterministic log timestamps. */
export class FixedClock implements IClock {
  /** Readonly reference to the configured, mutable Date returned unchanged by clock reads. */
  public readonly instant: Date;

  /**
   * Creates a clock fixed at the supplied instant.
   * @param instant Timestamp to return from {@link now}; retained by reference.
   */
  constructor(instant: Date) {
    this.instant = instant;
  }

  /**
   * Reads the configured deterministic instant.
   * @returns The same {@link instant} value on every call.
   */
  public now(): Date {
    return this.instant;
  }
}
