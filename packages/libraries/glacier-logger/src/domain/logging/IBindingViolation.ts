/** One reason a bindings record cannot be accepted. */
export interface IBindingViolation {
  readonly code: "empty_binding_key" | "reserved_binding_key";
  readonly message: string;
}
