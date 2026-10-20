import type { IClock } from "../../index.js";

/** Test-owned clock that always returns the same instant. */
export class FixedClock implements IClock {
  readonly instant: Date;

  constructor(instant: Date) {
    this.instant = instant;
  }

  now(): Date {
    return this.instant;
  }
}
