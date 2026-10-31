import type { IConstructableClass } from "@glacier/reflection";
import type { IHttpSuccessStatus } from "../../responses/types/IHttpSuccessStatus.js";
import type { IJsonValue } from "@glacier/schema";
import type { IApiResponseHeaders } from "./IApiResponseHeaders.js";

/**
 * Describes either a JSON success response or the explicitly bodyless 204 response.
 * @property status Successful status; 204 selects the bodyless branch.
 * @property type DTO class identity for JSON responses; never constructed by HTTP.
 * @property isArray Whether JSON response data is an array of DTO objects.
 * @property description Optional response documentation text.
 * @property examples Optional named JSON examples for JSON responses.
 * @property headers Optional documented response-header contracts.
 */
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
