import { FieldRegistry } from "../schema/FieldRegistry.js";
import type { ILiteralValue } from "../schema/ITypeSpec.js";
import type { ISchemaDecoratorOptions } from "./ISchemaDecoratorOptions.js";

/**
 * Property decorator declaring that the field must strictly equal one string, number, boolean, bigint
 * or `null` literal. Records metadata only; throws `SchemaDefinitionError` when the property already
 * has a type decorator.
 */
export function IsLiteral(
  value: ILiteralValue,
  options?: ISchemaDecoratorOptions,
): PropertyDecorator {
  return (target, key) => FieldRegistry.declare(target, key, { kind: "literal", value }, options);
}
