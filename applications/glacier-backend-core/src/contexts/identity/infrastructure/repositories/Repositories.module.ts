import { Module } from '@nestjs/common';

import { UserRepositoryModule } from './userRepository/UserRepository.module.js';

@Module({
  imports: [UserRepositoryModule]
})
export class RepositoriesModule {}
