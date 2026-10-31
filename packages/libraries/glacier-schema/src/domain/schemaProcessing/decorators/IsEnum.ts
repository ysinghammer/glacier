import { SchemaDefinitionError } from "../failures/SchemaDefinition.error.js";
import { EnumValues } from "../schema/EnumValues.js";
import { FieldRegistry } from "../schema/FieldRegistry.js";
import type { IEnumSource } from "../schema/types/IEnumSource.js";
import type { ISchemaDecoratorOptions } from "./types/ISchemaDecoratorOptions.js";

/**
 * Declares a field restricted to values from an enum, constant record or scalar list.
 * @param source Enum-like record or list supplying the accepted string and number values.
 * @param options Optional issue-message settings for the field.
 * @returns A property decorator that registers the enum values.
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
