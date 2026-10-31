import type { HttpRequest } from "../requests/HttpRequest.js";

/** External authentication returns a nonempty ID or undefined; challenge is required and static. */
export interface IHttpAuthenticationOptions {
  /**
   * Resolves the authenticated identity for one normalized request.
   * @param request Detached request data; the body stream is not exposed.
   * @returns A user ID or undefined directly or as the resolved promise value.
   */
  readonly authenticate: (request: HttpRequest) => string | undefined | Promise<string | undefined>;
  /** Required challenge used to form the response to authentication failures. */
  readonly challenge: {
    /** Authentication challenge scheme, such as Bearer. */
    readonly scheme: string;
    /** Optional challenge realm. */
    readonly realm?: string;
  };
}
