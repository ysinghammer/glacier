import { Module, ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';

import { FrameworkModule } from './framework/Framework.module.js';
import { PresentationModule } from './contexts/identity/presentation/Presentation.module.js';
import { V1ControllerModule } from './contexts/identity/presentation/controllers/v1/V1Controller.module.js';
import { RepositoriesModule } from './contexts/identity/infrastructure/repositories/Repositories.module.js';
import { CommandsModule } from './contexts/identity/application/commands/Commands.module.js';
import { QueriesModule } from './contexts/identity/application/queries/Queries.module.js';
import { DomainExceptionFilter } from './contexts/identity/presentation/exceptions/DomainExceptionFilter.js';

@Module({
  imports: [FrameworkModule, RepositoriesModule, CommandsModule, QueriesModule, PresentationModule]
})
export class ApplicationModule {
  public static async create() {
    const app = await NestFactory.create<NestExpressApplication>(ApplicationModule);
    app.useGlobalPipes(new ValidationPipe());
    app.useGlobalFilters(new DomainExceptionFilter());
    app.enableVersioning({ type: VersioningType.URI });
    V1ControllerModule.register(app);
    return app;
  }
}
