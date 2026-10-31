import { FieldRegistry } from "../schema/FieldRegistry.js";

/**
 * Allows missing or undefined input and leaves that property absent from the parsed instance.
 * @returns A property decorator that records optionality.
 */
export function Optional(): PropertyDecorator {
  return (target, key) => FieldRegistry.modify(target, key, "Optional", { optional: true });
}
