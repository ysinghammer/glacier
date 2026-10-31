import type { IJsonSchemaTarget } from "./IJsonSchemaTarget.js";
import type { IJsonSchemaDirection } from "./IJsonSchemaDirection.js";

/** Options of `toJsonSchema`. */
export interface IJsonSchemaOptions {
  /**
   * Generation direction; input describes parseable values and output describes projected JSON.
   * @default "input"
   */
  readonly direction?: IJsonSchemaDirection;
  /**
   * Output dialect controlling identifiers, references and placement in `$defs` or `components.schemas`.
   */
  readonly target: IJsonSchemaTarget;
}
