import type { IHttpAuthenticationOptions } from "./IHttpAuthenticationOptions.js";
import type { IHttpErrorContext } from "./IHttpErrorContext.js";
import type { IHttpLimitsOptions } from "./IHttpLimitsOptions.js";
import type { IHttpResponseLogRecord } from "./IHttpResponseLogRecord.js";
import type { IHttpErrorMapping } from "../responses/types/IHttpErrorMapping.js";

/** Explicit composition with static business mappings and supervised metadata-only response logging. */
export interface IHttpServerOptions {
  readonly controllers: readonly object[];
  readonly authentication?: IHttpAuthenticationOptions;
  readonly onError: (error: Error, context: IHttpErrorContext) => void;
  readonly limits?: IHttpLimitsOptions;
  readonly errorMappings?: readonly IHttpErrorMapping[];
  readonly onResponseLog?: (record: IHttpResponseLogRecord) => void | Promise<void>;
}
