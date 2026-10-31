import { FieldRegistry } from "../schema/FieldRegistry.js";
import { ElementTypes } from "../schema/ElementTypes.js";
import type { IElementType } from "../schema/IElementType.js";
import { RuleDefinitionCheck } from "../schema/RuleDefinitionCheck.js";
import type { ISizeOptions } from "./ISizeOptions.js";

/**
 * Property decorator declaring that the field must be a plain object, used as a dictionary, whose values
 * all match `value`: a primitive constructor, a decorated class or a `() => Class` reference. Keys are
 * the object's own enumerable string keys. Accepts `min` and `max` entry counts; the accepted value is a
 * new plain object. Records metadata only; throws `SchemaDefinitionError` for an invalid type or size, or
 * when the property already has a type decorator.
 */
export function IsRecord(value: IElementType, options?: ISizeOptions): PropertyDecorator {
  const { message, ...rules } = options ?? {};
  return (target, key) => {
    const label = `${target.constructor.name}.${String(key)}`;
    RuleDefinitionCheck.size(label, rules);
    FieldRegistry.declare(
      target,
      key,
      { kind: "record", value: ElementTypes.resolve(value, label), rules },
      message === undefined ? undefined : { message },
    );
  };
}
