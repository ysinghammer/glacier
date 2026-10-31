import type { IParseContext } from "../../validation/types/IParseContext.js";

/** Per-call recursion and DTO name provenance; neither source values nor metadata are mutated. */
export interface IOutboundContext extends IParseContext {
  readonly active: Set<object>;
  readonly names: WeakMap<object, ReadonlyMap<string, string>>;
}
