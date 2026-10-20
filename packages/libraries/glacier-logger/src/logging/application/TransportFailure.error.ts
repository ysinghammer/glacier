/**
 * A transport could not deliver log output. It is only ever handed to `onError`, never thrown to
 * the logging caller. `cause` keeps the original failure.
 */
export class TransportFailureError extends Error {
  constructor(message: string, options: { readonly cause: unknown }) {
    super(message, options);
    this.name = "TransportFailureError";
  }

  /** Wraps any thrown or rejected value, keeping it as the `cause`. */
  static from(cause: unknown): TransportFailureError {
    const reason = cause instanceof Error ? cause.message : String(cause);
    return new TransportFailureError(`Transport failed to deliver log output: ${reason}`, {
      cause,
    });
  }
}
