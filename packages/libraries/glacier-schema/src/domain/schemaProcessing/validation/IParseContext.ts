import type { ISchemaParseOptions } from "../schema/ISchemaParseOptions.js";

/** State carried through one parse call: the caller's options and how many class levels are already entered. */
export interface IParseContext {
  /** The options of the current `parse` or `safeParse` call. */
  readonly options: ISchemaParseOptions;
  /** Number of enclosing class schemas; `0` while validating the root class. */
  readonly depth: number;
}
