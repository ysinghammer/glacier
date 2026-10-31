import type { IConstructableClass } from "@glacier/reflection";
import type { IHttpErrorMappingOptions } from "./IHttpErrorMappingOptions.js";

/** Class identity and static transport mapping; the constructor is never invoked. */
export interface IHttpErrorMapping<E extends Error = Error> extends IHttpErrorMappingOptions {
  readonly error: IConstructableClass<E>;
}
