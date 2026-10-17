import type { IClass } from "@glacier/reflection";
import { SchemaDefinitionError } from "../failures/SchemaDefinition.error.js";
import { ClassAnnotations } from "../json-schema/ClassAnnotations.js";
import type { IDescribeOptions } from "../json-schema/IDescribeOptions.js";
import { FieldRegistry } from "../schema/FieldRegistry.js";

/**
 * Class and property decorator adding `title`, `description`, `example` and `deprecated` to the JSON Schema
 * output; `name` (class only) replaces the class name as the key of its definition. It never affects parsing and
 * may be combined with any type decorator in either order. Class annotations are not inherited. Records metadata
 * only; throws `SchemaDefinitionError` for a `name` on a property, an empty `name`, or a target that already has
 * `Describe`.
 */
export function Describe(options: IDescribeOptions): ClassDecorator & PropertyDecorator {
  return (target: object, key?: string | symbol): void => {
    if (options.name === "") {
      throw new SchemaDefinitionError("Describe needs a non-empty name");
    }
    if (key === undefined) {
      ClassAnnotations.describe(target as IClass, options);
      return;
    }
    if (options.name !== undefined) {
      throw new SchemaDefinitionError(
        `Describe on ${target.constructor.name}.${String(key)} cannot set name: only classes are named`,
      );
    }
    FieldRegistry.modify(target, key, "Describe", { describe: options });
  };
}
