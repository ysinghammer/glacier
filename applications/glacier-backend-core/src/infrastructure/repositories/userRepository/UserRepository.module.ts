import { Global, Module } from '@nestjs/common';

import { UserRepository } from './UserRepository.js';
import { PrismaModule } from '../../../framework/prisma/Prisma.module.js';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [
    {
      provide: 'UserRepositoryPort',
      useClass: UserRepository
    }
  ],
  exports: ['UserRepositoryPort']
})
export class UserRepositoryModule {}
