import { Expose, Type } from 'class-transformer';
import { Equals, IsDefined, IsString, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { CreateAuthUserAttributesDto } from './CreateAuthUserAttributesDto.js';

export class CreateAuthUserDataDto {
  @ApiProperty({ example: 'users' })
  @Expose()
  @IsDefined()
  @IsString()
  @Equals('users')
  declare public type: 'users';

  @ApiProperty({ type: CreateAuthUserAttributesDto })
  @Expose()
  @IsDefined()
  @ValidateNested()
  @Type(() => CreateAuthUserAttributesDto)
  declare public attributes: CreateAuthUserAttributesDto;
}
