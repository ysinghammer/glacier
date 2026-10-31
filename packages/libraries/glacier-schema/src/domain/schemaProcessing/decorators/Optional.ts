import { FieldRegistry } from "../schema/FieldRegistry.js";

/**
 * Property decorator allowing the field to be missing or `undefined`; the key then stays absent on the
 * instance. `null` is still rejected unless `Nullable` is applied. It may be combined with any type
 * decorator in either order. Records metadata only; throws `SchemaDefinitionError` when the property
 * already has `Optional`.
 */
export function Optional(): PropertyDecorator {
  return (target, key) => FieldRegistry.modify(target, key, "Optional", { optional: true });
}
