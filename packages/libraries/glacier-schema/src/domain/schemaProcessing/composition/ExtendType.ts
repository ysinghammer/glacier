import type { IClass } from "@glacier/reflection";
import { DerivedClasses } from "../schema/DerivedClasses.js";
import type { IDerivedClass } from "./types/IDerivedClass.js";
import type { IDerivedClassOptions } from "./types/IDerivedClassOptions.js";

/**
 * Creates a new schema class by combining base fields with extension fields, which replace name collisions.
 * @template B Instance type of the base class.
 * @template E Instance type of the extension class.
 * @param base Schema class supplying initial fields and refinements.
 * @param extension Schema class supplying overriding and additional fields.
 * @param options Optional generated-class name; defaults to `Extend` plus the base name.
 * @returns New constructor-free class typed as base fields overridden by extension fields.
 */
export function ExtendType<B extends object, E extends object>(
  base: abstract new (...arguments_: never[]) => B,
  extension: abstract new (...arguments_: never[]) => E,
  options?: IDerivedClassOptions,
): IDerivedClass<Omit<B, keyof E> & E> {
  const baseClass = base as unknown as IClass;
  const extensionClass = extension as unknown as IClass;
  const merged = new Map(DerivedClasses.fieldsOf(baseClass).map((field) => [field.name, field]));
  for (const field of DerivedClasses.fieldsOf(extensionClass)) merged.set(field.name, field);
  const derived = DerivedClasses.create(
    { kind: "extend", source: baseClass, extension: extensionClass },
    options?.name ?? `Extend${baseClass.name}`,
    [...merged.values()],
    [baseClass, extensionClass],
  );
  return derived as unknown as IDerivedClass<Omit<B, keyof E> & E>;
}
