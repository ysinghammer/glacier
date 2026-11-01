import type { IClass } from "@glacier/reflection";
import { SchemaDefinitionError } from "../failures/SchemaDefinition.error.js";
import { ClassAnnotations } from "../jsonSchema/ClassAnnotations.js";
import type { IDescribeOptions } from "../jsonSchema/types/IDescribeOptions.js";
import { FieldRegistry } from "../schema/FieldRegistry.js";

/**
 * Adds documentation annotations to generated JSON Schema without changing parsing behavior.
 * @param options Title, description, example or deprecation metadata; `name` applies only to classes.
 * @returns A class and property decorator that records the annotations.
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
