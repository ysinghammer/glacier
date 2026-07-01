import { Expose } from 'class-transformer';
import { IsDateString, IsEmail, IsEnum, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { AUTH_USER_STATUS } from '../../../../../../generated/prisma/enums.js';

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

  @ApiProperty({ enum: AUTH_USER_STATUS })
  @Expose()
  @IsEnum(AUTH_USER_STATUS)
  declare public status: (typeof AUTH_USER_STATUS)[keyof typeof AUTH_USER_STATUS];

  @ApiProperty({ format: 'date-time' })
  @Expose()
  @IsDateString()
  declare public createdAt: string;

  @ApiProperty({ format: 'date-time' })
  @Expose()
  @IsDateString()
  declare public updatedAt: string;
}
