import type { HttpRequest } from "../requests/HttpRequest.js";

/** External authentication returns a nonempty ID or undefined; challenge is required and static. */
export interface IHttpAuthenticationOptions {
  readonly authenticate: (request: HttpRequest) => string | undefined | Promise<string | undefined>;
  readonly challenge: { readonly scheme: string; readonly realm?: string };
}
