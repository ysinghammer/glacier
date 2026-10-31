import { FieldRegistry } from "../schema/FieldRegistry.js";
import { ElementTypes } from "../schema/ElementTypes.js";
import type { IElementType } from "../schema/types/IElementType.js";
import { RuleDefinitionCheck } from "../schema/RuleDefinitionCheck.js";
import type { ICollectionOptions } from "./types/ICollectionOptions.js";

/**
 * Declares a set field whose entries use `element`, and records collection rules as metadata.
 * @param element Primitive, decorated class or lazy reference describing each entry.
 * @param options Optional size, uniqueness and issue-message rules.
 * @returns A property decorator that registers the set field.
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
