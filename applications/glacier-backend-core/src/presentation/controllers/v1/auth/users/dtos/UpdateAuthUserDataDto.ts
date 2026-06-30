import { Expose, Type } from 'class-transformer';
import { Equals, IsString, IsUUID, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { UpdateAuthUserAttributesDto } from './UpdateAuthUserAttributesDto.js';

export class UpdateAuthUserDataDto {
  @ApiProperty({ example: 'users' })
  @Expose()
  @IsString()
  @Equals('users')
  type!: 'users';

  @ApiProperty({ format: 'uuid' })
  @Expose()
  @IsUUID(4)
  id!: string;

  @ApiProperty({ type: UpdateAuthUserAttributesDto })
  @Expose()
  @ValidateNested()
  @Type(() => UpdateAuthUserAttributesDto)
  attributes!: UpdateAuthUserAttributesDto;
}
