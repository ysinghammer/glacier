import type { IClass } from "@glacier/reflection";
import { SchemaDefinitionError } from "../failures/SchemaDefinition.error.js";
import type { IRefineOptions } from "../decorators/types/IRefineOptions.js";
import { CompiledSchemaCache } from "./CompiledSchemaCache.js";

/** A class-level refinement declared by `Refine`. */
export interface IClassRefinement {
  /**
   * Synchronous predicate applied after all declared fields validate.
   * @param value Validated class instance being checked.
   * @returns True to accept the instance; false or a thrown exception creates an issue.
   */
  readonly test: (value: never) => boolean;
  /** Issue path, code and message settings applied when the predicate rejects. */
  readonly options: IRefineOptions;
}

const refinements = new WeakMap<IClass, readonly IClassRefinement[]>();

/** Records the refinements declared on classes; subclasses inherit those of their ancestors. */
export class ClassRefinements {
  /**
   * Appends a class refinement to the declarations owned by a class.
   * @param target Class receiving the refinement.
   * @param refinement Synchronous predicate and issue configuration.
   * @returns No value; stores the refinement for compilation.
   * @throws {SchemaDefinitionError} If the target class was frozen by parsing.
   */
  public static declare(target: IClass, refinement: IClassRefinement): void {
    if (CompiledSchemaCache.isFrozen(target)) {
      throw new SchemaDefinitionError(
        `Cannot decorate ${target.name}: it was already parsed, so its schema is frozen`,
      );
    }
    refinements.set(target, [...(refinements.get(target) ?? []), refinement]);
  }

  /**
   * Reads inherited and local class refinements in ancestor-first order.
   * @param target Class whose refinement chain is read.
   * @returns Readonly list of refinements to execute after field validation.
   */
  public static readAll(target: IClass): readonly IClassRefinement[] {
    const parent: unknown = Object.getPrototypeOf(target);
    const inherited =
      typeof parent === "function" && parent !== Function.prototype
        ? ClassRefinements.readAll(parent as IClass)
        : [];
    return [...inherited, ...(refinements.get(target) ?? [])];
  }
}
