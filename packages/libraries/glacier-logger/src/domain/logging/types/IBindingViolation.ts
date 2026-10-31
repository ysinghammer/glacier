/** Describes one invalid binding key and the reason it is rejected. */
export interface IBindingViolation {
  /** Classification: empty key or a key reserved by the logger. */
  readonly code: "empty_binding_key" | "reserved_binding_key";
  /** Human-readable explanation naming the binding constraint. */
  readonly message: string;
}
