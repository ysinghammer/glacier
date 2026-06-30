import { Transform } from 'class-transformer';
import { IsEmail, IsEnum, IsOptional, IsString, Length } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

import { AUTH_USER_STATUS } from '../../../../../../generated/prisma/enums.js';

export class UpdateAuthUserAttributesDto {
  @ApiPropertyOptional({ minLength: 1, maxLength: 128 })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  @Length(1, 128)
  firstName?: string;

  @ApiPropertyOptional({ minLength: 1, maxLength: 128 })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  @Length(1, 128)
  lastName?: string;

  @ApiPropertyOptional({ format: 'email', maxLength: 320 })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value
  )
  @IsOptional()
  @IsEmail()
  @Length(3, 320)
  email?: string;

  @ApiPropertyOptional({ enum: AUTH_USER_STATUS })
  @IsOptional()
  @IsEnum(AUTH_USER_STATUS)
  status?: (typeof AUTH_USER_STATUS)[keyof typeof AUTH_USER_STATUS];
}
