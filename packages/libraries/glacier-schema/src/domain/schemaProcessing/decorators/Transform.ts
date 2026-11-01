import { FieldRegistry } from "../schema/FieldRegistry.js";
import type { ITransformFunction } from "../schema/types/ITransformFunction.js";

/**
 * Registers a transform applied after coercion and before field validation; missing input skips it.
 * @param transform Synchronous conversion whose result is passed to the field validator.
 * @returns A property decorator that records the transform.
 */
export function Transform(transform: ITransformFunction): PropertyDecorator {
  return (target, key) => FieldRegistry.modify(target, key, "Transform", { transform });
}
