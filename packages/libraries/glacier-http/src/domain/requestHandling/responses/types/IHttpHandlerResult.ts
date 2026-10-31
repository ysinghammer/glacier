import type { HttpResponse } from "../HttpResponse.js";

/**
 * Handler success result: a response envelope or no value for the declared 204 response.
 * @template T Object, object-array, or void body represented by the response envelope.
 */
export type IHttpHandlerResult<
  T extends object | readonly object[] | void,
> = HttpResponse<T> | void;
