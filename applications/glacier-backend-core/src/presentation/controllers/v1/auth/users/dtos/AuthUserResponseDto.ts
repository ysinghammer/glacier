import { Expose, Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { AuthUserResourceDto } from './AuthUserResourceDto.js';

export class AuthUserResponseDto {
  @ApiProperty({ type: AuthUserResourceDto })
  @Expose()
  @ValidateNested()
  @Type(() => AuthUserResourceDto)
  declare public data: AuthUserResourceDto;
}
