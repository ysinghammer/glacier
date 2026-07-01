import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { CreateAuthUserCommandHandler } from './createAuthUser/CreateAuthUserCommandHandler.js';
import { RemoveAuthUserCommandHandler } from './removeAuthUser/RemoveAuthUserCommandHandler.js';
import { UpdateAuthUserCommandHandler } from './updateAuthUser/UpdateAuthUserCommandHandler.js';

/**
 * Module that registers all application command handlers.
 *
 * This module imports the NestJS CqrsModule and provides all CommandHandler
 * implementations for the application. Each handler is decorated with @CommandHandler
 * and will be automatically registered by the CqrsModule.
 *
 * @see {@link CqrsModule} for NestJS CQRS functionality.
 */
@Module({
  imports: [CqrsModule],
  providers: [
    CreateAuthUserCommandHandler,
    RemoveAuthUserCommandHandler,
    UpdateAuthUserCommandHandler
  ]
})
export class CommandsModule {}
