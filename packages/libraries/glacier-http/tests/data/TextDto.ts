import { IsString } from "@glacier/schema";

/** Explicit outbound schema, without inferred compiler type recovery. */
export class TextDto {
  /** Required string represented by the public JSON schema and response body. */
  declare public text: string;
}
IsString()(TextDto.prototype, "text");
