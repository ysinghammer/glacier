import { DESIGN_PARAMETER_TYPES_METADATA } from "@glacier/reflection";

/** Simulates the compiler's `design:paramtypes` emission, which Vitest's transformer does not produce. */
export class ParameterTypes {
  /** Records the emitted constructor parameter types of the class; throws when they cannot be written. */
  public static emit(target: new (...arguments_: never[]) => object, types: unknown[]): void {
    const written = DESIGN_PARAMETER_TYPES_METADATA.set(target, types as never);
    if (!written.isValid) throw new Error(written.code);
  }
}
