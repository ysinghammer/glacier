import { FieldRegistry } from "../schema/FieldRegistry.js";

/**
 * Allows null input and preserves it on the parsed instance without further field validation.
 * @returns A property decorator that records nullability.
 */
export function Nullable(): PropertyDecorator {
  return (target, key) => FieldRegistry.modify(target, key, "Nullable", { nullable: true });
}
