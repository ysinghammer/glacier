import { IsInt, IsString } from "@glacier/schema";

/** Identical noncoercing JSON body contract for both measured servers. */
export class BenchmarkBodyDto {
  @IsInt()
  declare public count: number;
  @IsString()
  declare public label: string;
}
