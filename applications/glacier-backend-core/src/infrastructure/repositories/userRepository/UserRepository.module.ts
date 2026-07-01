import { Global, Module } from '@nestjs/common';

import { UserRepository } from './UserRepository.js';

@Global()
@Module({
  providers: [
    {
      provide: 'UserRepositoryPort',
      useClass: UserRepository
    }
  ],
  exports: [UserRepository]
})
export class UserRepositoryModule {}
