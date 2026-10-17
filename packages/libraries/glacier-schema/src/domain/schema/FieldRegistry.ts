import type { IClass } from "@glacier/reflection";
import { FIELDS_METADATA } from "../metadata/FieldsMetadata.js";
import type { ISchemaDecoratorOptions } from "../decorators/ISchemaDecoratorOptions.js";
import { SchemaDefinitionError } from "../failures/SchemaDefinition.error.js";
import { CompiledSchemaCache } from "./CompiledSchemaCache.js";
import { DesignTypeConflict } from "./DesignTypeConflict.js";
import type { IFieldDeclaration } from "./IFieldDeclaration.js";
import type { IFieldDefinition } from "./IFieldDefinition.js";
import type { IFieldModifiers } from "./IFieldModifiers.js";
import type { ITypeSpec } from "./ITypeSpec.js";

/** Writes and reads field declarations on top of `@glacier/reflection` metadata. */
export class FieldRegistry {
  /**
   * Records `type` for the decorated property. `target` is what a legacy property decorator receives.
   * Modifiers already declared on the property are kept. Throws `SchemaDefinitionError` for static or
   * symbol members, classes already frozen by a parse, a second type decorator on the same property, or
   * a type contradicting the emitted design type.
   */
  public static declare(
    target: object,
    key: string | symbol,
    type: ITypeSpec,
    options: ISchemaDecoratorOptions | undefined,
  ): void {
    const { owner, member, label } = FieldRegistry.#locate(target, key);
    const own = FieldRegistry.#readOwn(owner);
    const existing = own.find((field) => field.name === member);
    if (existing?.type !== undefined) {
      throw new SchemaDefinitionError(`Cannot decorate ${label}: it already has a type decorator`);
    }
    const conflict = DesignTypeConflict.describe(owner, member, type);
    if (conflict !== undefined) throw new SchemaDefinitionError(`${label} is ${conflict}`);
    const modifiers = existing?.modifiers ?? {};
    const declaration: IFieldDeclaration =
      options?.message === undefined
        ? { name: member, type, modifiers }
        : { name: member, type, message: options.message, modifiers };
    FieldRegistry.#write(owner, label, own, declaration);
  }

  /**
   * Records `modifiers` for the decorated property, in any decorator order relative to the type decorator.
   * `decorator` names the calling decorator in errors. Throws `SchemaDefinitionError` for static or symbol
   * members, classes already frozen by a parse, or a modifier that the property already has.
   */
  public static modify(
    target: object,
    key: string | symbol,
    decorator: string,
    modifiers: IFieldModifiers,
  ): void {
    const { owner, member, label } = FieldRegistry.#locate(target, key);
    const own = FieldRegistry.#readOwn(owner);
    const existing = own.find((field) => field.name === member) ?? { name: member, modifiers: {} };
    const repeated = Object.keys(modifiers).some((name) => Reflect.has(existing.modifiers, name));
    if (repeated) {
      throw new SchemaDefinitionError(`Cannot decorate ${label}: it already has ${decorator}`);
    }
    FieldRegistry.#write(owner, label, own, {
      ...existing,
      modifiers: { ...existing.modifiers, ...modifiers },
    });
  }

  /**
   * Returns the effective field definitions of `target` and its ancestors in declaration order, ancestors
   * first. A subclass type declaration replaces the inherited definition, including its modifiers, but keeps
   * its position; a subclass entry with only modifiers adds to the inherited definition. Throws
   * `SchemaDefinitionError` when a field has modifiers but no type decorator anywhere in the hierarchy.
   */
  public static readAll(target: IClass): readonly IFieldDefinition[] {
    const declared = FIELDS_METADATA.read(target);
    const effective = new Map<string, IFieldDeclaration>();
    for (const declaration of declared.isValid && declared.isPresent ? declared.value : []) {
      const inherited = effective.get(declaration.name);
      if (declaration.type === undefined && inherited !== undefined) {
        effective.set(declaration.name, {
          ...inherited,
          modifiers: { ...inherited.modifiers, ...declaration.modifiers },
        });
      } else {
        effective.set(declaration.name, declaration);
      }
    }
    return [...effective.values()].map((declaration) => {
      if (declaration.type === undefined) {
        throw new SchemaDefinitionError(
          `${target.name}.${declaration.name} has modifiers but no type decorator`,
        );
      }
      return { ...declaration, type: declaration.type };
    });
  }

  /** Reads the fields declared directly on `owner`. */
  static #readOwn(owner: IClass): readonly IFieldDeclaration[] {
    const own = FIELDS_METADATA.read(owner, { kind: "class", inheritance: "own" });
    return own.isValid && own.isPresent ? own.value : [];
  }

  /** Stores `declaration`, replacing the class's earlier entry for the property or appending a new one. */
  static #write(
    owner: IClass,
    label: string,
    own: readonly IFieldDeclaration[],
    declaration: IFieldDeclaration,
  ): void {
    const replaced = own.some((field) => field.name === declaration.name);
    const next = replaced
      ? own.map((field) => (field.name === declaration.name ? declaration : field))
      : [...own, declaration];
    const written = FIELDS_METADATA.set(owner, next);
    if (!written.isValid) {
      throw new SchemaDefinitionError(`Cannot decorate ${label}: ${written.code}`);
    }
  }

  /** Resolves the owning class and rejects classes frozen by a parse. */
  static #locate(
    target: object,
    key: string | symbol,
  ): { readonly owner: IClass; readonly member: string; readonly label: string } {
    const owner = FieldRegistry.#resolveOwner(target, key);
    const member = String(key);
    const label = `${owner.name}.${member}`;
    if (CompiledSchemaCache.isFrozen(owner)) {
      throw new SchemaDefinitionError(
        `Cannot decorate ${label}: ${owner.name} was already parsed, so its schema is frozen`,
      );
    }
    return { owner, member, label };
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
