import { INestApplication, Module } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AuthControllerModule } from './auth/AuthController.module.js';

@Module({
  imports: [AuthControllerModule]
})
export class V1ControllerModule {
  public static register(app: INestApplication): void {
    const config = new DocumentBuilder()
      .setTitle('Glacier Core')
      .setDescription('Core api for glacier')
      .setVersion('1.0')
      .build();

    const documentFactory = () => SwaggerModule.createDocument(app, config);

    SwaggerModule.setup('v1', app, documentFactory);
  }
}
