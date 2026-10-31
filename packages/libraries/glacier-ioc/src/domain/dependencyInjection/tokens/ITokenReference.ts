import type { InjectionToken } from "./InjectionToken.js";
import type { IToken } from "./IToken.js";

/** A token as supplied by consumers: a plain token or a typed injection token wrapping a symbol. */
export type ITokenReference = IToken | InjectionToken<unknown>;
