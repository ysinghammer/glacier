import type { IClass } from "@glacier/reflection";
import { SchemaDefinitionError } from "../failures/SchemaDefinition.error.js";
import { DerivedClasses } from "../schema/DerivedClasses.js";
import type { IDerivedClass } from "./IDerivedClass.js";
import type { IDerivedClassOptions } from "./IDerivedClassOptions.js";

/**
 * Creates a class with only the listed fields of `source`, keeping their types and modifiers. Class-level
 * refinements are not carried over because they may need dropped fields. The result is a new class, not a
 * subclass; it carries no methods. `source` is frozen. Throws `SchemaDefinitionError` for union base classes
 * and for keys that are not schema fields of `source`.
 */
export function PickType<T extends object, K extends keyof T & string>(
  source: abstract new (...arguments_: never[]) => T,
  keys: readonly K[],
  options?: IDerivedClassOptions,
): IDerivedClass<Pick<T, K>> {
  const target = source as unknown as IClass;
  const all = DerivedClasses.fieldsOf(target);
  for (const key of keys) {
    if (!all.some((field) => field.name === key)) {
      throw new SchemaDefinitionError(
        `Cannot pick ${key}: ${target.name} has no such schema field`,
      );
    }
  }
  const derived = DerivedClasses.create(
    { kind: "pick", source: target },
    options?.name ?? `Pick${target.name}`,
    all.filter((field) => keys.includes(field.name as K)),
    [],
  );
  return derived as unknown as IDerivedClass<Pick<T, K>>;
}
