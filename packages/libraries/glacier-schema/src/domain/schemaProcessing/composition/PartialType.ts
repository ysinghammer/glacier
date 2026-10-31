import type { IClass } from "@glacier/reflection";
import { DerivedClasses } from "../schema/DerivedClasses.js";
import type { IDerivedClass } from "./IDerivedClass.js";
import type { IDerivedClassOptions } from "./IDerivedClassOptions.js";

/**
 * Creates a class with every field of `source` made optional, for update DTOs. Types, other modifiers and
 * property refinements are kept, but `Default` is dropped so that an update never injects values, and
 * class-level refinements are not carried over because they may need absent fields. Only top-level fields
 * become optional. The result is a new class, not a subclass; it carries no methods. `source` is frozen.
 * Throws `SchemaDefinitionError` for union base classes.
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
