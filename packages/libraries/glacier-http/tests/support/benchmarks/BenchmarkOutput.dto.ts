import { IsInt, IsString } from "@glacier/schema";

/** Output validation and projection are required work, not an unvalidated hello world. */
export class BenchmarkOutputDto {
  @IsString()
  declare public id: string;
  @IsString()
  declare public userId: string;
  @IsInt()
  declare public count: number;
  @IsString()
  declare public label: string;
}
