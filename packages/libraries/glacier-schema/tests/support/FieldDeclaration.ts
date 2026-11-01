import { DESIGN_TYPE_METADATA } from "@glacier/reflection";
import type { IClass, IRuntimeType } from "@glacier/reflection";

/** Applies property decorators with compiler-like design metadata for public schema tests. */
export class FieldDeclaration {
  /**
   * Records optional design metadata, then applies property decorators to a class.
   * @param target Class whose prototype receives the decorators.
   * @param key String property name decorated on the class.
   * @param designType Emitted design type, or `undefined` when unavailable.
   * @param decorators Property decorators applied in declaration order.
   * @returns Nothing; records metadata and applies each decorator.
   * @throws {Error} When reflection refuses the requested design metadata write.
   */
  public static declare(
    target: IClass,
    key: string,
    designType: IRuntimeType,
    ...decorators: PropertyDecorator[]
  ): void {
    if (designType !== undefined) {
      const written = DESIGN_TYPE_METADATA.setDynamic(target, designType, {
        kind: "member",
        member: key,
      });
      if (!written.isValid) throw new Error(written.code);
    }
    for (const decorator of decorators) decorator(target.prototype, key);
  }
}
