import { Module } from '@nestjs/common';

import { UsersControllerModule } from './users/UsersController.module.js';

@Module({ imports: [UsersControllerModule] })
export class AuthControllerModule {}
