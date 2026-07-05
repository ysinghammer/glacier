import { Injectable } from '@nestjs/common';

import type { ClockPort } from '../../../../shared/kernel/index.js';

/**
 * System clock implementation of {@link ClockPort}.
 *
 * Returns the current system time using `Date.now()`.
 * This allows domain logic to depend on a testable port rather than directly on the system clock.
 */
@Injectable()
export class SystemClock implements ClockPort {
  /**
   * Returns the current moment in time.
   *
   * @returns A Date instance representing the current timestamp.
   */
  public now(): Date {
    return new Date();
  }
}
