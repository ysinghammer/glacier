import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';

import { PrismaHealth } from '../../../../../../framework/prisma/Prisma.health.js';

/* v8 ignore start */
@Controller({ version: '1', path: '/management/health' })
/* v8 ignore stop */
export class HealthController {
  public constructor(
    private health: HealthCheckService,
    private prismaHealth: PrismaHealth
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([() => this.prismaHealth.isHealthy('database')]);
  }
}
