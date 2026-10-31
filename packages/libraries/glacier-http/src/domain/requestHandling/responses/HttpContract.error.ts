/** Package-owned transport-value failure, never eligible for application exception mappings. */
export class HttpContractError extends TypeError {
  /** Retains factory failure causes for direct callers; transport diagnostics redact them separately. */
  public constructor(message: string, options?: ErrorOptions) {
    super(message, options);
  }
}
