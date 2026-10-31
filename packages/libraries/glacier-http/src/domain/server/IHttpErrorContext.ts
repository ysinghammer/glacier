/** Secret-safe diagnostic identity; no raw targets, credentials, values or request handles. */
export interface IHttpErrorContext {
  readonly requestId?: string;
  readonly method?: string;
  readonly route?: string;
  readonly phase:
    | "construction"
    | "startup"
    | "authentication"
    | "input"
    | "controller"
    | "output"
    | "transport"
    | "response-logging"
    | "shutdown";
  readonly issues?: readonly {
    readonly path: readonly (string | number)[];
    readonly code: string;
  }[];
}
