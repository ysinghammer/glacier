import { IsInt } from "@glacier/schema";

/** Identical coercing query contract for both measured servers. */
export class BenchmarkQueryDto {
  @IsInt()
  declare public count: number;
}
