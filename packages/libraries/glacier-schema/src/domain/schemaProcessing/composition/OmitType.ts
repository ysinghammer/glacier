import type { IClass } from "@glacier/reflection";
import { SchemaDefinitionError } from "../failures/SchemaDefinition.error.js";
import { DerivedClasses } from "../schema/DerivedClasses.js";
import type { IDerivedClass } from "./types/IDerivedClass.js";
import type { IDerivedClassOptions } from "./types/IDerivedClassOptions.js";

/**
 * Creates a new schema class containing every source field except those selected for removal.
 * @template T Instance type of the source class.
 * @template K String keys of `T` to omit.
 * @param source Schema class whose fields are copied and frozen against later decoration.
 * @param keys Schema property names to omit; each must be declared by the source.
 * @param options Optional generated-class name; defaults to `Omit` plus the source name.
 * @returns New constructor-free class typed as `Omit<T, K>` without class refinements.
 * @throws {SchemaDefinitionError} If any key is not a schema field of the source.
 */
export function OmitType<T extends object, K extends keyof T & string>(
  source: abstract new (...arguments_: never[]) => T,
  keys: readonly K[],
  options?: IDerivedClassOptions,
): IDerivedClass<Omit<T, K>> {
  const target = source as unknown as IClass;
  const all = DerivedClasses.fieldsOf(target);
  for (const key of keys) {
    if (!all.some((field) => field.name === key)) {
      throw new SchemaDefinitionError(
        `Cannot omit ${key}: ${target.name} has no such schema field`,
      );
    }
  }
  const derived = DerivedClasses.create(
    { kind: "omit", source: target },
    options?.name ?? `Omit${target.name}`,
    all.filter((field) => !keys.includes(field.name as K)),
    [],
  );
  return derived as unknown as IDerivedClass<Omit<T, K>>;
}
