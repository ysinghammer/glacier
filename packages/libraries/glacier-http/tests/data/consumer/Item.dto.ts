import { IsString, Rename } from "@glacier/schema";

/** Boundary schema with a renamed wire field and detectable constructor execution. */
export class ItemDto {
  /**
   * Counts fixture constructor calls to prove schema handling avoids instantiation.
   * @default 0
   */
  public static constructions = 0;
  @IsString()
  @Rename("displayLabel")
  /** Validated label exposed as `displayLabel` on the JSON wire. */
  declare public label: string;

  /**
   * Increments the fixture counter when application code explicitly constructs a DTO.
   * @returns No value; updates the static construction count.
   */
  public constructor() {
    ItemDto.constructions++;
  }
}
