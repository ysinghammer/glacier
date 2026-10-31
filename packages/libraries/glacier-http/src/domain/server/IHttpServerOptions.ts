import type { IHttpAuthenticationOptions } from "./IHttpAuthenticationOptions.js";
import type { IHttpErrorContext } from "./IHttpErrorContext.js";
import type { IHttpLimitsOptions } from "./IHttpLimitsOptions.js";

/** Explicit controller/authentication composition; logging, mappings and remaining lifecycle limits are separate. */
export interface IHttpServerOptions {
  readonly controllers: readonly object[];
  readonly authentication?: IHttpAuthenticationOptions;
  readonly onError: (error: Error, context: IHttpErrorContext) => void;
  readonly limits?: IHttpLimitsOptions;
}
