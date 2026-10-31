import { FieldRegistry } from "../schema/FieldRegistry.js";
import { ElementTypes } from "../schema/ElementTypes.js";
import type { IElementType } from "../schema/types/IElementType.js";
import { RuleDefinitionCheck } from "../schema/RuleDefinitionCheck.js";
import type { ISizeOptions } from "./types/ISizeOptions.js";

/**
 * Declares a map field, recording key/value types and entry-count rules as metadata.
 * @param key Primitive, decorated class or lazy reference describing each key.
 * @param value Primitive, decorated class or lazy reference describing each value.
 * @param options Optional entry-count constraints and issue message.
 * @returns A property decorator that registers the map field.
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
