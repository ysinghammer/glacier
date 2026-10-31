import { FieldRegistry } from "../schema/FieldRegistry.js";
import type { ISchemaDecoratorOptions } from "./ISchemaDecoratorOptions.js";

/**
 * Property decorator declaring that the field must be a boolean. Records metadata only; throws
 * `SchemaDefinitionError` when the property's emitted TypeScript type contradicts it or it already has a type decorator.
 */
export function IsBoolean(options?: ISchemaDecoratorOptions): PropertyDecorator {
  return (target, key) => FieldRegistry.declare(target, key, { kind: "boolean" }, options);
}
