import type { IClass } from "@glacier/reflection";
import { SchemaDefinitionError } from "../failures/SchemaDefinition.error.js";
import { CompiledSchemaCache } from "./CompiledSchemaCache.js";
import type { ITypeSpec } from "./types/ITypeSpec.js";

/** Union recorded on a class by `IsUnion` used as a class decorator. */
export interface IClassUnion {
  /** The discriminated union the class parses as. */
  readonly spec: Extract<ITypeSpec, { kind: "union" }>;
  /** Replaces the message of discriminator issues. */
  readonly message: string | undefined;
}

const classUnions = new WeakMap<IClass, IClassUnion>();

/** Records which classes parse as a discriminated union of their variants; subclasses do not inherit it. */
export class UnionRegistry {
  /**
   * Registers a class as a discriminated union base.
   * @param target Class parsing as one of its variants.
   * @param union Discriminator, variant specifications and issue-message override.
   * @returns No value; stores the class-specific union declaration.
   * @throws {SchemaDefinitionError} If the class is frozen or already registered as a union.
   */
  public static declare(target: IClass, union: IClassUnion): void {
    if (CompiledSchemaCache.isFrozen(target)) {
      throw new SchemaDefinitionError(
        `Cannot decorate ${target.name}: it was already parsed, so its schema is frozen`,
      );
    }
    if (classUnions.has(target)) {
      throw new SchemaDefinitionError(`Cannot decorate ${target.name}: it is already a union`);
    }
    classUnions.set(target, union);
  }

  /**
   * Retrieves union metadata declared directly on a class.
   * @param target Class whose own union declaration is queried.
   * @returns Union configuration, or undefined for ordinary classes and subclasses.
   */
  public static get(target: IClass): IClassUnion | undefined {
    return classUnions.get(target);
  }
}
