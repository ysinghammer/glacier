import type { IJsonSchemaTarget } from "./IJsonSchemaTarget.js";

/** Options of `toJsonSchema`. */
export interface IJsonSchemaOptions {
  /** The dialect to generate: `draft-2020-12` keeps classes in `$defs`, `openapi-3.1` in `components.schemas`. */
  readonly target: IJsonSchemaTarget;
}
