import { IsString, Rename } from "@glacier/schema";

/** Boundary schema with a renamed wire field and detectable constructor execution. */
export class ItemDto {
  public static constructions = 0;
  @IsString()
  @Rename("displayLabel")
  declare public label: string;

  /** HTTP/schema processing must never require this constructor. */
  public constructor() {
    ItemDto.constructions++;
  }
}
