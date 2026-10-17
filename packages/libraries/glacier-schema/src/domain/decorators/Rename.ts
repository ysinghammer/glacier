import { SchemaDefinitionError } from "../failures/SchemaDefinition.error.js";
import { FieldRegistry } from "../schema/FieldRegistry.js";

/**
 * Property decorator reading the field from the input key `inputKey` instead of its property name; the
 * instance still uses the property name and issue paths use the input key. Records metadata only; throws
 * `SchemaDefinitionError` for an empty key or when the property already has `Rename`. Two fields reading
 * the same input key are rejected when the class is first parsed.
 */
export function Rename(inputKey: string): PropertyDecorator {
  return (target, key) => {
    if (inputKey === "") {
      throw new SchemaDefinitionError(`Rename on ${String(key)} needs a non-empty input key`);
    }
    FieldRegistry.modify(target, key, "Rename", { inputKey });
  };
}
