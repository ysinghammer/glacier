import { FieldRegistry } from "../schema/FieldRegistry.js";
import { ElementTypes } from "../schema/ElementTypes.js";
import type { IElementType } from "../schema/types/IElementType.js";
import { RuleDefinitionCheck } from "../schema/RuleDefinitionCheck.js";
import type { ISizeOptions } from "./types/ISizeOptions.js";

/**
 * Declares a plain-object dictionary field and records its value type and size rules as metadata.
 * @param value Primitive, decorated class or lazy reference describing each dictionary value.
 * @param options Optional entry-count constraints and issue message.
 * @returns A property decorator that registers the record field.
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
