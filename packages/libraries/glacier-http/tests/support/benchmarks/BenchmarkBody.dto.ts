import { IsInt, IsString } from "@glacier/schema";

/** Identical noncoercing JSON body contract for both measured servers. */
export class BenchmarkBodyDto {
  @IsInt()
  declare count: number;
  @IsString()
  declare label: string;
}
