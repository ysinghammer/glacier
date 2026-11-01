import { DESIGN_PARAMETER_TYPES_METADATA } from "@glacier/reflection";

/** Writes constructor type metadata that Vitest's transformer does not emit for these scenarios. */
export class ParameterTypes {
  /**
   * Stores compiler-style constructor parameter metadata for a test class.
   * @param target Class whose constructor metadata is being simulated.
   * @param types Ordered runtime representations of the constructor parameter types.
   * @returns No value; records the supplied types for later public API resolution.
   * @throws {Error} Metadata storage rejects the target or supplied representation.
   */
  public static emit(target: new (...arguments_: never[]) => object, types: unknown[]): void {
    const written = DESIGN_PARAMETER_TYPES_METADATA.set(target, types as never);
    if (!written.isValid) throw new Error(written.code);
  }
}
