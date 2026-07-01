import { Expose } from 'class-transformer';
import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AuthUserParamsDto {
  @ApiProperty({ format: 'uuid' })
  @Expose()
  @IsUUID(4)
  declare public userId: string;
}
