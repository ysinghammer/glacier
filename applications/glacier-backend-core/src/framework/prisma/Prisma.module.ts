import { Module } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { TerminusModule } from '@nestjs/terminus';

import { PrismaConfig } from './Prisma.config.js';
import { PrismaClient } from '../../generated/prisma/client.js';
import { PrismaHealth } from './Prisma.health.js';

@Module({
  exports: [PrismaHealth],
  imports: [TerminusModule],
  providers: [
    PrismaConfig,
    {
      provide: PrismaClient,
      inject: [PrismaConfig],
      useFactory: (config: PrismaConfig) => {
        const adapter = new PrismaPg({ connectionString: config.url });
        return new PrismaClient({ adapter });
      }
    },
    PrismaHealth
  ]
})
export class PrismaModule {}
