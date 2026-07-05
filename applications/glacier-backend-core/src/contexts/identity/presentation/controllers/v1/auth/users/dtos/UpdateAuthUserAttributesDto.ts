import { Transform } from 'class-transformer';
import { IsEmail, IsEnum, IsOptional, IsString, Length, ValidateIf } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

import { UserStatusApiDto } from '../../../../../dtos/UserStatusApiDto.js';

export class UpdateAuthUserAttributesDto {
  @ApiPropertyOptional({
    minLength: 1,
    maxLength: 128,
    description: 'Required if lastName is provided'
  })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @ValidateIf((obj: UpdateAuthUserAttributesDto) => obj.lastName !== undefined)
  @IsString()
  @Length(1, 128)
  firstName?: string;

  @ApiPropertyOptional({
    minLength: 1,
    maxLength: 128,
    description: 'Required if firstName is provided'
  })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @ValidateIf((obj: UpdateAuthUserAttributesDto) => obj.firstName !== undefined)
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

  @ApiPropertyOptional({ enum: UserStatusApiDto })
  @IsOptional()
  @IsEnum(UserStatusApiDto)
  status?: UserStatusApiDto;
}
