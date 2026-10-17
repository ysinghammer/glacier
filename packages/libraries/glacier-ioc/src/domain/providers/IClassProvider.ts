import type { ITokenReference } from "../tokens/ITokenReference.js";
import type { IClassConstructor } from "./IClassConstructor.js";

/** Provider that creates its value by constructing `useClass` with injected constructor dependencies. */
export interface IClassProvider {
  /** The token consumers request. */
  readonly provide: ITokenReference;
  /** The class to construct once per container. */
  readonly useClass: IClassConstructor;
}
