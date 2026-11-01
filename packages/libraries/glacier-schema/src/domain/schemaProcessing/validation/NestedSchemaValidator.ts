import type { IClass } from "@glacier/reflection";
import { SchemaDefinitionError } from "../failures/SchemaDefinition.error.js";
import type { ICompiledSchema } from "../schema/CompiledSchemaCache.js";
import { SchemaCompiler } from "../schema/SchemaCompiler.js";
import type { IValueValidator } from "./factories/ValueValidator.factory.js";
import { TypeFailure } from "./TypeFailure.js";

/** Builds the validator of a field whose value is another decorated class. */
export class NestedSchemaValidator {
  /**
   * Creates a validator that lazily resolves and parses a nested class value.
   * @param resolve Thunk returning the nested class constructor.
   * @param levelStep Nesting levels added for this value; pass 0 for root-union variants.
   * @default 1
   * @returns Validator preserving nested issue paths and messages.
   */
  public static create(resolve: () => unknown, levelStep = 1): IValueValidator {
    let schema: ICompiledSchema<object> | undefined;
    return (value, context) => {
      if (typeof value !== "object" || value === null || Array.isArray(value)) {
        return { isValid: false, failures: [TypeFailure.invalidType("object", value)] };
      }
      schema ??= NestedSchemaValidator.compile(resolve);
      const result = schema(value, { options: context.options, depth: context.depth + levelStep });
      if (result.ok) return { isValid: true, value: result.value };
      return {
        isValid: false,
        failures: result.issues.map((issue) => ({ ...issue, hasOwnMessage: true })),
      };
    };
  }

  /**
   * Resolves the reference and compiles the class it names.
   * @param resolve Thunk expected to return a class constructor.
   * @returns Compiled schema for the resolved class.
   * @throws {SchemaDefinitionError} If the thunk result is not a class constructor.
   */
  private static compile(resolve: () => unknown): ICompiledSchema<object> {
    const target = resolve();
    if (typeof target !== "function" || !Object.hasOwn(target, "prototype")) {
      throw new SchemaDefinitionError("A lazy object reference did not resolve to a class");
    }
    return SchemaCompiler.compile<object>(target as IClass);
  }
}
