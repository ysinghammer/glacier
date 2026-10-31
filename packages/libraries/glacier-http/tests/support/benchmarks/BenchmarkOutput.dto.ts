import { IsInt, IsString } from "@glacier/schema";

/** Output validation and projection are required work, not an unvalidated hello world. */
export class BenchmarkOutputDto {
  @IsString()
  declare id: string;
  @IsString()
  declare userId: string;
  @IsInt()
  declare count: number;
  @IsString()
  declare label: string;
}
