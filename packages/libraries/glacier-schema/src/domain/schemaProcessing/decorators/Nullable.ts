import { FieldRegistry } from "../schema/FieldRegistry.js";

/**
 * Property decorator allowing `null`, which is kept as `null` on the instance without further checks.
 * `undefined` is still rejected unless `Optional` or `Default` applies. Records metadata only; throws
 * `SchemaDefinitionError` when the property already has `Nullable`.
 */
export function Nullable(): PropertyDecorator {
  return (target, key) => FieldRegistry.modify(target, key, "Nullable", { nullable: true });
}
