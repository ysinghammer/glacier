import { FieldRegistry } from "../schema/FieldRegistry.js";
import type { IElementType } from "../schema/types/IElementType.js";
import { UnionSpecs } from "../schema/UnionSpecs.js";
import type { ISchemaDecoratorOptions } from "./types/ISchemaDecoratorOptions.js";

/**
 * Declares a non-discriminated union field, trying its alternatives in order and recording metadata.
 * @param types At least two primitive, decorated-class or lazy-reference alternatives.
 * @param options Optional issue-message settings for the field.
 * @returns A property decorator that registers the union field.
 */
export function IsOneOf(
  types: readonly IElementType[],
  options?: ISchemaDecoratorOptions,
): PropertyDecorator {
  return (target, key) => {
    const label = `${target.constructor.name}.${String(key)}`;
    FieldRegistry.declare(target, key, UnionSpecs.oneOf(types, label), options);
  };
}
