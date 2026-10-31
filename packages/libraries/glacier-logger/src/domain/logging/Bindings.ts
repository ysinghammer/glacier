import type { IBindingViolation } from "./types/IBindingViolation.js";
import { ReservedKeys } from "./ReservedKeys.js";

/** Validates and combines structured data attached to every logger entry. */
export class Bindings {
  /** Finds empty and logger-reserved keys in a bindings record.
   * @param bindings - Read-only key-value data to inspect.
   * @returns One violation per invalid key; an empty array means no key violations.
   */
  public static validate(
    bindings: Readonly<Record<string, unknown>>,
  ): readonly IBindingViolation[] {
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

  /** Layers later binding values over earlier ones without mutating either input.
   * @param earlier - Base values retained unless overwritten.
   * @param later - Values that take precedence for duplicate keys.
   * @returns A new shallow merged record.
   */
  public static merge(
    earlier: Readonly<Record<string, unknown>>,
    later: Readonly<Record<string, unknown>>,
  ): Readonly<Record<string, unknown>> {
    return { ...earlier, ...later };
  }
}
