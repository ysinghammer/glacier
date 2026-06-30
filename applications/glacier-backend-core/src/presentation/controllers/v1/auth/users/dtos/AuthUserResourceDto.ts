import { Expose, Type } from 'class-transformer';
import { Equals, IsString, IsUUID, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { AuthUserAttributesDto } from './AuthUserAttributesDto.js';

export class AuthUserResourceDto {
  @ApiProperty({ example: 'users' })
  @Expose()
  @IsString()
  @Equals('users')
  type!: 'users';

  @ApiProperty({ format: 'uuid' })
  @Expose()
  @IsUUID(4)
  id!: string;

  @ApiProperty({ type: AuthUserAttributesDto })
  @Expose()
  @ValidateNested()
  @Type(() => AuthUserAttributesDto)
  attributes!: AuthUserAttributesDto;
}
