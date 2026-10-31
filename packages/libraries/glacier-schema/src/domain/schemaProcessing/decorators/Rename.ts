import { SchemaDefinitionError } from "../failures/SchemaDefinition.error.js";
import { FieldRegistry } from "../schema/FieldRegistry.js";

/**
 * Maps an input key to a property name; instances keep the property name and issue paths use the input key.
 * @param inputKey Non-empty key to read from the input object.
 * @returns A property decorator that records the input-key mapping.
 */
export function Rename(inputKey: string): PropertyDecorator {
  return (target, key) => {
    if (inputKey === "") {
      throw new SchemaDefinitionError(`Rename on ${String(key)} needs a non-empty input key`);
    }
    FieldRegistry.modify(target, key, "Rename", { inputKey });
  };
}
