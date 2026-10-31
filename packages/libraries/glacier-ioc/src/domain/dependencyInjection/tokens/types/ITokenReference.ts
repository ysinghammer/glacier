import type { InjectionToken } from "../InjectionToken.js";
import type { IToken } from "./IToken.js";

/** Consumer token form: a class, symbol, or typed token that normalizes to its wrapped symbol. */
export type ITokenReference = IToken | InjectionToken<unknown>;
