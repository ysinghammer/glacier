import { Module } from '@nestjs/common';

import { V1ControllerModule } from './v1/V1Controller.module.js';

@Module({ imports: [V1ControllerModule] })
export class ControllersModule {}
