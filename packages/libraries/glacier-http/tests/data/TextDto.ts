import { IsString } from "@glacier/schema";

/** Explicit outbound schema, without inferred compiler type recovery. */
export class TextDto {
  declare text: string;
}
IsString()(TextDto.prototype, "text");
