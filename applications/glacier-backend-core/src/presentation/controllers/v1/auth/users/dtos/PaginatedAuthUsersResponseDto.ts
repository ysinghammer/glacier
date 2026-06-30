import { Expose, Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { AuthUserResourceDto } from './AuthUserResourceDto.js';
import { JsonApiPageMetaDto } from './JsonApiPageMetaDto.js';

export class PaginatedAuthUsersResponseDto {
  @ApiProperty({ type: [AuthUserResourceDto] })
  @Expose()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AuthUserResourceDto)
  data!: AuthUserResourceDto[];

  @ApiProperty({ type: JsonApiPageMetaDto })
  @Expose()
  @ValidateNested()
  @Type(() => JsonApiPageMetaDto)
  meta!: JsonApiPageMetaDto;
}
