import type { IClass } from "@glacier/reflection";
import { FIELDS_METADATA } from "../metadata/FieldsMetadata.js";
import type { ISchemaDecoratorOptions } from "../decorators/ISchemaDecoratorOptions.js";
import { SchemaDefinitionError } from "../failures/SchemaDefinition.error.js";
import { CompiledSchemaCache } from "./CompiledSchemaCache.js";
import { DesignTypeConflict } from "./DesignTypeConflict.js";
import type { IFieldDefinition } from "./IFieldDefinition.js";
import type { ITypeSpec } from "./ITypeSpec.js";

/** Writes and reads field declarations on top of `@glacier/reflection` metadata. */
export class FieldRegistry {
  /**
   * Records `type` for the decorated property. `target` is what a legacy property decorator receives.
   * Throws `SchemaDefinitionError` for static or symbol members, classes already frozen by a parse,
   * a second type decorator on the same property, or a type contradicting the emitted design type.
   */
  public static declare(
    target: object,
    key: string | symbol,
    type: ITypeSpec,
    options: ISchemaDecoratorOptions | undefined,
  ): void {
    const owner = FieldRegistry.#resolveOwner(target, key);
    const member = String(key);
    const label = `${owner.name}.${member}`;
    if (CompiledSchemaCache.isFrozen(owner)) {
      throw new SchemaDefinitionError(
        `Cannot decorate ${label}: ${owner.name} was already parsed, so its schema is frozen`,
      );
    }
    const own = FieldRegistry.#readOwn(owner);
    if (own.some((field) => field.name === member)) {
      throw new SchemaDefinitionError(`Cannot decorate ${label}: it already has a type decorator`);
    }
    const conflict = DesignTypeConflict.describe(owner, member, type);
    if (conflict !== undefined) throw new SchemaDefinitionError(`${label} is ${conflict}`);
    const definition: IFieldDefinition =
      options?.message === undefined
        ? { name: member, type }
        : { name: member, type, message: options.message };
    const written = FIELDS_METADATA.set(owner, [...own, definition]);
    if (!written.isValid)
      throw new SchemaDefinitionError(`Cannot decorate ${label}: ${written.code}`);
  }

  /**
   * Returns the effective field definitions of `target` and its ancestors in declaration order, ancestors
   * first. A subclass redeclaration replaces the inherited definition but keeps its position.
   */
  public static readAll(target: IClass): readonly IFieldDefinition[] {
    const declared = FIELDS_METADATA.read(target);
    const effective = new Map<string, IFieldDefinition>();
    for (const definition of declared.isValid && declared.isPresent ? declared.value : []) {
      effective.set(definition.name, definition);
    }
    return [...effective.values()];
  }

  /** Reads the fields declared directly on `owner`. */
  static #readOwn(owner: IClass): readonly IFieldDefinition[] {
    const own = FIELDS_METADATA.read(owner, { kind: "class", inheritance: "own" });
    return own.isValid && own.isPresent ? own.value : [];
  }

  /** Narrows the decorator target to the owning class of an instance member. */
  static #resolveOwner(target: object, key: string | symbol): IClass {
    if (typeof key === "symbol") {
      throw new SchemaDefinitionError("Schema fields must use string property names");
    }
    if (typeof target === "function") {
      throw new SchemaDefinitionError(
        `Cannot decorate static member ${key}: only instance properties`,
      );
    }
    return target.constructor;
  }
}
