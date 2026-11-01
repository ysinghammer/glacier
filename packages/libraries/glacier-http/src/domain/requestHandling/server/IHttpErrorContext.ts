/** Secret-safe diagnostic identity; no raw targets, credentials, values or request handles. */
export interface IHttpErrorContext {
  /** Correlation identifier when request processing began. */
  readonly requestId?: string;
  /** Received HTTP method when known. */
  readonly method?: string;
  /** Matched route template; raw request targets are never included. */
  readonly route?: string;
  /** Lifecycle or request-processing phase in which the error occurred. */
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
  /** Safe issue paths and codes; raw values and validation messages are omitted. */
  readonly issues?: readonly {
    /** Input location components identifying the invalid field. */
    readonly path: readonly (string | number)[];
    /** Stable validation issue code without supplied values. */
    readonly code: string;
  }[];
}
