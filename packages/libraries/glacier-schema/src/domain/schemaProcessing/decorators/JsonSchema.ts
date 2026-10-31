import type { IClass } from "@glacier/reflection";
import { SchemaDefinitionError } from "../failures/SchemaDefinition.error.js";
import { ClassAnnotations } from "../jsonSchema/ClassAnnotations.js";
import type { IJsonSchemaFragment } from "../jsonSchema/types/IJsonSchemaFragment.js";
import { FieldRegistry } from "../schema/FieldRegistry.js";

/**
 * Overlays a manual JSON Schema fragment on generated output without changing parsing behavior.
 * @param fragment Keyword object merged over the generated schema; supplied keywords take precedence.
 * @returns A class and property decorator that records the fragment.
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
