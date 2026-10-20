import type { IBindingViolation } from "../domain/IBindingViolation.js";

/** Thrown by `Logger.child` when bindings bypass the compile-time reserved-key check. */
export class InvalidBindingsError extends Error {
  readonly violations: readonly IBindingViolation[];

  /** Keeps every violation; the message joins them for humans. */
  constructor(violations: readonly IBindingViolation[]) {
    super(`Invalid bindings: ${violations.map((violation) => violation.message).join("; ")}`);
    this.name = "InvalidBindingsError";
    this.violations = violations;
  }
}
