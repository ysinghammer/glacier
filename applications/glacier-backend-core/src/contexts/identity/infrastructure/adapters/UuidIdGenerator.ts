import { randomUUID } from 'crypto';

import { Injectable } from '@nestjs/common';

import type { IdGeneratorPort } from '../../../../shared/kernel/index.js';

/**
 * UUID v4-based implementation of {@link IdGeneratorPort}.
 *
 * Generates unique identifiers using the Node.js `crypto.randomUUID()` function.
 * Suitable for distributed systems where UUIDs provide collision resistance.
 */
@Injectable()
export class UuidIdGenerator implements IdGeneratorPort {
  /**
   * Generates a new UUID v4 identifier.
   *
   * @returns A unique UUID v4 string.
   */
  public generate(): string {
    return randomUUID();
  }
}
