/** Wraps a delivery failure and preserves its cause for reporting instead of the log caller. */
export class TransportFailureError extends Error {
  /**
   * Creates a delivery error while preserving the original cause.
   * @param message Safe summary of the failed delivery.
   * @param options Original failure retained as the cause.
   */
  constructor(message: string, options: { readonly cause: unknown }) {
    super(message, options);
    this.name = "TransportFailureError";
  }

  /** Converts a thrown or rejected value into a delivery error.
   * @param cause Original value to preserve for diagnosis.
   * @returns Error describing the failed delivery and retaining `cause`.
   */
  public static from(cause: unknown): TransportFailureError {
    const reason = cause instanceof Error ? cause.message : String(cause);
    return new TransportFailureError(`Transport failed to deliver log output: ${reason}`, {
      cause,
    });
  }
}
