import type { IClass } from "@glacier/reflection";
import type { IParseContext } from "../validation/IParseContext.js";
import type { IResult } from "../failures/IResult.js";

/** Closure produced once per class that validates and transforms an input into an instance. */
export type ICompiledSchema<T> = (input: unknown, context: IParseContext) => IResult<T>;

const compiledSchemas = new WeakMap<IClass, ICompiledSchema<object>>();
const frozenClasses = new WeakSet<IClass>();

/** Process-wide cache of compiled schemas and the record of classes whose metadata is frozen. */
export class CompiledSchemaCache {
  /** Returns the cached closure for `target`, or `undefined` before its first parse. */
  public static get<T extends object>(target: IClass): ICompiledSchema<T> | undefined {
    // The cache is keyed by class, and each entry was compiled for exactly that class's instance type.
    return compiledSchemas.get(target) as ICompiledSchema<T> | undefined;
  }

  /** Stores the closure for `target`. */
  public static set(target: IClass, schema: ICompiledSchema<object>): void {
    compiledSchemas.set(target, schema);
  }

  /** Freezes `target` and every ancestor so later decoration of any of them is rejected. */
  public static freeze(target: IClass): void {
    let current: unknown = target;
    while (typeof current === "function" && current !== Function.prototype) {
      frozenClasses.add(current as IClass);
      current = Object.getPrototypeOf(current);
    }
  }

  /** Whether `target` was frozen by a first parse of itself or of a subclass. */
  public static isFrozen(target: IClass): boolean {
    return frozenClasses.has(target);
  }
}
