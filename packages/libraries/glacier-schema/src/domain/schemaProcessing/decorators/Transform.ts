import { FieldRegistry } from "../schema/FieldRegistry.js";
import type { ITransformFunction } from "../schema/ITransformFunction.js";

/**
 * Property decorator running `transform` on the input value (after coercion, before validation), so the
 * result is what gets validated. It does not run for a missing value without `Default`. An exception
 * thrown by `transform` becomes a `transform_failed` issue. Records metadata only; throws
 * `SchemaDefinitionError` when the property already has `Transform`.
 */
export function Transform(transform: ITransformFunction): PropertyDecorator {
  return (target, key) => FieldRegistry.modify(target, key, "Transform", { transform });
}
