import { Transform, Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Length, Matches, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

import { AUTH_USER_STATUS } from '../../../../../../../../generated/prisma/enums.js';

const AUTH_USER_INCLUDE_FIELDS = ['accounts'] as const;

export class ListAuthUsersQueryDto {
  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  public ['page[number]']?: number = 1;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  public ['page[size]']?: number = 20;

  @ApiPropertyOptional({ enum: AUTH_USER_STATUS })
  @IsOptional()
  @IsEnum(AUTH_USER_STATUS)
  declare public ['filter[status]']?: (typeof AUTH_USER_STATUS)[keyof typeof AUTH_USER_STATUS];

  @ApiPropertyOptional({ minLength: 1, maxLength: 255 })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  @Length(1, 255)
  declare public ['filter[q]']?: string;

  @ApiPropertyOptional({
    description: 'Comma-separated fields, with "-" prefix for descending.',
    example: '-createdAt,email'
  })
  @IsOptional()
  @IsString()
  @Matches(/^-?(createdAt|updatedAt|email)(,-?(createdAt|updatedAt|email))*$/)
  declare public sort?: string;

  @ApiPropertyOptional({ enum: AUTH_USER_INCLUDE_FIELDS })
  @IsOptional()
  @IsEnum(AUTH_USER_INCLUDE_FIELDS)
  declare public include?: (typeof AUTH_USER_INCLUDE_FIELDS)[number];
}
