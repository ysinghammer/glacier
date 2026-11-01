/** Describes one validation problem that prevented logger creation. */
export interface IRejectionReason {
  /** Stable category identifying the invalid configuration or logger input. */
  readonly code:
    | "no_transports"
    | "invalid_level"
    | "invalid_transport_level"
    | "empty_binding_key"
    | "reserved_binding_key"
    | "invalid_redact_path"
    | "empty_context";
  /** Human-readable explanation of the validation problem. */
  readonly message: string;
}
