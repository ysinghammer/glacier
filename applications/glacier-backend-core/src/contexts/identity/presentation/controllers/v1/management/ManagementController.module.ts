import { Module } from '@nestjs/common';

import { HealthControllerModule } from './health/HealthController.module.js';

@Module({ imports: [HealthControllerModule] })
export class ManagementControllerModule {}
