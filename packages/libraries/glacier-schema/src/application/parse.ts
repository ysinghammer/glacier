import type { IConstructableClass } from "@glacier/reflection";
import type { ISchemaParseOptions } from "../domain/schema/ISchemaParseOptions.js";
import { SchemaError } from "../domain/failures/SchemaError.error.js";
import { safeParse } from "./safeParse.js";

/**
 * Like `safeParse` but returns the instance directly and throws `SchemaError` carrying every issue when
 * the input is invalid. Throws `SchemaDefinitionError` for incorrectly declared classes.
 */
export function parse<T extends object>(
  target: IConstructableClass<T>,
  input: unknown,
  options?: ISchemaParseOptions,
): T {
  const result = safeParse(target, input, options);
  if (!result.ok) throw new SchemaError(result.issues);
  return result.value;
}
