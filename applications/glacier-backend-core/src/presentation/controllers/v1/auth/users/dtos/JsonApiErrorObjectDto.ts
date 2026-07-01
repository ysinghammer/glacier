import { Expose } from 'class-transformer';
import { IsObject, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class JsonApiErrorObjectDto {
  @ApiProperty({ example: '400' })
  @Expose()
  @IsString()
  declare public status: string;

  @ApiProperty({ example: 'USER_VALIDATION_ERROR' })
  @Expose()
  @IsString()
  declare public code: string;

  @ApiProperty({ example: 'Invalid request parameters' })
  @Expose()
  @IsString()
  declare public title: string;

  @ApiPropertyOptional({ example: 'page[size] must be <= 100' })
  @Expose()
  @IsOptional()
  @IsString()
  declare public detail?: string;

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  @Expose()
  @IsOptional()
  @IsObject()
  declare public source?: Record<string, unknown>;
}
