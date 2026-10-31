import type { IClass } from "@glacier/reflection";
import { DesignTypeInference } from "../schema/DesignTypeInference.js";
import { ElementTypes } from "../schema/ElementTypes.js";
import { FieldRegistry } from "../schema/FieldRegistry.js";
import type { ISchemaDecoratorOptions } from "./types/ISchemaDecoratorOptions.js";

/**
 * Declares a nested decorated-class field, using its schema and recording the reference as metadata.
 * @param target Explicit class or lazy reference; when omitted, uses emitted design-type metadata.
 * @param options Optional issue-message settings for the field.
 * @returns A property decorator that registers the nested field.
 */
export function IsObject(
  target?: IClass | (() => IClass),
  options?: ISchemaDecoratorOptions,
): PropertyDecorator {
  return (prototype, key) => {
    const label = `${prototype.constructor.name}.${String(key)}`;
    const source =
      target ?? DesignTypeInference.inferClass(prototype.constructor, String(key), label);
    FieldRegistry.declare(prototype, key, ElementTypes.resolveClass(source, label), options);
  };
}
