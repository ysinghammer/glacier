import { HealthIndicatorResult, HealthIndicatorService } from '@nestjs/terminus';
import { Injectable } from '@nestjs/common';

import { PrismaClient } from '../../generated/prisma/client.js';

@Injectable()
export class PrismaHealth {
  public constructor(
    private readonly health: HealthIndicatorService,
    private readonly prismaClient: PrismaClient
  ) {}

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const indicator = this.health.check(key);
    try {
      await this.prismaClient.$queryRaw`SELECT 1`;
      return indicator.up();
    } catch (e) {
      return indicator.down({ message: 'Prisma check failed', error: e });
    }
  }
}
