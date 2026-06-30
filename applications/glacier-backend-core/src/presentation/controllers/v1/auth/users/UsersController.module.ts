import { Module } from '@nestjs/common';

import { UsersController } from './UsersController.js';

@Module({ controllers: [UsersController] })
export class UsersControllerModule {}
