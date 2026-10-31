/** Package-owned transport-value failure, never eligible for application exception mappings. */
export class HttpContractError extends TypeError {
  /**
   * Creates the package's transport-contract error and retains an optional original cause.
   * @param message Safe failure description for the direct caller.
   * @param options Optional ErrorOptions, including the underlying factory failure cause.
   */
  public constructor(message: string, options?: ErrorOptions) {
    super(message, options);
  }
}
