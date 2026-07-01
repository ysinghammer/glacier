import { Module } from '@nestjs/common';

import { UserRepository } from './userRepository/UserRepository.js';

@Module({
  imports: [UserRepository]
})
export class RepositoriesModule {}
