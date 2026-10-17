import type { IConstructableClass } from "@glacier/reflection";
import { SchemaCompiler } from "../domain/schema/SchemaCompiler.js";
import type { ISchemaParseOptions } from "../domain/schema/ISchemaParseOptions.js";
import type { IResult } from "../domain/failures/IResult.js";

/**
 * Validates `input` against the decorated class and returns an instance or every issue found, without
 * throwing for invalid input. The instance is created without calling the constructor, only declared
 * fields are copied and unknown keys are stripped. The first call freezes the class's schema; decorating
 * it later throws `SchemaDefinitionError`. Pass `{ coerce: true }` to convert
 * strings and similar input toward the declared types first; coercion is off by default.
 */
export function safeParse<T extends object>(
  target: IConstructableClass<T>,
  input: unknown,
  options: ISchemaParseOptions = {},
): IResult<T> {
  return SchemaCompiler.compile<T>(target)(input, { options, depth: 0 });
}
