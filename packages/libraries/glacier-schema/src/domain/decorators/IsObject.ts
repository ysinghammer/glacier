import type { IClass } from "@glacier/reflection";
import { DesignTypeInference } from "../schema/DesignTypeInference.js";
import { ElementTypes } from "../schema/ElementTypes.js";
import { FieldRegistry } from "../schema/FieldRegistry.js";
import type { ISchemaDecoratorOptions } from "./ISchemaDecoratorOptions.js";

/**
 * Property decorator declaring that the field is a nested instance of a decorated class, validated with
 * that class's schema; unknown keys are stripped and issue paths continue through the field. `target` is
 * the class, or a `() => Class` reference for forward references and cycles; without it the class comes
 * from the compiler-emitted TypeScript type. Records metadata only; throws `SchemaDefinitionError` when no
 * class can be determined, the argument is not a class or reference, or the property already has a type
 * decorator.
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
