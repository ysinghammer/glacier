/** Why a configuration, context or bindings value was rejected. */
export interface IRejectionReason {
  readonly code:
    | "no_transports"
    | "invalid_level"
    | "invalid_transport_level"
    | "empty_binding_key"
    | "reserved_binding_key"
    | "invalid_redact_path"
    | "empty_context";
  readonly message: string;
}
