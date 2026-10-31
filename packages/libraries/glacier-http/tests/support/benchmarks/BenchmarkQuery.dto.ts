import { IsInt } from "@glacier/schema";

/** Identical coercing query contract for both measured servers. */
export class BenchmarkQueryDto {
  @IsInt()
  /** Required integer count parsed from the query string. */
  declare public count: number;
}
