import { FieldRegistry } from "../schema/FieldRegistry.js";
import type { ISchemaDecoratorOptions } from "./types/ISchemaDecoratorOptions.js";

/**
 * Declares a boolean field and records its type as schema metadata.
 * @param options Optional issue-message settings for the field.
 * @returns A property decorator that registers the boolean field.
 */
export function IsBoolean(options?: ISchemaDecoratorOptions): PropertyDecorator {
  return (target, key) => FieldRegistry.declare(target, key, { kind: "boolean" }, options);
}
