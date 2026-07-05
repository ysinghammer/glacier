import { Expose, Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { JsonApiErrorObjectDto } from './JsonApiErrorObjectDto.js';

export class ApiErrorResponseDto {
  @ApiProperty({ type: [JsonApiErrorObjectDto] })
  @Expose()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JsonApiErrorObjectDto)
  declare public errors: JsonApiErrorObjectDto[];
}
