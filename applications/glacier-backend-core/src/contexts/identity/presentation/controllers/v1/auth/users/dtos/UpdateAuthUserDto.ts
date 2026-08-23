import { Expose, Type } from 'class-transformer';
import { IsDefined, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { UpdateAuthUserDataDto } from './UpdateAuthUserDataDto.js';

export class UpdateAuthUserDto {
  @ApiProperty({ type: UpdateAuthUserDataDto })
  @Expose()
  @IsDefined()
  @ValidateNested()
  @Type(() => UpdateAuthUserDataDto)
  declare public data: UpdateAuthUserDataDto;
}
