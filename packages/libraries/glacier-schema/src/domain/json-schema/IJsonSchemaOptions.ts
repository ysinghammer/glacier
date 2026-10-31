import type { IJsonSchemaTarget } from "./IJsonSchemaTarget.js";
import type { IJsonSchemaDirection } from "./IJsonSchemaDirection.js";

/** Options of `toJsonSchema`. */
export interface IJsonSchemaOptions {
  /** Output describes projected JSON; input (the default) preserves existing generation. */
  readonly direction?: IJsonSchemaDirection;
  /** The dialect to generate: `draft-2020-12` keeps classes in `$defs`, `openapi-3.1` in `components.schemas`. */
  readonly target: IJsonSchemaTarget;
}
