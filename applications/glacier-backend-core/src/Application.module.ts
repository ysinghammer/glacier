import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { PresentationModule } from './presentation/Presentation.module.js';
import { V1ControllerModule } from './presentation/controllers/v1/V1Controller.module.js';
import { FrameworkModule } from './framework/Framework.module.js';

@Module({
  imports: [FrameworkModule, PresentationModule]
})
export class ApplicationModule {
  public static async create() {
    const app = await NestFactory.create(ApplicationModule);
    V1ControllerModule.register(app);
    return app;
  }
}
