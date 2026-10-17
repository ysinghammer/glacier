import { FieldRegistry } from "../schema/FieldRegistry.js";
import type { ISchemaDecoratorOptions } from "./ISchemaDecoratorOptions.js";

/**
 * Escape hatch property decorator accepting any value, including `undefined` (which leaves the key
 * absent on the instance). Records metadata only; throws `SchemaDefinitionError` when the property
 * already has a type decorator.
 */
export function IsAny(options?: ISchemaDecoratorOptions): PropertyDecorator {
  return (target, key) => FieldRegistry.declare(target, key, { kind: "any" }, options);
}
