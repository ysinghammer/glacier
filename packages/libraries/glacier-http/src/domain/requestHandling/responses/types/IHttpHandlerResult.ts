import type { HttpResponse } from "../HttpResponse.js";

/** Success envelope or declared plain 204; async handlers may wrap this contract in a Promise. */
export type IHttpHandlerResult<
  T extends object | readonly object[] | void,
> = HttpResponse<T> | void;
