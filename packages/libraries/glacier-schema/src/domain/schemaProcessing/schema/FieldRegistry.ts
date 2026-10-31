import type { IClass } from "@glacier/reflection";
import { FIELDS_METADATA } from "../metadata/FieldsMetadata.js";
import type { ISchemaDecoratorOptions } from "../decorators/types/ISchemaDecoratorOptions.js";
import { SchemaDefinitionError } from "../failures/SchemaDefinition.error.js";
import { CompiledSchemaCache } from "./CompiledSchemaCache.js";
import { DesignTypeConflict } from "./DesignTypeConflict.js";
import type { IFieldDeclaration } from "./types/IFieldDeclaration.js";
import type { IFieldDefinition } from "./types/IFieldDefinition.js";
import type { IFieldModifiers } from "./types/IFieldModifiers.js";
import type { ITypeSpec } from "./types/ITypeSpec.js";

/** Writes and reads field declarations on top of `@glacier/reflection` metadata. */
export class FieldRegistry {
  /**
   * Registers a property's type while retaining modifiers already recorded for it.
   * @param target Prototype passed to a legacy property decorator.
   * @param key Instance property name to register.
   * @param type Declared validation type specification.
   * @param options Optional field issue-message override, or undefined.
   * @returns No value; stores the declaration in class metadata.
   * @throws {SchemaDefinitionError} If a type decorator already declared this property.
   * @throws {SchemaDefinitionError} If the declared type conflicts with emitted design metadata.
   */
  public static declare(
    target: object,
    key: string | symbol,
    type: ITypeSpec,
    options: ISchemaDecoratorOptions | undefined,
  ): void {
    const { owner, member, label } = FieldRegistry.locate(target, key);
    const own = FieldRegistry.readOwn(owner);
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
    FieldRegistry.write(owner, label, own, declaration);
  }

  /**
   * Adds a property's modifiers independently of type-decorator order.
   * @param target Prototype passed to a legacy property decorator.
   * @param key Instance property name to modify.
   * @param decorator Decorator name used in duplicate-modifier diagnostics.
   * @param modifiers Modifier values being recorded.
   * @returns No value; merges the modifier into class metadata.
   * @throws {SchemaDefinitionError} If the property already has one of these modifiers.
   */
  public static modify(
    target: object,
    key: string | symbol,
    decorator: string,
    modifiers: IFieldModifiers,
  ): void {
    const { owner, member, label } = FieldRegistry.locate(target, key);
    const own = FieldRegistry.readOwn(owner);
    const existing = own.find((field) => field.name === member) ?? { name: member, modifiers: {} };
    const repeated = Object.keys(modifiers).some((name) => Reflect.has(existing.modifiers, name));
    if (repeated) {
      throw new SchemaDefinitionError(`Cannot decorate ${label}: it already has ${decorator}`);
    }
    FieldRegistry.write(owner, label, own, {
      ...existing,
      modifiers: { ...existing.modifiers, ...modifiers },
    });
  }

  /**
   * Merges effective field definitions across the class hierarchy in ancestor-first declaration order.
   * @param target Class whose own and inherited field metadata is read.
   * @returns Readonly ordered definitions with a type for every field.
   * @throws {SchemaDefinitionError} If any field has modifiers but no type declaration.
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

  /**
   * Reads only the fields declared directly on one class.
   * @param owner Class whose own metadata is read.
   * @returns Own field declarations in their stored order, or an empty list.
   */
  private static readOwn(owner: IClass): readonly IFieldDeclaration[] {
    const own = FIELDS_METADATA.read(owner, { kind: "class", inheritance: "own" });
    return own.isValid && own.isPresent ? own.value : [];
  }

  /**
   * Stores or replaces one field declaration in class metadata.
   * @param owner Class receiving the updated metadata.
   * @param label Class-member label used in write errors.
   * @param own Existing declarations owned by the class.
   * @param declaration Replacement or new field declaration.
   * @returns No value; writes the updated ordered declaration list.
   * @throws {SchemaDefinitionError} If reflection metadata rejects the write.
   */
  private static write(
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

  /**
   * Resolves the member's class owner and ensures its schema remains mutable.
   * @param target Instance prototype supplied by the decorator runtime.
   * @param key Decorated property name.
   * @returns Owner class, string member name and diagnostic label.
   */
  private static locate(
    target: object,
    key: string | symbol,
  ): { readonly owner: IClass; readonly member: string; readonly label: string } {
    const owner = FieldRegistry.resolveOwner(target, key);
    const member = String(key);
    const label = `${owner.name}.${member}`;
    if (CompiledSchemaCache.isFrozen(owner)) {
      throw new SchemaDefinitionError(
        `Cannot decorate ${label}: ${owner.name} was already parsed, so its schema is frozen`,
      );
    }
    return { owner, member, label };
  }

  /**
   * Validates and narrows a decorator target to its instance-member class.
   * @param target Decorator target, expected to be an instance prototype.
   * @param key Decorated property key.
   * @returns Constructor that owns the instance property.
   * @throws {SchemaDefinitionError} If the key is a symbol or the target is a class static side.
   */
  private static resolveOwner(target: object, key: string | symbol): IClass {
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
