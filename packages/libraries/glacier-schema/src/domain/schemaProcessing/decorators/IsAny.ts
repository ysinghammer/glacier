import { FieldRegistry } from "../schema/FieldRegistry.js";
import type { ISchemaDecoratorOptions } from "./types/ISchemaDecoratorOptions.js";

/**
 * Declares an unconstrained field; undefined input leaves the property absent from the instance.
 * @param options Optional issue-message settings for the field.
 * @returns A property decorator that registers the unconstrained field.
 */
export function IsAny(options?: ISchemaDecoratorOptions): PropertyDecorator {
  return (target, key) => FieldRegistry.declare(target, key, { kind: "any" }, options);
}
