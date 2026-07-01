import { Expose, Type } from 'class-transformer';
import { Equals, IsString, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { CreateAuthUserAttributesDto } from './CreateAuthUserAttributesDto.js';

export class CreateAuthUserDataDto {
  @ApiProperty({ example: 'users' })
  @Expose()
  @IsString()
  @Equals('users')
  declare public type: 'users';

  @ApiProperty({ type: CreateAuthUserAttributesDto })
  @Expose()
  @ValidateNested()
  @Type(() => CreateAuthUserAttributesDto)
  declare public attributes: CreateAuthUserAttributesDto;
}
