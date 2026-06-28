import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

@Module({
  imports: [],
  controllers: [],
  providers: []
})
export class ApplicationModule {
  public static async create() {
    const app = await NestFactory.create(ApplicationModule);
    return app;
  }
}
