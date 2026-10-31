import type { IClock } from "../../index.js";

/** Test-owned clock that always returns the same instant. */
export class FixedClock implements IClock {
  public readonly instant: Date;

  constructor(instant: Date) {
    this.instant = instant;
  }

  public now(): Date {
    return this.instant;
  }
}
