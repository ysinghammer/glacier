import type { IClass } from "@glacier/reflection";
import { DerivedClasses } from "../schema/DerivedClasses.js";
import type { IDerivedClass } from "./IDerivedClass.js";
import type { IDerivedClassOptions } from "./IDerivedClassOptions.js";

/**
 * Creates a class with the fields of `base` plus those of `extension`; an `extension` field replaces the
 * `base` field of the same name, including its modifiers, and keeps the base position. Class-level
 * refinements of both classes are kept. The result is a new class, not a subclass of either; it carries no
 * methods. Both classes are frozen. Throws `SchemaDefinitionError` for union base classes.
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
