import type { IClass } from "@glacier/reflection";
import { SchemaDefinitionError } from "../failures/SchemaDefinition.error.js";
import { CompiledSchemaCache } from "./CompiledSchemaCache.js";
import type { ITypeSpec } from "./ITypeSpec.js";

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
  /** Marks `target` as a union. Throws `SchemaDefinitionError` when it is frozen or already a union. */
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

  /** Returns the union declared directly on `target`, or `undefined` for ordinary classes and subclasses. */
  public static get(target: IClass): IClassUnion | undefined {
    return classUnions.get(target);
  }
}
