import { Expose, Type } from 'class-transformer';
import { Equals, IsDefined, IsString, IsUUID, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { UpdateAuthUserAttributesDto } from './UpdateAuthUserAttributesDto.js';

export class UpdateAuthUserDataDto {
  @ApiProperty({ example: 'users' })
  @Expose()
  @IsDefined()
  @IsString()
  @Equals('users')
  declare public type: 'users';

  @ApiProperty({ format: 'uuid' })
  @Expose()
  @IsDefined()
  @IsUUID(4)
  declare public id: string;

  @ApiProperty({ type: UpdateAuthUserAttributesDto })
  @Expose()
  @IsDefined()
  @ValidateNested()
  @Type(() => UpdateAuthUserAttributesDto)
  declare public attributes: UpdateAuthUserAttributesDto;
}
