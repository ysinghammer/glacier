import type { IClass } from "@glacier/reflection";
import type { IJsonSchema } from "../domain/json-schema/IJsonSchema.js";
import type { IJsonSchemaOptions } from "../domain/json-schema/IJsonSchemaOptions.js";
import { JsonSchemaGenerator } from "../domain/json-schema/JsonSchemaGenerator.js";

/**
 * Generates the JSON Schema of one decorated class and every class it references. `draft-2020-12` returns
 * `{ $schema, $ref, $defs }`; `openapi-3.1` returns `{ $ref, components: { schemas } }`. Definitions are keyed by
 * class name or `Describe({ name })`; properties use `Rename` aliases, and optional or defaulted fields are not
 * `required`. `Refine` and `Transform` are not expressible and are skipped, as are string flags other than none
 * and `u`. A discriminated union becomes `oneOf` with a `discriminator` mapping and `IsOneOf` becomes `oneOf`.
 * Pure: it does not freeze or compile the class. Throws `SchemaDefinitionError` for an unknown target, colliding
 * or empty definition names, or fields with modifiers but no type.
 */
export function toJsonSchema<T extends object>(
  target: abstract new (...arguments_: never[]) => T,
  options: IJsonSchemaOptions,
): IJsonSchema {
  return new JsonSchemaGenerator(options.target).generate(target as unknown as IClass);
}
