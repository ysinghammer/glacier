import type { IParseContext } from "../../validation/types/IParseContext.js";

/** Per-call recursion and DTO name provenance; neither source values nor metadata are mutated. */
export interface IOutboundContext extends IParseContext {
  /** Mutable set of current ancestors used to detect circular references during one projection. */
  readonly active: Set<object>;
  /** Per-object mapping from logical property names to their wire aliases. */
  readonly names: WeakMap<object, ReadonlyMap<string, string>>;
}
