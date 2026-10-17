import { SchemaDefinitionError } from "../failures/SchemaDefinition.error.js";
import { FieldRegistry } from "../schema/FieldRegistry.js";
import { ElementTypes } from "../schema/ElementTypes.js";
import type { IElementType } from "../schema/IElementType.js";
import type { ISchemaDecoratorOptions } from "./ISchemaDecoratorOptions.js";

/**
 * Property decorator declaring that the field must be an array with exactly one element per entry of
 * `elements`, in order; each entry is a primitive constructor, a decorated class or a `() => Class`
 * reference. Records metadata only; throws `SchemaDefinitionError` for no elements or an invalid element
 * type, or when the property already has a type decorator.
 */
export function IsTuple(
  elements: readonly IElementType[],
  options?: ISchemaDecoratorOptions,
): PropertyDecorator {
  return (target, key) => {
    const label = `${target.constructor.name}.${String(key)}`;
    if (elements.length === 0) {
      throw new SchemaDefinitionError(`${label}: a tuple needs at least one element type`);
    }
    FieldRegistry.declare(
      target,
      key,
      { kind: "tuple", elements: elements.map((element) => ElementTypes.resolve(element, label)) },
      options,
    );
  };
}
