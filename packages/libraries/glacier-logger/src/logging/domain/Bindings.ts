import type { IBindingViolation } from "./IBindingViolation.js";
import { ReservedKeys } from "./ReservedKeys.js";

/** Invariants and merging of bindings, the structured data attached to every entry of a logger. */
export class Bindings {
  /** Lists every empty or reserved key. An empty result means the bindings are acceptable. */
  static validate(bindings: Readonly<Record<string, unknown>>): readonly IBindingViolation[] {
    const violations: IBindingViolation[] = [];
    for (const key of Object.keys(bindings)) {
      if (key === "") {
        violations.push({ code: "empty_binding_key", message: "Binding keys must not be empty" });
      } else if (ReservedKeys.isReserved(key)) {
        violations.push({
          code: "reserved_binding_key",
          message: `Binding key "${key}" is reserved`,
        });
      }
    }
    return violations;
  }

  /** Returns a new record with `later` layered over `earlier`. Neither input is mutated. */
  static merge(
    earlier: Readonly<Record<string, unknown>>,
    later: Readonly<Record<string, unknown>>,
  ): Readonly<Record<string, unknown>> {
    return { ...earlier, ...later };
  }
}
