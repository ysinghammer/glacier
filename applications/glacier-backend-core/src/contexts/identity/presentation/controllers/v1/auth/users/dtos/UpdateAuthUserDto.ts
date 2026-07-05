import { Expose, Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { UpdateAuthUserDataDto } from './UpdateAuthUserDataDto.js';

export class UpdateAuthUserDto {
  @ApiProperty({ type: UpdateAuthUserDataDto })
  @Expose()
  @ValidateNested()
  @Type(() => UpdateAuthUserDataDto)
  declare public data: UpdateAuthUserDataDto;
}
