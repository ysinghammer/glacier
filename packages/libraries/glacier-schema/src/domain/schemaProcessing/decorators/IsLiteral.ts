import { FieldRegistry } from "../schema/FieldRegistry.js";
import type { ILiteralValue } from "../schema/types/ITypeSpec.js";
import type { ISchemaDecoratorOptions } from "./types/ISchemaDecoratorOptions.js";

/**
 * Declares a field that must strictly equal the supplied scalar literal.
 * @param value Accepted string, number, boolean, bigint or null literal.
 * @param options Optional issue-message settings for the field.
 * @returns A property decorator that registers the literal field.
 */
export function IsLiteral(
  value: ILiteralValue,
  options?: ISchemaDecoratorOptions,
): PropertyDecorator {
  return (target, key) => FieldRegistry.declare(target, key, { kind: "literal", value }, options);
}
