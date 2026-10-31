import type { IBindingViolation } from "../../../domain/logging/types/IBindingViolation.js";

/** Reports binding validation failures raised while creating a child logger. */
export class InvalidBindingsError extends Error {
  /** All binding violations found; preserves the validation details. */
  public readonly violations: readonly IBindingViolation[];

  /** Creates an error whose message summarizes every supplied violation.
   * @param violations Binding validation failures to retain.
   */
  constructor(violations: readonly IBindingViolation[]) {
    super(`Invalid bindings: ${violations.map((violation) => violation.message).join("; ")}`);
    this.name = "InvalidBindingsError";
    this.violations = violations;
  }
}
