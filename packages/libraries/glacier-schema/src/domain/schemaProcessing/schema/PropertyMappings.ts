import type { IClass } from "@glacier/reflection";
import { SchemaDefinitionError } from "../failures/SchemaDefinition.error.js";
import { FieldRegistry } from "./FieldRegistry.js";
import { UnionRegistry } from "./UnionRegistry.js";
import type { IPropertyMapping } from "./types/IPropertyMapping.js";

/** Reads detached field-name snapshots from effective object schema declarations. */
export class PropertyMappings {
  /**
   * Collects effective field names without compiling or freezing the schema.
   * @param target Object schema class whose fields are inspected.
   * @returns Frozen array of frozen property-to-wire mappings in declaration order.
   * @throws {SchemaDefinitionError} If the target is not a class or is a root union.
   * @throws {SchemaDefinitionError} If two fields use the same wire name.
   */
  public static read(target: IClass): readonly IPropertyMapping[] {
    if (typeof target !== "function" || !Object.hasOwn(target, "prototype")) {
      throw new SchemaDefinitionError("Property mappings require a class");
    }
    if (UnionRegistry.get(target) !== undefined) {
      throw new SchemaDefinitionError(
        "Property mappings require an object schema, not a root union",
      );
    }
    const mappings: IPropertyMapping[] = [];
    const owners = new Map<string, string>();
    for (const field of FieldRegistry.readAll(target)) {
      const wireName = field.modifiers.inputKey ?? field.name;
      const previous = owners.get(wireName);
      if (previous !== undefined) {
        throw new SchemaDefinitionError(
          `${target.name}.${field.name} and ${target.name}.${previous} both read input key ${wireName}`,
        );
      }
      owners.set(wireName, field.name);
      mappings.push(
        Object.freeze({
          property: field.name,
          wireName,
          isRenamed: field.modifiers.inputKey !== undefined,
        }),
      );
    }
    return Object.freeze(mappings);
  }
}
