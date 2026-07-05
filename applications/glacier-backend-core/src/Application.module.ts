import { Module, ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';

import { PresentationModule } from './presentation/Presentation.module.js';
import { V1ControllerModule } from './presentation/controllers/v1/V1Controller.module.js';
import { FrameworkModule } from './framework/Framework.module.js';
import { RepositoriesModule } from './infrastructure/repositories/Repositories.module.js';
import { CommandsModule } from './application/commands/Commands.module.js';

@Module({
  imports: [FrameworkModule, RepositoriesModule, CommandsModule, PresentationModule]
})
export class ApplicationModule {
  public static async create() {
    const app = await NestFactory.create<NestExpressApplication>(ApplicationModule);
    app.useGlobalPipes(new ValidationPipe());
    app.enableVersioning({ type: VersioningType.URI });
    V1ControllerModule.register(app);
    return app;
  }
}
