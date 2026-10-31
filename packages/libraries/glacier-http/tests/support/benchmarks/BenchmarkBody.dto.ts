import { IsInt, IsString } from "@glacier/schema";

/** Identical noncoercing JSON body contract for both measured servers. */
export class BenchmarkBodyDto {
  @IsInt()
  /** Required JSON body item count; string coercion is not accepted. */
  declare public count: number;
  @IsString()
  /** Required JSON body label. */
  declare public label: string;
}
