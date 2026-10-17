import type { IConstructableClass } from "@glacier/reflection";
import { SchemaError } from "../domain/failures/SchemaError.error.js";
import { safeParse } from "./safeParse.js";

/**
 * Like `safeParse` but returns the instance directly and throws `SchemaError` carrying every issue when
 * the input is invalid. Throws `SchemaDefinitionError` for incorrectly declared classes.
 */
export function parse<T extends object>(target: IConstructableClass<T>, input: unknown): T {
  const result = safeParse(target, input);
  if (!result.ok) throw new SchemaError(result.issues);
  return result.value;
}
