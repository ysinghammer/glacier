import { FieldRegistry } from "../schema/FieldRegistry.js";

/**
 * Supplies a fallback for missing or undefined input; the value still passes through transforms and validation.
 * @template T Default value type produced directly or by a per-parse factory.
 * @param valueOrFactory Fixed default value, or a factory called once for each parse.
 * @returns A property decorator that records the default factory.
 */
export function Default<T>(valueOrFactory: T | (() => T)): PropertyDecorator {
  const defaultValue: () => unknown =
    typeof valueOrFactory === "function" ? (valueOrFactory as () => T) : () => valueOrFactory;
  return (target, key) => FieldRegistry.modify(target, key, "Default", { defaultValue });
}
