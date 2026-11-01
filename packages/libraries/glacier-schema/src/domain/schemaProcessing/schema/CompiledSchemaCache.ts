import type { IClass } from "@glacier/reflection";
import type { IParseContext } from "../validation/types/IParseContext.js";
import type { IResult } from "../failures/IResult.js";

/**
 * Parser closure for one class, yielding an instance or typed validation issues.
 * @template T Instance type produced when parsing succeeds.
 * @param input Untrusted candidate input to parse.
 * @param context Per-call coercion settings and nested-class depth.
 * @returns Parsed value or typed issue list.
 */
export type ICompiledSchema<T> = (input: unknown, context: IParseContext) => IResult<T>;

const compiledSchemas = new WeakMap<IClass, ICompiledSchema<object>>();
const frozenClasses = new WeakSet<IClass>();

/** Process-wide cache of compiled schemas and the record of classes whose metadata is frozen. */
export class CompiledSchemaCache {
  /**
   * Retrieves a compiled parser from the class-keyed cache.
   * @template T Instance type expected by the caller.
   * @param target Class whose compiled parser is requested.
   * @returns Cached parser, or undefined before compilation.
   */
  public static get<T extends object>(target: IClass): ICompiledSchema<T> | undefined {
    // The cache is keyed by class, and each entry was compiled for exactly that class's instance type.
    return compiledSchemas.get(target) as ICompiledSchema<T> | undefined;
  }

  /**
   * Associates a compiled parser with its class.
   * @param target Class used as the cache key.
   * @param schema Compiled parser for that class.
   * @returns No value; updates the process-local weak cache.
   */
  public static set(target: IClass, schema: ICompiledSchema<object>): void {
    compiledSchemas.set(target, schema);
  }

  /**
   * Marks a class and its constructor ancestors as schema-frozen.
   * @param target Parsed class whose hierarchy must no longer change.
   * @returns No value; records frozen classes in a weak set.
   */
  public static freeze(target: IClass): void {
    let current: unknown = target;
    while (typeof current === "function" && current !== Function.prototype) {
      frozenClasses.add(current as IClass);
      current = Object.getPrototypeOf(current);
    }
  }

  /**
   * Checks whether a class was frozen by parsing it or a subclass.
   * @param target Class whose metadata mutability is queried.
   * @returns True when the class may no longer be decorated.
   */
  public static isFrozen(target: IClass): boolean {
    return frozenClasses.has(target);
  }
}
