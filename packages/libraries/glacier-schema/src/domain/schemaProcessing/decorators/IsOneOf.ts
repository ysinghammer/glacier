import { FieldRegistry } from "../schema/FieldRegistry.js";
import type { IElementType } from "../schema/IElementType.js";
import { UnionSpecs } from "../schema/UnionSpecs.js";
import type { ISchemaDecoratorOptions } from "./ISchemaDecoratorOptions.js";

/**
 * Property decorator declaring a union without discriminator: the value must match at least one of `types`
 * (primitive constructors, decorated classes or `() => Class` references), tried in order, and the first
 * match wins. Coercion applies only when no option matches as given. A value matching none is one
 * `invalid_union` issue whose `params.attempts` holds the issues of each option. Records metadata only;
 * throws `SchemaDefinitionError` for fewer than two or invalid types, or when the property already has a
 * type decorator.
 */
export function IsOneOf(
  types: readonly IElementType[],
  options?: ISchemaDecoratorOptions,
): PropertyDecorator {
  return (target, key) => {
    const label = `${target.constructor.name}.${String(key)}`;
    FieldRegistry.declare(target, key, UnionSpecs.oneOf(types, label), options);
  };
}
