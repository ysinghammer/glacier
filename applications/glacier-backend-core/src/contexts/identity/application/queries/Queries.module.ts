import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { GetAuthUserByIdQueryHandler } from './getAuthUserById/GetAuthUserByIdQueryHandler.js';
import { ListAuthUsersQueryHandler } from './listAuthUsers/ListAuthUsersQueryHandler.js';

/**
 * Module that registers all application query handlers.
 *
 * This module imports the NestJS CqrsModule and provides all QueryHandler
 * implementations for the application. Each handler is decorated with @QueryHandler
 * and will be automatically registered by the CqrsModule.
 *
 * @see {@link CqrsModule} for NestJS CQRS functionality.
 */
@Module({
  imports: [CqrsModule],
  providers: [GetAuthUserByIdQueryHandler, ListAuthUsersQueryHandler]
})
export class QueriesModule {}
