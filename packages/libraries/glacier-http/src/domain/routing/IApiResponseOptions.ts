import type { IConstructableClass } from "@glacier/reflection";
import type { IHttpSuccessStatus } from "../responses/IHttpSuccessStatus.js";
import type { IJsonValue } from "@glacier/schema";
import type { IApiResponseHeaders } from "./IApiResponseHeaders.js";

/** Explicit success contract; DTO constructors are identities and never invoked by HTTP. */
export type IApiResponseOptions =
  | {
      readonly status: Exclude<IHttpSuccessStatus, 204 | 205>;
      readonly type: IConstructableClass<object>;
      readonly isArray?: boolean;
      readonly description?: string;
      readonly examples?: Readonly<Record<string, IJsonValue>>;
      readonly headers?: IApiResponseHeaders;
    }
  | {
      readonly status: 204;
      readonly type?: never;
      readonly isArray?: never;
      readonly description?: string;
      readonly examples?: never;
      readonly headers?: IApiResponseHeaders;
    };
