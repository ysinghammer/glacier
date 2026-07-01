import { Expose } from 'class-transformer';
import { IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class JsonApiPageMetaDto {
  @ApiProperty({ minimum: 1 })
  @Expose()
  @IsInt()
  @Min(1)
  declare public page: number;

  @ApiProperty({ minimum: 1, maximum: 100 })
  @Expose()
  @IsInt()
  @Min(1)
  declare public pageSize: number;

  @ApiProperty({ minimum: 0 })
  @Expose()
  @IsInt()
  @Min(0)
  declare public total: number;
}
