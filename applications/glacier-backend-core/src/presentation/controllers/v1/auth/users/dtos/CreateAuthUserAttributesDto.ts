import { Transform } from 'class-transformer';
import { IsEmail, IsEnum, IsOptional, IsString, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { AUTH_USER_STATUS } from '../../../../../../generated/prisma/enums.js';

export class CreateAuthUserAttributesDto {
  @ApiProperty({ minLength: 1, maxLength: 128 })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(1, 128)
  firstName!: string;

  @ApiProperty({ minLength: 1, maxLength: 128 })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(1, 128)
  lastName!: string;

  @ApiProperty({ format: 'email', maxLength: 320 })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value
  )
  @IsEmail()
  @Length(3, 320)
  email!: string;

  @ApiPropertyOptional({ enum: AUTH_USER_STATUS, default: AUTH_USER_STATUS.ACTIVE })
  @IsOptional()
  @IsEnum(AUTH_USER_STATUS)
  status?: (typeof AUTH_USER_STATUS)[keyof typeof AUTH_USER_STATUS];
}
