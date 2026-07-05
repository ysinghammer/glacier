import { Global, Module } from '@nestjs/common';

import { UserRepository } from './UserRepository.js';
import { PrismaModule } from '../../../../../framework/prisma/Prisma.module.js';
import { UserFactory } from '../../../domain/factories/userFactory/UserFactory.js';
import { UuidIdGenerator } from '../../adapters/UuidIdGenerator.js';
import { SystemClock } from '../../adapters/SystemClock.js';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [
    {
      provide: 'UserRepositoryPort',
      useClass: UserRepository
    },
    {
      provide: 'IdGeneratorPort',
      useClass: UuidIdGenerator
    },
    {
      provide: 'ClockPort',
      useClass: SystemClock
    },
    {
      provide: UserFactory,
      useFactory: (idGenerator: UuidIdGenerator, clock: SystemClock) =>
        new UserFactory(idGenerator, clock),
      inject: ['IdGeneratorPort', 'ClockPort']
    }
  ],
  exports: ['UserRepositoryPort', 'IdGeneratorPort', 'ClockPort', UserFactory]
})
export class UserRepositoryModule {}
