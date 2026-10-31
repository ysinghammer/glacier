import type { IClass } from "@glacier/reflection";
import { SchemaDefinitionError } from "../failures/SchemaDefinition.error.js";
import type { IRefineOptions } from "../decorators/IRefineOptions.js";
import { CompiledSchemaCache } from "./CompiledSchemaCache.js";

/** A class-level refinement declared by `Refine`. */
export interface IClassRefinement {
  /** Synchronous check of the validated instance; `false` or an exception rejects it. */
  readonly test: (value: never) => boolean;
  readonly options: IRefineOptions;
}

const refinements = new WeakMap<IClass, readonly IClassRefinement[]>();

/** Records the refinements declared on classes; subclasses inherit those of their ancestors. */
export class ClassRefinements {
  /** Adds `refinement` to `target`. Throws `SchemaDefinitionError` when the class is frozen. */
  public static declare(target: IClass, refinement: IClassRefinement): void {
    if (CompiledSchemaCache.isFrozen(target)) {
      throw new SchemaDefinitionError(
        `Cannot decorate ${target.name}: it was already parsed, so its schema is frozen`,
      );
    }
    refinements.set(target, [...(refinements.get(target) ?? []), refinement]);
  }

  /** Returns the refinements of `target` and its ancestors, ancestors first. */
  public static readAll(target: IClass): readonly IClassRefinement[] {
    const parent: unknown = Object.getPrototypeOf(target);
    const inherited =
      typeof parent === "function" && parent !== Function.prototype
        ? ClassRefinements.readAll(parent as IClass)
        : [];
    return [...inherited, ...(refinements.get(target) ?? [])];
  }
}
