import type { IClass } from "@glacier/reflection";
import { SchemaDefinitionError } from "../failures/SchemaDefinition.error.js";
import { ClassAnnotations } from "../json-schema/ClassAnnotations.js";
import type { IJsonSchemaFragment } from "../json-schema/IJsonSchemaFragment.js";
import { FieldRegistry } from "../schema/FieldRegistry.js";

/**
 * Class and property decorator merging a hand-written JSON Schema `fragment` over the generated schema of the
 * field or class; fragment keywords win and are not validated. It never affects parsing and may be combined with
 * any type decorator in either order. Class fragments are not inherited. Records metadata only; throws
 * `SchemaDefinitionError` for a fragment that is not a plain object or a target that already has `JsonSchema`.
 */
export function JsonSchema(fragment: IJsonSchemaFragment): ClassDecorator & PropertyDecorator {
  return (target: object, key?: string | symbol): void => {
    if (typeof fragment !== "object" || fragment === null || Array.isArray(fragment)) {
      throw new SchemaDefinitionError("JsonSchema needs a plain object fragment");
    }
    if (key === undefined) {
      ClassAnnotations.fragment(target as IClass, fragment);
      return;
    }
    FieldRegistry.modify(target, key, "JsonSchema", { jsonSchema: fragment });
  };
}
