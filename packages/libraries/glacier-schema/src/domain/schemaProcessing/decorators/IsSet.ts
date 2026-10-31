import { FieldRegistry } from "../schema/FieldRegistry.js";
import { ElementTypes } from "../schema/ElementTypes.js";
import type { IElementType } from "../schema/IElementType.js";
import { RuleDefinitionCheck } from "../schema/RuleDefinitionCheck.js";
import type { ICollectionOptions } from "./ICollectionOptions.js";

/**
 * Property decorator declaring that the field must be a `Set` whose elements all match `element`: a
 * primitive constructor, a decorated class or a `() => Class` reference. Accepts `min`, `max` and `unique`;
 * the accepted value is a new `Set`. With per-call coercion an array is also accepted. Records metadata
 * only; throws `SchemaDefinitionError` for an invalid element type or size, or when the property already
 * has a type decorator.
 */
export function IsSet(element: IElementType, options?: ICollectionOptions): PropertyDecorator {
  const { message, ...rules } = options ?? {};
  return (target, key) => {
    const label = `${target.constructor.name}.${String(key)}`;
    RuleDefinitionCheck.size(label, rules);
    FieldRegistry.declare(
      target,
      key,
      { kind: "set", element: ElementTypes.resolve(element, label), rules },
      message === undefined ? undefined : { message },
    );
  };
}
