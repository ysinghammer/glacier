import { Transform } from 'class-transformer';
import { IsEmail, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAuthUserAttributesDto {
  @ApiProperty({ minLength: 1, maxLength: 128 })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(1, 128)
  declare public firstName: string;

  @ApiProperty({ minLength: 1, maxLength: 128 })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(1, 128)
  declare public lastName: string;

  @ApiProperty({ format: 'email', maxLength: 320 })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value
  )
  @IsEmail()
  @Length(3, 320)
  declare public email: string;
}
