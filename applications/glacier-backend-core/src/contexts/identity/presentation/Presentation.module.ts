import { Module } from '@nestjs/common';

import { ControllersModule } from './controllers/Controllers.module.js';

@Module({
  imports: [ControllersModule]
})
export class PresentationModule {}
