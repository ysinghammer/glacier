import { FieldRegistry } from "../schema/FieldRegistry.js";

/**
 * Property decorator supplying the value used when the input is `undefined` or missing, which makes the
 * field optional on input; `null` is not replaced. A function argument is a factory called once per
 * parse, so mutable defaults should use one; any other argument is used as is. The default then goes
 * through `Transform` and validation like input. Records metadata only; throws `SchemaDefinitionError`
 * when the property already has `Default`.
 */
export function Default<T>(valueOrFactory: T | (() => T)): PropertyDecorator {
  const defaultValue: () => unknown =
    typeof valueOrFactory === "function" ? (valueOrFactory as () => T) : () => valueOrFactory;
  return (target, key) => FieldRegistry.modify(target, key, "Default", { defaultValue });
}
