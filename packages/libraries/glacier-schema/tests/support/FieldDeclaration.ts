import { DESIGN_TYPE_METADATA } from "@glacier/reflection";
import type { IClass, IRuntimeType } from "@glacier/reflection";

/**
 * Applies schema decorators the way the compiler would for `@Decorator() member: Type`, because the
 * test transformer does not emit decorator metadata: the design type is recorded first, then the
 * decorators run on the prototype.
 */
export class FieldDeclaration {
  /** Records `designType` (when given) and applies `decorators` to `key` of `target`. */
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
