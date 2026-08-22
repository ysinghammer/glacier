import { Expose, Type } from 'class-transformer';
import { IsDefined, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { CreateAuthUserDataDto } from './CreateAuthUserDataDto.js';

export class CreateAuthUserDto {
  @ApiProperty({ type: CreateAuthUserDataDto })
  @Expose()
  @IsDefined()
  @ValidateNested()
  @Type(() => CreateAuthUserDataDto)
  declare public data: CreateAuthUserDataDto;
}
