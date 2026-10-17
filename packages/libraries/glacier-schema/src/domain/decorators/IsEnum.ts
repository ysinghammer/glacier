import { SchemaDefinitionError } from "../failures/SchemaDefinition.error.js";
import { EnumValues } from "../schema/EnumValues.js";
import { FieldRegistry } from "../schema/FieldRegistry.js";
import type { IEnumSource } from "../schema/IEnumSource.js";
import type { ISchemaDecoratorOptions } from "./ISchemaDecoratorOptions.js";

/**
 * Property decorator declaring that the field must be one of the values of a TypeScript enum, a
 * const-object or an array of strings and numbers. Records metadata only; throws
 * `SchemaDefinitionError` for a source without values or when the property already has a type decorator.
 */
export function IsEnum(source: IEnumSource, options?: ISchemaDecoratorOptions): PropertyDecorator {
  const values = EnumValues.from(source);
  return (target, key) => {
    if (values.length === 0) {
      throw new SchemaDefinitionError(`IsEnum on ${String(key)} needs at least one value`);
    }
    FieldRegistry.declare(target, key, { kind: "enum", values }, options);
  };
}
