import { Expose } from 'class-transformer';
import { IsDateString, IsEmail, IsEnum, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { UserStatusApiDto } from '../../../../../dtos/UserStatusApiDto.js';

export class AuthUserAttributesDto {
  @ApiProperty({ minLength: 1, maxLength: 128 })
  @Expose()
  @IsString()
  @Length(1, 128)
  declare public firstName: string;

  @ApiProperty({ minLength: 1, maxLength: 128 })
  @Expose()
  @IsString()
  @Length(1, 128)
  declare public lastName: string;

  @ApiProperty({ format: 'email', maxLength: 320 })
  @Expose()
  @IsEmail()
  @Length(3, 320)
  declare public email: string;

  @ApiProperty({ enum: UserStatusApiDto })
  @Expose()
  @IsEnum(UserStatusApiDto)
  declare public status: UserStatusApiDto;

  @ApiProperty({ format: 'date-time' })
  @Expose()
  @IsDateString()
  declare public createdAt: string;

  @ApiProperty({ format: 'date-time' })
  @Expose()
  @IsDateString()
  declare public updatedAt: string;
}
