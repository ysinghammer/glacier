import type { IHttpAuthenticationOptions } from "./IHttpAuthenticationOptions.js";
import type { IHttpErrorContext } from "./IHttpErrorContext.js";
import type { IHttpLimitsOptions } from "./IHttpLimitsOptions.js";
import type { IHttpResponseLogRecord } from "./IHttpResponseLogRecord.js";
import type { IHttpErrorMapping } from "../responses/types/IHttpErrorMapping.js";

/** Explicit composition with static business mappings and supervised metadata-only response logging. */
export interface IHttpServerOptions {
  /** Controller instances explicitly installed in this server composition. */
  readonly controllers: readonly object[];
  /** Optional authentication policy; omission disables external authentication. */
  readonly authentication?: IHttpAuthenticationOptions;
  /**
   * Handles exceptional server failures after transport-safe context redaction.
   * @param error The exceptional failure being reported.
   * @param context Secret-safe request and lifecycle diagnostic context.
   * @returns No value; the callback reports the failure to its owner.
   */
  readonly onError: (error: Error, context: IHttpErrorContext) => void;
  /** Optional resource, timeout, and bounded-work limits; omitted values use documented defaults. */
  readonly limits?: IHttpLimitsOptions;
  /** Static error-to-Problem-Details mappings in global scope.
   * @default Empty mapping scope
   */
  readonly errorMappings?: readonly IHttpErrorMapping[];
  /**
   * Optional supervised completion observer; slow callbacks are bounded by configured capacity.
   * @param record Detached completion metadata without request values or handles.
   * @returns A promise resolving when observation finishes, or no value for synchronous observers.
   */
  readonly onResponseLog?: (record: IHttpResponseLogRecord) => void | Promise<void>;
}
