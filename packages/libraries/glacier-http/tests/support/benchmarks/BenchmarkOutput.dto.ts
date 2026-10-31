import { IsInt, IsString } from "@glacier/schema";

/** Output validation and projection are required work, not an unvalidated hello world. */
export class BenchmarkOutputDto {
  @IsString()
  /** Item identifier returned by the benchmark route. */
  declare public id: string;
  @IsString()
  /** Authenticated actor identifier returned by the benchmark route. */
  declare public userId: string;
  @IsInt()
  /** Validated integer count returned in the projected response. */
  declare public count: number;
  @IsString()
  /** Validated label selected by the request path. */
  declare public label: string;
}
