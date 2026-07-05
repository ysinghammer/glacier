import { Expose, Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { CreateAuthUserDataDto } from './CreateAuthUserDataDto.js';

export class CreateAuthUserDto {
  @ApiProperty({ type: CreateAuthUserDataDto })
  @Expose()
  @ValidateNested()
  @Type(() => CreateAuthUserDataDto)
  declare public data: CreateAuthUserDataDto;
}
