import { SchemaDefinitionError } from "../failures/SchemaDefinition.error.js";
import { FieldRegistry } from "../schema/FieldRegistry.js";
import { ElementTypes } from "../schema/ElementTypes.js";
import type { IElementType } from "../schema/types/IElementType.js";
import type { ISchemaDecoratorOptions } from "./types/ISchemaDecoratorOptions.js";

/**
 * Declares a fixed-length tuple field and records its ordered element types as metadata.
 * @param elements Non-empty ordered list of primitive, decorated-class or lazy-reference types.
 * @param options Optional issue-message settings for the field.
 * @returns A property decorator that registers the tuple field.
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
