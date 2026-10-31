import type { IClass } from "@glacier/reflection";
import { DerivedClasses } from "../schema/DerivedClasses.js";
import type { IDerivedClass } from "./types/IDerivedClass.js";
import type { IDerivedClassOptions } from "./types/IDerivedClassOptions.js";

/**
 * Creates a new schema class with all top-level source fields optional, suitable for partial updates.
 * @template T Instance type of the source class.
 * @param source Schema class whose fields are copied and frozen against later decoration.
 * @param options Optional generated-class name; defaults to `Partial` plus the source name.
 * @returns Constructor-free `Partial<T>` class; defaults and class refinements are omitted.
 */
export function PartialType<T extends object>(
  source: abstract new (...arguments_: never[]) => T,
  options?: IDerivedClassOptions,
): IDerivedClass<Partial<T>> {
  const target = source as unknown as IClass;
  const fields = DerivedClasses.fieldsOf(target).map(
    ({ modifiers: { defaultValue: _defaultValue, ...modifiers }, ...field }) => ({
      ...field,
      modifiers: { ...modifiers, optional: true as const },
    }),
  );
  const derived = DerivedClasses.create(
    { kind: "partial", source: target },
    options?.name ?? `Partial${target.name}`,
    fields,
    [],
  );
  return derived as unknown as IDerivedClass<Partial<T>>;
}
