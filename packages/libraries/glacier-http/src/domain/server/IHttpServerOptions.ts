import type { IHttpAuthenticationOptions } from "./IHttpAuthenticationOptions.js";
import type { IHttpErrorContext } from "./IHttpErrorContext.js";

/** Minimal explicit composition. Advanced lifecycle/logging/mapping options arrive in later phases. */
export interface IHttpServerOptions {
  readonly controllers: readonly object[];
  readonly authentication?: IHttpAuthenticationOptions;
  readonly onError: (error: Error, context: IHttpErrorContext) => void;
}
