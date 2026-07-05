import { Module } from '@nestjs/common';

import { UserResponseMapper } from '../../../../mappers/UserResponseMapper.js';
import { UsersController } from './UsersController.js';

@Module({
  providers: [UserResponseMapper],
  controllers: [UsersController]
})
export class UsersControllerModule {}
