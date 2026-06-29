import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';

import { PrismaHealth } from '../../../../../framework/prisma/Prisma.health.js';

@Controller({ version: '1', path: '/management/health' })
export class HealthController {
  public constructor(
    private health: HealthCheckService,
    private prismaHealth: PrismaHealth
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([() => this.prismaHealth.isHealthy('prisma')]);
  }
}
