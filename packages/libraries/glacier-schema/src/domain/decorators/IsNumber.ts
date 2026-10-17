import { FieldRegistry } from "../schema/FieldRegistry.js";
import type { ISchemaDecoratorOptions } from "./ISchemaDecoratorOptions.js";

/**
 * Property decorator declaring that the field must be a finite number. Records metadata only; throws
 * `SchemaDefinitionError` when the property's emitted TypeScript type contradicts it or it already has a type decorator.
 */
export function IsNumber(options?: ISchemaDecoratorOptions): PropertyDecorator {
  return (target, key) => FieldRegistry.declare(target, key, { kind: "number" }, options);
}
