import type { IConstructableClass } from "@glacier/reflection";
import type { IHttpErrorMappingOptions } from "./IHttpErrorMappingOptions.js";

/**
 * Maps an error class identity to static transport details; its constructor is never invoked.
 * @template E Error subtype matched by class identity; defaults to Error.
 */
export interface IHttpErrorMapping<E extends Error = Error> extends IHttpErrorMappingOptions {
  /** Error class identity used for prototype-chain matching. */
  readonly error: IConstructableClass<E>;
}
