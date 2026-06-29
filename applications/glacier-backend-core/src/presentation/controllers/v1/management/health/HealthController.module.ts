import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

import { HealthController } from './HealthController.js';
import { PrismaModule } from '../../../../../framework/prisma/Prisma.module.js';

@Module({ controllers: [HealthController], imports: [TerminusModule, PrismaModule] })
export class HealthControllerModule {}
