import { FieldRegistry } from "../schema/FieldRegistry.js";
import { ElementTypes } from "../schema/ElementTypes.js";
import type { IElementType } from "../schema/IElementType.js";
import { RuleDefinitionCheck } from "../schema/RuleDefinitionCheck.js";
import type { ISizeOptions } from "./ISizeOptions.js";

/**
 * Property decorator declaring that the field must be a `Map` whose keys match `key` and values match
 * `value`, each a primitive constructor, a decorated class or a `() => Class` reference. Accepts `min`
 * and `max` entry counts; the accepted value is a new `Map`. With per-call coercion an array of
 * `[key, value]` pairs or a plain object is also accepted. Issue paths use the entry key, or its position
 * for keys that are not strings or numbers; key issues carry `location: "key"`. Records metadata only;
 * throws `SchemaDefinitionError` for an invalid type or size, or when the property already has a type
 * decorator.
 */
export function IsMap(
  key: IElementType,
  value: IElementType,
  options?: ISizeOptions,
): PropertyDecorator {
  const { message, ...rules } = options ?? {};
  return (target, property) => {
    const label = `${target.constructor.name}.${String(property)}`;
    RuleDefinitionCheck.size(label, rules);
    FieldRegistry.declare(
      target,
      property,
      {
        kind: "map",
        key: ElementTypes.resolve(key, label),
        value: ElementTypes.resolve(value, label),
        rules,
      },
      message === undefined ? undefined : { message },
    );
  };
}
